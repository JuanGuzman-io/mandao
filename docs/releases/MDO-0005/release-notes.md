---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
audience: product owner
language: en
---

# Release notes — Prove that a crashing doctor never sends garbage to CI

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 — Broken lock file: error message, nothing on the output, failure | met | When the lock file is broken, the doctor fails with an error message that names the file and prints nothing a CI job could mistake for a report. This is now checked automatically on every build, so a regression fails the build instead of a team's pipeline. |
| AC-2 — Broken model settings: reported as an error, not a crash | met | When the model settings file is broken, the doctor still prints one valid JSON report, with an error that names the file, and fails the CI job. This is also checked on every build. |

No change in behavior: this release adds automatic checks for what the doctor already does.

## Not done yet
- Turning a broken lock file into a JSON report entry, instead of an error message, is left for a
  separate story.

## Known limits
- Correction to the MDO-0004 notes: a broken model settings file does **not** stop the doctor with an
  error message. It appears as an error in the JSON report, and the CI job still fails. Only a broken
  lock file takes the error-message path.
- The checks run on Linux, where CI runs; Windows is not covered.
