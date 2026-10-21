# Guided Dhikr Routines — التسبيحات الكاملة

**Latest reading correction, 19 October:** [Arabic reading implementation and actual Android evidence](arabic-reading-fix/README.md). Long card previews are labelled authored clauses; full wording/counting remain in the reader, using native line measurements. Earlier native-pending statements below retain their historical validation scope.

Implemented locally on 18 October 2026. This feature extends the single-screen app; it does not introduce routes, accounts, a backend, network-dependent content or native configuration changes. Existing single-Dhikr counting, milestones and the six theme IDs/palettes are preserved. The earlier Android APK and baseline screenshots do **not** contain this feature.

**Presentation recovery, later on 18 October:** the oversized initial integration has been replaced by a compact viewport-fitting layout. See the [current before/after evidence and validation status](routines-ui/README.md). Domain/content/storage contracts below remain unchanged.

## Verified content

Arabic product subtitle: **أذكار مأثورة مرتبة بعددها**. The current catalog displays three practical sequence cards for the four unchanged routine definitions. The identical 33/33/34 sequence has separate after-prayer and before-sleep context/source/start rows, preserving both stable IDs and saved progress. Each card includes its title, ordered step summary and total. Source badges appear in the catalog, routine options and reading. They open an offline citation dialog; only its explicit **فتح المصدر** action opens the stored URL through React Native Linking, with inline failure feedback. Raw URLs are not displayed in product paragraphs; opening a website is not required to count.

**19 October refinement:** [Current presentation, before/after evidence and validation boundaries](routines-refinement/README.md). Long wording is available in a bounded inline reader without ellipsis, and expanded reading retains live count/Undo with the existing parent callbacks. The source/content/persistence contracts below are unchanged.

