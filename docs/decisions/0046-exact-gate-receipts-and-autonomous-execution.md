# 0046 — Exact gate receipts and autonomous execution

**Status:** Accepted · 2026-10-21

## Context

Repeated gates, repeated session-cut advice, human review handoffs and version drift added avoidable
latency and interruptions. At the same time, reusing stale evidence, committing changes the Reviewer
never saw, or silently changing product/security scope would weaken the workflow's safety guarantees.

## Decision

- Reuse a gate result only when a deterministic receipt matches the working code tree (including
  staged and non-ignored untracked changes), resolved configuration and lockfiles, selected tests,
  and detected tool/runtime versions. Forced or deferred runs, missing tools, unrecognized tool
  versions and damaged receipts do not yield reusable evidence. Review and required gates remain
  mandatory.
- Persist session boundary IDs and whether a suggestion was already shown. A boundary may produce at
  most one stop/new-session suggestion; later estimates can still be recorded.
- Resolve reversible technical choices from the constitution and accepted ADRs; when neither decides,
  choose the least risky option meeting requirements and record rationale and rejected alternatives.
  Ask the user about product behavior, scope, security and external actions. Explicit approval gates,
  budget changes, publication and constitution edits still require authorization.
- Give the Reviewer the exact changed-path/status/hash manifest. A PASS can authorize only that
  unchanged manifest. `run commit` rejects missing/stale approval, extra paths and unreviewed human
  spec edits, and requires a successful configured build before committing.
- The launcher honors the version in `mandao.lock`: use the checkout build when dogfooding, a
  matching local/global install when available, otherwise the pinned `npx` version. Report mismatch
  rather than silently using an incompatible install.
- Archify is pinned and offered during interactive init, is invoked through one harness-independent
  script, and is required by doctor and diagram-required steps unless Mermaid was explicitly selected.

## Consequences

Matching gate runs and previously surfaced session advice can be skipped without weakening their
identity or repetition guarantees. Reviewers and commit scripts share an auditable content boundary;
manual review must use a generated pack. Technical implementation can proceed without unnecessary
clarification rounds while consequential choices remain with the user. Users opting out of Archify
must explicitly configure Mermaid.
