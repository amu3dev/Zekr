# نظام القراءة الذكية للأذكار

Local implementation and review evidence, 19 October 2026. This extends the existing uncommitted tree; no commit, push, publication, release build, native project generation or dependency change was performed.

## Architecture and behavior

`DhikrReader` remains the shared entry point for Individual Tasbeeh, Guided Routines, and their accessible Free Tap presentations. Standard counting cards still show the existing authored-clause excerpt and book affordance. There is no new scrolling region or toolbar in the standard counting layout.

| Mode | Behavior |
| --- | --- |
| القراءة الكاملة | Existing expanded, manually scrollable canonical text, virtue/source, measured native snapping, separate count and Undo. This is the backward-compatible default. |
| الشريط المتحرك | One complete Arabic text node in a horizontal, unconstrained measurement surface. The right-hand beginning starts in view; a linear native-driver translation reveals the remainder. Slow/normal/fast, explicit start, pause/resume, restart, and manual previous/next inspection. No looping or duplicated text. |
| القراءة بالمقاطع | Exact source slices ending at authored punctuation, with a word-boundary fallback for unusually long clauses. Concatenation reproduces the source exactly, including punctuation, whitespace and diacritics. Previous/next, restart, and optional user-started automatic progression. Long individual segments remain manually scrollable at large fonts. |
| التمرير الذكي | Native `Text.onTextLayout` line boxes are grouped into pages that fit the reading space; page transforms use the first measured line's `y`, never an estimated pixel increment. Previous/next, restart, optional user-started automatic progression, speed control and a finite last page. Automatic dwell increases with the number of measured lines. |

`smartReading.ts` owns only reading types, parsing, segmentation, motion eligibility and line-page geometry. `SmartReadingSurface` owns its local reading position and animation/timers. It does not import or dispatch counter/routine actions. Counting is still performed only by the existing separate count/Undo controls.

Phrase, dimensions, and font-scale changes invalidate reading measurements and remount only the reading surface. Routine boundary Undo/advance updates the open reader. Changing reading mode leaves counting, milestones, statistics, saved routine resume, completion and the 33-bead engine intact. All six theme IDs and tokens are unchanged.

The settings section **طريقة قراءة الأذكار** has four radio choices and one live Sayyid al-Istighfar preview. Full mode has no speed/progression settings; ticker has speed; segmented/vertical expose progression and show speed only for automatic progression. The reader's compact **طريقة القراءة: …** control opens the same preferences without leaving the Dhikr, and selecting a mode collapses the chooser. Reading controls occupy the reading dialog; the ring remains the counting screen's dominant element.

Preferences use a separate versioned `@dhikr/reading/v1` key with the existing revisioned `PersistentState` owner. Absent data uses Full/manual/normal defaults. Missing legacy fields migrate individually. Invalid/unreadable data fails closed without overwriting stored values; retry feedback appears in the preferences. Writes cannot touch counter/routine keys.

## Accessibility

- Automatic movement requires an explicit Start and resolved permission from reduced-motion, screen-reader, and foreground checks. Unknown/failing accessibility queries prohibit movement.
- Reduced motion retains manual ticker, segment and measured-page controls. Enabling reduced motion cancels playback; disabling it does not silently restart playback.
- Screen readers receive the entire canonical text as one static, selectable, manually scrollable node, irrespective of the saved animated mode. This conservatively disables automatic progression for the entire screen-reader session.
- Backgrounding stops playback. Speed changes preserve ticker position; pause/resume preserves position; phrase changes reset reading position. No automatic loop at the end.
- Choice controls expose radio/checked semantics; actions have Arabic labels and at least 44 × 44 touch bounds. No `numberOfLines` truncation is used for the reading text.
- Generous Arabic line height, native font padding and vertical breathing room protect tashkeel. Page boundaries use actual native line boxes. Very large text can scroll within the reading dialog while count/Undo remain outside that scroll region.

