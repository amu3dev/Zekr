# Guided routines: actual-app browser evidence

> **Local-only evidence:** Linked captures, manifests and validation outputs in this folder are preserved on the original checkout and ignored by Git. They will be unavailable in a fresh clone or worktree. The Markdown report remains portable; see the [QA artifact policy](../QA_ARTIFACT_POLICY.md).

**Historical initial integration.** These captures and results predate the focused UI recovery. See the [current compact layout, before/after comparisons and current validation status](../routines-ui/README.md). The original evidence is retained without being relabeled as evidence for the revised UI.

Captured 18 October 2026 from the working-tree `App.tsx` through React Native Web in isolated headless Chrome. **These are browser screenshots, not native Android/iOS captures.** No mockup artwork replaces the application UI. Earlier APK/native images elsewhere in the repository predate this feature.

The final run used the specific command explicitly approved by the owner after the updated macOS launch-safety instructions. Chrome ran outside the restricted macOS execution sandbox with its own Chromium sandbox enabled. No subsequent browser launch was needed for documentation. The initial restricted launch earlier in implementation aborted; later successful regression runs preceded the new instruction. No sandboxed retry is part of the reproduction guidance.

Native splash, haptics, accessibility announcements, lifecycle and safe areas (24 px top/bottom) are mocked. Standard captures use 390 × 844, touch, scale 1 and reduced motion. Narrow captures use 320 × 844. The 200% shim doubles text styles, honors `allowFontScaling`/`maxFontSizeMultiplier` and reports fontScale 2; it is a layout approximation, not native Dynamic Type or screen-reader evidence.

[Structured results](results.json) record **28 passing scenario groups and zero page errors**. [Capture manifest](capture-manifest.json) fingerprints the final application sources, harness and all 45 raw screenshots. Screenshots depict actual test states; they do not imply real-user use or religious acceptance. The small matrices below uniformly scale the raw captures for review.

## Six themes

Main is the top row, guided Free Tap the bottom. Columns: Midnight Sapphire, Royal Amethyst, Soft Ivory, Obsidian Ember, Glacier Prism, Solar Pulse. All show the same restored routine, second step at 1/33 and overall 34/100. Theme changes and opening/closing Free Tap preserve routine and individual progress.

![Actual application: six themes, Main and guided Free Tap](theme-matrix.png)

| Theme | Main | Free Tap |
| --- | --- | --- |
| Midnight Sapphire | [Main](screenshots/main-midnightSapphire.png) | [Free Tap](screenshots/free-midnightSapphire.png) |
| Royal Amethyst | [Main](screenshots/main-royalAmethyst.png) | [Free Tap](screenshots/free-royalAmethyst.png) |
| Soft Ivory | [Main](screenshots/main-softIvory.png) | [Free Tap](screenshots/free-softIvory.png) |
| Obsidian Ember | [Main](screenshots/main-obsidianEmber.png) | [Free Tap](screenshots/free-obsidianEmber.png) |
| Glacier Prism | [Main](screenshots/main-glacierPrism.png) | [Free Tap](screenshots/free-glacierPrism.png) |
| Solar Pulse | [Main](screenshots/main-solarPulse.png) | [Free Tap](screenshots/free-solarPulse.png) |

## Narrow phones / long Arabic text

All six themes render Tahlil at 320 px and 200% text approximation in Main and guided Free Tap. The phrase region scrolls independently, with an explicit hint; the beginning and end of the complete phrase are captured separately. At this scale, the outer content also scrolls to reach the counting area/actions. No ellipsis or line clamp is applied to the phrase. Content-bound checks keep phrase and step/overall labels within the viewport. These checks do not assert that the whole interface fits on one screen at 200%.

![Actual application: six themes with long Tahlil and 200% text approximation](large-text-matrix.png)

Examples: [Main, beginning](screenshots/tahlil-midnightSapphire-320-2x-main.png) · [Main, end](screenshots/tahlil-midnightSapphire-320-2x-main-end.png) · [Free Tap, beginning](screenshots/tahlil-midnightSapphire-320-2x-free.png) · [Free Tap, end](screenshots/tahlil-midnightSapphire-320-2x-free-end.png). Corresponding captures for the other five themes and standard text are in `screenshots/`.

## Interaction states

- [Catalog](screenshots/catalog.png): grouped source metadata and start/resume actions; the outer list scrolls to all four routines.
- [Long Tahlil](screenshots/tahlil.png): automatic fourth-step entry at 99/100. The test also checks that changing to this long phrase leaves the counting control in the same position.
- [Completion](screenshots/completion.png): counting disabled at 100/100, calm acknowledgment, correction through Undo and explicit restart/return actions.
- [34 repetitions / 33 beads](screenshots/34-with-33-beads.png): final 34-count step complete with one active bead in visual cycle two.
- [Save failure](screenshots/save-failure.png): pending progress retained across a boundary and a further tap, warning shown, retry saves latest progress once.

All six Main/Free Tap pairs and the narrow large-text matrices were visually inspected. The separate beginning/end large-text captures confirm that long wording remains scrollable. This is not native glyph fitting, touch, haptic or accessibility approval.

## Automated results

| Check | Result |
| --- | --- |
| `npm test` | **73/73 passed**, no failures/skips; 16 additional routine domain/adapter/persistence tests |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass |
| `npm run test:routines` | **28 passing groups**, zero page errors; final captured source hashes verified |
| Existing `test:milestones` | Pass during implementation, including 378 rendered component cases |
| Existing `test:persistence` | Pass during implementation, 13 scenario groups, zero page errors |
| Existing `test:launch` | Pass during implementation, 13 scenario groups after using the existing QA FFmpeg installation |
| Existing `test:themes` | Pass, all six themes; rerun after the settings changes |
| Existing `test:baseline` | Pass during implementation, six theme selection/restoration pairs and 18 captures |

The existing suites were run during integration before final guided-layout refinements. The final approved 28-group routine suite covers the resulting working-tree application; those older browser suites were not relaunched after the new per-command approval instruction. The unchanged individual reducer/bead engine remains covered by the final unit suite. Expo Doctor's earlier baseline result was not rerun for this dependency-free feature.

Final routine coverage includes all step boundaries, one-tap ownership, boundary/final undo, disabled completion/no restart, restart/cancel/replace/leave/resume, acknowledged-save restoration, no restoration announcement replay, stable ordinary-transition focus, combined aggregate/reset semantics, 34-count bead behavior, six UI-selected themes, shared Main/Free Tap state, motion preference changes, narrow/large text, corrupt/unknown/empty routine protection, independent single counting, failed reads/retry and failed saves/pending revision recovery.

## Reproduce safely

Use the existing [external QA dependency setup](../assets/screenshots/README.md#reproduce), then `npm run test:routines` with the QA module/browser environment variables. Default output is a unique temporary folder. Set `ZEKR_QA_OUTPUT` only when intentionally choosing a destination. Tests never access device/user storage and do not publish anything.

On macOS, do not launch this test/browser from a restricted execution sandbox. Use an approved outside-sandbox command or supported browser-control integration. A fresh agent launch requires explicit approval for its exact command under the current AGENTS instructions; an old allow rule is insufficient. Stop/report a registration crash or SIGABRT and do not silently retry.

Native follow-up remains: Android/iOS development-build rendering, actual 200% font scaling and nested scrolling, TalkBack/VoiceOver announcement/focus behavior, final-completion correction controls, physical haptics, tap ergonomics and interrupted-write scenarios. No new APK or production artifact was generated.
