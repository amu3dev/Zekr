# Proposed AGENTS.md addition — Android QA workflow

Prepared 19 October 2026 against the inspected `AGENTS.md`. During final verification, that file acquired a matching Android QA section through a concurrent edit, including an additional explicit Native QA phase condition. That edit was preserved. The text below records the narrowly scoped proposal prepared in this task. Keep all existing Expo and mandatory security instructions.

Proposed section (now substantially present in `AGENTS.md`):

```markdown
## Android development and QA workflow

Follow: Implementation → Automated Tests → Browser Visual QA → Product Owner Review → Final Native QA.

- During ordinary development and UI refinement, prefer existing unit, integration, browser and responsive QA.
- Reuse an already running, accessible Android device or emulator. A code change does not require a new emulator session.
- Do not automatically launch new AVD instances or repeatedly request emulator launch permission during ordinary iterations.
- If no Android device/emulator is available, continue with available automated/browser validation. Record native validation as pending; do not interrupt implementation to request an emulator.
- Request a new emulator launch only when the owner has explicitly authorized a Native QA phase and a new session is necessary. Obtain approval for the exact launch command through the supported approval mechanism; reuse that session afterward.
- This workflow does not waive sandbox, system or macOS GUI/browser launch restrictions. Never launch GUI/browser executables, including indirect or headless launches, from the restricted macOS execution sandbox. Prefer supported browser-control integrations. Any necessary outside-sandbox launch still requires explicit approval for its specific command; saved allow rules are insufficient.
- After SIGABRT, `Abort trap: 6` or a HIServices `_RegisterApplication` failure, stop that launch path and report it. Do not silently retry through another wrapper or launch flag.
- Keep the sandbox enabled globally and Chromium's sandbox enabled. Never use `--no-sandbox` as a workaround.
- Report unit/static, browser, native development-runtime, release-build and physical-device evidence separately. Do not claim native validation from browser screenshots.
```

This adds scheduling and reuse guidance. It does not remove any approval, crash-stop or sandbox protection. The single emulator launch in the Arabic reading task used the owner's subsequent explicit approval of the exact read-only command; it is not permission for future launches.
