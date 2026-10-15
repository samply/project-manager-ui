const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

// Exercise the actual TypeScript module without adding a frontend test framework.
const source = fs.readFileSync(require.resolve('../src/services/bridgeheadRoles.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}});
// The module imports the ProjectRole enum from the backend service, which needs the whole app (axios, config):
// give it the enum alone. Its values are the role names, as sent by the backend.
const ProjectRole = Object.fromEntries(
    ['CREATOR', 'DEVELOPER', 'PILOT', 'FINAL', 'BRIDGEHEAD_ADMIN', 'PROJECT_MANAGER_ADMIN'].map(role => [role, role]));
const requireStub = path => {
    if (path === '@/services/projectManagerBackendService') return {ProjectRole};
    throw new Error(`Unexpected import: ${path}`);
};
const context = {exports: {}, require: requireStub, Map, Set, Array};
vm.runInNewContext(compiled.outputText, context);
const {toBridgeheadRoles, canActForWholeProject, actingBridgeheads} = context.exports;

const TUM = {bridgehead: 'tum'};
const LMU = {bridgehead: 'lmu'};
const BERLIN = {bridgehead: 'berlin'};
const BRIDGEHEADS = [TUM, LMU, BERLIN];

// Array.from: arrays built in the module's own context are not equal to ours
const ids = bridgeheads => Array.from(bridgeheads, bridgehead => bridgehead.bridgehead);

test('toBridgeheadRoles keeps only the roles of a bridgehead', () => {
    const bridgeheadRoles = toBridgeheadRoles(new Map([
        ['tum', ['CREATOR', 'BRIDGEHEAD_ADMIN']],
        ['lmu', ['CREATOR']],
        ['berlin', undefined]
    ]));
    assert.deepEqual(Array.from(bridgeheadRoles.get('tum')), ['BRIDGEHEAD_ADMIN']);
    assert.equal(bridgeheadRoles.get('lmu').size, 0);
    assert.equal(bridgeheadRoles.get('berlin').size, 0);
});

test('the creator and the project manager admin may act for the whole project', () => {
    assert.equal(canActForWholeProject(['CREATOR']), true);
    assert.equal(canActForWholeProject(['PROJECT_MANAGER_ADMIN']), true);
    assert.equal(canActForWholeProject(['BRIDGEHEAD_ADMIN', 'FINAL']), false);
});

test('an admin of two bridgeheads acts for both, not for the others', () => {
    const bridgeheadRoles = toBridgeheadRoles(new Map([
        ['tum', ['BRIDGEHEAD_ADMIN']], ['lmu', ['BRIDGEHEAD_ADMIN']], ['berlin', []]]));
    assert.deepEqual(ids(actingBridgeheads(BRIDGEHEADS, bridgeheadRoles, ['BRIDGEHEAD_ADMIN'])), ['tum', 'lmu']);
});

test('a creator who is also admin of one bridgehead acts for that bridgehead only', () => {
    const bridgeheadRoles = toBridgeheadRoles(new Map([
        ['tum', ['CREATOR', 'BRIDGEHEAD_ADMIN']], ['lmu', ['CREATOR']], ['berlin', ['CREATOR']]]));
    assert.deepEqual(ids(actingBridgeheads(BRIDGEHEADS, bridgeheadRoles, ['CREATOR', 'BRIDGEHEAD_ADMIN'])), ['tum']);
});

test('the project manager admin acts for every bridgehead', () => {
    assert.deepEqual(ids(actingBridgeheads(BRIDGEHEADS, new Map(), ['PROJECT_MANAGER_ADMIN'])), ['tum', 'lmu', 'berlin']);
});

test('only the allowed roles count', () => {
    const bridgeheadRoles = toBridgeheadRoles(new Map([['tum', ['FINAL']], ['lmu', ['BRIDGEHEAD_ADMIN']]]));
    assert.deepEqual(ids(actingBridgeheads(BRIDGEHEADS, bridgeheadRoles, [], ['BRIDGEHEAD_ADMIN'])), ['lmu']);
    assert.deepEqual(ids(actingBridgeheads(BRIDGEHEADS, bridgeheadRoles, [], ['DEVELOPER', 'PILOT', 'FINAL'])), ['tum']);
});
