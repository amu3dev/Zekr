# Current real-application screenshots

Captured 18 October 2026 from the actual `App.tsx` through React Native Web in Chromium. **Browser-rendered evidence, not native Android/iOS screenshots.** No generated UI, retouching or artificial mockups are used.

The harness mocks native splash, haptics, reduced-motion API, lifecycle subscription and safe areas (24 px top/bottom). Viewport is 390 × 844 at scale 1; touch and reduced motion are enabled. Native status/navigation bars are not represented. QA storage is isolated from user data. No Expo overlays, console banners or personal information appear in the final images.

## Shared state and scope

- Dhikr: `tasbih_tahmid` — سبحان الله وبحمده، سبحان الله العظيم (the app displays its diacritized wording).
- Count **44**, base **33**, cumulative milestone **66**, **11 active beads out of 33**, cycle two.
- Haptics/effects disabled for deterministic captures; Main and Free Tap use the same domain state.
- `tasbeeh-*.png`: six full application main screens.
- `free-tap-*.png`: six full application Free Tap screens.
- `theme-gallery-initial.png`: first gallery section; `theme-gallery-scrolled.png`: remaining themes with Solar Pulse selected. A byte-identical separate selected-state copy was removed.
- `settings-solar-pulse.png`: current theme and registry-derived six-theme availability.
- `dhikr-selection.png`: current library dialog; intended horizontal/vertical scrolling remains visible.
- `custom-target.png`: unsaved Arabic goal **٥٠**, with current base still 33.
- `milestone-33-completion.png`: exception to shared count, captured at **33/33** just after a real tap from 32.

Gallery and Settings thumbnails use the app's **static 12/33 preview**, independently of session count. Main's compact virtue line intentionally truncates; the library provides the longer content.

The [capture manifest](capture-manifest.json) records parent source commit, working-tree application file hashes, theme selection/restoration results, bead counts and badge alignment. The application source under `src/` and `App.tsx` is unchanged from the parent commit; at capture time, EAS account linkage and build-version configuration were working-tree additions, recorded by this development-baseline consolidation. Screenshots were captured before the approved consolidation commit was created; they are not claimed to come from a synchronized new commit.

All 18 retained captures were visually reviewed at this viewport: themes, Arabic numerals, 44/66 labels, 33/11 beads, centered round badge, dialogs, selected state and absence of overlays. Existing faint secondary text contrast gaps are documented in the [baseline](../../PROJECT_BASELINE.md). This is not maximum-font-size or native accessibility sign-off.

## Reproduce

Keep QA-only dependencies outside the mobile app:

```sh
npm install --prefix /tmp/zekr-qa react@19.2.3 react-dom@19.2.3 react-native-web@0.21.0 esbuild playwright
/tmp/zekr-qa/node_modules/.bin/playwright install chromium ffmpeg
export ZEKR_QA_MODULES=/tmp/zekr-qa/node_modules
npm run test:milestones
npm run test:persistence
npm run test:launch
npm run test:themes
npm run test:baseline
```

Set `ZEKR_QA_CHROME` to an existing Chrome executable if desired. `ZEKR_QA_PLAYWRIGHT` can select another Playwright installation. Default outputs are unique temporary folders; they do not overwrite committed evidence.

To intentionally refresh this final collection after review:

```sh
ZEKR_QA_OUTPUT=docs/assets/screenshots npm run test:baseline
```

Wait for acknowledged saves before reload-based restoration assertions. Browser reload before the 400 ms counter save completes is not crash-durability proof. The capture harness checks all six theme selections through the UI, saved restoration, count/goal/settings preservation, 33/11 SVG beads and centered badge; it does not alter application business logic.
