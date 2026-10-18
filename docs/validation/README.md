# Validation evidence — 18 October 2026

Current parent source commit: `51c8121078f1070f32ed6cc014c8f58b31a19fd5`. Application code is unchanged; the consolidation adds EAS linkage, explicit local build-version selection, documentation and QA scripts.

| File | Evidence |
| --- | --- |
| `milestones.json` | Ten browser journey groups; the same run also executed 378 component-contract cases. The verbose matrix remains temporary, rather than adding 87 KB of repetitive evidence. |
| `persistence.json` | 13 isolated browser failure/recovery groups, no page errors |
| `launch.json` | 13 browser startup/lifecycle/gesture groups |
| `themes.json` | Six-theme browser results, selected native React props, switch colors, no page errors |
| `theme-contrast.json` | Selected opaque-token contrast measurements; explicitly incomplete coverage |
| `android-build.json` | Signed EAS release build, APK/certificate hashes and actual manifest flags/permissions |
| `../assets/screenshots/android/capture-manifest.json` | Six native theme journeys, force-stop restoration, shared 44/66 values and 18 PNG hashes |
| `../assets/screenshots/capture-manifest.json` | Six-theme selection, reload, preservation, 33/11 beads, badge geometry, source provenance |

Other executed checks: 57/57 unit/installed-adapter tests, TypeScript, lint, Expo Doctor 21/21. Browser results use actual application code with mocked native services. A simulated native storage bridge is not native process/device durability evidence.

Full interpretation and release limitations: [project baseline](../PROJECT_BASELINE.md). Temporary videos, comparison sheets, intermediate screenshots and console logs are intentionally excluded from Git.
