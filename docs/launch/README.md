> **Historical snapshot.** This dated report and its original evidence are preserved. For current behavior, test results and release status see the [project baseline](../PROJECT_BASELINE.md). Older test totals and machine-local evidence links below are not current portable proof.

# Zekr launch implementation and validation — 13 October 2026

The native system splash and the JavaScript launch experience are separate stages.

## Original problem

The inspected checkout already configured `#0B132B` and transparent splash PNGs. The reported white oversized icon could not be reproduced on a device. Expo Go substitutes the app icon, and existing binaries do not acquire config-plugin changes without a rebuild. The unused legacy `assets/splash-icon.png` has an opaque background, but was not referenced by the current config.

The configured iOS lockup had eight beads and rasterized Arabic branding; Android used the twelve-bead symbol. The symbol was vertically off-center in its transparent canvas. There was no JS launch sequence or loading spinner. `preventAutoHideAsync()` ran at module scope, but `hideAsync()` ran when storage resolved, without waiting for the restored home view's layout.

Theme and counter restoration remain independent existing storage reads. No storage keys, reducer behavior, settings, or theme gallery were changed.

## New behavior

- Native Android and iOS retain the same centered transparent 512 × 512 emblem and stable `#0B132B` background in both OS appearance modes. JS now renders the same geometry with existing `react-native-svg`, so image decoding cannot race the launch decision.
- Normal sequence: 820 ms of subtle emblem illumination, sequential beads, central glow, Arabic reveal and a final 180 ms theme dissolve. Native-driven opacity/scale animations perform no per-frame React updates.
- Native splash hiding belongs to home and waits for restored counter/theme plus `onLayout`. It is independent of decorative readiness and still works if backgrounding cancels the intro before restoration finishes.
- A shared `useReducedMotion` hook treats unknown preferences conservatively, handles query failure, ignores stale query results after an OS preference event, and is used by launch, counter and free-tap mode.
- A delayed motion response can start a shortened sequence within the original deadline. A never-resolving response uses a static emblem and expires the intro after 900 ms. Neither case holds the native splash. Skip is available immediately when home is ready.
- The first intro press consumes the gesture and reveals home without changing count. Automatic dismissal pauses during that gesture so a held finger cannot reach the concealed counter when the intro timer expires. Home controls stay outside the accessibility tree until revealed.
- Backgrounding cancels the intro; returning does not replay it. Reduced motion cancels motion immediately. If the full sequence fails, an independent short theme dissolve is attempted; if the driver also fails, static handoff still releases home.
- Count feedback uses a synchronous cursor advanced by the same counter reducer for every queued action. This keeps haptics and background flushes aligned with batched presses without changing reducer or storage semantics.
- Free-tap cycle wording matches the main counter. Theme gallery has radio-group semantics, starts with an estimate of the actual modal width, and avoids duplicated vertical spacing. Confirmation callbacks own closing exactly once.
- `app.config.ts` explicitly allows Android network/overlay permissions only for `ZEKR_BUILD_VARIANT=development`. Default, preview and production config retain their offline permission blocks. EAS profiles select the variant explicitly.

## Evidence and limits

| Check | Result |
| --- | --- |
| Expo lint and TypeScript | Passed |
| Counter/bead and input-validation tests | 5 passed; sanitization, numeric bounds and Arabic/Persian digit conversion included |
| Android JS export | Passed; 729 modules, approximately 1.7 MB Hermes bundle |
| Expo Android CNG prebuild in temporary checkouts | Passed for production and development variants; development manifest includes INTERNET, production removes it |
| Generated native splash resources | All 10 density/night PNGs checked: transparent corners and zero opaque white pixels |
| Generated native colors | Splash light/night, launcher background and activity background use sapphire |
| Browser QA of actual App and LaunchExperience | Normal exit, skip without counting, held-gesture safety, theme restoration, background/no replay, reduced motion, delayed preference, driver failure, unresolved preference, batched haptic selection and gallery grouping |
| Android cold start, warm start and background/foreground | Not performed on Android |
| Android reduced motion, skip and theme handoff | Not performed on Android |
| Production-like Android APK | Not built; EAS CLI reports `Not logged in`; ADB reports no connected device |
| Android startup time / frame pacing | Not measured |

