/** Format canonical numbers only. Never guess the meaning of localized strings. */
const formatters = new Map<string, Intl.NumberFormat>();
const canonicalNumber = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

export const formatNumber = (value: string | number | null | undefined, locale: string): string => {
    if (value == null) return '';
    const raw = String(value);
    if (!canonicalNumber.test(raw)) return raw;

    const [mantissa, exponentText] = raw.toLowerCase().split('e');
    const exponent = Number(exponentText ?? 0);
    const [integer, fraction = ''] = mantissa.replace('-', '').split('.');
    const digits = (integer + fraction).replace(/^0+/, '');
    const zero = digits.length === 0;
    const scale = fraction.length - (digits.length - digits.replace(/0+$/, '').length) - exponent;
    const integerDigits = digits.length - fraction.length + exponent;
    // Same limits as the PDF formatter; outside them, preserve the original value.
    if (!zero && (scale > 100 || integerDigits > 309 || !Number.isFinite(exponent))) return raw;

    let formatter = formatters.get(locale);
    if (!formatter) {
        formatter = new Intl.NumberFormat(locale, {
            useGrouping: true,
            minimumFractionDigits: 0,
            maximumFractionDigits: 100
        });
        formatters.set(locale, formatter);
    }
    // Intl accepts exact decimal strings in modern browsers. The type assertion
    // accommodates TypeScript's older signature; it does NOT convert to Number.
    return formatter.format((zero ? '0' : raw) as unknown as number);
};
