# Final UX refinement — 19 October 2026

The subsequent [Arabic reading correction](../arabic-reading-fix/README.md) supersedes this report's bounded inline preview and adds separately approved Android Expo Go evidence. Results below apply to this earlier refinement snapshot.

This is a focused refinement of the existing uncommitted `master` working tree. It preserves the previous feature and responsive recovery. No new Android screenshots were attached or located in this request, so the matched comparisons use the actual task-start application, frozen before edits, and the resulting application. These are **supported in-app browser / React Native Web** captures, not Android or iOS execution evidence.

## Changes and rationale

- **Distinct actions:** the application control uses the existing settings gear; current-routine actions use a new three-dot icon in the existing SVG icon system, consistently in Main and Free Tap. The top settings target is now 44 × 44 px. Navigation callbacks are preserved.
- **One visual identity:** both Free Tap presentations reuse the current semantic background gradient and geometric artwork. Decorative views are hidden from accessibility and cannot receive touches. No new ambient animation or timing loop was added. Existing count feedback continues to use its existing effects/reduced-motion guards.
- **Reference inspection before leaving:** the book badge opens an offline citation dialog with collection and exact reference. Only the explicit **فتح المصدر** action calls `Linking.openURL`. A failed open stays in the dialog with an Arabic error and retry action. No raw URL is displayed.
- **Three practical sequence cards, four narrated routines:** the identical 33/33/34 sequence appears once. It has separate after-prayer and before-sleep rows, references and Start/Resume actions. Neither narration nor stable ID was removed or merged. Saved sessions still select the original variant. The grouping is a pure presentation helper.
- **Separate numbers:** stage position occupies one side of the header; current repetitions use a separate accented ratio. Overall progress retains its own strip. A modest minimum header height at standard text scale stabilizes the ring between short steps and long Tahlil.
- **Read while counting:** long phrases now render their entire unchanged wording in a bounded inline reader without a line clamp or ellipsis. A visible cue explains scrolling when necessary. The book control opens larger reading with a live count button and Undo, using the same parent callbacks and persistence owners. The reader remains open through automatic phrase changes, completion and final correction; closing/reopening between repetitions is unnecessary. Individual Dhikr and guided Main/Free Tap share this treatment. Long individual Free Tap phrases use the readable layout instead of shrinking a ten-line label.

No counter, routine engine, religious definition, bead calculation, persistence schema/owner, theme ID/palette, native configuration or dependency was changed in this refinement. [Task-start and resulting fingerprints](capture-manifest.json).

## Exact source / test / documentation files changed in this task

The broader working tree also contains earlier uncommitted feature changes; those are preserved and are not attributed to this refinement.

| File | Change |
| --- | --- |
| `App.tsx` | Settings icon/target; connect shared reader to existing count/Undo and milestone value; compact long-text card; pass Undo into individual Free Tap |
| `src/components/Icons.tsx` | Add the three-dot routine action icon |
| `src/components/CountingDock.tsx` | Use that icon for routine actions |
| `src/components/CountingBackdrop.tsx` (new) | Shared static Free Tap gradient and geometric decoration |
| `src/components/RoutineExperience.tsx` | Shared-sequence catalog, stage hierarchy, stable header, reader callbacks and guided Free Tap artwork |
| `src/components/FreeTapMode.tsx` | Restore atmosphere; readable long-text layout and shared reader/count context |
| `src/components/DhikrReader.tsx` | Full inline wording and persistent expanded reading with live count/Undo |
| `src/components/SourceBadge.tsx` | In-app citation details, explicit external action, failure feedback |
| `src/routineCatalog.ts` (new) | Group exact step sequences without changing definitions or IDs |
| `tests/routine-catalog.test.mjs` (new) | Verify shared display preserves all contexts, references, object identities and IDs |
| `tests/responsive-browser.cjs` | Add persistent-reading/Undo/completion checks, three-card/four-source checks, explicit source-opening checks; permit only the intentional inline text scroller |
| `tests/routines-browser.cjs` | Follow the new source-detail button semantics; retain functional assertions |
| `docs/PROJECT_BASELINE.md` | Link this later refinement and distinguish its evidence |
| `docs/GUIDED_ROUTINES.md` | Update presentation description; religious and persistence contracts unchanged |
| `docs/routines-ui/README.md` | Mark the previous recovery report as historical and link here |
| `docs/routines-refinement/` (new) | This report, measured JSON evidence, validation logs, source/image manifest and actual screenshots/composites |

