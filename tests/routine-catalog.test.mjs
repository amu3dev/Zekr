import test from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINES } from '../src/routines.ts';
import { groupRoutineSequences } from '../src/routineCatalog.ts';

test('catalog groups identical sequences while retaining every context, source and stable ID', () => {
  const groups = groupRoutineSequences(ROUTINES);
  assert.equal(groups.length, 3);
  const shared = groups.find(group => group.variants.length === 2);
  assert.deepEqual(shared.variants.map(r => r.id), ['afterPrayer100', 'beforeSleep100']);
  assert.deepEqual(shared.variants.map(r => r.context), ['afterPrayer', 'beforeSleep']);
  assert.deepEqual(shared.variants.map(r => r.source.reference), ['596a', '5361']);
  assert.deepEqual(groups.flatMap(g => g.variants).map(r => r.id).sort(), ROUTINES.map(r => r.id).sort());
  for (const routine of groups.flatMap(g => g.variants)) assert.equal(routine, ROUTINES.find(r => r.id === routine.id));
});
