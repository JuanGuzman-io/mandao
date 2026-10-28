# 0066 — Optional tracking of installed catalog skills

**Status:** Accepted (phase 22).

## Context

Teams can commit installed skill copies, or restore them after cloning. Existing projects already track
these copies and must retain their behavior. Sync must remain offline.

## Decision

`skills.track` defaults to true. Interactive init offers to ignore installed, reinstalable catalog skills,
defaulting to ignore. The lock records the source and copy policy needed to reproduce Git skills at their
exact commits and bundled skills from the installed Mandao version. `skills restore` fills missing targets
without overwriting existing ones. Sync manages individual ignore entries and reports the Git command needed
to remove already tracked copies; it never changes the index. Project skills and non-reinstallable sources
remain tracked.

## Consequences

A clone or CI can restore ignored skills explicitly. Sync does not require network access. A missing or
unavailable pinned source is reported, and restoration failures of supported sources fail the command.