`CounterRing.tsx`, `Modals.tsx`, `src/routines.ts`, `src/counter.ts`, `src/beads.ts`, `src/storage.ts`, `src/persistence.ts` and `src/theme.ts` received no edits in this task. Their existing uncommitted changes, where present, predate this refinement.

## Matched before / after screenshots

Both sides use the same fixture, safe areas (24 px top/bottom), theme and viewport. Before is left, after is right. The image manifest enumerates all retained raw captures and composites. No images were generated or retouched to simulate the result; composites only place screenshots beside each other.

| Case | Before | After |
| --- | --- | --- |
| Individual home, 390 × 844, 44/base 33 | [Before](before/main.jpg) | [After](after/main.jpg) |
| Routine stage 1, 390 × 844, 3/33 | [Before](before/guided.jpg) | [After](after/guided.jpg) |
| Guided Free Tap, 390 × 844 | [Before](before/free.jpg) | [After](after/free.jpg) |
| Long Tahlil, 390 × 844, overall 99 | [Before](before/tahlil.jpg) | [After](after/tahlil.jpg) |
| Catalog initial position | [Before](before/catalog.jpg) | [After](after/catalog.jpg) |
| Tahlil, 320 × 640 | [Before](before/narrow.jpg) | [After](after/narrow.jpg) |
| Tahlil, 320 × 844, 200% approximation | [Before](before/enlarged.jpg) | [After](after/enlarged.jpg) |
| Long individual Dhikr, 320 × 640 | [Before](before/single-long.jpg) | [After](after/single-long.jpg) |

![Long Tahlil before and after](tahlil-comparison.jpg)
![Guided Free Tap before and after](free-comparison.jpg)
![Shared-sequence catalog before and after](catalog-comparison.jpg)

The matched pairs, the six-theme contact sheets and enlarged-reading/control sheets were visually inspected. Full reading keeps count controls inside the dialog rather than losing recitation context: [guided Main](after/reading-routine-main-2x.jpg), [guided Free Tap](after/reading-routine-free-2x.jpg), [individual Main](after/reading-single-main-2x.jpg), [individual Free Tap](after/reading-single-free-2x.jpg).

## Viewport fit and readability

[Measured cases](viewport-fit.json): all six themes × Main/Free Tap × three profiles = **36 captures/checks**. All **24 standard-scale cases** keep the counting surface and Undo in the safe viewport, with no outer counting scroll, horizontal document overflow or intercepted center tap. The checks use the long Tahlil step. [Individual long-phrase fit](individual-fit.json) additionally checks both modes on 320 × 640.

| Profile | Font scale | Modes / themes | Result |
| --- | --- | --- | --- |
| 320 × 640 | 1.0 | Main + guided Free Tap, all six | Outer counting layout fits; smallest Main count target ≈121 × 121 px; Undo ≥44 px |
| 390 × 844 | 1.0 | Main + guided Free Tap, all six | Outer counting layout fits; full Tahlil wording fits inline |
| 320 × 844 | 2.0 approximation | Main + guided Free Tap, all six | Safe outer scrolling; options, Undo and expanded reading reached through actual controls |
| 320 × 640 | 1.0 | Long individual Main + Free Tap | No outer scroll/overflow; Main count target ≈120 × 120 px; Free Tap area 284 × 364 px |

The inline reader is intentionally a **text scroller**, not an ellipsized preview. At 320 × 640 the Tahlil text measures 93 px in an 80 px reading region; one 13 px scroll reveals its ending while overall progress stays 99/100. [Scrolled wording](after/narrow-inline-scrolled.jpg). The bounded reading area protects the ring and essential controls. Very long individual wording and enlarged fonts may require more text scrolling; persistent expanded reading provides a larger area and shared count/Undo. Inline body typography is 20 px with 31 px line height at standard scale; short guided phrases remain 25 px. Arabic content and tashkeel are unchanged.

