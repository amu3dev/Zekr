# Arabic reading correction — 19 October 2026

Focused changes on the existing uncommitted `master` tree. No commit, push, release, APK generation, dependency or native configuration change.

## Correction and files

The old main-card preview put complete multi-line Arabic inside a bounded inline ScrollView. Its viewport could intersect glyphs/tashkeel, while a scrolling instruction competed with the text. Padding alone would not remove that boundary.

The main card now has **no inline ScrollView, line clamp or ellipsis**. Short wording sizes naturally. Long wording displays an explicitly labelled **مقتطف من الذكر**, ending at the first authored punctuation boundary, with a separate **النص كاملًا** book control. This is an exact source prefix, preserving tashkeel and punctuation. Tahlil retains its complete opening affirmation through «لا شريك له»; arbitrary word limits are not used. No canonical wording, virtue, citation or routine definition changed.

Expanded reading retains full wording, count/Undo and automatic transitions. Controls sit outside its scrolling viewport. Native line measurements determine a whole-line viewport and scroll interval; end padding aligns the final offset. Reading padding sits outside the clipped viewport. Resizing, font scaling and phrase transitions invalidate earlier viewport measurements. Clipped-subview removal is disabled. These use the installed RN 0.86 [Text layout](https://reactnative.dev/docs/0.86/text#ontextlayout) and [ScrollView](https://reactnative.dev/docs/0.86/scrollview#snaptointerval) APIs.

| Exact file changed in this correction | Purpose |
| --- | --- |
| `App.tsx` | Long individual card vertical padding 10 → 8 |
| `src/components/DhikrReader.tsx` | Natural clause preview, separate reading affordance, measured native reader |
| `src/components/RoutineExperience.tsx` | Compact natural inner card and transparent stable header slot |
| `src/reading.ts` | Exact-prefix excerpt and measured geometry helpers |
| `tests/reading.test.mjs` | Five focused wording/geometry tests |
| `tests/responsive-browser.cjs`, `tests/routines-browser.cjs` | Compare full reading with canonical definitions; assert labelled exact-prefix preview and no inline scroller; retain count/geometry assertions |
| `docs/QA_WORKFLOW_PROPOSAL.md` | Proposed AGENTS addition; a matching concurrent AGENTS update was detected and preserved during final verification |
| This evidence directory; `docs/PROJECT_BASELINE.md`, `docs/GUIDED_ROUTINES.md`, `docs/routines-ui/README.md`, `docs/routines-refinement/README.md` | Evidence and historical-report pointers |

The broader working tree contains earlier changes, preserved here. The [manifest](capture-manifest.json) confirms unchanged hashes for counter/routine content, beads, storage, persistence, themes, CounterRing, Modals and the reduced-motion hook against the preceding refinement record. SourceBadge is unchanged too. **No religious-content change requires approval.**

## Before / after

Matched pairs render the actual App through React Native Web in the **supported in-app browser**, with isolated fixtures and mocked native APIs. The before UI was frozen before this correction. These are not native-before images. Browser text scale 2 approximates layout; native scaling was checked separately.

| Case | Before | After |
| --- | --- | --- |
| Short Takbir, guided, 320 × 640 | [Before](before/short.jpg) | [After](after/short.jpg) |
| Sayyid al-Istighfar, individual, 320 × 640 | [Before](before/long.jpg) | [After](after/long.jpg) |
| Guided Tahlil, 390 × 844 | [Before](before/tahlil.jpg) | [After](after/tahlil.jpg) |
| Enlarged individual text, 320 × 844 | [Before](before/large.jpg) | [After](after/large.jpg) |
| Long individual Free Tap, 320 × 640 | [Before](before/free-long.jpg) | [After](after/free-long.jpg) |

![Browser before left, after right](main-comparison.jpg)

## Actual Android validation

The owner subsequently approved one exact emulator launch, reused throughout: **Pixel 3a, Android 14/API 34 arm64, Expo Go 57.0.9, current SDK 57 bundle**, read-only AVD with no snapshots. No APK was generated or installed. Original display: 1080 × 2220 px, density 440. A temporary 880 × 1760 override supplied a **320 × 640 dp** screen including Android system areas; original size was restored. System font scales 1 and 2 were exercised.

| Native check | Evidence and result |
| --- | --- |
| Short Allahu Akbar | [Main](native/takbir-main-1x.png): compact card; complete tashkeel, ring and dock visible |
| Long Sayyid, standard text | [Main](native/sayyid-main-1x.png), [full reader](native/sayyid-expanded-1x.png) |
| Enlarged reading, original screen | [Top](native/sayyid-expanded-2x-top.png), [middle](native/sayyid-expanded-2x-middle.png), [bottom](native/sayyid-expanded-2x-bottom.png) |
| Enlarged reading, 320 × 640 dp | [Top](native/sayyid-320-2x-top.png), [middle](native/sayyid-320-2x-middle.png), [last Dhikr line](native/sayyid-320-2x-ending.png), [end of content](native/sayyid-320-2x-bottom.png) |
| Count / Undo, enlarged narrow reader | 0 → 1 → 0; reader stays open; controls separate from active text |
| Guided boundary Undo | [Takbir 32/33, overall 98](native/reader-undo-to-takbir.png), reader open |
| Automatic transition while reading | [Full Tahlil 0/1, overall 99](native/reader-transition-to-tahlil.png); reading area updates with phrase |
| Completion / Undo | [100/100](native/reader-completed.png), counting disabled; Undo returns to 99 without closing reader |
| Main / Free Tap | [Free Tap](native/tahlil-free.png) retains Tahlil 0/1 and overall 99 |
| Catalog → source → hardware Back | [Reference](native/source-from-catalog.png) → [catalog retained](native/back-to-catalog.png); catalog Back → [main retained](native/back-to-main.png) |
| Reader → source → hardware Back | Returns to the full Tahlil reader at 99; second Back returns to the same main state |
| Mixed Arabic/numeric reference | Existing directional isolates render «صحيح مسلم / الحديث ٥٩٧a» correctly; source component unchanged |
| Reduced motion | Final enlarged top/middle/bottom checks used Android animator duration 0. Reader and controls remain usable; original unset preference restored |

Each native PNG has adjacent UIAutomator XML. At inspected settled positions, the **active Dhikr** has complete lines and controls do not overlay it. The native viewport/snapping uses actual Arabic line pitch, including Android nonlinear scaling. Moving text naturally crosses a viewport during a drag; auxiliary virtue/source content retains normal scrolling and can intersect an edge at intermediate positions. This is not a guarantee of zero clipping at every instant or on every font/device.

![Actual Android: short card, long card, enlarged full reading](native-overview.jpg)

## Results and remaining boundaries

- `npm test`: **79 passed, 0 failed**, including all existing counter/milestone/routine/storage tests and five new reading tests. [Output](unit-tests.txt).
- `npx tsc --noEmit`: passed. `npm run lint`: passed.
- Supported-browser matrix: **36 current-source combinations**, six themes × (320 × 640 at 1×, 390 × 844 at 1×, 320 × 844 at 2×) × main/Free Tap. No hidden preview text or clamp. All 24 standard-scale cases have zero main-scroll overflow; minimum central target is 120.95 px. Enlarged cases permit scrolling. [Measurements](viewport-checks.json).
- Standard 320-wide guided card heights: short 90.5 px, long 140.5 px; transparent header slot keeps ring movement across steps 3 → 4 to 0.25 px.
- Browser reading flows: **four combinations**, individual/guided × main/Free Tap at 2×. Count/Undo, complete phrase, guided boundary transitions and completion disabling passed. [Results](reading-flows.json), [single](after/reading-single-main-2x.jpg), [guided](after/reading-routine-main-2x.jpg).
- Injected source-open failure produces [graceful feedback](after/source-failure.jpg). Browser linking is mocked; this does not prove a native external handler.
- The seven shell-driven Chrome suites were **not rerun**. The owner selected supported-browser validation; the later emulator approval did not authorize another Chrome batch. Earlier suite passes remain historical.

Native evidence is an emulator development runtime, not an OEM phone or release build. Physical-device typography, TalkBack focus/announcements, selection gestures, haptics and production link handlers remain final native QA. Only Midnight Sapphire was exercised natively; all six themes were checked in browser and palette hashes are unchanged. Expo Go's development Tools bubble appears over the top menu/exit in some captures and intercepted development-session exit taps; it is not an application control. Existing Free Tap hardware Back exits the activity rather than toggling Free Tap; this was not changed in a typography correction.

The [proposed permanent QA workflow](../QA_WORKFLOW_PROPOSAL.md) preserves every mandatory launch/sandbox restriction. Routine iterations should use available tests/browser QA, reuse available Android sessions and record native checks as pending when none are available.
