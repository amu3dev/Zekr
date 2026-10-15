import assert from 'node:assert/strict';
import { test } from 'node:test';
import { counterReducer, initialCounterState } from '../src/counter.ts';
import { adapterFixture, adapterVersion } from './support/async-storage-adapters.mjs';

const counterKey = '@dhikr/counter-state/v1';
const themeKey = '@dhikr/theme/v1';
const saved = { ...initialCounterState, count: 202, target: 33, totalSessionCount: 500 };
const savedJSON = JSON.stringify(saved);

for (const platform of ['native', 'web']) {
  test(`${platform} installed adapter: empty payload vs missing key behavior (${adapterVersion})`, async () => {
    const { adapter } = adapterFixture(platform, [[counterKey, '']]);
    assert.equal(await adapter.getItem(counterKey), platform === 'native' ? null : '');
    assert.equal(await adapter.getItem('missing'), null);
    assert.deepEqual(Array.from(await adapter.getAllKeys()), [counterKey]);
  });

  test(`${platform}: existing empty counter must never hydrate defaults or overwrite the payload`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls } = adapterFixture(platform, [[counterKey, '']]);
    const store = storage.counterPersistence;
    await store.initialize();
    store.update(state => counterReducer(state, { type: 'increment' }));
    await store.flush();
    assert.equal(disk.get(counterKey), '', 'An existing empty payload was overwritten by default-based counting');
    assert.equal(store.getSnapshot().hydration, 'error');
    assert.equal(calls.writes.length, 0);
  });

  test(`${platform}: verified missing keys initialize defaults and permit normal first updates`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls } = adapterFixture(platform, [['unrelated-key', 'preserve']]);
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'ready');
    assert.deepEqual(storage.counterPersistence.getSnapshot().value, initialCounterState);
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'ready');
    assert.equal(storage.themePersistence.getSnapshot().value, 'midnightSapphire');
    assert.equal(calls.keys, 2);
    assert.equal(calls.writes.length, 0);
    storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
    storage.themePersistence.update(() => 'softIvory');
    assert.equal(await storage.counterPersistence.flush(), true);
    assert.equal(await storage.themePersistence.flush(), true);
    assert.equal(JSON.parse(disk.get(counterKey)).count, 1);
    assert.equal(disk.get(themeKey), 'softIvory');
    assert.equal(disk.get('unrelated-key'), 'preserve');
  });

  test(`${platform}: valid saved counts, theme and settings restore without enumeration or rewriting`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const settings = { ...saved, hapticsEnabled: false, visualEffectsEnabled: false, fullScreenTap: true };
    const raw = JSON.stringify(settings);
    const { storage, disk, calls, faults } = adapterFixture(platform, [[counterKey, raw], [themeKey, 'softIvory']]);
    faults.keys = true; // Valid reads must not depend on enumeration availability.
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    assert.deepEqual(storage.counterPersistence.getSnapshot().value, settings);
    assert.equal(storage.themePersistence.getSnapshot().value, 'softIvory');
    assert.equal(calls.keys, 0);
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.get(counterKey), raw);
    storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
    await storage.counterPersistence.flush();
    assert.deepEqual(JSON.parse(disk.get(counterKey)), { ...settings, count: 203, totalSessionCount: 501 });
    assert.equal(disk.get(themeKey), 'softIvory');
  });

  test(`${platform}: existing empty theme remains protected from selection until recovery`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls } = adapterFixture(platform, [[counterKey, savedJSON], [themeKey, '']]);
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    storage.themePersistence.update(() => 'royalAmethyst');
    assert.equal(await storage.themePersistence.flush(), false);
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    assert.equal(disk.get(themeKey), '');
    assert.equal(disk.get(counterKey), savedJSON);
    assert.equal(calls.writes.length, 0);
  });

  test(`${platform}: rejected getItem preserves data, skips enumeration and recovers through retry`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls, faults } = adapterFixture(platform, [[counterKey, savedJSON], [themeKey, 'softIvory']]);
    faults.read = true;
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    assert.equal(await storage.counterPersistence.flush(), false);
    assert.equal(await storage.themePersistence.flush(), false);
    assert.equal(calls.keys, 0);
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.get(counterKey), savedJSON);
    assert.equal(disk.get(themeKey), 'softIvory');
    faults.read = false;
    await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
    assert.deepEqual(storage.counterPersistence.getSnapshot().value, saved);
    assert.equal(storage.themePersistence.getSnapshot().value, 'softIvory');
    assert.equal(calls.writes.length, 0);
  });

  test(`${platform}: null plus failed existence check fails closed, then verified absence can recover`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls, faults } = adapterFixture(platform, [['unrelated-key', 'preserve']]);
    faults.keys = true;
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
    storage.themePersistence.update(() => 'softIvory');
    assert.equal(await storage.counterPersistence.flush(), false);
    assert.equal(await storage.themePersistence.flush(), false);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.has(counterKey), false);
    assert.equal(disk.has(themeKey), false);
    faults.keys = false;
    await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'ready');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'ready');
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.get('unrelated-key'), 'preserve');
  });

  test(`${platform}: unreadable existing data and uncertain enumeration cannot authorize defaults`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls, faults } = adapterFixture(platform, [[counterKey, savedJSON], [themeKey, 'softIvory']]);
    faults.nullRead = true;
    faults.keys = true;
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    faults.keys = false; // Keys now enumerate correctly, but values remain unreadable.
    await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    storage.counterPersistence.update(state => counterReducer(state, { type: 'resetAll' }));
    assert.equal(await storage.counterPersistence.flush(), false);
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.get(counterKey), savedJSON);
    assert.equal(disk.get(themeKey), 'softIvory');
    faults.nullRead = false;
    await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
    assert.deepEqual(storage.counterPersistence.getSnapshot().value, saved);
    assert.equal(storage.themePersistence.getSnapshot().value, 'softIvory');
    assert.equal(calls.writes.length, 0);
  });

  test(`${platform}: repeated empty payload errors allow valid-data recovery without a destructive write`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const { storage, disk, calls } = adapterFixture(platform, [[counterKey, ''], [themeKey, '']]);
    for (let attempt = 0; attempt < 3; attempt++) {
      await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
      assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
      assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
      assert.equal(await storage.counterPersistence.flush(), false);
      assert.equal(await storage.themePersistence.flush(), false);
      assert.equal(disk.get(counterKey), '');
      assert.equal(disk.get(themeKey), '');
    }
    // Simulate storage becoming readable again, only within this private fixture.
    // The application itself never repairs/replaces the empty payload.
    disk.set(counterKey, savedJSON);
    disk.set(themeKey, 'softIvory');
    await Promise.all([storage.counterPersistence.retry(), storage.themePersistence.retry()]);
    assert.deepEqual(storage.counterPersistence.getSnapshot().value, saved);
    assert.equal(storage.themePersistence.getSnapshot().value, 'softIvory');
    assert.equal(calls.writes.length, 0);
  });

  test(`${platform}: legacy migration still restores in memory and persists only after an action`, async t => {
    t.mock.timers.enable({ apis: ['setTimeout'] });
    const raw = JSON.stringify({ count: 202, target: 33, cycle: 8, hapticsEnabled: false });
    const { storage, disk, calls } = adapterFixture(platform, [[counterKey, raw]]);
    await storage.counterPersistence.initialize();
    assert.equal(storage.counterPersistence.getSnapshot().value.totalSessionCount, 202);
    assert.equal(storage.counterPersistence.getSnapshot().value.visualEffectsEnabled, true);
    assert.equal('cycle' in storage.counterPersistence.getSnapshot().value, false);
    assert.equal(disk.get(counterKey), raw);
    assert.equal(calls.writes.length, 0);
    storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
    await storage.counterPersistence.flush();
    assert.equal(JSON.parse(disk.get(counterKey)).count, 203);
    assert.equal(JSON.parse(disk.get(counterKey)).totalSessionCount, 203);
  });
}

