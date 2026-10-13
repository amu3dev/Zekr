import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeDigits, toArabicDigits, getCycleText } from '../src/arabic.ts';
import { initialCounterState, isValidTarget, sanitizeCounterState } from '../src/counter.ts';

test('Arabic and Persian keyboard digits round trip without altering other text', () => {
  assert.equal(normalizeDigits('١٢٣ ۴۵۶ 789، هدف'), '123 456 789، هدف');
  assert.equal(toArabicDigits('goal 123/9999'), 'goal ١٢٣/٩٩٩٩');
  assert.equal(normalizeDigits(toArabicDigits(9999)), '9999');
  assert.equal(getCycleText(2), 'الدورة الثانية');
  assert.equal(getCycleText(11), 'الدورة ١١');
});

test('targets accept only bounded integers', () => {
  for (const value of [1, 33, 9999]) assert.equal(isValidTarget(value), true);
  for (const value of [0, -1, 10000, 1.5, NaN, Infinity, '33', null]) {
    assert.equal(isValidTarget(value), false, String(value));
  }
});

test('corrupt saved data falls back field by field', () => {
  for (const raw of [null, undefined, 'invalid', []]) {
    assert.deepEqual(sanitizeCounterState(raw), initialCounterState);
  }
  const restored = sanitizeCounterState({
    count: -1, target: 10000, cycle: 0, totalSessionCount: Infinity,
    dhikrId: 'missing', hapticsEnabled: 'false', visualEffectsEnabled: 0,
    fullScreenTap: 'true',
  });
  assert.deepEqual(restored, initialCounterState);
  assert.equal(sanitizeCounterState({ count: 7, target: 33, cycle: 2, fullScreenTap: true }).count, 7);
  assert.equal(sanitizeCounterState({ count: 7 }).totalSessionCount, 7);
  assert.equal(sanitizeCounterState({ fullScreenTap: true }).fullScreenTap, true);
  const explicit = sanitizeCounterState({ hapticsEnabled: false, visualEffectsEnabled: false });
  assert.equal(explicit.hapticsEnabled, false);
  assert.equal(explicit.visualEffectsEnabled, false);
});
