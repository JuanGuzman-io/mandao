# ADR 0049 — Confirmed, provider-neutral delivery and Git-derived release status

**Status:** Accepted (Phase 6)

## Context

Mandao previously stopped at local commits. The agreed delivery flow needs to work across branching
models without silently selecting a PR target, merging without verified CI, or claiming a release from
the presence of a local branch alone. Quick changes must use the same delivery boundary as specs.

## Decision

- Ask for the PR destination and delivery extent in one grouped confirmation. Default to the branch
  recorded as the worktree's start point; show other configured branches only when present on the
  remote. A typed destination must also exist remotely. Hotfix defaults to `hotfix.from` and reports
  `hotfix.merge_to` after merge. Protected branches are PR targets, never direct push destinations.
- The grouped extent is all, push-and-PR-only, or nothing. “All” can merge only after a successful,
  observable PR CI result, and uses a merge commit. A missing GitHub CLI or non-GitHub provider takes a
  manual path: push, print a URL or provider-neutral steps, report CI as not verifiable, and leave merge
  with the user.
- Before merge, record the chosen target and PR URL in the spec's `close-summary.md` and `docs/CHANGELOG.md`
  on the same PR. Generate the PR body from the close Outcome and For developers sections, with a spec
  link. For a manually opened PR, allow its actual URL to be recorded before merge.
- Run configured pre-push lint, typecheck, build and impacted tests by default under the resource guard.
  `delivery.pre_push: full` is explicit opt-in; `none` skips the local pre-push suite.
- After merge, promotion is a separate confirmed PR. Never force-remove dirty worktrees. Check ancestry
  before branch deletion and operate on the principal checkout only after leaving the worktree.
- `release-status` reports released only when Git proves task commits are ancestors of the selected
  remote target; it includes a recorded PR and the merge commit when available. `implement` auto-chains
  to verify only when the script returns `autoContinue: true` for all-done, committed tasks.

## Consequences

Delivery can stop safely at a manual-provider boundary without pretending CI ran. The PR itself carries
the destination/URL record before merge. Release status remains reproducible from that record and Git
history. Cleanup can be delayed when local files need review; promotion remains intentionally separate
from the initial delivery authorization.
