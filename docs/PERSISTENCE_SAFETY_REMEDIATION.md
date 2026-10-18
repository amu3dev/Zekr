> **Historical snapshot.** This dated report and its original evidence are preserved. For current behavior, test results and release status see the [project baseline](PROJECT_BASELINE.md). Older test totals and machine-local evidence links below are not current portable proof.

# Zekr persistence safety remediation

Date: 15 October 2026 (Africa/Cairo). Baseline commit: `626c38824be570c34bce4cb365f9bc28d358bb68`.

**Result: the RR-01 destructive hydration failure is resolved in the implemented lifecycle and isolated failure-injection tests. RR-04 silent write failures now produce visible feedback and retain pending changes for retry. Native crash durability and overall release readiness are separate, outstanding validations.**

The [existing release-readiness audit](/Users/ayosry/.codex/visualizations/2026/10/15/01a13e7d-bc8f-77d3-aa52-1b65af5f003f/release-readiness-audit/docs/RELEASE_READINESS_AUDIT.md) was read before implementation. Its unrelated milestone presentation, contrast and native release findings remain outside this remediation. No commit, push, publication, dependency upgrade, native-project generation or real user-storage modification was performed.

## Confirmed root cause and exact failure sequence

The original storage abstraction erased the difference between a missing key and a rejected read. Its catch block returned `null` for either a storage exception or JSON parsing failure. The screen then marked initialization complete regardless of whether data had actually been read.

The pre-fix reproduction used the audit's browser harness against the actual, unchanged application code in a fresh Chrome profile:

1. Seed isolated storage with current count **202**, total **500**, base target **33**, and non-default preferences.
2. Fail exactly the next counter read. All subsequent reads and writes remain available.
3. `loadCounterState()` catches the exception and resolves `null`.
4. `CounterScreen` skips restore and sets `isLoaded = true`; the reducer still holds its initial count **0**, total **0**, target **100** and default preferences.
5. The 400 ms persistence effect now considers those defaults eligible for saving and writes them over the original blob. The background path could also write these defaults once loaded.
6. Reload successfully reads **0 / 0**. The original saved progress is already gone.

Separately, both storage writers caught exceptions and resolved successfully, so the screen could neither detect unsaved progress nor retry it. Debounced saves and background saves had no shared sequencing owner. The overlapping-write issue was a source-confirmed race risk; the 202/500 read-failure overwrite was directly reproduced.

## Architecture and safety decisions

The existing AsyncStorage dependency, `CounterState` schema, pure reducer, and keys remain:

- `@dhikr/counter-state/v1`
- `@dhikr/theme/v1`

No database, service, journal key, schema revision or new application dependency was introduced.

`PersistentState<T>` owns each key for the lifetime of the JavaScript runtime. React subscribes through `useSyncExternalStore`; counter actions synchronously apply the existing reducer to that owner's latest value. This replaces the duplicated React reducer/ref cursor while retaining its guarantee that background persistence and tap feedback see every accepted action before React renders.

Hydration has explicit **loading / ready / error** states. Concurrent initialization requests share one read. Only a successful read returning `null` followed by error-free key enumeration confirming absence means empty storage (see the native empty-payload follow-up below). Read, parse and invalid-progress failures enter error state and leave the stored bytes alone. Actions and flushes are rejected until that key is ready. Hydration itself never schedules a write, including successful restoration and first launch.

The recovery screen offers an Arabic retry action and hides the native splash after the recovery view lays out, so a read error does not strand the user behind the splash. Foregrounding retries initialization. Neither path replaces existing data with a fresh session.

Writes have explicit **saved / pending / saving / error** status. Storage exceptions propagate to the owner. A failed flush returns `false`, retains the latest dirty revision, and keeps the failure notice visible until the latest revision is acknowledged. Retry after hydration writes memory; it does not reread older disk data over an active counting session.

