import test from 'node:test';
import assert from 'node:assert/strict';
import { getDhikrExcerpt, getReadingEndPadding, getReadingViewport } from '../src/reading.ts';
import { DHIKR_OPTIONS } from '../src/counter.ts';

test('reading previews preserve an exact original clause with its tashkeel and punctuation', () => {
  for (const { phrase } of DHIKR_OPTIONS) {
    const { text, isExcerpt } = getDhikrExcerpt(phrase);
    assert.ok(phrase.startsWith(text));
    assert.ok(text.length > 0);
    if (isExcerpt) assert.match(text, /[،,؛;.!؟?]$/u);
    else assert.equal(text, phrase);
  }
});
test('Tahlil preview preserves the entire opening clause, including its affirmation', () => {
  const phrase = DHIKR_OPTIONS.find(d => d.id === 'tahlil').phrase;
  assert.equal(getDhikrExcerpt(phrase).text, 'لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ،');
});
test('Sayyid al-Istighfar preview ends after its complete opening clause', () => {
  const phrase = DHIKR_OPTIONS.find(d => d.id === 'sayyid_istighfar').phrase;
  assert.equal(getDhikrExcerpt(phrase).text, 'اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ،');
});
test('unpunctuated wording is never shortened and empty input is safe', () => {
  for (const phrase of ['', 'اللَّهُ أَكْبَرُ', 'أَسْتَغْفِرُ اللَّهَ وَأَتُوبُ إِلَيْهِ'])
    assert.deepEqual(getDhikrExcerpt(phrase), { text: phrase, isExcerpt: false });
});

test('native reading viewport and final offset settle on measured line boundaries', () => {
  for (const pitch of [42, 48.727272033691406, 84]) {
    for (const height of [220, 381.0909118652344, 540]) {
      const viewport = getReadingViewport(height, pitch);
      assert.ok(viewport <= height + 0.1);
      assert.ok(Math.abs(viewport / pitch - Math.round(viewport / pitch)) < 0.001);
      for (const content of [100, 543.6363677978516, 1300]) {
        const padding = getReadingEndPadding(content, viewport, pitch);
        assert.ok(padding >= 19.9 && padding < 20 + pitch);
        const overflow = content + padding - viewport;
        if (overflow > 0) assert.ok(Math.abs(overflow / pitch - Math.round(overflow / pitch)) < 0.001);
      }
    }
  }
  assert.equal(getReadingViewport(0, 0), 0);
  assert.equal(getReadingViewport(30, 42), 30);
  assert.equal(getReadingEndPadding(0, 0, 42), 20);
});
