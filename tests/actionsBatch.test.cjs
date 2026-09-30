const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

// Exercise the actual TypeScript module without adding a frontend test framework.
const source = fs.readFileSync(require.resolve('../src/services/actionsBatch.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}});
const silentConsole = {warn: () => undefined, error: () => undefined};
const context = {exports: {}, console: silentConsole, Map, Set};
vm.runInNewContext(compiled.outputText, context);
const {runBatchLoads} = context.exports;

// A backend that answers every entry from a table of results by action, and records what each request contained
function backend(resultsByAction) {
    const requests = [];
    const fetchBatch = async entries => {
        // Array.from: the entries come from the module's own context, whose arrays are not equal to ours
        requests.push(Array.from(entries, entry => entry.id));
        const results = new Map();
        entries.forEach(entry => {
            const result = resultsByAction[entry.action];
            if (result !== undefined) results.set(entry.id, typeof result === 'function' ? result(entry) : result);
        });
        return results;
    };
    return {requests, fetchBatch};
}

test('loads without dependencies go into one request and apply their responses', async () => {
    const applied = {};
    const {requests, fetchBatch} = backend({A: {response: 1}, B: {response: [2]}});

    const outcome = await runBatchLoads([
        {id: 'a', module: 'M', action: 'A', apply: response => { applied.a = response; }},
        {id: 'b', module: 'M', action: 'B', apply: response => { applied.b = response; }}
    ], fetchBatch);

    assert.deepEqual(requests, [['a', 'b']]);
    assert.deepEqual(applied, {a: 1, b: [2]});
    assert.equal(outcome.waves, 1);
    assert.deepEqual(Object.keys(outcome.errors), []);
});

test('a dependent load runs in a later request and can use the earlier response', async () => {
    const {requests, fetchBatch} = backend({
        EXISTS: {response: true},
        FETCH: entry => ({response: `fetched with ${entry.params.get('from')}`})
    });
    let fetched;

    await runBatchLoads([
        {id: 'fetch', module: 'M', action: 'FETCH', dependsOn: ['exists'],
            when: responses => responses.exists === true,
            params: responses => new Map([['from', responses.exists]]),
            apply: response => { fetched = response; }},
        {id: 'exists', module: 'M', action: 'EXISTS'}
    ], fetchBatch);

    assert.deepEqual(requests, [['exists'], ['fetch']]);
    assert.equal(fetched, 'fetched with true');
});

test('a load whose condition is not met is not sent and runs its otherwise', async () => {
    const {requests, fetchBatch} = backend({EXISTS: {response: false}, FETCH: {response: 'x'}});
    const calls = [];

    const outcome = await runBatchLoads([
        {id: 'exists', module: 'M', action: 'EXISTS'},
        {id: 'fetch', module: 'M', action: 'FETCH', dependsOn: ['exists'],
            when: responses => responses.exists === true,
            apply: () => calls.push('apply'), otherwise: () => calls.push('otherwise')}
    ], fetchBatch);

    assert.deepEqual(requests, [['exists']]);
    assert.deepEqual(calls, ['otherwise']);
    assert.equal(outcome.waves, 1);
});

test('a failed load does not stop the others and is reported', async () => {
    const calls = [];
    const {fetchBatch} = backend({
        OK: {response: 'fine'},
        BROKEN: {errorCode: 500, errorMessage: 'IllegalStateException: boom', errorStacktrace: 'trace'},
        MISSING: {errorCode: 404},
        FORBIDDEN: {errorCode: 405}
        // NOT_ACTIVE has no result: the entry was not sent
    });
    const load = (id, action) => ({id, module: 'M', action,
        apply: () => calls.push(`${id}:apply`), otherwise: () => calls.push(`${id}:otherwise`)});

    const outcome = await runBatchLoads([
        load('ok', 'OK'), load('broken', 'BROKEN'), load('missing', 'MISSING'),
        load('forbidden', 'FORBIDDEN'), load('notActive', 'NOT_ACTIVE')
    ], fetchBatch);

    assert.deepEqual(calls, ['ok:apply', 'broken:otherwise', 'missing:otherwise', 'forbidden:otherwise', 'notActive:otherwise']);
    assert.deepEqual(Object.keys(outcome.errors), ['broken']);
    assert.deepEqual(Object.keys(outcome.responses), ['ok']);
});

test('an exception in a page handler is reported and does not stop the others', async () => {
    const {fetchBatch} = backend({A: {response: 1}, B: {response: 2}});
    let applied;

    const outcome = await runBatchLoads([
        {id: 'a', module: 'M', action: 'A', apply: () => { throw new Error('handler'); }},
        {id: 'b', module: 'M', action: 'B', apply: response => { applied = response; }}
    ], fetchBatch);

    assert.equal(applied, 2);
    assert.deepEqual(Object.keys(outcome.errors), ['a']);
});

test('dependencies that cannot be resolved are rejected', async () => {
    const {fetchBatch} = backend({});

    await assert.rejects(runBatchLoads([
        {id: 'a', module: 'M', action: 'A', dependsOn: ['b']},
        {id: 'b', module: 'M', action: 'B', dependsOn: ['a']}
    ], fetchBatch), /circle/);
    await assert.rejects(runBatchLoads([
        {id: 'a', module: 'M', action: 'A', dependsOn: ['nowhere']}
    ], fetchBatch), /unknown load/);
    await assert.rejects(runBatchLoads([
        {id: 'a', module: 'M', action: 'A'}, {id: 'a', module: 'M', action: 'B'}
    ], fetchBatch), /unique ids/);
});