Browser geometry is deliberately a separate adapter: RN Web does not implement native `onTextLayout`, so `ReadingText.web.tsx` groups actual DOM grapheme ranges into measured browser line boxes. The native implementation is `ReadingText.tsx`. Browser text scaling is an approximation, not native typography evidence. The native adapter follows [RN Text layout](https://reactnative.dev/docs/text#ontextlayout), [Animated](https://reactnative.dev/docs/animated) and [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo). Native shaping, native-driver RTL transforms, exact settled tashkeel clearance and assistive-technology behavior still require native QA. Moving marquee glyphs naturally cross its horizontal viewport edge; the full static text is always available through Full mode and the screen-reader fallback.

## Actual-app screenshots for product review

These are the actual App rendered through React Native Web in the supported in-app browser, using isolated local fixtures and mocked native OS services. They are **browser evidence**, not Android/iOS screenshots. All four matched mode images use **Sayyid al-Istighfar**, **Midnight Sapphire / ياقوت الليل**, **320 × 640**, standard text scale and **44 repetitions**. Playback is initially paused and manual progression is selected.

| Full | Ticker | Segmented | Vertical |
| --- | --- | --- | --- |
| ![Full](browser/full.jpg) | ![Ticker](browser/ticker.jpg) | ![Segments](browser/segments.jpg) | ![Vertical](browser/vertical.jpg) |

- [Mode selection and live preview](browser/settings.jpg) — same Dhikr/theme, 390 × 844.
- [Compact quick-switch chooser](browser/quick-switch.jpg) — 320 × 640.
- [Vertical final page](browser/vertical-last.jpg) — forward control disabled at the end.
- [Enlarged Arabic](browser/vertical-large.jpg) — 320 × 844, browser 2× text simulation.

The owner should review these four experiences, pacing and compact chooser before final native QA. No owner sign-off is inferred from implementation or passing tests.

## Changed files in this task

| Files | Responsibility |
| --- | --- |
| `src/smartReading.ts` | Preference schema, strict legacy parsing, speed presets, exact segmentation, measured pages and motion gate |
| `src/hooks/useReadingSafety.ts` | Reduced motion, screen-reader detection and foreground state |
| `src/components/SmartReadingSurface.tsx` | Shared ticker, segments, measured vertical reading and user controls |
| `src/components/ReadingText.tsx`, `ReadingText.web.tsx` | Native / browser text-measurement adapters |
| `src/components/ReadingPreferences.tsx` | Settings choices, live preview, relevant options, compact quick switch and retry feedback |
| `src/components/DhikrReader.tsx` | Extend the existing shared reader while preserving its full-reading implementation and count dock |
| `src/components/Modals.tsx` | Mount the new reading section inside existing Settings |
| `src/storage.ts` | Independent reading persistence owner and adapter functions |
| `tests/smart-reading.test.mjs`, `tests/support/async-storage-adapters.mjs` | Focused domain/storage tests and isolated adapter import wiring |
| `tests/smart-reading-browser.cjs` | Actual-App mode/theme/size matrix, text coverage, controls, settings, safety, count/Undo and routine boundaries |
| `tests/smart-reading-preview.cjs`, `tests/run-smart-reading-regressions.cjs` | Supported-browser preview (no browser launch) and explicitly approved browser regression batch |
| `tests/responsive-browser.cjs`, `tests/milestones-browser.cjs` | Existing browser-only immersive Free Tap hit target: x=10 → x=2 avoids SVG interception by RN Web's box-none descendant CSS; application touch behavior is unchanged |
| `docs/smart-reading/` | This review, screenshots, test evidence and source manifest |

Earlier changes in App, domain, routines, beads, themes, native configuration and other documents are preserved. The manifest compares protected files with the preceding Arabic-reading evidence where hashes are available.

## Validation record

- Unit tests: **88 passed, 0 failed**, including 9 new reading-domain/native-and-web-adapter tests.
- TypeScript: passed. Expo lint: passed.
- Smart reading browser tests: **72 mode/theme/viewport cases passed**, with additional actual-App checks for all-mode phrase coverage, main/Free Tap, guided main/Free Tap boundary Undo → advance → completion → Undo, ticker pause/resume/restart, speed persistence, mode switching, automatic segmented progression, dynamic reduced-motion interruption/no silent restart, relevant Settings controls, and full screen-reader fallback. [Results](validation/reading-browser.json).
- All **seven existing browser suites passed**: responsive, routines, milestones, persistence, launch, contrast and baseline. [Summary](validation/legacy-browser-summary.json). Their JSON reports and final run logs are in `validation/`.
- [Unit output](validation/unit-tests.txt), [capture/source manifest](capture-manifest.json). All source hashes in the manifest match the final tested source. Protected counter/routine/bead/theme/root files match the preceding Arabic-reading evidence where prior hashes exist.

The added dynamic-motion assertion was adjusted to wait for React's committed UI after the mocked OS event. The first smart-suite attempt hit a launch-screen skip race in the test itself; it was corrected by waiting for the counting screen. The first legacy responsive attempt hit the browser-only SVG interception described above. A later launch-suite attempt found the ffmpeg recorder missing from Playwright's expected cache. The existing temporary copy proved incomplete, and the official installer also stalled during extraction. The complete recorder was extracted from the newly downloaded official Playwright archive, verified byte-for-byte against that archive, and passed macOS signature verification. App dependencies were unchanged. These failures were test/runtime setup issues; no SIGABRT, HIServices registration failure, sandbox disabling or browser-crash retry occurred.

The preview server can be started with `ZEKR_QA_MODULES=<external QA node_modules> node tests/smart-reading-preview.cjs`; it binds only `127.0.0.1:4183` and never launches a browser. The approved batch uses `node tests/run-smart-reading-regressions.cjs` with the established QA modules, Chrome executable and temporary output directory. It runs the new reading suite followed by the unchanged seven-suite coordinator. Browser launch approval is still required under AGENTS for future commands.

The first Chrome batch request was rejected by automatic approval review because AGENTS requires exact-command approval. The owner then explicitly approved the displayed command; subsequent Chrome runs used that command outside the macOS sandbox with `chromiumSandbox: true` and stopped at the first suite failure. The global sandbox remained enabled.

## Remaining native QA

No emulator was launched or native QA claimed in this task. Prior Arabic-reading native screenshots do not validate these new modes.

After product review, check the four modes on Android and iOS with the SAME canonical phrase and theme, then all six themes: actual `onTextLayout` line geometry, Arabic shaping/tashkeel at 1×/large/nonlinear font scales, RTL and right-to-left layout configurations, native-driver ticker start/pause/speed/end/restart, rotation and font changes, last-line clearance, touch selection/drag independence from counting, routine boundary Undo/advance/completion and Free Tap, background/foreground, reduced-motion changes, TalkBack/VoiceOver focus and complete static text, cold-restart persistence and read/write failure recovery. Physical-device haptics, OEM fonts and assistive-technology operation remain unverified. No release build is requested or produced.
