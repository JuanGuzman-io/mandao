# 0023 — Branching strategy that adapts to the team

**Status:** Accepted · 2026-10-20 · **design only**: implemented in iteration 2b

Context: §11.4 and §14.5 fixed branches to `feat|fix/<ID>-<slug>` off the default branch. Teams work with
trunk-based development, feature branches, gitflow or one branch per environment; Mandao has to follow
the team's model, not impose one.

## Decision

`config.yml` gets a `branching` block. `model` picks one of four presets; every other field has the
preset's default and can be overridden. In a polyrepo each project may override it; otherwise it
inherits the workspace's.

| Field | Meaning |
|---|---|
| `model` | `trunk` · `feature-branch` · `gitflow` · `env-branches` |
| `base` | where spec branches start and where their PR targets |
| `promotion` | ordered environments a change moves through (recorded, never automated) |
| `production` | the branch that is production |
| `prefixes` | `feature`, `fix`, `hotfix`, `release`: branch name prefixes |
| `hotfix` | `from` (branch) and `merge_to` (branches, in order) |
| `protected` | branches Mandao never commits or pushes to |
| `max_branch_age_days` | trunk only: warn when a spec branch is older |

Preset defaults:

| Preset | base / PR | promotion | hotfix from → merge to | protected | prefixes (feature, fix, hotfix, release) |
|---|---|---|---|---|---|
| `trunk` | `main` | — | `main` → `main` | `main` | `feat/`, `fix/`, `fix/`, — |
| `feature-branch` | `main` | — | `main` → `main` | `main` | `feat/`, `fix/`, `hotfix/`, `release/` |
| `gitflow` | `develop` | `develop → main` (via team-made `release/`) | `main` → `main`, `develop` | `main`, `develop` | `feature/`, `bugfix/`, `hotfix/`, `release/` |
| `env-branches` | `test` | `test → staging → main` | `main` → `main`, `staging`, `test` (back-merge) | `main`, `staging`, `test` | `feat/`, `fix/`, `hotfix/`, — |

- **trunk:** short-lived branches. `doctor` and `resume` warn when a spec branch is older than
  `max_branch_age_days` (default 2) and suggest splitting the spec, stacked PRs or a feature flag.
- **gitflow:** `release/` branches are created by the team; Mandao never creates them, but `close` can
  associate the spec with a release.
- **Names** always carry the ID: `<prefix><ID>-<slug>` (the prefix by spec type: story → `feature`,
  bug → `fix`, hotfix lane → `hotfix`). This replaces the fixed `feat/`/`fix/`.

Example:

```yaml
branching:
  model: gitflow
  # every field below is the preset default and may be omitted
  base: develop
  production: main
  promotion: [develop, main]
  prefixes: { feature: feature/, fix: bugfix/, hotfix: hotfix/, release: release/ }
  hotfix: { from: main, merge_to: [main, develop] }
  protected: [main, develop]
```

**Detection in `constitution`:** a `develop` or `release/*` branch suggests gitflow; `test` or `staging`
suggests env-branches; only `main` asks between trunk and feature-branch. Always confirmed with the
user, and documented in `infrastructure.md`.

**Unchanged:** `specify`/`quick` create the branch and the worktree from `base`; the PR targets `base`;
never a commit or push to a `protected` branch; `verified` is confirmed by the CI of `base`; promotion
between environments is not automated — Mandao only records the environment reached when CI or a
tracker MCP reports it.

## Consequences

- Schema: `branching` in `config.yml` (and per project in polyrepo) with preset resolution and tests.
- `spec-new` proposes names from `prefixes` and the base from `base`; `where` and `doctor` check base,
  protected branches and, for trunk, branch age.
- `constitution` gains the detection step; the `infrastructure.md` template gains a branching section.
- `close` can link the spec to a release (gitflow) and records the environment reached.

## Implementation (iteration 2b, 2026-10-20)

- `branching` in `config.yml` (and per project) with presets resolved by `resolveBranching`; `spec.branch`
  now defaults to `{prefix}{id}-{slug}` (`{type}` still works).
- `spec-new` names the branch from the prefixes (`--hotfix` for the hotfix lane), proposes
  `git worktree add -b <branch> <path> <base>` and reports a missing base; `where` reports a protected
  branch; `mandao run commit` refuses to commit on one.
- `mandao run branching` shows the model in force and what the branches suggest; `constitution` confirms
  it with the user and documents it in `infrastructure.md` (`## Branching`).
- `doctor` warns when the base does not exist and, in trunk, about spec branches older than
  `max_branch_age_days`.
- Pending until `close` exists: associating a spec with a team-made `release/` branch and recording the
  environment reached.
