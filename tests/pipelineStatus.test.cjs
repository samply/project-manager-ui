const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

// Exercise the actual TypeScript module without adding a frontend test framework (as bridgeheadRoles.test.cjs)
const source = fs.readFileSync(require.resolve('../src/services/pipelineStatus.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}});
const enumOf = values => Object.fromEntries(values.map(value => [value, value]));
const ProjectState = enumOf(['DRAFT', 'REVIEW', 'CENTRAL_APPROVAL', 'LOCAL_APPROVAL', 'DEVELOP', 'PILOT', 'FINAL',
    'FINISHED', 'REJECTED', 'ARCHIVED']);
const requireStub = path => {
    if (path === '@/services/projectManagerBackendService') {
        return {ProjectState, ProjectBridgeheadState: enumOf(['ACCEPTED']), UserProjectState: enumOf(['ACCEPTED', 'REJECTED'])};
    }
    throw new Error(`Unexpected import: ${path}`);
};
const context = {exports: {}, require: requireStub, Map, Set, Array};
vm.runInNewContext(compiled.outputText, context);
const {classifyLocalApproval} = context.exports;

test('an uploaded local approval is done', () => {
    assert.equal(classifyLocalApproval(true, 'LOCAL_APPROVAL', true).classification, 'done');
});

test('before the local approval phase it has not started', () => {
    ['REVIEW', 'CENTRAL_APPROVAL', undefined].forEach(state =>
        assert.equal(classifyLocalApproval(false, state, true).classification, 'grey'));
});

test('missing from the local approval phase on: red if required, else not provided', () => {
    ['LOCAL_APPROVAL', 'FINAL'].forEach(state => {
        assert.equal(classifyLocalApproval(false, state, true).classification, 'failed');
        assert.equal(classifyLocalApproval(false, state, false).classification, 'not_required');
    });
});