| Stable ID / Arabic title | Ordered repetitions | Total | Source verified 18 October 2026 | Finding |
| --- | --- | --- | --- | --- |
| `afterPrayer99Tahlil` / تسبيح بعد الصلاة — تمام المائة | Tasbih 33 → Tahmid 33 → Takbir 33 → Tahlil 1 | 100 | [Sahih Muslim 597a](https://sunnah.com/muslim/5/188) | Counts, final Tahlil and prayer context match. |
| `afterPrayer100` / تسبيح بعد الصلاة — ٣٣، ٣٣، ٣٤ | Tasbih 33 → Tahmid 33 → Takbir 34 | 100 | [Sahih Muslim 596a](https://sunnah.com/muslim:596a) | Counts/order and prescribed-prayer context match. Book-level supplied URL narrowed to the exact hadith. |
| `afterPrayer30` / التسبيح المختصر بعد الصلاة | Tasbih 10 → Tahmid 10 → Takbir 10 | 30 | [Sunan Abi Dawud 5065, Dorar](https://dorar.net/h/loc9eOdh), [cross-check](https://sunnah.com/abudawud:5065) | Uses only the prayer portion. Dorar records Abu Dawud's silence with his stated صالح criterion; Sunnah lists Sahih, Al-Albani. The separate bedtime portion is not appended. |
| `beforeSleep100` / تسبيح ما قبل النوم | Tasbih 33 → Tahmid 33 → Takbir 34 | 100 | [Sahih al-Bukhari 5361](https://sunnah.com/bukhari:5361) | Bedtime context, order and counts match. Book-level supplied URL narrowed to the exact hadith. |

No discrepancy requiring a religious-content change was found. These are separate narrated variants; the interface makes no comparative validity, acceptance or guaranteed-reward claim. The completion message acknowledges recorded repetitions only. Existing unrelated virtue descriptions in the individual library have not received a comprehensive new audit.

All four definitions have `definitionVersion: 1`, a stable ID, Arabic title, context, description, ordered `{ dhikrId, repetitions }` steps, declared total and `{ collection, reference, url }`. Totals are checked against the sum of steps. Shared library entries in `src/counter.ts` supply the exact existing diacritized phrases; no duplicate Dhikr entries were added:

- `tasbih`: سُبْحَانَ اللَّهِ
- `tahmid`: الْحَمْدُ لِلَّهِ
- `takbir`: اللَّهُ أَكْبَرُ
- `tahlil`: لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ، وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ

The first three are the named forms in the narrations. Diacritics and punctuation do not add wording to the final Tahlil.

## State, counting and lifecycle

`src/routines.ts` contains the deterministic catalog, pure reducer, derived progress and strict saved-state parser. A session stores one cumulative `completedRepetitions` integer. Step index, step count, active phrase and completion are derived from it. There is no second independent step counter or completion flag to drift.

- Each increment records exactly one repetition. At 33, the first 33-count step becomes complete and the next step displays zero. Tap 34 becomes one in that next step.
- Undo decrements that same integer, including `33 → 32` across a transition and `100 → 99` after completion. Zero cannot go negative.
- A completed session ignores further counting taps. It remains completed after restoration, and never restarts automatically. Undo, confirmed Restart and Return remain available.
- Main and guided Free Tap use the same owner and event handlers. Free Tap provides a large counting area around the ring; phrase scrolling and navigation controls are separate from it. Individual Free Tap keeps its existing behavior.
- The step arc uses the fixed step target, independently of single-mode milestones. Beads use the existing **33-bead engine on the current step count**: repetition 34 lights one bead in visual cycle two. A new step begins at zero beads. Overall progress is shown separately.
- Leaving retains the active session for resume. Starting another routine confirms replacement when the saved session has unfinished recorded progress. Restart also confirms. The previously selected individual Dhikr, count and base target survive entering/leaving; Free Tap visibility is a shared presentation preference.

The active phrase occupies a compact stable region. A long preview opens the complete wording in a scrollable reading dialog. Long Tahlil transitions do not move the counting control. Standard counting fits within the usable viewport; enlarged text permits safe scrolling and dock/goal reflow. Restart, switch and return occupy the existing dock's overflow sheet. Step and overall counts stay visible alongside the ring at standard scaling.

The existing ring provides short nonblocking progress feedback and respects the existing reduced-motion/effects controls. Transition haptics respect the haptic preference. Announcements happen in successful user-action handlers only when the step/completion changes, including boundary undo. Hydration, theme selection and save-status rerenders do not announce again. The counting control is retained across ordinary transitions to preserve focus; completion disables counting and exposes the acknowledgment and undo controls. Native assistive-technology focus/delivery still requires device QA.

## Persistence and statistics

The existing keys and schemas remain unchanged:

- `@dhikr/counter-state/v1`: original individual session, aggregate and preferences.
- `@dhikr/theme/v1`: original theme preference.
- **New** `@dhikr/routines/v1`: `{ version: 1, inRoutine, session, totalRecorded }`, where `session` is null or `{ routineId, definitionVersion: 1, completedRepetitions }`.

An old installation needs no counter migration. Verified absence initializes the new key in memory, without writing on hydration. The new key reuses `loadStoredValue`'s native-empty-payload existence check, `PersistentState` and `usePersistentState`. It inherits loading/error write gates, one runtime owner, serialized writes, revision tracking, 400 ms bounded autosave scheduling, retry/backoff, background flushing and save-failure feedback in the main screen and native modals.

Malformed JSON, invalid progress/ledger, unknown routines or incompatible definition versions fail closed. No replacement defaults or destructive repair writes are permitted. The individual session remains usable; routine recovery is offered separately. Combined statistics are marked incomplete and their reset is disabled while the routine store is unreadable. A future definition change requires an explicit version/migration decision.

Statistics mean **all recorded repetitions since the last confirmed statistics reset**. Settings displays the saturating sum of the original individual aggregate and the routine `totalRecorded` ledger. A routine tap/undo changes the routine ledger once, in the same persisted object as its progress. It never dispatches an increment/undo to the individual reducer. Restart/replacement/leave retain aggregate history, matching the existing individual session-reset meaning. Undo is limited to the current routine session; it cannot subtract history from replaced/restarted sessions. Confirmed global statistics reset clears both counters and the saved routine, with explicit wording.

There is no cross-key transaction for global statistics reset. A process interruption can save one reset before the other. Ordinary routine counting/progress/aggregate updates use one key together. Pending writes can be lost on abrupt process termination; acknowledged-save browser restoration is not a crash-proof durability guarantee.

## Files changed

| File | Change |
| --- | --- |
| `src/routines.ts` | Four content definitions, session engine, progress derivation, strict parsing |
| `src/components/RoutineExperience.tsx` | Compact catalog dialog, stage/progress display, overflow lifecycle actions and guided Free Tap |
| `App.tsx` | Shared state integration, discovery, confirmations, transitions/undo feedback, restore/retry, combined statistics |
| `src/components/CounterRing.tsx` | Optional guided step semantics and decorative rendering; original milestone branch retained |
| `src/storage.ts` | Isolated routine read/write adapter and shared persistence owner |
| `src/components/StorageNotice.tsx` | Include routine save failures/retry in dialogs |
| `src/components/Modals.tsx` | Incomplete-statistics explanation and reset protection |
| `tests/routines.test.mjs` | Domain, adapter and persistence fault/regression tests |
| `tests/routines-browser.cjs` | Actual-app interactions, themes, geometry, motion, save/read failures and captures |
| `tests/support/async-storage-adapters.mjs` | Resolve the routine module in existing installed-adapter fixtures |
| `package.json` | `test:routines` browser command; no dependency changes |
| `tsconfig.json` | Permit TypeScript source extensions for direct Node unit-test imports |
| `README.md`, `README.ar.md`, `docs/PROJECT_BASELINE.md`, this document | Feature and validation boundaries |
| `docs/routines/` | Browser evidence and its source fingerprints |

`src/counter.ts`, `src/beads.ts`, `src/persistence.ts`, theme registry/gallery, native configuration and release files remain unchanged. The later UI recovery updates Free Tap's large-text presentation and introduces shared dock, source badge and full-reading components; it does not rewrite the routine engine or storage layer.

## Validation and evidence

See [capture provenance and results](routines/README.md). Browser evidence renders the actual `App.tsx` through React Native Web, with isolated storage and mocked native services. The 200% check doubles text styles while honoring scaling limits; it approximates layout rather than proving Android/iOS Dynamic Type.

```sh
npm test
npx tsc --noEmit
npm run lint
# Existing external QA runtime; no mobile-app dependency additions:
export ZEKR_QA_MODULES=/tmp/zekr-baseline-qa/node_modules
export ZEKR_QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
export PLAYWRIGHT_BROWSERS_PATH=/tmp/zekr-baseline-browsers
npm run test:routines
npm run test:milestones
npm run test:persistence
npm run test:launch
npm run test:themes
npm run test:baseline
```

Paths above name this run's pre-existing QA installation. For a fresh environment, follow [QA dependency setup](assets/screenshots/README.md#reproduce). Default artifacts go to unique temporary folders; `ZEKR_QA_OUTPUT` selects an explicit destination.

Known limitations / follow-up: validate this feature on Android/iOS development builds, with TalkBack/VoiceOver, real 200% font scaling, nested phrase scrolling, final-completion focus, haptics, physical tap accuracy and process termination during pending saves. No feature-native APK was built in this implementation. Existing single-mode keyboard and theme faint-text limitations remain recorded in the baseline. No commits, pushes, release, APK publication or production build were performed.
