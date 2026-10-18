# README and visual asset audit — 18 October 2026

Scope: inspected README.md and README.ar.md at source commit `51c8121078f1070f32ed6cc014c8f58b31a19fd5`, their referenced images, configured native artwork and existing documentation evidence. Original files are preserved. The new current captures live in `docs/assets/screenshots/` (browser) and its `android/` subfolder (native release).

## Every original README image reference

Both language READMEs referenced the following four local images and six external badges. They did not reference the dated docs screenshots directly.

| Original path / URL | Reference location | Represents / real app capture? | Matches current UI? | Decision |
| --- | --- | --- | --- | --- |
| `assets/launcher-icon.png` | Header in both READMEs | Current configured launcher artwork; not a screenshot | Configured icon | Retain as artwork in English README |
| `assets/screenshots/screen-main.png` | Design Preview table, both READMEs | Historical concept/mockup, explicitly labelled Design Preview | Not current verified app evidence | Replace in showcase; retain original with archive notice |
| `assets/screenshots/screen-library.png` | Design Preview table, both READMEs | Historical library concept/mockup | Not current verified app evidence | Replace; retain historical file |
| `assets/screenshots/screen-freetap.png` | Design Preview table, both READMEs | Historical Free Tap concept/mockup | Not current verified app evidence | Replace; retain historical file |
| `https://img.shields.io/badge/Expo-SDK%2057-000020?style=for-the-badge&logo=expo&logoColor=white` | Expo badge in both headers | Remote version badge; no app capture | SDK major matches | Replace with local text/version table |
| `https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=for-the-badge&logo=react&logoColor=black` | RN badge in both headers | Remote version badge | RN major/minor matches | Replace with version table |
| `https://img.shields.io/badge/React-19.2-20232A?style=for-the-badge&logo=react&logoColor=61DAFB` | React badge in both headers | Remote version badge | React major/minor matches | Replace with version table |
| `https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white` | TS badge in both headers | Configuration badge | Strict mode confirmed | Replace with text |
| `https://img.shields.io/badge/License-MIT-DFBA6B?style=for-the-badge` | License badge in both headers | License badge | MIT file exists, Expo notice retained | Replace with direct LICENSE link |
| `https://img.shields.io/badge/Privacy-100%25%20Offline-2F855A?style=for-the-badge` | Privacy badge in both headers | Privacy assertion badge | Development permits Metro; native merged-manifest check needed | Replace with qualified configuration description |

The older READMEs already identified the three concepts as design previews, but still gave them the primary showcase position. The refreshed READMEs show current native Android release evidence, with supplementary actual-code browser evidence explicitly identified.

## Other visual evidence and artwork

| Collection | Nature / currency | Decision |
| --- | --- | --- |
| `docs/launch/*-browser.png`, mp4/webm | Dated React Native Web launch/home/gallery evidence; not native screenshots | Retain unchanged, mark report historical |
| `docs/launch/native-resource-preview.png`, `launch-comparison.png`, native-resource-proof.json | Generated-resource preview/composition and static inspection | Retain as historical resource evidence; never call device captures |
| `docs/milestones/*.png` | Dated browser captures, some preceding the cumulative-label correction | Retain unchanged; current README uses fresh 44/66 captures |
| `assets/previews/splash-*-preview.png` | Artwork/layout previews | Retain outside showcase; not release screenshots |
| Current `launcher-*` and `splash-emblem.*` | App-configured native artwork and vector sources | Retain; native launch fidelity pending |
| Older `icon.png`, `splash-icon.png`, `splash-symbol.*`, `splash-lockup.*`, `android-icon-*` | Unreferenced/legacy artwork or previews | Preserve historical assets; no deletion or claimed native use |
| `docs/assets/screenshots/*.png` | 18 actual App browser captures for the current baseline | Retain as supplementary browser QA with source hashes; clearly labelled |
| `docs/assets/screenshots/android/*.png` | 18 native Android 14 release APK captures, uniformly resized 50% | Primary current README showcase; APK identity and PNG hashes recorded |

Main/Free Tap captures share count 44/base 33/dhikr tasbih_tahmid. The completion capture intentionally uses 33/33. Gallery/current-theme miniatures retain the application's static 12/33 preview; the browser custom input shows 50 before saving; the native dialog shows its original 33 with keyboard hidden. UI scrolling and intended single-line virtue truncation are not image editing. No screenshot was synthesized, retouched or composited for the current product showcase. Native captures were uniformly resized from 1080 × 2220 to 540 × 1110; browser captures retain their original 390 × 844 dimensions.
