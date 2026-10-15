import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PersistentState } from '../src/persistence.ts';
import { counterReducer, initialCounterState, sanitizeCounterState } from '../src/counter.ts';

const saved = { ...initialCounterState, count: 202, target: 33, totalSessionCount: 500 };
const clone = value => value == null ? null : JSON.parse(JSON.stringify(value));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const settle = () => new Promise(resolve => setImmediate(resolve));

// Every fixture is private in-memory storage. Never imports AsyncStorage or reads
// device/browser profiles. Mocked timers make failures and ordering deterministic.
function fixture(t, initial = saved, options = {}) {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const disk = { value: clone(initial), reads: 0, writes: [], failReads: 0, failWrites: 0, readGate: null, writeGate: null };
  const create = () => new PersistentState({
    initialValue: initialCounterState,
    read: async () => {
      disk.reads++;
      if (disk.readGate) await disk.readGate.promise;
      if (disk.failReads-- > 0) throw Error('isolated read failure');
      return disk.value === null ? null : sanitizeCounterState(clone(disk.value));
    },
    write: async value => {
      disk.writes.push(clone(value));
      if (disk.writeGate) await disk.writeGate.promise;
      if (disk.failWrites-- > 0) throw Error('isolated write failure');
      disk.value = clone(value);
    },
    ...options,
  });
  const store = create();
  const dispatch = action => store.update(state => counterReducer(state, action));
  return { disk, store, create, dispatch };
}

test('successful initial hydration restores saved data without rewriting it', async t => {
  const { store, disk } = fixture(t);
  assert.equal(store.getSnapshot().hydration, 'loading');
  await store.initialize();
  assert.equal(store.getSnapshot().hydration, 'ready');
  assert.deepEqual(store.getSnapshot().value, saved);
  t.mock.timers.tick(5000);
  assert.equal(await store.flush(), true);
  assert.deepEqual(disk.writes, []);
});

test('empty storage becomes ready with defaults; first action is safely saved', async t => {
  const { store, disk, dispatch } = fixture(t, null);
  await store.initialize();
  assert.equal(store.getSnapshot().hydration, 'ready');
  assert.equal(disk.value, null);
  assert.deepEqual(disk.writes, []);
  dispatch({ type: 'increment' });
  assert.equal(await store.flush(), true);
  assert.equal(disk.value.count, 1);
  assert.equal(disk.value.totalSessionCount, 1);
});

test('loading gates actions, background writes and duplicate initialization', async t => {
  const { store, disk, dispatch } = fixture(t);
  disk.readGate = deferred();
  const hydration = store.initialize();
  assert.equal(store.initialize(), hydration);
  await settle();
  dispatch({ type: 'resetAll' });
  assert.equal(await store.flush(), false);
  t.mock.timers.tick(10000);
  assert.equal(disk.reads, 1);
  assert.deepEqual(disk.value, saved);
  assert.deepEqual(disk.writes, []);
  disk.readGate.resolve();
  await hydration;
  assert.deepEqual(store.getSnapshot().value, saved);
});

test('P0: transient read failure preserves 202/500 byte-for-byte; retry restores them', async t => {
  const { store, disk, dispatch } = fixture(t);
  const original = JSON.stringify(disk.value);
  disk.failReads = 1;
  await store.initialize();
  assert.equal(store.getSnapshot().hydration, 'error');
  dispatch({ type: 'increment' });
  dispatch({ type: 'resetAll' });
  t.mock.timers.tick(10000);
  assert.equal(await store.flush(), false);
  assert.equal(JSON.stringify(disk.value), original);
  assert.deepEqual(disk.writes, []);
  await store.retry();
  assert.equal(store.getSnapshot().hydration, 'ready');
  assert.equal(store.getSnapshot().value.count, 202);
  assert.equal(store.getSnapshot().value.totalSessionCount, 500);
  assert.equal(JSON.stringify(disk.value), original);
  assert.deepEqual(disk.writes, []);
});

test('repeated failed reads never become ready or write defaults; restart still restores 202/500', async t => {
  const { store, disk, create } = fixture(t);
  disk.failReads = 4;
  for (let attempt = 0; attempt < 4; attempt++) {
    await store.retry();
    assert.equal(store.getSnapshot().hydration, 'error');
    assert.equal(await store.flush(), false);
    assert.deepEqual(disk.value, saved);
  }
  assert.deepEqual(disk.writes, []);
  const restarted = create();
  await restarted.initialize();
  assert.deepEqual(restarted.getSnapshot().value, saved);
});

