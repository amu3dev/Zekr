const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toArabicDigits(value: number) {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

/** Converts Arabic-Indic / Persian digits to ASCII so Arabic keyboards work in number inputs. */
export function normalizeDigits(text: string) {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_DIGITS.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN_DIGITS.indexOf(digit));
  });
}
