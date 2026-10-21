/** A labelled preview ends at an authored clause boundary, never an arbitrary
 * word/character limit. Keep punctuation and tashkeel as an exact source prefix.
 */
export function getDhikrExcerpt(phrase: string) {
  const boundary = phrase.search(/[،,؛;.!؟?]/u);
  const text = boundary < 0 ? phrase : phrase.slice(0, boundary + 1);
  return { text, isExcerpt: text.length < phrase.length };
}

/** Keep settled reading edges on whole lines, with breathing room outside the
 * ScrollView. Native measurements include Android's nonlinear font scaling.
 */
export function getReadingViewport(height: number, linePitch: number) {
  if (linePitch <= 0 || height <= linePitch) return height;
  return Math.floor((height + 0.1) / linePitch) * linePitch;
}

export function getReadingEndPadding(contentHeight: number, viewport: number, linePitch: number) {
  if (viewport <= 0) return 20;
  const overflow = contentHeight + 20 - viewport;
  if (linePitch <= 0 || overflow <= 0) return 20;
  return 20 + Math.ceil((overflow - 0.1) / linePitch) * linePitch - overflow;
}
