# QA artifacts and portable documentation

New browser captures and scenario results default to `.qa-artifacts/<suite>-<unique suffix>/` at the checkout root. Each run gets a new directory. `.qa-artifacts/` is ignored; it is intentionally absent from fresh clones and worktrees until the first run. Scratch bundles and mocked runtime files remain in OS temporary storage.

`ZEKR_QA_OUTPUT` overrides the destination. Choose a fresh ignored directory for each run; an explicit override can overwrite files and must never point at historical evidence. For browser previews controlled through a supported integration, save screenshots, videos, traces and logs under a fresh `.qa-artifacts/` directory as well. Browser execution still requires the existing macOS launch safeguards and approvals.

Review a capture before explicitly copying a curated product screenshot into `docs/assets/screenshots/` or `assets/`. Product art, splash images, theme previews, README screenshots and JSON manifests outside the historical evidence folders are trackable. Stage selected paths explicitly; never stage all generated artifacts automatically. Retain durable architecture, product reports and curated validation summaries.

## Preserved historical evidence

The following folders contain 394 ignored local files in the original checkout. Their Markdown reports remain trackable. They are legacy evidence locations, not destinations for new product assets or QA runs:

- `docs/arabic-reading-fix/`: 91 files.
- `docs/routines-refinement/`: 109 files.
- `docs/routines-ui/`: 118 files.
- `docs/routines/`: 49 files.
- `docs/smart-reading/`: 27 files.

Links to this evidence are labeled local-only in each report. Absolute `/Users/...` references in the persistence and milestone reports are also explicitly machine-local. These links are unavailable in fresh clones or worktrees; they are not portable proof. No files were relocated, deleted, overwritten or added to Git as part of this hygiene correction. Existing tracked launch, milestone, native screenshot and validation collections remain intact.

The local Markdown target audit on 21 October 2026 found all referenced filesystem targets present: 163 links to ignored local evidence and 20 absolute machine-local links. Relative portable targets were also present. External websites and Markdown heading anchors were not revalidated by this filesystem audit.

## Isolated UI experiment

A worktree based on `3e8e357` will include the committed application and tests but will not inherit these uncommitted hygiene changes, ignored evidence, dependencies or QA outputs. Apply the reviewed hygiene diff to the isolated worktree if it needs this policy before a new commit is approved. Keep Gemini UI changes isolated; do not copy the historical screenshot collection into Git.

## Hygiene correction file inventory

- `.gitignore`
- `AGENTS.md`
- `docs/PERSISTENCE_SAFETY_REMEDIATION.md`
- `docs/QA_ARTIFACT_POLICY.md`
- `docs/arabic-reading-fix/README.md`
- `docs/assets/screenshots/README.md`
- `docs/launch/README.md`
- `docs/milestones/PRESENTATION_CONTRACT_FIX.md`
- `docs/routines-refinement/README.md`
- `docs/routines-ui/README.md`
- `docs/routines/README.md`
- `docs/smart-reading/README.md`
- `tests/baseline-browser.cjs`
- `tests/contrast-browser.cjs`
- `tests/launch-browser.cjs`
- `tests/milestones-browser.cjs`
- `tests/persistence-browser.cjs`
- `tests/responsive-browser.cjs`
- `tests/routines-browser.cjs`
- `tests/run-ui-regressions.cjs`
- `tests/smart-reading-browser.cjs`
- `tests/smart-reading-preview.cjs`
- `tests/support/qa-output.cjs`

## Ignore rules before and after

Removed QA block (all other dependency, build, signing and environment rules remain unchanged):

```gitignore
docs/*-evidence/

# QA test run logs, validation artifacts, and screenshots
*.log
docs/**/*.log
docs/**/*.txt
docs/**/before/
docs/**/after/
docs/**/native/
docs/**/browser/
docs/**/screenshots/
docs/**/validation/
docs/*/*.jpg
docs/*/*.png
docs/*/*.json

```

Replacement block:

```gitignore
# Temporary QA outputs (unique run directories; see docs/QA_ARTIFACT_POLICY.md)
/.qa-artifacts/

# Historical local-only QA evidence; keep durable Markdown reports trackable.
/docs/arabic-reading-fix/**
!/docs/arabic-reading-fix/**/
!/docs/arabic-reading-fix/**/*.md
/docs/routines-refinement/**
!/docs/routines-refinement/**/
!/docs/routines-refinement/**/*.md
/docs/routines-ui/**
!/docs/routines-ui/**/
!/docs/routines-ui/**/*.md
/docs/routines/**
!/docs/routines/**/
!/docs/routines/**/*.md
/docs/smart-reading/**
!/docs/smart-reading/**/
!/docs/smart-reading/**/*.md

```
