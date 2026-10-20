# 0006 — Helper scripts run through `mandao run`

**Status:** Accepted

## Context
Commands need deterministic helpers (diff limits for quick, stack fingerprint for skill resolution).
Spec Kit ships duplicated bash and PowerShell scripts.

## Decision
- Helpers are Node code in `src/scripts/`, exposed as `mandao run <script>` and printing JSON.
- Commands reference them with `{{script:<name>}}`. The adapter renders `npx -y mandao@<version> run <name>`,
  pinned to the installed version, or `npx --no-install mandao run <name>` when
  `scripts.runner: local` (Mandao as a devDependency, no network).
- MVP scripts: `quick-check` (working-tree diff vs the quick limits, risk tags, new dependencies,
  migrations, contracts; polyrepo-aware) and `fingerprint` (stack per project, facets, catalog proposal).

## Consequences
- One implementation for every OS. The pure parts (`analyzeDiff`, `proposeSkills`) are unit tested.
- With the `npx` runner, the first run needs network access.
