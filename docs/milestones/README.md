> **Historical snapshot.** This dated report and its original evidence are preserved. For current behavior, test results and release status see the [project baseline](../PROJECT_BASELINE.md). Older test totals and machine-local evidence links below are not current portable proof.

# Automatic milestone progression — implementation and validation

Current presentation contract and verification: [15 October 2026 milestone presentation fix](PRESENTATION_CONTRACT_FIX.md). The dated review notes and committed captures below remain historical evidence.

## Previous contradiction

Both counting modes treated `count >= target` as a lasting completion condition, clamped the ring at 100%, and offered a manual next-cycle action. The reducer allowed further taps without changing that completion condition. The separately stored `cycle` only advanced via the manual action, which reset the count.

## New model

- `count` is cumulative within the current session; `target` remains the selected base goal.
- `activeMilestone = Math.max(1, Math.ceil(count / baseTarget)) * baseTarget`.
- Interval progress is `(count - (activeMilestone - baseTarget)) / baseTarget`. Zero count is zero progress; an exact boundary is full progress.
- The 33 beads use `count === 0 ? 0 : ((count - 1) % 33) + 1`; their cycle uses `Math.max(1, Math.ceil(count / 33))`.
- The outer ring sits outside the beads and shows progress within the current interval. The large center value remains cumulative; the milestone label shows cumulative count out of the active cumulative milestone (44 of 66 at base 33). Accessibility values use that cumulative milestone; hints explicitly identify the separate interval progress.
- A milestone tap shows restrained text for 900 ms, announces the milestone, and uses the existing enabled haptic feedback. A base goal of 1 uses ordinary tap haptics without completion text or announcements in either mode. The next tap clears the text immediately. Counting is never delayed or reset by completion.
- Feedback runs only from an increment event, never restoration or render effects. The persistent panel, manual transition action and indefinite completion pulse are removed.
- No milestone or bead-cycle state is persisted. Old `cycle` metadata is ignored; existing count, target, aggregate count, dhikr and settings remain readable under the same storage key.
- Undo, reset and goal changes derive all progress from their resulting count and target. Free Tap uses the same calculations and event handler.
- Reduced motion and the visual-effects setting suppress counter motion; milestone interval changes snap directly to their new progress.

## Changed files

- `App.tsx`: event-driven temporary acknowledgment, milestone haptics/announcements, removed completion panel and manual action; existing uncommitted Expo Go splash guard preserved.
- `src/counter.ts`: milestone calculation, removed obsolete manual round state/action, safe numeric input handling.
- `src/beads.ts`: bead-cycle helper and invalid-count handling.
- `src/components/CounterRing.tsx`: outer milestone ring, derived bead cycle, temporary completion text, animation cleanup and accessible milestone value.
- `src/components/FreeTapMode.tsx`: shared milestone/cycle derivation, temporary completion text, removed manual next-round button.
- `tests/counter-beads.test.mjs`: aligned existing regression tests with continuous counting.
- `tests/milestones.test.mjs`: focused arithmetic, reducer and persistence regression tests.
- `tests/milestones-browser.cjs`: interaction, native accessibility-prop, ring/bead geometry and persistence regression harness.
- `package.json`: added `test:milestones`; no dependency changes.
- `docs/milestones/`: this report, browser results and five screenshots.

Theme Gallery, theme storage and native splash configuration were not modified.

## Review fixes — 2026-10-13

- Both modes show interval progress beneath the cumulative count; accessibility values distinguish the two.
- Goal 1 uses ordinary tap feedback without repeated completion messages or announcements.
- The visual-effects setting names both counting modes; the obsolete next-cycle icon and README wording were removed.
- `npm run android` selects development permissions; browser harnesses write to temporary folders by default.
- Typecheck, lint, all nine unit tests and both browser suites passed. Updated main-ring and Free Tap captures were visually inspected. Development and preview Expo configs were checked for allowed and blocked internet access respectively; no native build or device run was performed.

## Checks and results

- `npm test`: **9 passed, 0 failed**. Includes 0, 1, 32, 33, 34, 44, 65, 66, 67, 98, 99, 100, 132, 999, 1000, 1001 with goals 1, 7, 25, 33, 40, 99, 100, 1000, 9999. Covers invalid input, rapid reducer actions, undo, reset, goal changes and legacy restoration.
- `npx tsc --noEmit`: **passed**.
- `npm run lint`: **passed**.
- `git diff --check`: **passed**.
- `npm run test:milestones`: **six scenario groups passed**, with no browser page errors. See [structured results](browser-qa-results.json).
- At 44 with base 33, the rendered SVG has exactly 11 active beads and one-third outer-ring progress.
- Browser interactions cover 33/66/100/200 boundaries, batched rapid taps, undo, custom Arabic-Indic goal input, Free Tap, persistence reload, theme switching/restoration, reduced motion, motion enabled and reset.
- Restoration at exact count 40/40 emits neither completion text nor announcement. Mode restoration emits no haptic feedback.

The browser harness uses the actual app rendered through React Native Web in Chromium with mocked native modules. It verifies actual React Native accessibility props because React Native Web does not translate all native accessibility props into HTML. This is not native screen-reader validation.

Reproduce using the same temporary QA runtime as the existing launch harness (outside the app dependency tree):

```sh
ZEKR_QA_MODULES=/private/tmp/zekr-launch-qa/node_modules \
ZEKR_QA_PLAYWRIGHT=/Users/ayosry/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright \
ZEKR_QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
npm run test:milestones
```

## Visually inspected evidence

The committed captures below are historical evidence from before the review fixes. Current milestone labels show cumulative progress (for example, 44 of 66 at base 33); the ring still shows 11/33 interval progress. New browser runs write to unique temporary folders and print the artifact path; `ZEKR_QA_OUTPUT` explicitly selects another destination.

- [Milestone 33 acknowledgment](33-complete-browser.png)
- [44 of 66: eleven beads and one-third interval progress](44-of-66-browser.png)
- [Free Tap milestone 200](free-200-browser.png)
- [Free Tap 201 of 300](free-201-browser.png)
- [Theme switching at count 201](theme-active-browser.png)

The 33, 44, Free Tap 201 and theme screenshots were visually inspected.

## Remaining validation

No physical device or native simulator testing was performed. Android/iOS rendering, native touch/animation timing, actual haptic feel, VoiceOver/TalkBack announcement delivery and large-font/small-screen layouts still need native validation. Browser reload validates the existing storage flow through its web implementation; native process termination and AsyncStorage timing were not exercised. The existing 400 ms persistence debounce and background flush remain in place.
