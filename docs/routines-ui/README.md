# Guided routines UI recovery — 18 October 2026

The subsequent [Arabic reading correction and Android evidence](../arabic-reading-fix/README.md) removes the bounded inline scroller and adds measured whole-line reading. This recovery's results remain historical.

**Historical recovery snapshot.** The subsequent [19 October refinement](../routines-refinement/README.md) supersedes the presentation described here. Its validation boundaries are recorded separately; the seven-suite results below apply to this 18 October source.

This is a focused presentation recovery of the existing uncommitted feature on `master`. The routine engine, authenticated content, persistence owners, individual counter, bead arithmetic and all six theme definitions are byte-identical to the start of this task. [Source and capture fingerprints](capture-manifest.json).

## Diagnosis and hierarchy

The previous `RoutineHeader` repeated the context/title and reserved a tall scrolling phrase slot even for a short phrase. Its 390 × 844 reference capture used roughly 300 px for that card. `RoutineActions` then stacked three large lifecycle actions, bead explanatory text and a raw URL above a second dock. `RoutineFreeTap` repeated the same stack in another scrolling page. Ring size depended on a viewport percentage instead of the actual space left by those siblings.

The recovered hierarchy is: **current phrase + stage → dominant ring → overall progress → one dock**. The active header is approximately 110 px in the standard reference capture. Its short phrase and two-line long-phrase preview occupy the same stable region. Tapping a long preview opens the complete wording in an independently scrollable reading dialog. The full text remains available to accessibility; the preview is not presented as the entire long phrase.

The ring is measured against the remaining flex area, width and safe-area-adjusted viewport. Standard content is constrained to that viewport. At large text sizes or unusually small usable heights, it permits vertical scrolling. The dock reflows at large font scales instead of letting labels overlap.

![Before on the left, after on the right: stage one, 3/33, 390 × 844](step-1-comparison.jpg)

## Components changed in this recovery

| Component | Focused change |
| --- | --- |
| `App.tsx` | Fit the counting layout to remaining space, restore the ring's priority, open the catalog as a dialog, keep one dock, move routine lifecycle actions to overflow, close the catalog before replacement confirmation, preserve cancel/resume behavior, hide background controls from web accessibility in Free Tap |
| `RoutineExperience.tsx` | Compact stage/phrase header, overall progress strip, concise grouped catalog, overflow actions, expanded reading and responsive guided Free Tap |
| `CountingDock.tsx` | Reuse the existing dock treatment for individual/routine controls; 44 px minimum targets; large-text reflow |
| `SourceBadge.tsx` | Book icon, collection/reference, proper mixed-direction reference text, supported external linking and inline failure feedback |
| `DhikrReader.tsx` | Share the stable long-phrase preview/full-reading treatment with individual Dhikr, preserving wording and existing virtue detail |
| `CounterRing.tsx` | Bound scaling of already oversized central numerals to 1.3× so they fit their slot; keep the full numeric accessibility value and original bead/count semantics |
| `FreeTapMode.tsx` | Preserve everyday immersive single-Dhikr Free Tap; provide a safe scrolling, readable fallback at enlarged text/small usable heights |
| `Modals.tsx` | Export the existing shell so catalog, reading and overflow share the current design |

On short standard phones, the individual card omits its one-line virtue snippet to give the ring more space; the existing library still supplies that detail. Very long individual phrases use the same expanded-reading treatment, including their existing virtue detail. Enlarged-text goal chips and the dock reflow rather than overflow. Settings remains available through the original top menu. Routine discovery occupies the dock instead of a new full-width button above the counter. No second competing toolbar is added.

## Before / after evidence

All captures render the actual application through React Native Web in the **supported in-app browser**, with isolated QA storage. They are **not emulator or physical Android screenshots**. Native splash, haptics, lifecycle, reduced-motion query and linking services are mocked. Safe areas are 24 px top/bottom. The 200% shim scales text styles while honoring explicit limits; it approximates layout rather than proving native font scaling.

The before preview was compiled and retained before replacing the UI. The after preview used the resulting application. Matching pairs use the same viewport, theme, routine and count. No owner image files were attached alongside the request text; the actual current-app before captures and original repository showcase supplied the visual baseline.