test('native: callback error plus a resolved empty key list still fails closed', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { adapter, storage, disk, calls, faults } = adapterFixture('native', [[counterKey, ''], [themeKey, '']]);
  faults.keysResult = [];
  faults.keysErrorWithResult = true;
  let callbackError;
  // Prove the installed adapter resolves despite this callback error.
  assert.equal((await adapter.getAllKeys(error => { callbackError = error; })).length, 0);
  assert.ok(callbackError);
  await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
  storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
  storage.themePersistence.update(() => 'softIvory');
  assert.equal(await storage.counterPersistence.flush(), false);
  assert.equal(await storage.themePersistence.flush(), false);
  assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
  assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
  assert.equal(disk.get(counterKey), '');
  assert.equal(disk.get(themeKey), '');
  assert.equal(calls.writes.length, 0);
});

test('native: malformed or unavailable key lists never verify absence', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  for (const result of [null, false, 'not-a-list', {}, [null], [7], new Array(1)]) {
    const { storage, disk, calls, faults } = adapterFixture('native');
    faults.keysResult = result;
    await Promise.all([storage.counterPersistence.initialize(), storage.themePersistence.initialize()]);
    assert.equal(storage.counterPersistence.getSnapshot().hydration, 'error');
    assert.equal(storage.themePersistence.getSnapshot().hydration, 'error');
    storage.counterPersistence.update(state => counterReducer(state, { type: 'increment' }));
    assert.equal(await storage.counterPersistence.flush(), false);
    assert.equal(calls.writes.length, 0);
    assert.equal(disk.has(counterKey), false);
  }
});
