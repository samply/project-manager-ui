import {format, isValid, parseISO} from 'date-fns';
import {FormDataType} from '@/services/projectManagerBackendService';

const LOCAL_DATE_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const CANONICAL_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?Z$/;
const DATE_TIME_LOCAL_FORMAT = "yyyy-MM-dd'T'HH:mm";

export const isCanonicalTimestampValue = (value: string): boolean => {
    return CANONICAL_TIMESTAMP_PATTERN.test(value) && isValid(parseISO(value));
};

/** Converts a canonical API value into the value expected by a native input. */
export const toFormControlValue = (
    value: string | null | undefined,
    dataType?: FormDataType
): string => {
    if (value == null || dataType !== FormDataType.TIMESTAMP
        || !isCanonicalTimestampValue(value)) {
        return value ?? '';
    }

    const instant = parseISO(value);
    return isValid(instant) ? format(instant, DATE_TIME_LOCAL_FORMAT) : value;
};

/** Converts a native input value back to the canonical API representation. */
export const fromFormControlValue = (
    value: string,
    dataType?: FormDataType,
    originalCanonicalValue?: string
): string => {
    if (dataType !== FormDataType.TIMESTAMP || value === '') {
        return value;
    }

    // Avoid losing seconds/fractions when an existing instant was not edited.
    if (originalCanonicalValue
        && value === toFormControlValue(originalCanonicalValue, dataType)) {
        return originalCanonicalValue;
    }
    if (!LOCAL_DATE_TIME_PATTERN.test(value)) {
        return value;
    }

    const localDateTime = parseISO(value);
    return isValid(localDateTime) ? localDateTime.toISOString() : value;
};
