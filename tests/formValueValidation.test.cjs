const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');

// Exercise the actual TypeScript helper without adding a frontend test framework.
const source = fs.readFileSync(require.resolve('../src/services/formValueValidation.ts'), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020}});
const context = {exports: {}};
vm.runInNewContext(compiled.outputText, context);
const {getInvalidValueMessage, isValidFormValue, normalizeFormValue} = context.exports;

test('EMAIL accepts addresses and rejects anything else', () => {
    for (const value of ['a@b.de', 'first.last+tag@sub.dkfz-heidelberg.de', 'A_B%c@x.museum']) {
        assert.equal(isValidFormValue(value, 'EMAIL'), true, value);
    }
    for (const value of ['abc', 'a@b', 'a@b.', '@b.de', 'a b@c.de', 'a@b.d', 'a@@b.de', 'a@b..de', 'a@b.de\u00a0']) {
        assert.equal(isValidFormValue(value, 'EMAIL'), false, value);
    }
    assert.equal(getInvalidValueMessage('abc', 'EMAIL'), '"abc" is not a valid e-mail address');
});

test('INTEGER accepts whole numbers within the backend Integer range', () => {
    for (const value of ['0', '-5', '42', '2147483647', '-2147483648']) {
        assert.equal(isValidFormValue(value, 'INTEGER'), true, value);
    }
    for (const value of ['1.5', '1,5', 'abc', '2147483648', '1e3', '+1']) {
        assert.equal(isValidFormValue(value, 'INTEGER'), false, value);
    }
});

test('DOUBLE accepts numbers with a dot as decimal separator', () => {
    for (const value of ['0', '-1.5', '1000.25', '1e-7', '2E10']) {
        assert.equal(isValidFormValue(value, 'DOUBLE'), true, value);
    }
    for (const value of ['1.000,5', 'abc', '.5', '1.', '1e999']) {
        assert.equal(isValidFormValue(value, 'DOUBLE'), false, value);
    }
});

test('DATE accepts existing ISO dates only', () => {
    for (const value of ['2026-10-07', '2024-02-29', '2000-02-29', '0001-01-01', '0099-12-31', '9999-12-31']) {
        assert.equal(isValidFormValue(value, 'DATE'), true, value);
    }
    for (const value of ['2025-02-29', '2026-13-01', '07.10.2026', '2026-1-7', '1900-02-29', '2026-04-31', '2026-00-10', '+10000-01-01']) {
        assert.equal(isValidFormValue(value, 'DATE'), false, value);
    }
});

// Same cases as decimalCommaEdgeCases in FormFieldValueValidatorTest (backend)
test('DOUBLE reads an unambiguous decimal comma as a point', () => {
    for (const [value, saved] of [['1,5', '1.5'], ['-0,25', '-0.25'], [' 3,14 ', '3.14'], ['1,2345', '1.2345']]) {
        assert.equal(isValidFormValue(value, 'DOUBLE'), true, value);
        assert.equal(normalizeFormValue(value, 'DOUBLE'), saved, value);
    }
    // 1,500 could be 1.5 or 1500; the others are no decimal comma
    for (const value of ['1,500', '1.000,5', '1,5,5', ',5', '1,', '1,5e3']) {
        assert.equal(isValidFormValue(value, 'DOUBLE'), false, value);
        assert.equal(normalizeFormValue(value, 'DOUBLE'), value, value);
    }
    assert.equal(isValidFormValue('1,5', 'INTEGER'), false);
    assert.equal(normalizeFormValue('1,5', 'STRING'), '1,5');
    assert.equal(getInvalidValueMessage('1,500', 'DOUBLE'),
        '"1,500" is not a valid number (use a dot as decimal separator, e.g. 1.5)');
});

