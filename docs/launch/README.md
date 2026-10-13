# Zekr launch implementation and validation — 13 October 2026

The native system splash and the JavaScript launch experience are separate stages.

## Original problem

The inspected checkout already configured `#0B132B` and transparent splash PNGs. The reported white oversized icon could not be reproduced on a device. Expo Go substitutes the app icon, and existing binaries do not acquire config-plugin changes without a rebuild. The unused legacy `assets/splash-icon.png` has an opaque background, but was not referenced by the current config.

The configured iOS lockup had eight beads and rasterized Arabic branding; Android used the twelve-bead symbol. The symbol was vertically off-center in its transparent canvas. There was no JS launch sequence or loading spinner. `preventAutoHideAsync()` ran at module scope, but `hideAsync()` ran when storage resolved, without waiting for the restored home view's layout.

Theme and counter restoration remain independent existing storage reads. No storage keys, reducer behavior, settings, or theme gallery were changed.

## New behavior

- Both native platforms use `assets/splash-emblem.png`, a centered 512 × 512 transparent rendering of the existing twelve-bead symbol, on `#0B132B`, in light and dark OS modes. The configured image width is 240 logical pixels; visible artwork is approximately 124 pixels across.
- Android's plugin generates a transparent 288-pixel canvas at mdpi. The emblem's outer radius is approximately 62 logical pixels, inside Android's 96-pixel radius safe circle for icons without an icon background. No separate icon background is configured. Android controls native placement, masking and system-owned splash timing.
- The JS layer reuses that small PNG. It fades the emblem from 82% to full illumination, lights twelve beads sequentially, adds a restrained center glow, and reveals `ذِكْر` using the platform Arabic-capable typography (`Geeza Pro` on iOS, system serif fallback on Android).
- Normal duration is 820 ms: the last 180 ms dissolve sapphire into the already-restored selected theme. There is no added dependency, animation loop, or per-frame React update. Opacity and scale use the native Animated driver; scheduling is non-interactive.
- The native splash hides after the counter and theme restore and the home view reports `onLayout`. Neither animation completion, image decoding, nor the reduced-motion query is awaited by the native handoff. Native fade duration is explicitly zero so reduced-motion users are not subjected to an OS-layer decorative fade.
- Home remains interactive underneath the pointer-transparent artwork. Skip or the first home touch dismisses the layer. A home tap still performs its original action exactly once.
- Reduced motion, an unknown motion preference, foreground uncertainty, unavailable image or animation, and interrupted launch all use the static native emblem and release directly into home. A reduced-motion change while animating cancels it. The safety watchdog removes decoration after 1 second if animation completion is lost; it is never a readiness gate.
- Backgrounding cancels decoration. Foregrounding the retained app does not replay it. A new JS process is a new launch. The selected theme preference is never rewritten by the launch code.

## Evidence and limits

| Check | Result |
| --- | --- |
| Expo lint and TypeScript | Passed |
| Existing counter/bead tests | 2 passed |
| Android JS export | Passed; 729 modules, approximately 1.7 MB Hermes bundle |
| Expo Android CNG prebuild in temporary checkout | Passed |
| Generated native splash resources | All 10 density/night PNGs checked: transparent corners and zero opaque white pixels |
| Generated native colors | Splash light/night, launcher background and activity background use sapphire |
| Browser QA of actual App and LaunchExperience | Normal exit, skip, first home tap, Ivory/Amethyst restoration, background cancellation, no replay, reduced motion at launch and during launch, animation failure and unresolved motion query passed |
| Android cold start, warm start and background/foreground | Not performed on Android |
| Android reduced motion, skip and theme handoff | Not performed on Android |
| Production-like Android APK | Not built; EAS CLI reports `Not logged in`; ADB reports no connected device |
| Android startup time / frame pacing | Not measured |

Browser QA uses React Native Web with real application code and local storage. Native splash, safe-area insets and OS events are mocked. It exercises lifecycle control but cannot validate native compositing, TalkBack, Android Arabic font selection, system bars, icon masking, or device performance. Screenshots were visually inspected. Asset/resource checks do not prove the absence of every possible device-level white flash.

`launch-browser.png`, `home-browser.png`, `reduced-motion-ivory-browser.png` and `launch-browser.mp4` are browser captures, not Android screenshots. `native-resource-preview.png` is a composition of the generated Android splash drawable on sapphire, not a device capture. `browser-qa-results.json` records the executed browser scenarios; `native-resource-proof.json` records the asset inspection.

The new PNG is approximately 18 KB (512 × 512; about 1 MiB uncompressed RGBA). Startup does not wait for the decorative sequence. The configured 820 ms is animation duration, not measured application startup latency. No claim of Android production validation is made.

## Changed files

- `App.tsx`: home-layout readiness, instant native handoff options, first-touch dismissal and launch integration.
- `src/components/LaunchExperience.tsx`: brand sequence, skip, reduced-motion/static fallback, lifecycle cleanup and sapphire status-bar appearance.
- `app.json`: shared emblem and stable light/dark native splash identity.
- `assets/splash-emblem.svg` / `assets/splash-emblem.png`: centered transparent brand artwork; original launcher assets retained.
- `eas.json`: internal Android APK preview profile.
- `docs/launch/*`: report, resource proof, browser results and visual evidence.

## Native sign-off still required

Sign into EAS, then run `npx eas-cli@latest build --platform android --profile preview`. This profile creates an internal APK without a development client. Install that APK on Android 12+; also check a pre-12 device if available. Launch through the launcher rather than Expo Go.

Check force-stop/cold start; retained-activity warm start; background midway through launch and after home; system reduced motion before launch and switched during launch; first-ever launch; saved Sapphire, Amethyst and Ivory; skip and immediate counter input; restoration of a nonzero count. Record native splash-to-home frames and confirm no opaque white box, system-bar flash, clipped emblem, or layout jump. Measure startup-to-interactive and frame pacing on a slower Android device before reporting production performance.

Documentation consulted: [Expo SDK 57 splash screen](https://docs.expo.dev/versions/v57.0.0/sdk/splash-screen/), [Android system splash constraints](https://developer.android.com/develop/ui/views/launch/splash-screen), [React Native Animated](https://reactnative.dev/docs/animated), [AccessibilityInfo](https://reactnative.dev/docs/accessibilityinfo).
