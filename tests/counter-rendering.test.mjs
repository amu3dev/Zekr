import assert from 'node:assert/strict';
import { test } from 'node:test';
import { toArabicDigits, normalizeDigits } from '../src/arabic.ts';
import { counterReducer, initialCounterState, getMilestoneProgress } from '../src/counter.ts';
import { getActiveBeadCount, getBeadCycle } from '../src/beads.ts';

const samples = new Map([
  [33, '٣٣'], [66, '٦٦'], [67, '٦٧'], [99, '٩٩'], [100, '١٠٠'],
  [103, '١٠٣'], [132, '١٣٢'], [133, '١٣٣'], [137, '١٣٧'],
  [999, '٩٩٩'], [1000, '١٠٠٠'], [1, '١'], [9999, '٩٩٩٩'],
  [99999, '٩٩٩٩٩'], [999999, '٩٩٩٩٩٩'],
]);

test('central counter inputs remain exact Arabic-Indic numeral runs at 1–6 digits', () => {
  for (const [count, expected] of samples) {
    const actual = toArabicDigits(count);
    assert.equal(actual, expected);
    assert.match(actual, /^[٠-٩]+$/u); // No ellipsis, grouping, or directional control characters.
    assert.equal(Number(normalizeDigits(actual)), count);
  }
});

test('third cycle and later render cumulative count while milestones and 33 beads stay independent', () => {
  for (const [count, expected] of samples) {
    const state = counterReducer({ ...initialCounterState, count: count - 1, target: 33 }, { type: 'increment' });
    assert.equal(state.count, count);
    assert.equal(toArabicDigits(state.count), expected);
    assert.equal(getBeadCycle(state.count), Math.floor((count - 1) / 33) + 1);
    assert.equal(getActiveBeadCount(state.count), ((count - 1) % 33) + 1);
    const milestone = getMilestoneProgress(state.count, 33);
    assert.equal(milestone.intervalCount, ((count - 1) % 33) + 1);
    assert.equal(milestone.activeMilestone, Math.ceil(count / 33) * 33);
  }
});
