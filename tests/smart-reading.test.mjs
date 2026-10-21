import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_READING, READING_MODES, READING_SPEEDS, canAutoRead, measuredReadingPages, parseReadingPreferences, segmentDhikr } from '../src/smartReading.ts';
import { DHIKR_OPTIONS, getDhikr } from '../src/counter.ts';
import { ROUTINES } from '../src/routines.ts';
import { adapterFixture } from './support/async-storage-adapters.mjs';

test('exactly four stable modes, backward compatible defaults and strict parsing', () => {
  assert.deepEqual(READING_MODES.map(item => item.id), ['full', 'ticker', 'segments', 'vertical']);
  assert.deepEqual(parseReadingPreferences({}), DEFAULT_READING);
  for (const { id } of READING_MODES) assert.equal(parseReadingPreferences({ mode: id }).mode, id);
  for (const raw of [null, [], 1, { mode: 'other' }, { speed: 'toString' }, { progression: 'other' }]) assert.throws(() => parseReadingPreferences(raw));
});
test('segments reconstruct every canonical phrase and preserve all Arabic punctuation/diacritics', () => {
  const phrases = [...DHIKR_OPTIONS.map(item => item.phrase), ...ROUTINES.flatMap(routine => routine.steps.map(step => getDhikr(step.dhikrId).phrase)),
    '،\n  اللَّهُمَّ اغْفِرْ لِي؛ ثُمَّ تُبْ عَلَيَّ!؟  ', 'أَسْتَغْفِرُ اللَّهَ '.repeat(50), ''];
  for (const phrase of phrases) {
    const segments = segmentDhikr(phrase);
    assert.equal(segments.join(''), phrase);
    assert.ok(segments.every(segment => !/^\p{M}/u.test(segment)));
  }
});
test('vertical pages cover measured irregular native line boxes exactly once at 1x/2x', () => {
  for (const scale of [1, 2]) {
    const lines = [0, 44, 89, 133, 178, 222, 267].map(y => ({ y: y * scale, height: 44 * scale }));
    const pages = measuredReadingPages(lines, 140 * scale);
    assert.equal(pages.length, 3);
    const covered = pages.flatMap(page => lines.filter(line => line.y >= page.offset && line.y + line.height <= page.offset + page.height + 0.1));
    assert.deepEqual(covered, lines);
    assert.ok(pages.every(page => lines.some(line => line.y === page.offset)));
  }
  assert.deepEqual(measuredReadingPages([], 100), []);
  assert.deepEqual(measuredReadingPages([{ y: 0, height: 200 }], 100), [{ offset: 0, height: 200 }]);
});
test('motion denied until both accessibility checks resolve, and while backgrounded', () => {
  for (const reduced of [null, false, true]) for (const reader of [null, false, true]) for (const foreground of [true, false])
    assert.equal(canAutoRead(reduced, reader, foreground), reduced === false && reader === false && foreground);
});
test('speed increases travel rate while allowing more reading time at slow speed', () => {
  assert.ok(READING_SPEEDS.slow.delay > READING_SPEEDS.normal.delay);
  assert.ok(READING_SPEEDS.normal.delay > READING_SPEEDS.fast.delay);
  assert.ok(READING_SPEEDS.slow.pixelsPerSecond < READING_SPEEDS.normal.pixelsPerSecond);
  assert.ok(READING_SPEEDS.normal.pixelsPerSecond < READING_SPEEDS.fast.pixelsPerSecond);
});
for (const platform of ['native', 'web']) {
  test(`${platform}: reading persistence restores without touching counting or routine keys`, async () => {
    const fixture = adapterFixture(platform, [['@dhikr/counter-state/v1', 'untouched'], ['@dhikr/routines/v1', 'untouched']]);
    await fixture.storage.readingPersistence.initialize();
    fixture.storage.readingPersistence.update(old => ({ ...old, mode: 'segments', progression: 'automatic', speed: 'slow' }));
    await fixture.storage.readingPersistence.flush();
    assert.deepEqual(await fixture.storage.loadReadingPreferences(), { mode: 'segments', progression: 'automatic', speed: 'slow' });
    assert.deepEqual([...fixture.disk.keys()].sort(), ['@dhikr/counter-state/v1', '@dhikr/reading/v1', '@dhikr/routines/v1']);
    assert.equal(fixture.disk.get('@dhikr/counter-state/v1'), 'untouched');
    assert.equal(fixture.disk.get('@dhikr/routines/v1'), 'untouched');
  });
  test(`${platform}: corrupt reading data fails closed and retry restores safely`, async () => {
    const fixture = adapterFixture(platform, [['@dhikr/reading/v1', '{broken']]);
    await fixture.storage.readingPersistence.initialize();
    fixture.storage.readingPersistence.update(() => DEFAULT_READING);
    assert.equal(await fixture.storage.readingPersistence.flush(), false);
    assert.equal(fixture.disk.get('@dhikr/reading/v1'), '{broken');
    fixture.disk.set('@dhikr/reading/v1', '{}');
    await fixture.storage.readingPersistence.retry();
    assert.equal(fixture.storage.readingPersistence.getSnapshot().hydration, 'ready');
  });
}
