# 0066 — Optional tracking of installed catalog skills

**Status:** Accepted (phase 22).

## Context

Teams can commit installed skill copies, or restore them after cloning. Existing projects already track
these copies and must retain their behavior. Sync must remain offline.

## Decision

`skills.track` defaults to true. Interactive init offers to ignore installed, reinstallable catalog skills,
defaulting to ignore. The lock records the source and copy policy needed to reproduce Git skills at their
exact commits and bundled skills from the installed Mandao version. `skills restore` fills missing targets
without overwriting existing ones. Sync manages individual ignore entries and reports the Git command needed
to remove already tracked copies; it never changes the index. Project skills and non-reinstallable sources
remain tracked.

A git pin written before 0.1.0-beta.3 has no recipe. It gets one when the installed catalog pins the same version,
source and commit and a copy is on disk: the copy shows the invocation policy it was installed with
(`disable-model-invocation: true` or Codex `allow_implicit_invocation: false`); the catalog's
`model_invocation: false` also turns it off, so a copy edited by hand never loosens the policy. `sync` writes that recipe into the lock,
so a clone without the copies restores them. Without a copy, nothing proves the policy and the skill stays tracked.

## Consequences

A clone or CI can restore ignored skills explicitly. Sync does not require network access. A missing or
unavailable pinned source is reported, and restoration failures of supported sources fail the command.