| Case | Before | After |
| --- | --- | --- |
| Individual home, 44/base 33 | [Before](before/single-home.jpg) | [After](after/single-home.jpg) |
| Routine step 1, 3/33 | [Before](before/step-1.jpg) | [After](after/step-1.jpg) |
| Transition: step 2 at zero, overall 33 | [Before](before/transition.jpg) | [After](after/transition.jpg) |
| Long Tahlil, overall 99 | [Before](before/long-tahlil.jpg) | [After](after/long-tahlil.jpg) |
| Completed, overall 100 | [Before](before/completed.jpg) | [After](after/completed.jpg) |
| Catalog initial position | [Before](before/catalog-initial.jpg) | [After](after/catalog-initial.jpg) |
| Catalog remaining routines | [Before](before/catalog-remaining.jpg) | [After](after/catalog-remaining.jpg) |
| Guided Free Tap | [Before](before/free-tap.jpg) | [After](after/free-tap.jpg) |
| Soft Ivory | [Before](before/light-ivory.jpg) | [After](after/light-ivory.jpg) |
| Royal Amethyst | [Before](before/dark-amethyst.jpg) | [After](after/dark-amethyst.jpg) |
| 320 × 640, long phrase | [Before](before/narrow-320x640.jpg) | [After](after/narrow-midnightSapphire-main.jpg) |
| 320 × 844, 200% text approximation | [Before](before/enlarged-320x844-2x.jpg) | [After](after/large-midnightSapphire-main.jpg) |
| Individual Free Tap, 320 × 844, 200% | [Before](before/single-free-2x.jpg) | [After](after/single-free-2x.jpg) |

Additional checks: [very long individual Dhikr on 320 × 640](after/single-long-320x640.jpg), [full reading](after/single-long-reading.jpg), [enlarged individual goals and dock](after/single-goals-2x.jpg).

![Before / after guided Free Tap](free-tap-comparison.jpg)

## Viewport-fit results

The supported browser inspected DOM bounds, usable top/bottom limits, active scroll-container dimensions and horizontal overflow. At standard text scale, the counter and Undo remain inside the usable viewport in all four inspected modes: individual counting, routine step 1, long Tahlil and guided Free Tap.

| Viewport | Font scale | Main content height / scroll height | Guided Free Tap height / scroll height | Result |
| --- | --- | --- | --- | --- |
| 320 × 640 | 1.0 | 530 / 530 | 540 / 540 | No vertical scrolling; no horizontal overflow |
| 360 × 800 | 1.0 | 690 / 690 | 700 / 700 | No vertical scrolling; no horizontal overflow |
| 390 × 844 | 1.0 | 734 / 734 | 744 / 744 | No vertical scrolling; no horizontal overflow |
| 320 × 844 | 2.0 approximation | Scrolling allowed; dock reflows | Scrolling allowed when needed | Full wording available through expanded reading in all six themes |

At 320 × 640, the main routine's central counting target measures about **140 × 140 px**, and Undo **66 × 44 px**. The corresponding guided Free Tap counting surface measures **284 × 284 px**, with Undo **89 × 44 px**. At 390 × 844, its counting surface expands to about **354 × 488 px**. [Detailed standard measurements](after/viewport-fit.json), [six-theme / enlarged-text results](after/theme-and-large-text-results.json).

![Six themes: Main above, guided Free Tap below](theme-matrix.jpg)

Columns: Midnight Sapphire, Royal Amethyst, Soft Ivory, Obsidian Ember, Glacier Prism, Solar Pulse. Every pair uses step 1 at 3/33. All six pairs were visually inspected, as were the short-phone and enlarged-text matrices. The palettes and theme IDs were not changed.

![200% text approximation in all six themes](large-text-matrix.jpg)

Large previews deliberately show an excerpt. The complete, unclamped wording is verified in the reading dialog; [example in Midnight Sapphire](after/large-reading-midnightSapphire-main.jpg), [Soft Ivory](after/large-reading-softIvory-main.jpg). At extreme scaling, needing to scroll to the dock or through full wording is expected; clipped or overlapping labels are not.

## Source links and interaction checks

