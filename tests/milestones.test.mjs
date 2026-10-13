import assert from 'node:assert/strict';
import { test } from 'node:test';
import { counterReducer, getMilestoneProgress, initialCounterState, sanitizeCounterState } from '../src/counter.ts';
import { getActiveBeadCount, getBeadCycle } from '../src/beads.ts';

const counts = [0, 1, 32, 33, 34, 44, 65, 66, 67, 98, 99, 100, 132, 999, 1000, 1001];

test('all requested counts: milestones and 33-bead cycles are independent for every goal', () => {
  for (const target of [1, 7, 25, 33, 40, 99, 100, 1000, 9999]) {
    for (const count of counts) {
      const actual = getMilestoneProgress(count, target);
      const milestone = Math.max(1, Math.ceil(count / target)) * target;
      assert.equal(actual.activeMilestone, milestone);
      assert.equal(actual.intervalCount, count - milestone + target);
      assert.equal(actual.progress, (count - milestone + target) / target);
      assert.equal(actual.isMilestone, count > 0 && count % target === 0);
      assert.equal(getActiveBeadCount(count), count === 0 ? 0 : ((count - 1) % 33) + 1);
      assert.equal(getBeadCycle(count), Math.max(1, Math.ceil(count / 33)));
    }
  }
  assert.deepEqual(getMilestoneProgress(44, 33), {
    activeMilestone: 66, intervalCount: 11, progress: 1 / 3, isMilestone: false,
  });
});

test('invalid counts and targets safely fall back without NaN or zero division', () => {
  for (const target of [0, -1, NaN, Infinity, 1.5, 10000]) {
    assert.equal(getMilestoneProgress(34, target).activeMilestone, 66);
  }
  for (const count of [-1, NaN, Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(getMilestoneProgress(count, 33).progress, 0);
    assert.equal(getActiveBeadCount(count), 0);
    assert.equal(getBeadCycle(count), 1);
  }
});

test('rapid reducer actions continue through every milestone without resetting the base target', () => {
  let state = { ...initialCounterState, target: 7 };
  const completed = [];
  for (let count = 1; count <= 1001; count++) {
    state = counterReducer(state, { type: 'increment' });
    assert.equal(state.count, count);
    assert.equal(state.totalSessionCount, count);
    assert.equal(state.target, 7);
    if (getMilestoneProgress(state.count, state.target).isMilestone) completed.push(count);
  }
  assert.equal(completed.length, 143);
  assert.equal(completed.at(-1), 1001);
});

test('undo across boundaries, goal changes, resets and legacy restoration preserve counting data', () => {
  let state = sanitizeCounterState({ ...initialCounterState, count: 67, target: 33, cycle: 8, totalSessionCount: 200 });
  assert.equal('cycle' in state, false); // Legacy manual round metadata is no longer used.
  state = counterReducer(state, { type: 'undo' });
  assert.equal(state.count, 66);
  assert.equal(getMilestoneProgress(state.count, state.target).activeMilestone, 66);
  assert.equal(getActiveBeadCount(state.count), 33);
  state = counterReducer(state, { type: 'undo' });
  assert.equal(getMilestoneProgress(state.count, state.target).intervalCount, 32);
  state = counterReducer(state, { type: 'setTarget', target: 25 });
  assert.equal(state.count, 65);
  assert.equal(getMilestoneProgress(state.count, state.target).activeMilestone, 75);
  state = counterReducer(state, { type: 'setFullScreenTap', enabled: true });
  const restored = sanitizeCounterState(JSON.parse(JSON.stringify(state)));
  assert.deepEqual(restored, state);
  assert.equal(restored.fullScreenTap, true);
  assert.deepEqual(getMilestoneProgress(restored.count, restored.target), getMilestoneProgress(65, 25));
  assert.equal(counterReducer(state, { type: 'setTarget', target: 0 }), state);
  state = counterReducer(state, { type: 'reset' });
  assert.equal(state.count, 0);
  assert.equal(state.target, 25);
  assert.equal(state.totalSessionCount, 198);
  assert.equal(getMilestoneProgress(state.count, state.target).activeMilestone, 25);
  assert.equal(getBeadCycle(state.count), 1);
  state = counterReducer(state, { type: 'resetAll' });
  assert.equal(state.totalSessionCount, 0);
});