![Six themes at 320 × 640: Main above, guided Free Tap below](themes-320x640-1x.jpg)
![Six themes at 390 × 844](themes-390x844-1x.jpg)
![200% expanded reading: Main above, Free Tap below](reading-all-themes-2x.jpg)

The enlarged initial view may place the dock below the fold. This is deliberate accessibility reflow: the dock and reader can be reached by scrolling, and the focused-reading count/Undo stay visible. [Reached controls in every enlarged theme](controls-all-themes-2x.jpg), [measurements](large-text-controls.json).

## Interaction evidence

Supported-browser controls exercised the actual App with isolated fixture storage and mocked OS services:

- 32→33 activates the next phrase at zero; boundary Undo returns to 32. Free Tap uses the same state and boundary behavior.
- Restart cancellation and replacement cancellation preserve progress; cancelling replacement returns to the catalog, and Resume restores the same on-screen session.
- Expanded reading counts and undoes exactly once in all four individual/guided × Main/Free Tap combinations at 200% approximation. Final counting disables at completion and Undo permits correction. [Reading results](reading-checks.json).
- Undo from Tahlil zero returns to Takbir 32/33 **inside the still-open reader**; the next count returns to Tahlil zero, and final completion/correction remain available. [Journey results](flow-checks.json).
- The settings gear opens the original settings. Selecting Soft Ivory through its existing gallery leaves 3/100 unchanged.
- All four reference badges remain in-app without invoking Linking. Their explicit actions use the exact stored URLs, verified through mock linking logs. Each injected unavailable-link failure shows Arabic feedback, and closing the dialogs returns to 3/100 unchanged. [Source checks](source-checks.json), [citation dialog](after/source-details.jpg), [failure example](after/source-597a-failure.jpg).

The preview uses reduced-motion fixtures, and the introduced decoration has no animation path. Existing count feedback guards and the reduced-motion hook are untouched. This does not establish delivery of a real Android reduced-motion setting, frame timing or haptics.

## Tests and evidence boundaries

| Check on resulting source | Result |
| --- | --- |
| `npm test` | **74 passed**, no failures/skips; includes the new grouping invariant and existing routine/count/storage/milestone tests |
| `npx tsc --noEmit` | Passed |
| `npm run lint` | Passed |
| `git diff --check` | Passed |
| Browser script syntax | Passed for modified responsive/routine scripts |
| Supported-browser visual / interaction QA | Completed as recorded above; raw images and JSON retained |
| Seven CLI browser suites | **Not executed in this refinement at the owner's explicit choice: “اكتفِ بالفحص عبر المتصفح المدعوم”.** New browser assertions are authored but their full CLI execution remains unverified. The passing 18 October batch belongs to the previous UI and is not presented as a new run. |

[Structured validation summary](validation/results.json), [unit test log](validation/unit.log). Temporary viewport overrides were reset, the QA tab was closed and the task-owned preview servers were stopped after inspection.

No Chrome/browser executable was launched from shell in this task. Loopback preview servers and isolated QA tools were used with the supported browser integration. The app's dependencies and lockfile were not changed. Browser services mock splash, safe areas, native lifecycle, haptics and linking. Font scaling is a doubled-style approximation honoring explicit limits, not native Dynamic Type or Android font evidence.

## Religious content and remaining review

**No religious-content changes require approval.** `afterPrayer100` (Muslim 596a) and `beforeSleep100` (Bukhari 5361) retain separate definitions, wording, contexts, sources and start/resume IDs. Their shared card is a display grouping of identical practical steps, not a new combined narration. The other two definitions are untouched. The [18 October source verification](../GUIDED_ROUTINES.md#verified-content) remains the provenance record.

Native Android/iOS font shaping, actual system text scaling, TalkBack/VoiceOver focus and announcement delivery, nested reference-dialog focus return, native inline-scroll gestures, OS link handoff, lifecycle persistence and physical touch/haptics still require device evidence. The native screenshots mentioned by the owner were not supplied in this turn, so a direct comparison against those specific images is outstanding. Existing palette contrast gaps and custom-target keyboard behavior are unchanged.

Owner review can focus on the shared catalog layout, inline reading cue and focused-reading count affordance. No commit, push, publish, branch change or APK build was performed.