Source badges use [React Native `Linking.openURL`](https://reactnative.dev/docs/0.86/linking), with the original curated `source.url`. They display collection/reference rather than the URL, and isolate mixed Arabic digits/Latin suffixes for bidi safety. Opening a reference is optional and may use an external browser/network; counting remains offline. No native permission or release configuration changed.

The supported browser clicked a source badge with a simulated native-link failure, displayed the inline Arabic failure message and returned to **3/100 unchanged**. [Failure screenshot](after/source-failure.jpg). Physical OS browser handoff is not verified by that mock. The automated responsive suite additionally checks each of the four destinations against the catalog metadata, link errors and absence of visible raw URLs; see its execution status below.

Real supported-browser interactions confirmed automatic 32→33 transition to the next phrase at zero, boundary undo back to 32, final completion/disabled counting, final undo back to 99, and a Free Tap increment returning to Main at 4/33. Restart and replacement confirmations were opened and cancelled without losing the saved 3/100; cancellation of replacement returns to the catalog. [Restart confirmation](after/restart-confirmation.jpg).

## Validation status and reproduction

- `npm test`: **73/73 passed**, including the unchanged routine/adapter/persistence tests.
- `npx tsc --noEmit`: passed.
- `npm run lint`: passed.
- `git diff --check`: passed.
- Supported-browser visual/interaction checks and the measurements above: completed on the revised UI.
- The explicitly approved reviewed CLI batch **passed all seven suites** on the revised UI. [Batch results](validation/reviewed/summary.json). Each suite ran once in this batch with Chromium sandbox enabled; no retry or browser crash occurred.

| Browser suite | Reviewed result | Retained evidence |
| --- | --- | --- |
| Responsive | 86 cases passed; no page errors | [Results](validation/reviewed/responsive/results.json) |
| Routines | 28 scenario groups passed; no page errors | [Results](validation/reviewed/routines/results.json) |
| Milestones | 10 scenario groups and 378 presentation matrix entries passed | [Results](validation/reviewed/milestones/browser-qa-results.json), [matrix](validation/reviewed/milestones/presentation-matrix.json) |
| Persistence | 13 scenario groups passed; no page errors | [Results](validation/reviewed/persistence/results.json) |
| Launch | 13 scenario groups passed | [Results](validation/reviewed/launch/browser-qa-results.json) |
| Themes / contrast | All six theme renderings passed the suite's assertions | [Results](validation/reviewed/contrast/after-browser-results.json) |
| Baseline | All six themes passed; no page errors | [Manifest](validation/reviewed/baseline/capture-manifest.json) |

The first approved attempt stopped at the new individual immersive Free Tap center-click check. React Native Web's `box-none` CSS re-enables decorative HUD descendants, which intercept that click; this does not establish native hit testing. The test now uses the exposed tap location already used by the milestone suite at standard scale, retaining the exact-one increment, shared-state and exit assertions. Enlarged Free Tap still uses a center click. No product source changed in response to that harness issue. [First-attempt summary](validation/first-batch-summary.json), [failure log](validation/first-responsive-attempt.log). The reviewed run was separately approved by the owner. Earlier results in `docs/routines/` remain historical evidence for the previous UI.

Complete reviewed-run PNG/video artifacts remain in `/tmp/zekr-ui-recovery-reviewed`; result JSON and suite logs are retained alongside this report. The representative screenshot comparisons above are retained in the repository and were visually inspected. Passing contrast assertions does not replace a full accessibility audit of every token or native screen.

`tests/responsive-browser.cjs` checks fit, standard-layout scrolling, horizontal bounds, usable targets, pointer overlap, all six themes, long/expanded wording, source destinations/errors and captures. `tests/routines-browser.cjs` retains its behavioral assertions while following the new overflow/dialog UI and validating full wording in expanded reading. Existing suites keep their assertions; browser launch options explicitly enable Chromium's sandbox.

After explicit command approval on macOS:

```sh
ZEKR_QA_MODULES=/tmp/zekr-baseline-qa/node_modules \
ZEKR_QA_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
PLAYWRIGHT_BROWSERS_PATH=/tmp/zekr-baseline-browsers \
ZEKR_QA_OUTPUT=/tmp/zekr-ui-recovery-reviewed \
node tests/run-ui-regressions.cjs
```

The runner executes responsive, routines, milestones, persistence, launch, themes and baseline sequentially, stops at the first failure and never retries a browser launch. Browser executables must not be launched from the restricted macOS execution sandbox. The supported browser path used for the retained captures does not launch a GUI from shell.

## Remaining product/native review

Native Android/iOS rendering, real OS 200% font scaling, TalkBack/VoiceOver focus/announcements, external-browser handoff and physical touch/haptics still need device evidence. The long-preview expand affordance and placement of infrequent actions are ready for owner visual review. Catalog/detail dialogs may scroll by design. Existing keyboard and theme faint-text limitations remain outside this palette-preserving recovery.

No reset/discard of the existing changes, branch switch, commit, push, publishing or APK build was performed.
