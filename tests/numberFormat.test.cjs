const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

// Exercise the actual TypeScript helper without adding a frontend test framework.
const source = fs.readFileSync(require.resolve('../src/services/numberFormat.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS}});
const context = {exports: {}, Intl};
vm.runInNewContext(compiled.outputText, context);
const {formatNumber} = context.exports;

test('English and German numbers preserve precision and normalize insignificant zeros', () => {
    const cases = [
        ['1000', '1,000', '1.000'],
        ['1000.1', '1,000.1', '1.000,1'],
        ['-1000.1234567', '-1,000.1234567', '-1.000,1234567'],
        ['0', '0', '0'],
        ['-0.0', '0', '0'],
        ['1000.1000', '1,000.1', '1.000,1'],
        ['1e3', '1,000', '1.000'],
        ['1e-7', '0.0000001', '0,0000001'],
        ['12345678901234567890.1234567890123456789',
            '12,345,678,901,234,567,890.1234567890123456789',
            '12.345.678.901.234.567.890,1234567890123456789']
    ];
    for (const [raw, en, de] of cases) {
        assert.equal(formatNumber(raw, 'en-US'), en);
        assert.equal(formatNumber(raw, 'de-DE'), de);
    }
    assert.equal(formatNumber(1000.1, 'de-DE'), '1.000,1');
});

test('missing values stay empty and noncanonical or out-of-range values stay visible', () => {
    assert.equal(formatNumber(null, 'de-DE'), '');
    assert.equal(formatNumber(undefined, 'de-DE'), '');
    for (const raw of ['', ' ', '1.000,1', 'NaN', 'Infinity', '01', '1e-101', '1e309']) {
        assert.equal(formatNumber(raw, 'de-DE'), raw);
    }
});

test('configured regional conventions are independent of the machine locale', () => {
    assert.equal(formatNumber('1000.1', 'de-CH'), '1’000.1');
});
