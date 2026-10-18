# Native Android release captures — 18 October 2026

These are **native Android emulator screenshots of the signed release-mode APK**, not browser renders, Expo Go, a Metro development client or design mockups.

- APK build: `23373925-2ac0-4add-b7ae-bacd7d5ce98a`, profile `preview`, account `ayosry`.
- App: `app.dhikr.counter`, version 0.1.0, versionCode 1.
- APK SHA-256: `47cbc16b5e02746ea60e49791aededf87743d7585c6af822a60fa89ce1b93895`.
- Emulator: Pixel 3a, Android 14/API 34, arm64, 1080 × 2220, density 440, font scale 1.0.
- Capture: `adb exec-out screencap -p`, uniformly resized **50% to 540 × 1110** using macOS sips for maintainable documentation files. No cropping, retouching, synthesized UI, overlay removal or color correction.
- Isolation: existing AVD booted with `-read-only -no-snapshot`; original stored emulator data is preserved. Test initialization and all interactions occurred only in that disposable session. No physical device/user storage was accessed.

[Capture manifest](capture-manifest.json) records theme results, actual native accessibility values, screen dimensions, APK identity and PNG hashes. [Build/signature/permission record](../../../ANDROID_RELEASE.md).

## State and checks

The real native UI selected goal 33, then received 44 native touch events. The first dhikr remains selected. All six main and Free Tap images show count **44**, base **33**, cumulative milestone **66**, 11 active beads and cycle two. Haptics and visual effects were switched off through Settings for deterministic captures.

For every theme, the script selected its gallery radio, checked Android's checked state, closed Settings, waited for writes, force-stopped/restarted the application, verified the restored theme in Settings and the **٤٤ من ٦٦** native counter value, captured main and Free Tap, and checked count parity after exiting Free Tap. This validates normal native restoration after saved state; it does not guarantee durability when termination interrupts a pending write.

Other captures show initial/scrolled/selected gallery sections, Solar Pulse Settings with six-theme availability, dhikr selection, custom goal input and the 33/33 completion after a real tap. Static theme previews intentionally show **12/33**; the native custom dialog shows its unchanged initial goal **33**, with the keyboard not shown. The supplementary browser capture uses unsaved 50. Completion intentionally uses **33/33**, before continuing to 44.

Final images were visually reviewed for Arabic numerals, milestone state, active theme, centered badge, clipping/overlap and absence of development overlays or personal information. Scrollable dialog content is intentionally viewport-limited; this does not mean all library/settings content is shown in one image.

## Reproduce manually

Install the [same internal APK](https://expo.dev/artifacts/eas/Idh9kUOUATWWdxoKojQctJiiutM3XzIYnjVL_AoqSPE.apk) in an isolated Android emulator. Initialize only test data there, set standard font scale, disable haptics/effects in Settings, choose base 33 and tap to 44. Select each theme, wait for its save, stop/relaunch and confirm state; capture main/Free Tap and dialogs with Android screencap. Uniformly resize the resulting documentation copies if desired and record their provenance/hashes.

No claim is made for physical haptic feel, TalkBack/VoiceOver delivery, Android 12/16 or iOS behavior, maximum text scaling, launcher masking, production splash transition frames or performance. These native captures supplement the separately labelled [browser QA](../README.md); they do not turn browser mocks into native evidence.

Observed limitation: when the native numeric keyboard is open, it can cover the custom-target Save/Cancel actions. Hiding it makes the actions visible. The accepted capture documents that real keyboard-hidden state; it does not establish correct keyboard avoidance.

## Theme captures

| Theme | Main | Free Tap |
| --- | --- | --- |
| Midnight Sapphire / ياقوت الليل | [Main](tasbeeh-midnight-sapphire.png) | [Free Tap](free-tap-midnight-sapphire.png) |
| Royal Amethyst / الجمشت الملكي | [Main](tasbeeh-royal-amethyst.png) | [Free Tap](free-tap-royal-amethyst.png) |
| Soft Ivory / العاجي الهادئ | [Main](tasbeeh-soft-ivory.png) | [Free Tap](free-tap-soft-ivory.png) |
| Obsidian Ember / جمر الليل | [Main](tasbeeh-obsidian-ember.png) | [Free Tap](free-tap-obsidian-ember.png) |
| Glacier Prism / طيف الجليد | [Main](tasbeeh-glacier-prism.png) | [Free Tap](free-tap-glacier-prism.png) |
| Solar Pulse / نبض الشمس | [Main](tasbeeh-solar-pulse.png) | [Free Tap](free-tap-solar-pulse.png) |

The scrolled gallery image also documents the selected state; its duplicate was removed.
