# Android internal validation build — 18 October 2026

## Current outcome

**Development/build validation and physical-device QA only. Zekr is not publicly released.** Planned features remain before the first public release; no release candidate, tag, GitHub APK upload or store submission is authorized by this baseline.

**SUCCESS:** EAS internal release APK build **23373925-2ac0-4add-b7ae-bacd7d5ce98a** finished on 18 October 2026 at **07:42:45 UTC / 10:42:45 Africa/Cairo**. Its signature and merged manifest were inspected; it installed and cold-launched successfully on an isolated Android 14/API 34 emulator. Further native screenshot checks are recorded below.

[Build details](https://expo.dev/accounts/ayosry/projects/dhikr-counter/builds/23373925-2ac0-4add-b7ae-bacd7d5ce98a) · [EAS project](https://expo.dev/accounts/ayosry/projects/dhikr-counter)

[Download internal APK](https://expo.dev/artifacts/eas/Idh9kUOUATWWdxoKojQctJiiutM3XzIYnjVL_AoqSPE.apk). Local file: `artifacts/android/zekr-0.1.0-1-preview-23373925.apk` (ignored by Git; **76,383,218 bytes**).

- APK SHA-256: `47cbc16b5e02746ea60e49791aededf87743d7585c6af822a60fa89ce1b93895`.
- Signing certificate SHA-256: `7450ea8b6e0a58d4d855f74a0c3984591cb30a5debbb5fedca608909417252c7`.
- [Machine-readable build record](validation/android-build.json).

## Build identity and traceability

| Field | Value |
| --- | --- |
| EAS account / project | `ayosry` / `dhikr-counter` |
| EAS project ID | `840613e4-8465-43e5-babf-69a3cb61a45c` |
| Build ID | `23373925-2ac0-4add-b7ae-bacd7d5ce98a` |
| Submitted | 2026-10-18 07:34:09 UTC / 10:34:09 Africa/Cairo |
| Parent committed source | `51c8121078f1070f32ed6cc014c8f58b31a19fd5`, `master` |
| Uploaded state | Working tree, not a new synchronized commit; existing application source plus EAS linkage, local-version setting and QA/documentation work present at upload |
| Application source | `App.tsx`, `src/`, current native artwork and counting/storage logic unchanged from parent source; all six themes already included |
| Application version / Android build | `0.1.0` / `1` |
| Application ID | `app.dhikr.counter` |
| SDK / React Native / React | `57.0.30` / `0.86.3` / `19.2.3` |
| Build profile / distribution | `preview` / internal |
| Build type | Release-mode APK, not development debug APK or Play AAB |
| Version source | `local`, app.json; no auto-increment or version change |
| Signing | Remote Android credentials; EAS generated and manages the keystore for this project. No private signing material is committed. |
| EAS source fingerprint | `68dac54d4c22aca268c91e35d99cfb901ee2f966` |

EAS records the existing HEAD hash even when uploading local modifications. It is inaccurate to describe this APK as built from a clean, synchronized consolidation commit. Documentation and the screenshot harness were subsequently refined without changing application code or native build configuration. The approved commit can reproduce the same runtime configuration via the preview profile.

## Configuration reviewed

EAS review: app.json contains only public owner/project identifiers. No credentials, signing keys or secrets are in the consolidation. Preview uses internal distribution and release-mode APK output; the existing production profile only builds an AAB. There is no submit configuration, automatic submission flag, publishing hook or EAS Update workflow configured in this repository. Existing working profiles are preserved; their existence does not authorize publication.

- Current app.json references launcher-icon.png, adaptive foreground/background, monochrome launcher and the transparent splash-emblem.png on sapphire `#0B132B`.
- `expo-splash-screen` config supplies stable Android/iOS light/dark artwork; production splash fidelity requires a standalone binary rather than Expo Go.
- Android backup is disabled. Preview/production block Internet, SYSTEM_ALERT_WINDOW and legacy external-storage read/write permissions. Development allows network/overlay for Metro.
- Finished APK merged manifest inspected: **VIBRATE** and the app-scoped **DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION** only. No INTERNET, overlay or external-storage read/write permission. `allowBackup=false`; `debuggable` is absent (false), and installed package flags do not include DEBUGGABLE. This corrects the historical zero-permissions claim.
- No hand-written native projects, new build service or build architecture were introduced. Existing `eas.json` preview/production/development workflows were retained; local app-version source was made explicit.
- No version bump, tag, GitHub release or Google Play submission was performed.

## Reproduce and record

```sh
npm ci
npm test
npx tsc --noEmit
npm run lint
npx expo-doctor
npx eas-cli@latest whoami
npx eas-cli@latest build --platform android --profile preview
```

The authorized account must have access to `@ayosry/dhikr-counter`. Use production profile for an AAB only when needed; building does not imply store approval.

For each later build, record the exact committed source and any working-tree delta, build ID/fingerprint, profile, app version/versionCode, signing certificate SHA-256, timestamp, downloadable artifact, file SHA-256, inspected permissions/debuggable flag and actual native test environment. Keep APKs and signing secrets out of source commits.

## Artifact and native smoke verification

Android build-tools 34 `apksigner verify --print-certs` passed; `aapt2` and Android installed-package metadata confirm package/version/build, minSdk 24 and target/compile SDK 36. Release APK installation and a cold activity launch succeeded without Metro. The emulator is Pixel 3a, Android 14/API 34, arm64, 1080 × 2220 at density 440 and standard font scale 1.0. It runs with `-read-only -no-snapshot`, preserving its original saved data. Only this disposable session received test initialization and preference changes. Cold activity timing (2005 ms from `am start -W`) is a single launch diagnostic, not an application startup benchmark.

All six themes were selected through the native gallery and restored after force-stop/restart, retaining count 44/base 33/milestone 66. Main/Free Tap values matched in each theme. [Native screenshots and manifest](assets/screenshots/android/README.md) identify the tested binary and display. The custom-target keyboard can cover dialog actions until dismissed; this native layout issue remains open.

## Release gates

A signed internal APK is not a store-approved release. Physical haptics, native screen-reader delivery, process-kill durability, native launch transitions, accessibility at large font sizes, Android-version/device coverage and performance still require explicit evidence. [Feature inventory and current limitations](PROJECT_BASELINE.md).
