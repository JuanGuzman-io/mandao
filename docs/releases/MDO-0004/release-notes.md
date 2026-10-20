---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
audience: product owner
language: en
---

# Release notes — Read the doctor's findings from CI as JSON

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 — Findings as JSON | met | `mandao doctor --json` prints one JSON document with every finding (level, message, fix when there is one) and a count per level; nothing else appears on the output, even in a color terminal. |
| AC-2 — CI fails on errors | met | The command fails the CI job when there is at least one error and passes when there are only warnings, info or ok findings. |
| AC-3 — Broken or missing setup still gives JSON | met | Without a Mandao setup, or with a broken configuration, CI still gets valid JSON explaining the problem, and the job fails. |
| AC-4 — Text output unchanged | met | `mandao doctor` without `--json` looks and behaves exactly as before. |

## Not done yet
- A stable identifier per check, to follow one specific warning across runs (OPEN-2), is left for a
  follow-up story if the pilot asks for it.

## Known limits
- If the lock file or the model settings are broken, the doctor stops with an error message instead of
  JSON; the CI job still fails, as agreed.
- There is no "strict" mode that fails on warnings; CI can decide that from the counts in the JSON.
- Messages include local paths and project names, as the text output already does.
