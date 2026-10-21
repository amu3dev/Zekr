This is an Expo/React Native mobile application. Prioritize mobile-first patterns, performance, and cross-platform compatibility.

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. APIs you remember are likely renamed, moved, or removed. Before writing any code that touches an Expo, EAS, or React Native API:

1. Read the major version of the `expo` package in `package.json`.
2. Fetch the matching versioned docs: `https://docs.expo.dev/versions/v<major>.0.0/`
3. For anything else, fetch https://docs.expo.dev/llms.txt — an index of all Expo docs with corrections to common LLM misconceptions. Follow its links to the specific page you need; never answer from memory.

## Commands

Use `bunx` instead of `npx` if the project uses bun (`bun.lock` present).

```bash
npx expo install <package>  # ALWAYS use instead of npm/yarn/pnpm/bun add — resolves SDK-compatible versions
npx expo start              # start the dev server
npx expo lint               # lint
npx tsc --noEmit            # typecheck
npx expo-doctor             # diagnose dependency and config issues
npx expo install --fix      # fix incompatible package versions
```

Run lint and typecheck before declaring any task done.

## Navigation & Routing

- Use **Expo Router** for all navigation. Routes live in `src/app/` — every file there is a screen, `_layout.tsx` files define navigators. Keep non-route code (components, hooks, utils) outside `src/app/`.
- Import `Link`, `router`, and `useLocalSearchParams` from `expo-router`.
- Docs: https://docs.expo.dev/router/introduction.md

## Building with EAS

Use EAS to build, sign, and submit the app in the cloud (`eas build`, `eas submit`) and to ship over-the-air updates (`eas update`) — no local Xcode or Android Studio required. Run EAS CLI as `bunx eas-cli <command>` in Bun projects, or `npx eas-cli@latest <command>` otherwise; substitute that for bare `eas` in docs examples.
Docs: https://docs.expo.dev/eas/index.md

## Rules

- If `ios/` and `android/` directories do not exist, they are generated (Continuous Native Generation). Never create or edit them by hand — configure native behavior in `app.json` and config plugins.
- Expo Go only includes its bundled native modules. After adding a library with native code, the app needs a development build: `npx expo run:ios|android` locally, or `eas build --profile development`.
- Prefer recommended Expo modules over third-party libraries, and check your available skills before adding dependencies. Docs: https://docs.expo.dev/versions/latest/index.md

## Android development and QA workflow

Follow: Implementation → Automated Tests → Browser Visual QA → Product Owner Review → Final Native QA.

- During ordinary development and UI refinement, prefer existing unit, integration, browser and responsive QA.
- Reuse an already running, accessible Android device or emulator when permitted. A code change does not require a new emulator session. Request native emulator execution only during an explicitly approved Native QA phase.
- Do not automatically launch new AVD instances or repeatedly request emulator launch permission during ordinary iterations.
- If no Android device/emulator is available, continue with available automated/browser validation. Record native validation as pending; do not interrupt implementation to request an emulator.
- Request a new emulator launch only when the owner has explicitly authorized a Native QA phase and a new session is necessary. Obtain approval for the exact launch command through the supported approval mechanism; reuse that session afterward.
- This workflow does not waive sandbox, system or macOS GUI/browser launch restrictions. Never launch GUI/browser executables, including indirect or headless launches, from the restricted macOS execution sandbox. Prefer supported browser-control integrations. Any necessary outside-sandbox launch still requires explicit approval for its specific command; saved allow rules are insufficient.
- After SIGABRT, `Abort trap: 6` or a HIServices `_RegisterApplication` failure, stop that launch path and report it. Do not silently retry through another wrapper or launch flag.
- Keep the sandbox enabled globally and Chromium's sandbox enabled. Never use `--no-sandbox` as a workaround.
- Report unit/static, browser, native development-runtime, release-build and physical-device evidence separately. Do not claim native validation from browser screenshots.