test('write failure is observable, retains dirty updates, and retry saves latest without rehydrating', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  disk.failWrites = 1;
  dispatch({ type: 'increment' });
  assert.equal(await store.flush(), false);
  assert.equal(store.getSnapshot().saveStatus, 'error');
  assert.deepEqual(disk.value, saved);
  for (let i = 0; i < 100; i++) dispatch({ type: 'increment' });
  assert.equal(store.getSnapshot().value.count, 303);
  assert.equal(store.getSnapshot().saveStatus, 'error');
  await store.retry();
  assert.equal(store.getSnapshot().saveStatus, 'saved');
  assert.equal(disk.value.count, 303);
  assert.equal(disk.value.totalSessionCount, 601);
  assert.equal(disk.reads, 1);
});

test('automatic retry recovers without user action and preserves latest settings', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  disk.failWrites = 2;
  dispatch({ type: 'setHaptics', enabled: false });
  assert.equal(await store.flush(), false);
  dispatch({ type: 'setVisualEffects', enabled: false });
  t.mock.timers.tick(999);
  await settle();
  assert.equal(disk.writes.length, 1);
  t.mock.timers.tick(1);
  await settle();
  assert.equal(store.getSnapshot().saveStatus, 'error');
  assert.equal(disk.writes.length, 2);
  t.mock.timers.tick(2000);
  await settle();
  assert.equal(store.getSnapshot().saveStatus, 'saved');
  assert.equal(disk.value.hapticsEnabled, false);
  assert.equal(disk.value.visualEffectsEnabled, false);
});

test('rapid consecutive counting retains every action and coalesces pending snapshots', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  for (let i = 0; i < 1000; i++) dispatch({ type: 'increment' });
  assert.equal(store.getSnapshot().value.count, 1202);
  assert.deepEqual(disk.writes, []);
  t.mock.timers.tick(400);
  await settle();
  assert.equal(disk.writes.length, 1);
  assert.equal(disk.value.count, 1202);
  assert.equal(disk.value.totalSessionCount, 1500);
});

test('continuous counting cannot postpone autosave indefinitely', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  for (let i = 0; i < 20; i++) {
    dispatch({ type: 'increment' });
    t.mock.timers.tick(100);
    await settle();
  }
  assert.equal(disk.writes.length, 5);
  assert.equal(disk.value.count, 222);
});

test('slow older write, newer taps and background flush use one writer; latest snapshot wins', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  disk.writeGate = deferred();
  dispatch({ type: 'increment' });
  const first = store.flush();
  await settle();
  assert.equal(disk.writes.length, 1);
  for (let i = 0; i < 50; i++) dispatch({ type: 'increment' });
  assert.equal(store.flush(), first);
  t.mock.timers.tick(5000);
  assert.equal(disk.writes.length, 1); // No overlapping native setItem calls.
  disk.writeGate.resolve();
  await first;
  assert.deepEqual(disk.writes.map(value => value.count), [203, 253]);
  assert.equal(disk.value.count, 253);
  assert.equal(disk.value.totalSessionCount, 551);
});

test('background flush includes synchronous taps before render; unsubscribing retains pending progress', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  const unsubscribe = store.subscribe(() => {});
  for (let i = 0; i < 31; i++) dispatch({ type: 'increment' });
  unsubscribe();
  await store.flush();
  assert.equal(disk.value.count, 233);
  assert.equal(disk.value.totalSessionCount, 531);
});

test('a queued reset supersedes an older in-flight count even though its count is smaller', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  disk.writeGate = deferred();
  dispatch({ type: 'increment' });
  const pending = store.flush();
  await settle();
  dispatch({ type: 'resetAll' });
  dispatch({ type: 'setTarget', target: 7 });
  disk.writeGate.resolve();
  await pending;
  assert.deepEqual(disk.writes.map(value => value.count), [203, 0]);
  assert.equal(disk.value.totalSessionCount, 0);
  assert.equal(disk.value.target, 7);
});

test('an older in-flight failure cannot discard newer actions queued during that write', async t => {
  const { store, disk, dispatch } = fixture(t);
  await store.initialize();
  disk.failWrites = 1;
  disk.writeGate = deferred();
  dispatch({ type: 'increment' });
  const pending = store.flush();
  await settle();
  dispatch({ type: 'increment' });
  dispatch({ type: 'setFullScreenTap', enabled: true });
  disk.writeGate.resolve();
  assert.equal(await pending, false);
  assert.deepEqual(disk.value, saved);
  await store.retry();
  assert.equal(disk.value.count, 204);
  assert.equal(disk.value.totalSessionCount, 502);
  assert.equal(disk.value.fullScreenTap, true);
});

