import {format, isValid, parseISO} from 'date-fns';
import type {Locale} from 'date-fns';
import {de, enGB, enUS} from 'date-fns/locale';
import {
    DisplayFormatKey,
    DisplayFormatsConfig
} from '@/services/configLoader';

const DATE_FNS_LOCALES: Record<string, Locale> = {
    de,
    en: enUS,
    'en-gb': enGB,
    'en-us': enUS
};

let config: DisplayFormatsConfig | null = null;

const normalizeLanguage = (language?: string): string | undefined => {
    const normalized = language?.trim().replaceAll('_', '-').toLowerCase();
    return normalized || undefined;
};

// The backend already resolved every key to a (language, pattern) pair for
// the requested - or its own default - language, so there's nothing left to
// validate here beyond "every key is present".
const hasRequiredConfiguration = (candidate: DisplayFormatsConfig): boolean =>
    Object.values(DisplayFormatKey).includes(candidate?.defaultDateDisplayFormat)
    && Object.values(DisplayFormatKey).includes(candidate?.defaultTimestampDisplayFormat)
    && Object.values(DisplayFormatKey).every(key => !!candidate.formats?.[key]?.pattern);

const requireConfig = (): DisplayFormatsConfig => {
    if (config === null) {
        throw new Error('Display formats have not been configured');
    }
    return config;
};

export const configureDisplayFormats = (candidate: DisplayFormatsConfig): void => {
    if (!hasRequiredConfiguration(candidate)) {
        throw new Error('Invalid backend display-format response');
    }
    config = candidate;
};

const resolveLocale = (language: string): Locale => {
    const normalized = normalizeLanguage(language) ?? 'en';
    return DATE_FNS_LOCALES[normalized]
        ?? DATE_FNS_LOCALES[normalized.split('-')[0]]
        ?? enUS;
};

const parseDate = (value: string | Date): Date =>
    value instanceof Date ? new Date(value.getTime()) : parseISO(value);

export const formatDisplayDate = (
    value: string | Date | null | undefined,
    key: DisplayFormatKey
): string => {
    if (value == null || value === '') return '';

    const date = parseDate(value);
    if (!isValid(date)) return '';

    const resolved = requireConfig().formats[key];
    return format(date, resolved.pattern, {locale: resolveLocale(resolved.language)});
};

/** The display format key applied to a DATE field when it has no explicit display_format. */
export const getDefaultDateDisplayFormat = (): DisplayFormatKey =>
    requireConfig().defaultDateDisplayFormat;

/** The display format key applied to a TIMESTAMP/LOCAL_DATE_TIME field when it has no explicit display_format. */
export const getDefaultTimestampDisplayFormat = (): DisplayFormatKey =>
    requireConfig().defaultTimestampDisplayFormat;

/**
 * Resolves a raw display-format key coming from a screen-specific frontend
 * variable (FRONTEND_VARIABLES_*, a UI-only concern - the backend has no
 * consumer for these), falling back when it is absent or not a recognized key.
 */
export const resolveDisplayFormatKey = (
    value: string | undefined,
    fallback: DisplayFormatKey
): DisplayFormatKey =>
    (Object.values(DisplayFormatKey) as string[]).includes(value ?? '')
        ? value as DisplayFormatKey
        : fallback;

export {DisplayFormatKey};
