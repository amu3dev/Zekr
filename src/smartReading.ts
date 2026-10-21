/** Reading has no dependency on counter/routine reducers or religious content. */
export const READING_MODES = [
  { id: 'full', label: 'القراءة الكاملة' },
  { id: 'ticker', label: 'الشريط المتحرك' },
  { id: 'segments', label: 'القراءة بالمقاطع' },
  { id: 'vertical', label: 'التمرير الذكي' },
] as const;
export type ReadingMode = typeof READING_MODES[number]['id'];
export type ReadingSpeed = 'slow' | 'normal' | 'fast';
export type ReadingPreferences = { mode: ReadingMode; speed: ReadingSpeed; progression: 'manual' | 'automatic' };
export const DEFAULT_READING: ReadingPreferences = { mode: 'full', speed: 'normal', progression: 'manual' };
export const READING_SPEEDS = { slow: { delay: 6500, pixelsPerSecond: 18 }, normal: { delay: 4200, pixelsPerSecond: 30 }, fast: { delay: 2600, pixelsPerSecond: 46 } };
export function parseReadingPreferences(raw: unknown): ReadingPreferences {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw Error('Invalid reading preference');
  const data = raw as Partial<ReadingPreferences>;
  if (data.mode !== undefined && !READING_MODES.some(mode => mode.id === data.mode)) throw Error('Invalid reading mode');
  if (data.speed !== undefined && !Object.hasOwn(READING_SPEEDS, data.speed)) throw Error('Invalid reading speed');
  if (data.progression !== undefined && !['manual', 'automatic'].includes(data.progression)) throw Error('Invalid reading progression');
  return { mode: data.mode ?? DEFAULT_READING.mode, speed: data.speed ?? DEFAULT_READING.speed, progression: data.progression ?? DEFAULT_READING.progression };
}
/** Exact source slices, including whitespace, punctuation and combining marks.
 * Without punctuation, word boundaries provide a fallback, never code units.
 */
export function segmentDhikr(phrase: string): string[] {
  if (!phrase) return [''];
  const clauses = phrase.match(/[^،,؛;.!؟?\n]+[،,؛;.!؟?\n]*\s*|[،,؛;.!؟?\n]+\s*/gu) ?? [phrase];
  return clauses.flatMap(clause => {
    if (clause.length <= 160) return [clause];
    const words = clause.match(/\S+\s*|\s+/gu) ?? [clause];
    const result: string[] = [];
    let current = '';
    for (const word of words) {
      if (current && current.length + word.length > 120) { result.push(current); current = ''; }
      current += word;
    }
    if (current) result.push(current);
    return result;
  });
}
export type ReadingLine = { y: number; height: number };
/** Page starts come from actual line boxes. Never settle at an arbitrary offset. */
export function measuredReadingPages(lines: readonly ReadingLine[], availableHeight: number) {
  if (!lines.length || availableHeight <= 0) return [];
  const pages: { offset: number; height: number }[] = [];
  for (let index = 0; index < lines.length;) {
    const first = lines[index];
    let end = index;
    while (end + 1 < lines.length && lines[end + 1].y + lines[end + 1].height - first.y <= availableHeight + 0.1) end++;
    pages.push({ offset: first.y, height: lines[end].y + lines[end].height - first.y });
    index = end + 1;
  }
  return pages;
}
export function canAutoRead(reducedMotion: boolean | null, screenReader: boolean | null, foreground: boolean) {
  return reducedMotion === false && screenReader === false && foreground;
}
