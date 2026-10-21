import assert from 'node:assert/strict';
import { test } from 'node:test';
import { DHIKR_OPTIONS, counterReducer, getMilestoneProgress, initialCounterState } from '../src/counter.ts';
import { getActiveBeadCount, getBeadCycle } from '../src/beads.ts';
import { ROUTINES, getRoutineProgress, initialRoutineState, parseRoutineState, routineReducer } from '../src/routines.ts';
import { PersistentState } from '../src/persistence.ts';
import { adapterFixture } from './support/async-storage-adapters.mjs';

const start = (id = 'afterPrayer99Tahlil') => routineReducer(initialRoutineState, { type: 'start', routineId: id });
const tap = state => routineReducer(state, { type: 'increment' });
const undo = state => routineReducer(state, { type: 'undo' });
const taps = (state, count) => { for (let i = 0; i < count; i++) state = tap(state); return state; };
const progress = state => getRoutineProgress(state.session);
const key = '@dhikr/routines/v1';

test('exactly four curated definitions have valid shared phrases, ordered counts, contexts and source metadata', () => {
  assert.deepEqual(ROUTINES.map(r => r.id), ['afterPrayer99Tahlil','afterPrayer100','afterPrayer30','beforeSleep100']);
  const expected = [[33,33,33,1], [33,33,34], [10,10,10], [33,33,34]];
  ROUTINES.forEach((routine, index) => {
    assert.equal(routine.definitionVersion, 1);
    assert.equal(routine.context, index === 3 ? 'beforeSleep' : 'afterPrayer');
    assert.deepEqual(routine.steps.map(s => s.repetitions), expected[index]);
    assert.deepEqual(routine.steps.map(s => s.dhikrId), index === 0 ? ['tasbih','tahmid','takbir','tahlil'] : ['tasbih','tahmid','takbir']);
    assert.equal(routine.total, routine.steps.reduce((sum, step) => sum + step.repetitions, 0));
    assert.ok(routine.title && routine.description && routine.source.collection && routine.source.reference);
    assert.match(routine.source.url, /^https:\/\/(sunnah\.com|dorar\.net)\//);
    for (const step of routine.steps) assert.ok(DHIKR_OPTIONS.some(d => d.id === step.dhikrId && d.phrase));
  });
});

for (const routine of ROUTINES) {
  test(`${routine.id}: every tap and undo including all boundaries, completion once, no restart`, () => {
    let state = start(routine.id), completions = 0;
    let cumulative = 0;
    for (let step = 0; step < routine.steps.length; step++) {
      for (let count = 1; count <= routine.steps[step].repetitions; count++) {
        const before = state;
        state = tap(state);
        cumulative++;
        assert.equal(progress(state).overall, cumulative);
        assert.equal(state.totalRecorded, cumulative);
        assert.deepEqual(undo(state), before, 'one undo must reverse exactly one tap across every boundary');
        if (!progress(before).completed && progress(state).completed) completions++;
        if (count === routine.steps[step].repetitions && step < routine.steps.length - 1) {
          assert.equal(progress(state).stepIndex, step + 1);
          assert.equal(progress(state).stepCount, 0, 'boundary tap cannot spill into next step');
        } else {
          assert.equal(progress(state).stepIndex, step);
          assert.equal(progress(state).stepCount, count);
        }
      }
    }
    assert.equal(completions, 1);
    assert.equal(progress(state).completed, true);
    assert.equal(taps(state, 50), state);
    assert.equal(progress(undo(state)).completed, false);
    assert.equal(progress(undo(state)).stepCount, routine.steps.at(-1).repetitions - 1);
  });
}

test('zero undo, invalid start and inactive actions are harmless; leave/resume retains progress', () => {
  assert.equal(undo(initialRoutineState), initialRoutineState);
  assert.equal(routineReducer(initialRoutineState, { type: 'start', routineId: 'unknown' }), initialRoutineState);
  let state = start();
  assert.equal(undo(state), state);
  state = taps(state, 34);
  const left = routineReducer(state, { type: 'leave' });
  assert.equal(tap(left), left);
  assert.equal(undo(left), left);
  assert.deepEqual(routineReducer(left, { type: 'resume' }), state);
});

test('34th repetition enters visual bead cycle two while step target stays 34', () => {
  const state = taps(start('beforeSleep100'), 100);
  assert.equal(progress(state).stepCount, 34);
  assert.equal(progress(state).stepTarget, 34);
  assert.equal(getActiveBeadCount(progress(state).stepCount), 1);
  assert.equal(getBeadCycle(progress(state).stepCount), 2);
});

test('routine ledger changes once per tap/undo; restart, replacement and leave retain aggregate history', () => {
  let state = taps(start(), 34);
  state = undo(state);
  assert.equal(state.totalRecorded, 33);
  state = routineReducer(state, { type: 'restart' });
  assert.equal(state.totalRecorded, 33);
  assert.equal(progress(state).overall, 0);
  state = taps(state, 2);
  state = routineReducer(state, { type: 'start', routineId: 'afterPrayer30' });
  assert.equal(state.totalRecorded, 35);
  state = undo(state);
  assert.equal(state.totalRecorded, 35);
  assert.deepEqual(routineReducer(state, { type: 'resetAll' }), initialRoutineState);
});

test('single counter/milestone engine remains independent from the routine ledger', () => {
  const single = { ...initialCounterState, count: 44, target: 33, totalSessionCount: 500 };
  const routine = taps(start(), 99);
  assert.equal(routine.totalRecorded, 99);
  assert.equal(single.count, 44);
  assert.equal(getMilestoneProgress(single.count, single.target).activeMilestone, 66);
  assert.equal(counterReducer(single, { type: 'increment' }).count, 45);
  assert.equal(counterReducer(single, { type: 'increment' }).totalSessionCount, 501);
});

test('saved routine state round trips at every count, including boundary zero and completed', () => {
  for (const routine of ROUTINES) {
    let state = start(routine.id);
    for (let count = 0; count <= routine.total; count++) {
      assert.deepEqual(parseRoutineState(JSON.parse(JSON.stringify(state))), state);
      assert.deepEqual(progress(parseRoutineState(JSON.parse(JSON.stringify(state)))), progress(state));
      state = tap(state);
    }
  }
});

test('unknown/obsolete definitions, corrupt counts/ledgers and invalid schema fail closed', () => {
  const valid = taps(start(), 34);
  const invalid = [null, [], {}, { ...valid, version: 2 }, { ...valid, inRoutine: 1 },
    { ...valid, session: null }, { ...valid, session: [] }, { ...valid, totalRecorded: 33 },
    { ...valid, totalRecorded: NaN }, { ...valid, totalRecorded: -1 },
    ...[{ routineId: 'unknown' }, { definitionVersion: 2 }, { completedRepetitions: -1 },
      { completedRepetitions: 101 }, { completedRepetitions: 0.5 }, { completedRepetitions: '34' }]
      .map(patch => ({ ...valid, session: { ...valid.session, ...patch } }))];
  for (const value of invalid) assert.throws(() => parseRoutineState(value));
});

for (const platform of ['native','web']) {
  test(`${platform}: old installations initialize an isolated routine key without rewriting counter data`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const original = JSON.stringify({ ...initialCounterState, count: 202, totalSessionCount: 500 });
    const { storage, disk, calls } = adapterFixture(platform, [['@dhikr/counter-state/v1', original]]);
    await storage.routinePersistence.initialize();
    assert.equal(calls.writes.length, 0);
    storage.routinePersistence.update(() => taps(start(), 67));
    await storage.routinePersistence.flush();
    assert.equal(disk.get('@dhikr/counter-state/v1'), original);
    assert.equal(JSON.parse(disk.get(key)).session.completedRepetitions, 67);
    assert.equal((await storage.loadRoutineState()).session.completedRepetitions, 67);
  });

  test(`${platform}: failed reads, malformed JSON, unknown routine and empty native payload never authorize writes`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const unknown = { ...start(), session: { ...start().session, routineId: 'removed' } };
    for (const raw of ['', '{', 'null', '[]', JSON.stringify(unknown)]) {
      const { storage, disk, calls } = adapterFixture(platform, [[key, raw]]);
      await storage.routinePersistence.initialize();
      storage.routinePersistence.update(() => start());
      assert.equal(await storage.routinePersistence.flush(), false);
      assert.equal(storage.routinePersistence.getSnapshot().hydration, 'error');
      assert.equal(calls.writes.length, 0);
      assert.equal(disk.get(key), raw);
    }
    const original = JSON.stringify(taps(start(), 67));
    const { storage, disk, calls, faults } = adapterFixture(platform, [[key, original]]);
    faults.read = true;
    await storage.routinePersistence.initialize();
    storage.routinePersistence.update(() => start());
    assert.equal(await storage.routinePersistence.flush(), false);
    assert.equal(calls.writes.length, 0);
    faults.read = false;
    await storage.routinePersistence.retry();
    assert.equal(storage.routinePersistence.getSnapshot().value.session.completedRepetitions, 67);
    assert.equal(disk.get(key), original);
  });
}