test('interruption before acknowledgement restores last saved snapshot; completed write survives restart', async t => {
  const { store, disk, create, dispatch } = fixture(t);
  await store.initialize();
  disk.writeGate = deferred();
  dispatch({ type: 'increment' });
  const pending = store.flush();
  await settle();
  // A killed runtime cannot guarantee an unacknowledged native write. Capture
  // durable storage at that boundary instead of pretending the OS flushed it.
  const atInterruption = clone(disk.value);
  const interruptedRestart = new PersistentState({ initialValue: initialCounterState,
    read: async () => atInterruption, write: async () => assert.fail('Unexpected startup write') });
  await interruptedRestart.initialize();
  assert.equal(interruptedRestart.getSnapshot().value.count, 202);
  assert.equal(interruptedRestart.getSnapshot().value.totalSessionCount, 500);
  disk.writeGate.resolve();
  await pending;
  const restarted = create();
  await restarted.initialize();
  assert.equal(restarted.getSnapshot().value.count, 203);
  assert.equal(restarted.getSnapshot().value.totalSessionCount, 501);
});

test('undo, reset, milestones, Free Tap and settings preserve semantics across failed writes and restart', async t => {
  const { store, disk, create, dispatch } = fixture(t, { ...saved, count: 32 });
  await store.initialize();
  disk.failWrites = 1;
  dispatch({ type: 'increment' }); // milestone 33
  assert.equal(await store.flush(), false);
  dispatch({ type: 'increment' });
  dispatch({ type: 'undo' });
  assert.equal(store.getSnapshot().value.count, 33);
  dispatch({ type: 'setFullScreenTap', enabled: true });
  dispatch({ type: 'setHaptics', enabled: false });
  dispatch({ type: 'setVisualEffects', enabled: false });
  dispatch({ type: 'setTarget', target: 7 });
  await store.retry();
  const restarted = create();
  await restarted.initialize();
  assert.deepEqual(restarted.getSnapshot().value, store.getSnapshot().value);
  assert.equal(disk.value.fullScreenTap, true);
  dispatch({ type: 'reset' });
  assert.equal(store.getSnapshot().value.totalSessionCount, 501);
  await store.flush();
  assert.equal(disk.value.count, 0);
  assert.equal(disk.value.totalSessionCount, 501);
  dispatch({ type: 'resetAll' });
  await store.flush();
  assert.equal(disk.value.totalSessionCount, 0);
});

test('theme has the same read gate, serialized updates and failure recovery as counting', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let theme = 'softIvory', failRead = true, failWrite = true;
  const writes = [];
  const store = new PersistentState({ initialValue: 'midnightSapphire',
    read: async () => { if (failRead) throw Error('theme read'); return theme; },
    write: async value => { writes.push(value); if (failWrite) throw Error('theme write'); theme = value; }, intervalMs: 0 });
  await store.initialize();
  store.update(() => 'royalAmethyst');
  assert.equal(await store.flush(), false);
  assert.equal(theme, 'softIvory');
  assert.deepEqual(writes, []);
  failRead = false;
  await store.retry();
  assert.equal(store.getSnapshot().value, 'softIvory');
  store.update(() => 'royalAmethyst');
  assert.equal(await store.flush(), false);
  store.update(() => 'midnightSapphire');
  failWrite = false;
  await store.retry();
  assert.equal(theme, 'midnightSapphire');
  assert.deepEqual(writes, ['royalAmethyst', 'midnightSapphire']);
});

test('legacy state is migrated in memory without rewriting the source during hydration', async t => {
  const legacy = { count: 202, target: 33, cycle: 8, hapticsEnabled: false };
  const { disk, store, dispatch } = fixture(t, legacy);
  await store.initialize();
  assert.equal(store.getSnapshot().value.totalSessionCount, 202);
  assert.equal(store.getSnapshot().value.visualEffectsEnabled, true);
  assert.equal('cycle' in store.getSnapshot().value, false);
  assert.deepEqual(disk.value, legacy);
  dispatch({ type: 'increment' });
  await store.flush();
  assert.equal(disk.value.count, 203);
  assert.equal(disk.value.totalSessionCount, 203);
});
