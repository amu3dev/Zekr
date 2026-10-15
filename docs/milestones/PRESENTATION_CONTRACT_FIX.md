# Milestone presentation contract fix — 15 October 2026

**Result:** Main Tasbeeh and Free Tap milestone labels now show cumulative count relative to the active cumulative milestone. At count 44 with base target 33, both display **٤٤ من ٦٦**. The outer ring remains at 11/33 interval progress, the main counter has 11 active beads out of its fixed 33-bead cycle, and the selected base target remains 33.

## Root cause and pre-fix reproduction

`getMilestoneProgress()` already returned the correct three values: `activeMilestone = 66`, `intervalCount = 11`, and `progress = 11/33` at count 44/base 33. Both display components deliberately bound their milestone text and accessibility values to `intervalCount / target`, following the earlier interval-label design. The existing browser assertions encoded that same design. The reducer and milestone calculation were correct.

Before changing source, the actual app was rendered in a fresh isolated browser profile. Starting from count 32/base 33, the existing increment callbacks advanced it to 44. Main and Free Tap both displayed **١١ من ٣٣**. SVG inspection confirmed 11 active beads and the expected one-third ring offset (657.640062 on the main ring). This reproduced the presentation mismatch without using real user data.

## Minimal implementation

- `CounterRing` binds its milestone label and accessibility value to `count / activeMilestone`.
- `FreeTapMode` reads the already-derived `activeMilestone` and uses the same cumulative label/value.
- Both accessibility hints explicitly name the separate ring interval metric, for example **تقدّم الحلقة في الفترة الحالية: ١١ من ٣٣**. The cumulative milestone and interval are therefore identified as different concepts.
- Existing completion announcements already use `activeMilestone`; those event handlers remain unchanged. Tests continue to verify exact boundary announcements and no replay after undo/restoration.
- No arithmetic, animation, ring offset, bead state, reducer, base-target selection, Arabic digit formatter or persistence code was changed. No derived value was persisted.

| Count, base 33 | Milestone label | Interval ring progress |
|---:|---|---|
| 0 | ٠ من ٣٣ | 0/33 |
| 32 | ٣٢ من ٣٣ | 32/33 |
| 33 | ٣٣ من ٣٣ | 33/33 |
| 34 | ٣٤ من ٦٦ | 1/33 |
| 44 | ٤٤ من ٦٦ | 11/33 |
| 66 | ٦٦ من ٦٦ | 33/33 |
| 67 | ٦٧ من ٩٩ | 1/33 |
| 99 | ٩٩ من ٩٩ | 33/33 |
| 100 | ١٠٠ من ١٣٢ | 1/33 |

Bead progress remains independent of target: count zero has no active beads, then each tap advances through 1–33 and wraps to 1. For targets other than 33, the ring interval and bead cycle can differ correctly.

## Files changed in this task

| File | Change |
|---|---|
| `src/components/CounterRing.tsx` | Cumulative milestone label/value and explicitly named interval hint |
| `src/components/FreeTapMode.tsx` | Matching cumulative milestone label/value and interval hint |
| `tests/milestones-browser.cjs` | Updated contract assertions, real-app 44/66 mode-switch journey, and 378 actual-component rendering cases |
| `docs/milestones/README.md` | Correct current contract and link this report; retain historical evidence |
| `docs/milestones/PRESENTATION_CONTRACT_FIX.md` | This report |

Starting fingerprints verified that `App.tsx`, `src/counter.ts`, `src/beads.ts`, `src/arabic.ts`, storage adapters, persistence engine/hook, ThemeProvider, theme tokens, Theme Gallery, launch component, Modals, app configuration, package file and existing persistence suites remain unchanged during this task. All pre-existing uncommitted work was preserved.

## Regression results

| Check | Result |
|---|---|
| `npm test` | **PASS: 50/50** existing counting, numeral, persistence and installed-adapter tests |
| `npm run lint` | **PASS** |
| `npx tsc --noEmit` | **PASS** |
| `npm run test:milestones` | **PASS:** existing interaction journeys plus 378 rendered main/Free Tap cases; zero page errors |
| `git diff --check` | **PASS** |

The browser suite exercises actual app code with mocked native APIs and fresh browser storage. Existing journeys cover milestone completion, first post-completion tap, undo 67→66, reset, Arabic custom targets 7 and 40, changing targets without losing count, goal 1, rapid taps, Free Tap/main synchronization, theme switching, reload, and non-replaying completion announcements. The added real-app journey checks 44/66 before entering Free Tap, inside Free Tap and after returning to the main counter.

The presentation matrix renders the actual two components through a separate storage-free fixture: **2 modes × 9 base targets × 21 counts = 378 cases**. Targets are 1, 7, 25, 33, 40, 99, 100, 1000 and 9999. Counts include all specified boundaries, plus 1, 6, 7, 25, 65, 98, 132, 999, 1000, 1001, 9999 and 999999. Assertions check:

- Cumulative Arabic-Indic milestone label and central count.
- Matching native accessibility value props and the explicitly named interval hint.
- SVG dash offset still equals interval progress, independently of the cumulative label.
- Exactly 33 main-counter beads with correct active-bead count for every target.
- Milestone label width does not overflow in the tested browser layouts.

Additional 320 px and 390 px captures cover 44/66 and six-digit cumulative values in both modes. The main/Free Tap narrow captures, large-count captures, and real-app before/after main screenshots were visually inspected. Existing RTL layout and text styles were retained.

## Evidence and screenshots

- [Before: full app at 44/base 33](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/before/main-44-before.png)
- [Before: Free Tap at 44/base 33](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/before/free-44-before.png)
- [After: full app at 44/base 33](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/44-of-66-browser.png)
- [After: real-app Free Tap at 44/base 33](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/free-44-of-66-browser.png)
- [Narrow main component fixture](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/main-44-320.png)
- [Narrow Free Tap fixture](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/free-44-320.png)
- [Rendered matrix results](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/presentation-matrix.json)
- [App journey results](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/after/browser-qa-results.json)
- [Verification and source fingerprints](/Users/ayosry/.codex/visualizations/2026/10/15/01a13eb1-23f2-7d82-aed6-765e5908da86/milestone-contract/verification.json)

Component-fixture screenshots show actual counter components with controlled props; the main-only fixture intentionally has no surrounding app UI. The full-app captures above are identified separately. Existing committed historical screenshots were not overwritten.

## Remaining limitations

No physical device or native simulator testing was performed. Browser geometry, text and React Native accessibility props do not prove native font fitting, maximum OS font scaling, TalkBack/VoiceOver delivery, physical haptics or native animation performance. Six-digit labels fit the inspected 320/390 px browser layouts; extreme safe-integer-length labels and native maximum text scaling were not visually validated.

The P1 label contract is resolved in both modes with the established ring/bead semantics preserved. This task does not close other release-audit findings. No real user data was accessed, and no commit, push or publication occurred.