Exactly one write per key can be in flight. Every update advances a revision, including resets whose numeric count decreases. The writer captures a snapshot/revision, awaits it, then drains any newer revision. An older success cannot clear newer pending progress; an older failure cannot discard it. Intermediate snapshots may be coalesced, but all reducer actions contribute to the latest state.

The previous trailing debounce is replaced with a **400 ms bounded coalescing interval**: continuous counting cannot postpone saving indefinitely. Theme changes use the same serialized owner with a zero-delay coalescing timer. Failed writes retry after 1, 2, 4, 8, 16 and then at most 30 seconds between attempts. Counting does not reset that backoff. Manual retry and foregrounding flush immediately; inactive/background events and component cleanup flush through the same queue.

The Arabic unsaved-progress notice allows counting to continue and explains that closing the app can lose unsaved changes. The same notice is present inside native modals because a root-view notice would otherwise be obscured by Settings or the theme gallery. Successful operation adds no notice.

Existing migration remains field-by-field: missing legacy aggregate count derives from current count; missing visual effects default to enabled; obsolete `cycle` metadata is ignored. Migration occurs in memory and is saved only after an actual update. Malformed JSON, invalid top-level payloads and explicitly invalid progress fields now block hydration rather than becoming writable zero progress. Unknown saved theme IDs are also preserved as recovery errors. There is no automatic deletion/reset of unreadable data.

## Files changed

| File | Purpose |
|---|---|
| `src/persistence.ts` | Hydration state machine, synchronous updates, serialized revisioned writes, coalescing, retry/backoff |
| `src/storage.ts` | Preserve keys, propagate actual read/write errors, validate persisted progress, instantiate the two owners |
| `src/hooks/usePersistentState.ts` | React subscription, initialization, foreground retry, background/unmount flushing |
| `App.tsx` | Counter-owner integration, recovery screen, splash handoff on read error, unsaved-progress feedback |
| `src/ThemeProvider.tsx` | Hydrate/select themes through their shared persistence owner |
| `src/theme.ts` | Expose hydration/save status in theme context; no token changes |
| `src/components/StorageNotice.tsx` | Arabic recovery/retry and unsaved-progress notices |
| `src/components/Modals.tsx` | Display failure feedback inside the existing modal shell |
| `tests/persistence.test.mjs` | 17 deterministic persistence regression tests using isolated in-memory storage and fake timers |
| `tests/persistence-browser.cjs` | 11 full-app failure/recovery scenarios using isolated browser storage and the actual web AsyncStorage adapter |
| `tests/launch-browser.cjs` | Assert empty storage remains untouched after intro taps/held gestures, with visible count still zero |
| `tests/milestones-browser.cjs` | Wait for modal dismissal after one close action; remove repeated clicks against a disappearing control |
| `package.json` | Add `npm run test:persistence`; existing `npm test` automatically includes new unit tests |
| `docs/PERSISTENCE_SAFETY_REMEDIATION.md` | Investigation, verification, evidence and residual risks |

`src/counter.ts`, CounterRing, FreeTapMode, theme colors, counting semantics and stored key/schema definitions were not changed.

## Before/after failure-injection evidence

| Scenario | Before | After |
|---|---|---|
| One failed initial read; saved 202/500, target 33 | Storage rewritten to 0/0, target 100; reload restores zeros | Error/retry screen; zero writes; original blob byte-for-byte intact; retry and reload restore 202/500, target 33 |
| Four failed initial reads, plus background events | Same destructive path was available | Every failed attempt remains blocked; zero writes; recovery and reload restore 202/500 |
| Write failure after a tap | Writer swallowed failure; accepted progress silently unsaved | Observable error and Arabic feedback; last saved blob intact; latest pending progress retained |
| 50 more taps while writes fail | No explicit recovery contract | Manual retry saves current count 253 and total 551; reload restores both |
| One failed save after 1,000 rapid taps | No automatic persistence recovery | Automatic retry saves current count 1202 and total 1500 |
| Slow older write plus new taps/background flush | Independent writes could overlap | One in-flight write; latest snapshot follows it; no stale final overwrite |
| Reset while an older write is in flight | No queue ordering contract | Reset's later revision wins even though its numeric count is smaller |
| Theme read/write failure | Read treated as empty; write silently swallowed | Saved theme preserved; error visible in gallery; retry/foreground recovery saves selected theme |
| Malformed or invalid saved progress | Parse failures treated as empty storage | Original bytes preserved, hydration error, zero writes |

