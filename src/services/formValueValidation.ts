import type {FormDataType} from '@/services/projectManagerBackendService';

// Checks that a form field value matches its data type. The backend applies
// the same rules when the value is saved (FormFieldValueValidator) and rejects
// an invalid one, so keep both in sync. Blank values are not checked here:
// whether a value is required is the mandatory check's job.

const EMAIL_PATTERN = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const INTEGER_PATTERN = /^-?\d+$/;
// A dot as decimal separator, as stored and sent by the backend (no grouping).
const DOUBLE_PATTERN = /^-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/;
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
// The stored forms, as shown by the summary: an instant in UTC (seconds
// required, fraction optional, as sent by toISOString) and a local date and
// time in minutes (as entered in an <input type="datetime-local">).
const TIMESTAMP_PATTERN = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,9})?Z$/;
const LOCAL_DATE_TIME_PATTERN = /^(\d{4}-\d{2}-\d{2})T(?:[01]\d|2[0-3]):[0-5]\d$/;
// Range of the backend's Integer.
const INTEGER_MIN = -2147483648;
const INTEGER_MAX = 2147483647;

const isValidDate = (value: string): boolean => {
    const match = DATE_PATTERN.exec(value);
    if (!match) return false;
    const [year, month, day] = match.slice(1).map(Number);
    // setUTCFullYear: Date.UTC would move the years 0-99 to 1900-1999
    const date = new Date(0);
    date.setUTCFullYear(year, month - 1, day);
    return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

// The time is checked by the pattern (no 24:00, no leap second), the date like a DATE.
const isValidDateTime = (pattern: RegExp) => (value: string): boolean => {
    const match = pattern.exec(value);
    return match !== null && isValidDate(match[1]);
};

const isValidInteger = (value: string): boolean => {
    if (!INTEGER_PATTERN.test(value)) return false;
    const number = Number(value);
    return number >= INTEGER_MIN && number <= INTEGER_MAX;
};

const isValidDouble = (value: string): boolean =>
    DOUBLE_PATTERN.test(value) && Number.isFinite(Number(value));

const validators: Record<string, {isValid: (value: string) => boolean, message: string}> = {
    EMAIL: {isValid: value => EMAIL_PATTERN.test(value), message: 'is not a valid e-mail address'},
    INTEGER: {isValid: isValidInteger, message: 'is not a valid whole number'},
    DOUBLE: {isValid: isValidDouble, message: 'is not a valid number (use a dot as decimal separator, e.g. 1.5)'},
    DATE: {isValid: isValidDate, message: 'is not a valid date (YYYY-MM-DD)'},
    TIMESTAMP: {isValid: isValidDateTime(TIMESTAMP_PATTERN), message: 'is not a valid date and time (YYYY-MM-DDTHH:MM:SSZ)'},
    LOCAL_DATE_TIME: {isValid: isValidDateTime(LOCAL_DATE_TIME_PATTERN), message: 'is not a valid date and time (YYYY-MM-DDTHH:MM)'}
};

// ASCII whitespace only, like the backend (String.trim() would also remove
// e.g. a non-breaking space, which the backend keeps and rejects).
const SURROUNDING_WHITESPACE = /^[ \t\n\r\f\v]+|[ \t\n\r\f\v]+$/g;
const trim = (value: string): string => value.replace(SURROUNDING_WHITESPACE, '');
// A decimal comma ("1,5"), read as a decimal point. Not with exactly three
// digits after it: "1,500" could also mean 1500 (thousands separator).
const DECIMAL_COMMA = /^-?\d+,(?:\d{1,2}|\d{4,})$/;

// Surrounding whitespace removed; for DOUBLE an unambiguous decimal comma as a point.
const canonicalText = (text: string, dataType: FormDataType): string => {
    const trimmed = trim(text);
    return dataType === 'DOUBLE' && DECIMAL_COMMA.test(trimmed) ? trimmed.replace(',', '.') : trimmed;
};

/**
 * The reason why the value does not match the data type, or undefined when it does.
 * The value is not always a string: v-model on an <input type="number"> yields a number.
 * Checked as it is saved (see normalizeFormValue): e.g. " 1,5" as "1.5".
 */
export const getInvalidValueMessage = (value: unknown, dataType?: FormDataType): string | undefined => {
    if (value == null || !dataType) return undefined;
    const text = canonicalText(String(value), dataType);
    if (text.length === 0) return undefined;
    const validator = validators[dataType];
    return validator && !validator.isValid(text) ? `"${text}" ${validator.message}` : undefined;
};

/**
 * The value as it is saved, the same as the backend saves it: always a string
 * (a number from an <input type="number"> as text), for the checked data types
 * without surrounding whitespace, and for DOUBLE with an unambiguous decimal
 * comma as a point ("1,5" as "1.5").
 */
export const normalizeFormValue = (value: string | number, dataType?: FormDataType): string => {
    const text = typeof value === 'number' ? String(value) : value;
    return typeof text === 'string' && dataType && dataType in validators ? canonicalText(text, dataType) : text;
};

export const isValidFormValue = (value: unknown, dataType?: FormDataType): boolean =>
    getInvalidValueMessage(value, dataType) === undefined;
