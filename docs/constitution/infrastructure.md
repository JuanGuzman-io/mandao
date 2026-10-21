---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
---

# Infrastructure

## Branching

Configured model: `feature-branch`, base/PR target `main` (`.mandao/config.yml`, ADR 0023).
Feature, fix and hotfix work uses isolated worktrees. Mandao task commits refuse protected branches;
PRs preserve task trailers with merge commits or rebase, never squash. Hotfixes start from main and
merge back to main under this preset. Promotion is recorded, not automated.

The maintainer reconfirmed this model in the active constitution review. GitHub-side PR approval,
bypass and protection settings are not inferred from the config.

## Environments

Local CLI and GitHub Actions runners. Package distribution is configured for public npm publishing;
a configured workflow does not prove a beta package has been published. See `CONTRIBUTING.md`.

## CI/CD

- CI: Node 22 and 24 run lint, typecheck, tests, build and package-install smoke; separate jobs run
  Gitleaks, Semgrep and PR commitlint (`.github/workflows/ci.yml`).
- Required-check names: `check (22)`, `check (24)`, `commitlint`, `secrets`, `sast`. The check job also runs
  `npm run diagrams:check` explicitly. This step closes the gap found in this review: CI previously
  invoked the component commands separately and omitted diagram freshness. The maintainer approved the accompanying ci.yml change.
- Release: manual dispatch only on main or tags; npm trusted publishing uses OIDC. Main uses
  Changesets; tags publish their checked-out version (`.github/workflows/release.yml`).
- Local pre-commit runs staged Biome, typecheck and conditional diagram freshness; commit-msg runs
  commitlint when installed, otherwise warns (`scripts/hooks/`). No hook is a substitute for CI.

## Cloud and services

GitHub hosts source, PRs and Actions; npm is the distribution registry. Tracker publication is
optional and performed by the agent's MCP connector after a payload preview and human approval.
No tracker is configured in `.mandao/sources.yml`.

## Observability

CLI JSON outputs, `_log/` evidence, review and gate reports, cost records and integrity discrepancies.
See `src/scripts/spec-log.ts`, `src/writer/log-integrity.ts` and `src/cli/run-cost.ts`.

## Repository settings

Follow `docs/maintainer-checklist.md` for branch protection, review/bypass, merge methods, secret
scanning and Dependabot. Repository files alone do not establish that hosted settings are active.