Retained current-run artifacts:

- [Pre-fix reproduction JSON](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/before/storage-faults.json)
- [Post-fix full-app scenario results](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/after/results.json)
- [Recovery screen](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/after/read-error-1.png)
- [Counting during write failure](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/after/unsaved-counting.png)
- [Failure feedback inside theme gallery](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/after/theme-gallery-unsaved.png)
- [Verification and source fingerprints](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/persistence-remediation/verification.json)

The recovery and write-failure captures were visually inspected. The browser suite records zero uncaught page errors. Failure injection used only newly created browser contexts and in-memory unit-test adapters. Native APIs are mocked in browser tests; real application or device storage was never targeted.

## Verification results

| Command | Result |
|---|---|
| `npx tsc --noEmit` | PASS |
| `npm run lint` | PASS |
| `npm test` | PASS: all 28 tests, including the 11 existing tests and 17 new persistence tests |
| `npm run test:persistence` | PASS: 11 full-app scenario groups, including five malformed/invalid payload cases |
| `npm run test:milestones` | PASS: existing counting, undo, reset, target, milestone, Free Tap, theme and rendering regression checks |
| `npm run test:launch` | PASS: existing 13 launch/lifecycle scenarios with updated no-default-write assertions |
| `git diff --check` | PASS |

Coverage includes successful hydration, empty storage, loading gates, transient/repeated failed reads, retry/restart, failed writes, automatic/manual/foreground recovery, 1,000 rapid taps, bounded autosave during continuous counting, delayed/outstanding writes, reset ordering, background/unmount flushing, last-acknowledged-snapshot restoration, legacy migration, theme selection and settings/Free Tap restoration. Existing browser checks also verify that hydration and retry do not replay milestone celebrations, and that launch gestures do not count.

The milestone harness initially repeated clicks on a closing control; awaiting dismissal resolved it. The launch suite initially depended on startup's old default write; its assertions now verify untouched empty storage and visible zero instead. Temporary QA packages and FFmpeg were installed outside the repository; the application dependency tree/lockfile was not changed.

To rerun the browser tests, provide the same external QA runtime used by the existing launch/milestone harnesses:

```sh
npm install --prefix /private/tmp/zekr-persistence-qa react@19.2.3 react-dom@19.2.3 react-native-web@0.21.0 esbuild playwright --no-audit --no-fund
ZEKR_QA_MODULES=/private/tmp/zekr-persistence-qa/node_modules \
ZEKR_QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
npm run test:persistence
```

Artifacts default to a fresh temporary directory; `ZEKR_QA_OUTPUT` can select an explicit output destination. The new unit tests run with `npm test` without these external browser packages.

## Remaining data-loss risks and evidence boundaries

- **Unacknowledged updates are not crash-durable.** Abrupt termination before the coalescing interval or during an in-flight write can lose changes after the last successfully acknowledged snapshot. Background flushing is best effort; the OS need not wait for JavaScript or storage I/O. The interruption test explicitly verifies restoration of the last saved 202/500 while a newer write is unresolved; it does not pretend the unresolved tap is durable.
- **A sustained write outage retains changes only in memory.** Counting remains available and warned; closing/killing the runtime before recovery can lose those unsaved changes. Retry cannot manufacture durable storage while the underlying service is unavailable.
- **Unreadable/corrupt data is preserved, not repaired automatically.** Repeated retry will continue failing unless the payload/service becomes readable. No destructive reset bypass was added. Data already overwritten by the old version cannot be reconstructed from the replacement zeros.
- **Underlying storage guarantees remain AsyncStorage's.** There is no new backup copy, transactional journal or power-loss/fsync guarantee. A storage operation that never settles can also hold hydration or the single writer; issuing competing timed-out writes would undermine ordering.
- **Native platform fault injection remains unverified.** These tests exercise actual app code through React Native Web plus deterministic persistence-core tests. Native process termination, OS suspension timing, AsyncStorage's platform durability, screen-reader announcements and physical haptics were not exercised. A read-only CoreSimulator availability check failed with service connection refusal in the current sandbox; no device was used for fault injection.