// Same cases as timestampEdgeCases in FormFieldValueValidatorTest (backend)
test('TIMESTAMP accepts UTC instants with seconds only', () => {
    for (const value of ['2026-10-07T08:30:00Z', '2026-10-07T08:30:00.000Z', '2026-10-07T08:30:00.123456789Z',
        '2024-02-29T23:59:59Z', '0001-01-01T00:00:00Z', ' 2026-10-07T08:30:00Z ',
        new Date(Date.UTC(2026, 9, 7, 8, 30)).toISOString()]) {
        assert.equal(isValidFormValue(value, 'TIMESTAMP'), true, value);
    }
    for (const value of ['2026-10-07T08:30Z', '2026-10-07T08:30:00', '2026-10-07T08:30:00+02:00', '2026-10-07T08:30:00z',
        '2026-10-07 08:30:00Z', '2026-10-07T24:00:00Z', '2026-10-07T08:60:00Z', '2026-10-07T23:59:60Z',
        '2026-10-07T8:30:00Z', '2026-10-07T08:30:00.1234567890Z', '2025-02-29T08:30:00Z', '2026-02-30T08:30:00Z',
        '2026-10-07', '1759825800000', '07.10.2026 08:30']) {
        assert.equal(isValidFormValue(value, 'TIMESTAMP'), false, value);
    }
    assert.equal(getInvalidValueMessage('2026-10-07T08:30', 'TIMESTAMP'),
        '"2026-10-07T08:30" is not a valid date and time (YYYY-MM-DDTHH:MM:SSZ)');
});

// Same cases as localDateTimeEdgeCases in FormFieldValueValidatorTest (backend)
test('LOCAL_DATE_TIME accepts dates with a time in minutes only', () => {
    for (const value of ['2026-10-07T08:30', '2024-02-29T00:00', '2026-12-31T23:59', ' 2026-10-07T08:30\t']) {
        assert.equal(isValidFormValue(value, 'LOCAL_DATE_TIME'), true, value);
    }
    for (const value of ['2026-10-07T08:30:00', '2026-10-07T08:30Z', '2026-10-07 08:30', '2026-10-07T24:00',
        '2026-10-07T08:60', '2026-10-07T8:30', '2025-02-29T08:30', '2026-04-31T08:30', '2026-10-07', '07.10.2026 08:30']) {
        assert.equal(isValidFormValue(value, 'LOCAL_DATE_TIME'), false, value);
    }
    assert.equal(getInvalidValueMessage('2026-10-07', 'LOCAL_DATE_TIME'),
        '"2026-10-07" is not a valid date and time (YYYY-MM-DDTHH:MM)');
    assert.equal(normalizeFormValue(' 2026-10-07T08:30 ', 'LOCAL_DATE_TIME'), '2026-10-07T08:30');
});

test('blank values and unchecked types are always valid', () => {
    for (const value of [undefined, null, '', '   ']) {
        assert.equal(isValidFormValue(value, 'EMAIL'), true);
    }
    assert.equal(isValidFormValue('anything', 'STRING'), true);
    assert.equal(isValidFormValue('anything', undefined), true);
});

test('number values from <input type="number"> are checked as text', () => {
    assert.equal(isValidFormValue(223, 'INTEGER'), true);
    assert.equal(isValidFormValue(1.5, 'INTEGER'), false);
    assert.equal(isValidFormValue(1.5, 'DOUBLE'), true);
    assert.equal(getInvalidValueMessage(1.5, 'INTEGER'), '"1.5" is not a valid whole number');
});

test('surrounding whitespace does not count', () => {
    assert.equal(isValidFormValue(' a@b.de ', 'EMAIL'), true);
    assert.equal(isValidFormValue('\t5\n', 'INTEGER'), true);
    assert.equal(isValidFormValue('1.5 ', 'DOUBLE'), true);
    assert.equal(isValidFormValue(' 2026-10-07', 'DATE'), true);
    assert.equal(getInvalidValueMessage(' 1.5 ', 'INTEGER'), '"1.5" is not a valid whole number');
});

test('normalizeFormValue returns the value as the backend saves it', () => {
    assert.equal(normalizeFormValue(223, 'INTEGER'), '223');
    assert.equal(normalizeFormValue(' a@b.de\t', 'EMAIL'), 'a@b.de');
    assert.equal(normalizeFormValue(' free text ', 'STRING'), ' free text ');
    assert.equal(normalizeFormValue(' x ', undefined), ' x ');
    assert.equal(normalizeFormValue('a@b.de\u00a0', 'EMAIL'), 'a@b.de\u00a0');
});