Browser QA uses React Native Web with real application code and local storage. Native splash, safe-area insets, haptics and OS events are mocked. Batched callback tests verify feedback selection, not physical vibration. It exercises lifecycle control but cannot validate native compositing, TalkBack, Android Arabic font selection, system bars, icon masking, or device performance. Screenshots were visually inspected. Asset/resource checks do not prove the absence of every possible device-level white flash.

`launch-browser.png`, `home-browser.png`, `reduced-motion-ivory-browser.png` and `launch-browser.mp4` are browser captures, not Android screenshots. `native-resource-preview.png` is a composition of the generated Android splash drawable on sapphire, not a device capture. `browser-qa-results.json` records the executed browser scenarios; `native-resource-proof.json` records the asset inspection.

The native PNG is approximately 18 KB (512 × 512; about 1 MiB uncompressed RGBA); the JS sequence uses SVG instead of decoding that PNG. Startup does not wait for the decorative sequence. The configured 820 ms is animation duration, not measured application startup latency. No claim of Android production validation is made.

## Changed files

- `App.tsx`: home readiness/native handoff, accessibility visibility and queued counter feedback.
- `src/components/LaunchExperience.tsx`: SVG emblem, bounded sequence, safe skip gestures and theme handoff.
- `src/hooks/useReducedMotion.ts`, counter/free-tap components: consistent motion preferences and cycle wording.
- `src/components/Modals.tsx`, `ThemeGallery.tsx`: confirmation ownership, accessibility grouping and initial layout.
- `app.config.ts`: development-only Android network permissions.
- `tests/inputs.test.mjs`, `tests/launch-browser.cjs`: data validation and repeatable UI regressions.
- `package.json`, `.gitattributes`, English/Arabic READMEs: test commands, LF policy and updated launch documentation.
- `app.json`: shared emblem and stable light/dark native splash identity.
- `assets/splash-emblem.svg` / `assets/splash-emblem.png`: centered transparent brand artwork; original launcher assets retained.
- `eas.json`: debug APK development, internal APK preview, and production app-bundle profiles.
- `docs/launch/*`: report, resource proof, browser results and visual evidence.

## Native sign-off still required

Sign into EAS, then run `npx eas-cli@latest build --platform android --profile preview`. This profile creates an internal APK without a development client. Install that APK on Android 12+; also check a pre-12 device if available. Launch through the launcher rather than Expo Go.

Check force-stop/cold start; retained-activity warm start; background midway through launch and after home; system reduced motion before launch and switched during launch; first-ever launch; saved Sapphire, Amethyst and Ivory; skip and immediate counter input; restoration of a nonzero count. Record native splash-to-home frames and confirm no opaque white box, system-bar flash, clipped emblem, or layout jump. Measure startup-to-interactive and frame pacing on a slower Android device before reporting production performance.

Documentation consulted: [Expo SDK 57 splash screen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/), [Android system splash constraints](https://developer.android.com/develop/ui/views/launch/splash-screen), [React Native Animated](https://reactnative.dev/docs/animated), [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo).

## Re-running browser QA

The browser harness is checked in at `tests/launch-browser.cjs`. Install QA-only packages into a temporary directory, without changing app dependencies:

```sh
npm install --prefix /private/tmp/zekr-launch-qa react@19.2.3 react-dom@19.2.3 react-native-web@0.21.0 esbuild playwright
```

Install Playwright Chromium/ffmpeg for that temporary runtime, or set `ZEKR_QA_CHROME` to an existing Chrome executable. Set `ZEKR_QA_MODULES=/private/tmp/zekr-launch-qa/node_modules` and run `npm run test:launch`. `ZEKR_QA_PLAYWRIGHT` can point to a separately provided Playwright module. Captures and scenario results default to a unique ignored `.qa-artifacts/` run folder printed at completion. Set `ZEKR_QA_OUTPUT` to explicitly choose a destination; committed evidence is never overwritten by default.

Review fixes on 2026-10-13 made launch cleanup safe under StrictMode, kept the emblem at full opacity until the overlay dissolves, and removed its unused style. The browser suite passed all existing scenarios plus a StrictMode launch regression. The committed captures remain historical evidence; the new run was saved to temporary storage. Native launch validation remains outstanding.

For a local Android debug build, use `npm run android`, which sets `ZEKR_BUILD_VARIANT=development`; for cloud debug APKs use the EAS `development` profile. This is a standard Metro debug APK, not an Expo development client. Preview/production builds stay offline. Generated manifests were inspected; Metro connectivity and physical haptics have not been exercised on Android.