The P0 conclusion is supported by both the reproduced pre-fix loss and the post-fix critical test: **a failed initialization performs no writes, preserves the exact stored 202/500 payload, and restores those same values after recovery and restart**. It does not close unrelated audit findings or establish overall release approval.

Implementation references checked against this checkout: [Expo SDK 57](https://docs.expo.dev/versions/v57.0.0/), [SDK 57 AsyncStorage](https://docs.expo.dev/versions/v57.0.0/sdk/async-storage/), [SDK 57 SplashScreen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/), and [React Native AppState](https://reactnative.dev/docs/appstate).


## Follow-up: native empty-payload corruption gap — 15 October 2026

**Result: the identified empty-payload gap is closed at the application boundary under the installed storage adapter contract.** Existing empty counter/theme payloads are preserved, initialization enters the existing recoverable error state, and counting/selection cannot authorize a write until safe hydration succeeds. The original rejected-read P0 safeguards remain intact. This section records follow-up verification; the earlier 28-test/11-scenario results above are the initial remediation snapshot.

### Root cause and native/web differences

The installed AsyncStorage version is **2.2.0**. Both its native TypeScript source and shipped CommonJS adapter were inspected. Native `getItem()` unpacks its bridge result using a truthiness check:

```js
const value = result?.[0]?.[1] ? result[0][1] : null;
```

Consequently, both a genuinely missing value and an existing `""` payload resolve to `null`. The application previously trusted that null as proof of absence. Hydration became ready with defaults, and the first increment overwrote the existing empty blob with count 1, total 1, and default target/settings. Hydration alone did not write; the first action triggered the overwrite.

The installed web adapter returns `window.localStorage.getItem(key)` directly and therefore preserves `""`. Existing application JSON/theme validation already rejected web empty payloads. This explains why browser-only fault injection did not expose the native gap.

### Small production fix and getAllKeys evaluation

A shared `loadStoredValue()` helper in `src/storage.ts` now serves both keys. Non-null values continue through existing validation/migration without an additional storage operation. When `getItem()` returns null, it calls `getAllKeys()` and accepts defaults only when enumeration completes without error, yields a valid string array, and excludes that exact key.

The native Android implementation enumerates the database key column independently of stored values. The iOS implementation enumerates manifest keys. These paths can therefore distinguish a present empty value from an absent key under their normal API contract. They were inspected in the installed package; they were not executed on a device.

The installed native JS `getAllKeys()` adapter resolves whenever its callback receives a truthy key list, even if the callback also reports an error. The helper checks that callback error as well as promise rejection and the returned array. Non-array results, non-string entries and sparse arrays fail closed. The regression suite explicitly supplies an error alongside `[]` to prove this safeguard.

A present key with a null read throws into the existing hydration error/retry lifecycle. Rejected reads and failed/uncertain enumeration do likewise. No deletion, automatic reset, schema change, dependency change, UI change or new persistence owner was introduced. The existing write gate prevents actions, background flushes and retries from writing defaults after corruption detection. Retry can restore valid data once storage becomes readable again.

### Before/after reproduction and test results

Tests execute the **installed native JS adapter** with only its `RCTAsyncStorage` bridge replaced by a private in-memory callback implementation. The actual application `src/storage.ts` is transpiled using the project's existing TypeScript dependency and wired to the real persistence controller, reducer and theme registry. The installed web adapter is also executed with an isolated localStorage implementation. Adapter behavior is not reimplemented in the fixture.

| Case | Before | After |
|---|---|---|
| Existing native empty counter | Regression failed: first action replaced `""` with count 1/total 1/defaults | Hydration error, original `""` intact, zero writes |
| Existing native empty theme | Null could authorize default-theme hydration and a later selection write | Hydration error; selection/flush blocked; payload intact |
| Genuine missing keys | Defaults allowed | Defaults allowed only after verified absence; first updates save normally |
| Valid 202/500, theme and settings | Normal restoration | Exact restoration; no enumeration and no startup write |
| Rejected getItem | Original P0 guard blocks writes | Guard preserved; valid data restored on retry |
| Null read plus enumeration failure | Null could authorize defaults | Error; no write; retry waits for a trustworthy result |
| Native callback error alongside resolved `[]` | No verification was performed | Error preserved despite fulfilled adapter promise |
| Repeated empty data, then valid 202/500 and saved theme become readable | Existing native payload could be overwritten before recovery | Zero application writes during failure/recovery; exact values restored |
| Web empty counter/theme | Rejected by existing payload validation | Same protection preserved, with working recovery UI |

Checks run on the final source:

- `npx tsc --noEmit`: **PASS**.
- `npm run lint`: **PASS**.
- `npm test`: **50/50 PASS**, including all 28 previous tests and 22 new installed-adapter regressions. Cases A–H are covered, including both counter/theme paths, seven malformed/unavailable key-list responses, legacy migration, and callback-error-plus-result handling.
- `npm run test:persistence`: **13 scenario groups PASS**, zero uncaught page errors. Adds empty counter recovery, empty theme recovery and key-enumeration failure through the real browser UI; the invalid-payload group now covers six payloads.
- `npm run test:milestones`: **PASS**. Existing counting, undo/reset, rapid taps, milestones, Free Tap, theme switching/restoration and settings persistence checks remain passing.
- `npm run test:launch`: **PASS**, all 13 existing scenarios.
- `git diff --check`: **PASS**.

The serialized-write controller and lifecycle hook were inspected and remain byte-for-byte unchanged from the start of this follow-up. Existing regression tests still cover pending revisions, stale-write prevention, backoff/retry and responsiveness. Counting logic, theme tokens, UI and native splash were not modified.

### Files changed in this follow-up

- `src/storage.ts`: one shared null-read/existence guard, used by both loaders.
- `tests/storage-adapters.test.mjs`: 22 installed-native/web-adapter regression tests.
- `tests/support/async-storage-adapters.mjs`: isolated bridge/localStorage fixture and loader for the real installed adapters/application storage code.
- `tests/persistence-browser.cjs`: browser empty-payload and enumeration-failure regression coverage.
- `docs/PERSISTENCE_SAFETY_REMEDIATION.md`: updated null-read contract and this follow-up report.

All other pre-existing uncommitted changes were preserved. No commit or publication occurred, and no real user storage was accessed.

### Evidence and remaining limitations

- [Failing pre-fix native reproduction log](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/native-empty-payload/before-tests.log)
- [Follow-up production diff](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/native-empty-payload/storage-change.diff)
- [Final verification and source fingerprints](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/native-empty-payload/verification.json)
- [Current browser persistence results](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/native-empty-payload/browser-persistence/results.json)

**No physical-device testing was performed.** The native proof executes the installed JavaScript adapter against a simulated bridge; it does not establish native filesystem, OS process-death, or power-loss durability.

`getItem()` and `getAllKeys()` are separate, non-atomic operations. The fix relies on accurate, complete key enumeration and the app's existing sole ownership of these two keys during initialization. It cannot detect a backend that falsely reports a successful incomplete list, recover a missing/corrupt native manifest, or prevent an external writer from racing after absence was verified. The app itself performs no writes for an unhydrated key, so it does not introduce that race internally. A read/enumeration promise that never settles keeps initialization blocked rather than guessing absence.

Empty/corrupt data is preserved; the fix cannot reconstruct information already absent from that payload. Retry restores valid data if the storage service/payload recovers. Sustained corruption remains an error without an automatic reset. The earlier limitations around unacknowledged writes and abrupt termination remain.