test('routine owner gates hydration and serializes slow writes, preserving newer taps after failures', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let disk = taps(start(), 32), failRead = true, failWrite = false, release;
  const writes = [];
  let gate = null;
  const create = () => new PersistentState({ initialValue: initialRoutineState,
    read: async () => { if (failRead) throw Error('read'); return parseRoutineState(structuredClone(disk)); },
    write: async value => { writes.push(value); if (gate) await gate;
      if (failWrite) throw Error('write'); disk = structuredClone(value); } });
  const store = create();
  store.update(() => start('beforeSleep100'));
  assert.equal(await store.flush(), false);
  await store.initialize();
  assert.equal(store.getSnapshot().hydration, 'error');
  assert.deepEqual(writes, []);
  failRead = false;
  await store.retry();
  store.update(tap);
  failWrite = true;
  gate = new Promise(resolve => { release = resolve; });
  const pending = store.flush();
  await new Promise(resolve => setImmediate(resolve));
  store.update(tap);
  assert.equal(store.flush(), pending);
  release();
  assert.equal(await pending, false);
  assert.equal(disk.session.completedRepetitions, 32);
  assert.equal(store.getSnapshot().value.session.completedRepetitions, 34);
  assert.equal(store.getSnapshot().saveStatus, 'error');
  failWrite = false; gate = null;
  await store.retry();
  assert.equal(disk.session.completedRepetitions, 34);
  assert.equal(disk.totalRecorded, 34);
  const restored = create();
  await restored.initialize();
  assert.deepEqual(restored.getSnapshot().value, store.getSnapshot().value);
  assert.deepEqual(writes.map(s => s.session.completedRepetitions), [33,34]);
});
