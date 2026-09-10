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

const hasRequiredConfiguration = (candidate: DisplayFormatsConfig): boolean => {
    const defaultLanguage = normalizeLanguage(candidate?.defaultLanguage);
    return !!defaultLanguage
        && Object.values(DisplayFormatKey).includes(candidate?.defaultDateDisplayFormat)
        && Object.values(DisplayFormatKey).includes(candidate?.defaultTimestampDisplayFormat)
        && Object.values(DisplayFormatKey).every(key =>
            !!candidate.formats?.[key]?.[defaultLanguage]);
};

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

const resolvePattern = (key: DisplayFormatKey, language?: string): {language: string; pattern: string} => {
    if (config === null) {
        throw new Error('Display formats have not been configured');
    }
    const translations = config.formats[key];
    const requested = normalizeLanguage(language);
    const baseLanguage = requested?.split('-')[0];
    const defaultLanguage = normalizeLanguage(config.defaultLanguage) ?? 'en';

    if (requested && translations[requested]) {
        return {language: requested, pattern: translations[requested]};
    }
    if (baseLanguage && translations[baseLanguage]) {
        return {language: baseLanguage, pattern: translations[baseLanguage]};
    }
    return {language: defaultLanguage, pattern: translations[defaultLanguage]};
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
    key: DisplayFormatKey,
    language?: string
): string => {
    if (value == null || value === '') return '';

    const date = parseDate(value);
    if (!isValid(date)) return '';

    const resolved = resolvePattern(key, language);
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
