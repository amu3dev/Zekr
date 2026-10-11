const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toArabicDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

/** Formats number with Arabic thousands separator (e.g., ١،٥٠٠) */
export function formatArabicNumber(value: number): string {
  const formatted = value.toLocaleString('en-US');
  return formatted
    .replace(/,/g, '،')
    .replace(/\d/g, (digit) => ARABIC_DIGITS[Number(digit)]);
}

/** Converts Arabic-Indic / Persian digits to ASCII so Arabic keyboards work in number inputs. */
export function normalizeDigits(text: string): string {
  return text.replace(/[٠-٩۰-۹]/g, (digit) => {
    const index = ARABIC_DIGITS.indexOf(digit);
    return String(index >= 0 ? index : PERSIAN_DIGITS.indexOf(digit));
  });
}

const CYCLE_ORDINALS = [
  'الأولى',
  'الثانية',
  'الثالثة',
  'الرابعة',
  'الخامسة',
  'السادسة',
  'السابعة',
  'الثامنة',
  'التاسعة',
  'العاشرة',
];

export function getCycleText(cycleNumber: number): string {
  if (cycleNumber >= 1 && cycleNumber <= CYCLE_ORDINALS.length) {
    return `الدورة ${CYCLE_ORDINALS[cycleNumber - 1]}`;
  }
  return `الدورة ${toArabicDigits(cycleNumber)}`;
}
