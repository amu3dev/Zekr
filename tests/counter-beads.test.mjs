import assert from 'node:assert/strict';
import { test } from 'node:test';

import { getActiveBeadCount, getBeadCycle, TOTAL_BEADS } from '../src/beads.ts';
import { counterReducer, initialCounterState } from '../src/counter.ts';

test('the 33 beads advance one at a time and wrap independently of the goal', () => {
  const boundaries = new Map([
    [0, 0],
    [1, 1],
    [32, 32],
    [33, 33],
    [34, 1],
    [66, 33],
    [67, 1],
    [99, 33],
    [100, 1],
  ]);

  assert.equal(TOTAL_BEADS, 33);
  for (const [count, activeBeadCount] of boundaries) {
    assert.equal(getActiveBeadCount(count), activeBeadCount, `count ${count}`);
  }
});

test('undo and reset keep the bead loop aligned with count', () => {
  let state = initialCounterState;
  for (let count = 1; count <= 34; count += 1) {
    state = counterReducer(state, { type: 'increment' });
    assert.equal(state.count, count);
    assert.equal(getActiveBeadCount(state.count), ((count - 1) % TOTAL_BEADS) + 1);
  }

  state = counterReducer(state, { type: 'setTarget', target: 33 });
  assert.equal(state.count, 34);
  assert.equal(getActiveBeadCount(state.count), 1);

  state = counterReducer(state, { type: 'undo' });
  assert.equal(state.count, 33);
  assert.equal(getActiveBeadCount(state.count), 33);

  state = counterReducer(state, { type: 'reset' });
  assert.equal(state.count, 0);
  assert.equal(getBeadCycle(state.count), 1);
  assert.equal(getActiveBeadCount(state.count), 0);
  assert.equal(state.totalSessionCount, 33);

});
