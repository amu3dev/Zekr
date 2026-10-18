# Zekr project baseline

Development baseline verified on 18 October 2026 (Africa/Cairo). This is the authoritative current technical description; it is not a public app release. Dated reports linked below are historical snapshots and do not supersede this document.

## Repository and provenance

- Repository: `https://github.com/amu3dev/Zekr.git`, public, not archived.
- Canonical branch: **master**, retained by the owner's explicit correction during this consolidation. No `main` or additional development branch was created.
- Discovery/source parent: local HEAD and fetched `origin/master` were **51c8121078f1070f32ed6cc014c8f58b31a19fd5**. This is the APK/application source parent, not a claim about the later consolidation HEAD.
- Remote default/HEAD: `master`; local vs remote ahead/behind: **0 / 0** at discovery.
- Initial tracked modifications and untracked files: **none**. Latest implementation, including all six themes and native empty-payload storage protection, was already committed and on GitHub.
- Existing `fix/zekr-readme-claims-and-linkedin-media` points to `89c2209c3c6aba5383250f03efbd1ca761952d82`, already contained in master. Preserved; no branch deletion or history rewrite.
- No tags or GitHub releases found. Existing `.github/workflows/ci.yml` used master/main filters; this consolidation aligns them to canonical master while retaining npm ci, TypeScript, lint, unit tests and Expo Doctor. It does not run browser QA or build a release APK.
- Existing GitHub CI for inspected HEAD: [successful run](https://github.com/amu3dev/Zekr/actions/runs/38862749302).
- The owner approved one development-baseline consolidation commit and normal push on master. This document belongs to that commit; obtain its exact identity with `git log -1 --format=%H -- docs/PROJECT_BASELINE.md`. The final local/remote SHA, clean-tree and GitHub-rendering checks are reported after push, rather than embedding a self-referential commit hash here. No app release, tag or APK upload to GitHub is authorized.

The source SHA recorded in screenshots/build metadata is the parent source commit. The [capture manifest](assets/screenshots/capture-manifest.json) additionally fingerprints application files from the working tree. The [Android record](ANDROID_RELEASE.md) distinguishes committed source from the uploaded working tree.

## Current architecture

`index.ts` registers the single `App.tsx` root. `SafeAreaProvider` and `ThemeProvider` wrap the counter screen. The app uses modal state rather than routes; Expo Router is not installed. No routing rewrite or new feature is part of this consolidation.

| Boundary | Owner / responsibility |
| --- | --- |
| Screen orchestration | `App.tsx`: modal visibility, current dhikr, feedback, main/Free Tap rendering, launch handoff |
| Domain | `src/counter.ts`: ten dhikr entries, reducer, target validation, safe bounds, legacy sanitization, milestone calculation |
| Beads / Arabic | `src/beads.ts`: independent 33-bead loop; `src/arabic.ts`: Arabic digits, input normalization and ordinals |
| Main / focus presentation | `CounterRing.tsx`, `FreeTapMode.tsx`: shared derived progression and event callbacks |
| Theme registry | `src/theme.ts`: semantic tokens, stable IDs, registry-derived options/count; `ThemeProvider.tsx`: selected preference |
| Theme UI | `ThemeGallery.tsx`: responsive rows, static 12/33 previews, selected semantics, current-theme card |
| Dialog UI | `Modals.tsx`: library, goal entry, settings, confirmations |
| Persistence | `storage.ts`: adapter validation and one owner per key; `persistence.ts`: revisioned read/write lifecycle |
| React subscription | `usePersistentState.ts`: useSyncExternalStore, initialization, foreground retry, background/unmount flush |
| Startup / feedback | `LaunchExperience.tsx`, `useReducedMotion.ts`, `StorageNotice.tsx` |
| Native configuration | `app.json`, `app.config.ts`, `eas.json`; native projects are generated, not manually maintained |

Runtime stack: installed Expo 57.0.30, React Native 0.86.3, React 19.2.3, AsyncStorage 2.2.0, SVG 15.15.4, strict TypeScript 6.0.3. [Expo's SDK 57 reference](https://docs.expo.dev/versions/v57.0.0/) maps SDK 57 to RN 0.86 and React 19.2.3. SDK/platform configuration is not native execution evidence.

## Feature inventory

**Verified** below means the named unit/browser/Android 14 evidence passed in this run, not general native release approval. **Implemented but not fully verified** means device behavior or interaction coverage remains outstanding. No requested feature is being reclassified as planned merely because native QA is pending.

| Requested capability | Classification | Evidence and boundary |
| --- | --- | --- |
| Arabic dhikr selection/display | Implemented but not fully verified | Ten source entries; real browser and Android release library/display captures. Full selection/confirmation journey is not part of the new screenshot suite; religious source accuracy was not independently audited. |
| Main Tasbeeh | Verified in browser/Android 14 | Real App render, taps, numeral checks, counters and all-six-theme captures in browser and Android 14 release APK. |
| Exactly 33 prayer beads per cycle | Verified | Unit arithmetic plus rendered SVG bead counts for every theme and 378 component cases. |
| Continuous counting | Verified | Boundary and batched-action unit/browser journeys; no count clamp at a target. |
| Automatic milestones | Verified | Shared helper, boundary journeys, goal 1 and exact-milestone restoration. |
| Cumulative milestone presentation | Verified | Both modes show 44/66; interval hint and SVG remain 11/33. |
| Custom targets | Implemented but not fully verified | Domain/browser validation and custom goals 7/40/1 pass. Native initial dialog captured; numeric keyboard can obscure actions until dismissed, requiring UI remediation/validation. |
| Undo and reset | Verified | Reducer tests; 67→66 undo, confirmed session reset and no feedback replay in browser. |
| Free Tap / Focus | Verified in browser/Android 14 | Same shared state/callbacks, mode switching, restoration, captures in all six themes. Native Android 14 touch/mode checks pass; actual screen-reader delivery pending. |
| Animation and haptic settings | Implemented but not fully verified | Browser switch props, motion/feedback selection and reduced-motion tests pass. Physical vibration and native frame timing untested. |
| Theme Gallery | Verified in browser/Android 14 | Registry count, six radio options, selected props, scrolling and screenshots. |
| Theme persistence | Verified in tests/browser/Android 14 | Every theme selected through UI, acknowledged save, reload restoration and unchanged counting state. Native Android 14 acknowledged-save restoration after force-stop also passes for every theme. |
| Safe local storage initialization | Verified in tests/browser | Loading/ready/error lifecycle, blocked actions and no writes after failed reads. |
| Storage corruption protection | Verified in tests/browser | Malformed JSON/progress/theme, empty native/web payload, uncertain existence and retry cases. |
| Serialized persistence writes | Verified in tests/browser | One in-flight writer, revisions/latest snapshot, injected delay/failure and retry cases. |
| Save failure feedback | Verified in browser | StorageNotice, unsaved warning, continued counting, retries and recovery; 13 scenario groups. |
| Arabic RTL | Verified at captured browser/Android 14 sizes | Arabic labels/digits and explicit RTL styles; all screenshots inspected, including native 33/44 values. Other OS/font-scale behavior remains unverified. |
| Accessibility | Implemented but not fully verified | Roles/labels/hints, selected props, reduced motion, announcements tested with mocks. Faint-text contrast gaps remain; native screen readers/maximum text scaling untested. |
| Native splash / launcher assets | Implemented but not fully verified | Referenced emblem and adaptive/monochrome artwork exist. Historical generated-resource proof retained. Current release-device display pending. |

## Six-theme verification matrix

Both browser and native Android 14 selection/restoration/Main/Free Tap checks pass for each row. Native force-stop tests wait for writes; browser geometry assertions verify bead counts and badge centering, complemented by native visual review. All IDs and Arabic labels match the registry; no IDs, palettes or counting logic were changed. UI theme counts use `THEME_OPTIONS.length`, derived from `THEMES`; six is asserted only as this baseline's expected test inventory.

| Stable ID | English / Arabic | Registered | UI selection | Reload restore | Main / Free Tap | Count preserved | Beads / badge |
| --- | --- | --- | --- | --- | --- | --- | --- |
| midnightSapphire | Midnight Sapphire / ياقوت الليل | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |
| royalAmethyst | Royal Amethyst / الجمشت الملكي | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |
| softIvory | Soft Ivory / العاجي الهادئ | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |
| obsidianEmber | Obsidian Ember / جمر الليل | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |
| glacierPrism | Glacier Prism / طيف الجليد | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |
| solarPulse | Solar Pulse / نبض الشمس | Pass | Pass | Pass | Pass / Pass | 44/33 | 33 total, 11 active; centered |

Primary text, muted text and large counters pass selected opaque-token contrast checks in all themes. This is **not** complete accessibility conformance: `textFaint` on the base background measures Sapphire **3.93**, Amethyst **3.50**, Obsidian **4.03**, Solar **3.72**, below the 4.5:1 normal-text target; Ivory **4.97** and Glacier **4.82** pass that pairing. Gradients, alpha composition and native rendering require further assessment. [Measurements](validation/theme-contrast.json). Existing contrast tests cover more component pairings for Ivory and the three newer themes; they do not detect every dark-theme faint-label gap. No business logic or palette was changed merely to make documentation checks pass.

## Counting and milestone contract

- `count` is cumulative for the current dhikr session, bounded below safe-integer overflow. `target` stays the user's base target.
- `activeMilestone = max(1, ceil(count / target)) * target`.
- `intervalCount = count - (activeMilestone - target)`; arc progress is `intervalCount / target`.
- At zero: milestone is the base target and progress is zero. At an exact milestone the arc is full; the next increment starts the next interval.
- Active beads: zero at count zero; otherwise `((count - 1) % 33) + 1`. Bead cycle: `max(1, ceil(count / 33))`.
- Main and Free Tap use cumulative Arabic count/milestone labels and separate interval hints.
- Only an increment reaching an exact milestone triggers the brief 900 ms message/announcement/success-haptic selection. Restoration, undo, target/theme changes and rerenders do not replay completion. Target 1 suppresses repeated completion messages.
- Undo decrements current and aggregate count. Session reset clears current count; statistics reset clears both. A different dhikr resets current count and adopts that entry's default target through the existing confirmation flow.

## Persistence contract

Keys remain `@dhikr/counter-state/v1` and `@dhikr/theme/v1`. Counter data includes count, target, dhikrId, aggregate count, mode and feedback preferences. Theme data is the stable theme ID. Obsolete cycle metadata is ignored; milestones and bead cycles are derived.

`PersistentState` is shared per key for the JS runtime. Hydration is single-flight; `loading`/`error` cannot authorize updates/writes. Only successful verified absence allows defaults. A native adapter can collapse an existing empty string to null: `storage.ts` confirms absence through `getAllKeys`, including its callback error, before permitting defaults. Empty/unknown/unreadable payloads remain protected.

Updates are revisioned. One writer drains the latest snapshot, acknowledging only completed revisions. Counter autosave is scheduled at 400 ms without indefinitely deferring continuous taps; theme writes use a zero-delay schedule. Failures retain pending state, show a warning and retry with bounded exponential backoff (up to 30 seconds). Foreground retries and background/unmount flushes share the same owner.

Storage is unencrypted AsyncStorage. There is no journal, transaction across both keys or promise of crash-proof durability. Browser and native screenshot suites wait for saves before reloading/restarting; an immediate browser reload within the autosave window can restore an older mode. Force-stop after acknowledged saves restores count/theme on Android 14. Abrupt termination during pending writes still requires testing. No real user storage was accessed by QA.

## Current verification

| Check, 18 October 2026 | Result |
| --- | --- |
| `npm test` | 57 passed, zero failures/skips; includes installed native/web adapter behavior with simulated bridge/storage |
| `npx tsc --noEmit` | Pass |
| `npm run lint` | Pass |
| `npx expo-doctor` | 21/21 pass |
| `npm run test:milestones` | Pass: interaction journeys plus 378 rendered component cases; zero page errors |
| `npm run test:persistence` | Pass: 13 scenario groups, zero page errors |
| `npm run test:launch` | Pass: 13 scenario groups, including StrictMode, skip/held gesture, failure paths and reduced motion |
| `npm run test:themes` | Pass: six themes, switches, gallery/selected props and representative completion/reset dialogs; zero page errors |
| `npm run test:baseline` | Pass: six UI selections/restorations, count preservation, 33/11 beads and centered badges; 18 retained captures |
| Native release APK on Android 14/API 34 | Installed/cold-launched, all six themes selected/restored after force-stop, main/Free Tap count parity; native captures recorded separately |
| `git diff --check` and README local image resolution | Pass; final synchronization review rechecks these before approval |

[Structured results](validation/) retain small JSON evidence; intermediate browser screenshots/videos stay temporary. The [browser capture manifest](assets/screenshots/capture-manifest.json) records exact source-file hashes; [native evidence](assets/screenshots/android/capture-manifest.json) identifies the signed APK and emulator. Browser QA uses actual application code with native splash/haptics/OS/safe-area mocks and fresh storage; it cannot replace Android/iOS QA.

### Observed native keyboard limitation

On this Android 14 emulator, opening the custom-target keyboard can cover the Save/Cancel actions. Dismissing the keyboard through Android restores the visible actions. The final native dialog capture shows the unchanged initial goal 33 with keyboard not shown; the browser dialog capture shows unsaved 50. This is observed behavior in the unchanged application, not merely stale documentation, and requires separate UI remediation/validation. No keyboard/layout implementation change was made during consolidation.

## Development build configuration and status

Runtime version 0.1.0; Android versionCode 1; package `app.dhikr.counter`. npm `tasbeeh-app@1.0.0` is scaffold package metadata and does not set the installed version. Native directories are absent/ignored and generated through CNG.

EAS belongs to `ayosry`, project `840613e4-8465-43e5-babf-69a3cb61a45c`. Profiles: `development` → debug/Metro, `preview` → internal release APK, `production` → AAB. Version source is explicitly local; no version bump, tag, GitHub release or Play submission was performed. Preview signing is EAS-managed. [Build record](ANDROID_RELEASE.md).

Android configuration disables backup and blocks Internet, overlay and external storage permissions outside development. `app.config.ts` permits Internet/overlay only for development. Dependencies may contribute other normal permissions: the finished APK has only VIBRATE and its app-scoped dynamic-receiver permission, with no INTERNET/overlay/external storage access. It is not a zero-permission APK. Shared sapphire native splash, adaptive foreground/background and monochrome resources are configured. Configuration and historical resource previews do not prove production launch fidelity.

Project status: **verified development baseline; not publicly released**. Planned features remain before the first public release. The internal APK is for end-to-end build validation and physical-device QA, not a release candidate or store submission. The signed APK was generated and verified; artifact details belong in the Android record. No physical device or booted simulator was present at discovery. An existing Pixel 3a AVD was then booted in an isolated read-only/no-snapshot session for Android 14 release validation. The local SDK contains platforms through API 34/build-tools 34 and NDK 25; SDK 57 requires API 36, so the existing EAS workflow was used instead of changing local build infrastructure.

## Documentation authority and historical material

- `README.md` and `README.ar.md`: current product introduction and current native Android captures, with supplementary browser evidence.
- This document: authoritative implementation, evidence and limitations.
- `ANDROID_RELEASE.md`: build/signing/provenance and release gates.
- `IMAGE_AUDIT.md`: original README image inventory and retention/replacement decisions.
- `docs/assets/screenshots/README.md` and `docs/assets/screenshots/android/README.md`: browser/native capture methods and provenance.
- `docs/launch/`, `docs/milestones/`, `PERSISTENCE_SAFETY_REMEDIATION.md`: preserved dated evidence. Their older test counts and machine-local evidence links are historical, not current portable proof.
- `assets/screenshots/`: original concept images retained at original paths and explicitly marked historical; absent from current README showcases.

## Pre-release product considerations

The intended product is freely available with a charitable purpose. Future work must review developer identity/attribution, About Zekr, support contact information, licensing and existing third-party copyright notices, and privacy documentation. No developer identity, support address, About screen, license change or privacy-policy implementation is introduced here. These reviews and the separately specified planned product features must be addressed before the first public release; the current baseline is not permission to publish.

## Future feature extension points

No future feature is specified or implemented. Extend the existing reducer/domain helpers for counting semantics, registry/tokens for visual identities, shared event callbacks for main/Free Tap parity, and existing modal components for related UI. Keep screen-only modal state separate from persisted domain data.

Any new stored fields require explicit defaults, compatibility with existing v1 payloads, corruption handling and a migration decision before changing keys. Preserve the failed-read write gate, serialized writer and numeric bounds. Add boundary/reducer and fault-injection coverage for changes, plus real main/Free Tap interactions and native QA when platform behavior is affected. The current single-root architecture and two independent storage keys are constraints, not reasons to introduce speculative routing, backend or persistence infrastructure.
