# Contributing to Mandao

Contributions use forks and pull requests targeting `main`. Open an issue before starting a large
change (new behavior, architecture, dependencies or a public contract) and agree on scope with the
maintainer. Small, focused fixes can go straight to a PR. Read our [Code of Conduct](CODE_OF_CONDUCT.md).

## Local setup

Use Node.js >= 22.18 (CI covers Node 22 and 24), npm and Git.

1. Fork `JuanGuzman-io/mandao` on GitHub.
2. Clone your fork and create a branch:

   ```sh
   git clone https://github.com/YOUR-USERNAME/mandao.git
   cd mandao
   git remote add upstream https://github.com/JuanGuzman-io/mandao.git
   git switch -c docs/contribution-guide
   npm ci
   ```

3. Make your change, then run:

   ```sh
   npm run lint
   npm run typecheck
   npx --no-install vitest related --run --maxWorkers=2 path/to/changed-file.ts
   npm run build
   npm run diagrams:check
   ```

Pass all changed source files to `vitest related`; explicitly select tests that read changed documents
or fixtures by path. Run lint, typecheck and the impacted tests after each change, and build before
pushing. Keep test workers limited to available resources (at most two for this program). The full
suite and smoke test run in PR CI. `npm run check` includes the full suite: do not use it locally.
For documentation-only changes, report when there are no related tests.

Use `npm run build` and `node dist/cli.js …` to exercise this checkout, never a global `mandao`.
Temporary git repositories in tests must set local `user.name` and `user.email`. Test scripts and
fixtures must use `process.exitCode` rather than `process.exit()` when output may still be pending.

`npm run dev` rebuilds on changes. `npm run format` applies Biome corrections; review the diff before
committing. Add meaningful tests for behavior changes and regressions. Follow the architecture and
standards in `docs/constitution/`. Add a changeset (`npx changeset`) for changes requiring a release.

## Commit messages and hooks

Use English, imperative subjects, with at most 72 characters excluding the emoji:

```text
✨ feat(cli): add workspace option

Refs: MDO-123
Mandao-Task: T1
Mandao-AC: AC-1, AC-2
```

| Type | Emoji | Type | Emoji |
|---|---|---|---|
| feat | ✨ | fix | 🐛 |
| docs | 📝 | style | 🎨 |
| refactor | ♻️ | test | ✅ |
| chore | 🔧 | perf | ⚡️ |
| build | 📦️ | ci | 👷 |
| revert | ⏪️ | breaking change | 💥 |

Use a module as the scope. Breaking changes use `💥`, `!` after the scope, and a
`BREAKING CHANGE:` footer. Keep trailers in a final block separated by a blank line:

- `Refs: <issue or spec id>` links the work; required for spec branches with an active id.
- `Mandao-Task: <Tn>` and `Mandao-AC: <AC ids>` identify spec work, when applicable.
- `Mandao-Quick: <name>` identifies quick changes, when applicable.
- `Co-Authored-By: Name <email>` credits coauthors, including agents when applicable.

`npm ci` installs `pre-commit` (staged Biome checks and TypeScript) and `commit-msg` (commitlint).
Existing non-Mandao hooks are preserved: follow the installer's warning to chain the corresponding
`scripts/hooks/` script. If you use `core.hooksPath`, chain these scripts in that hook manager.
Reinstall with `npm run prepare`. Check a message manually with
`npx --no-install commitlint --edit PATH-TO-MESSAGE`; CI checks the complete PR commit range. Worktrees
share the hooks; in one made from a commit before commitlint was added, the hook warns and skips.

## Pull requests

Push your branch to your fork and open a PR against `main`. Describe the change, link its issue or
spec, and include commands and results showing how you tested it. Complete the PR checklist and
address review feedback. Fork CI needs no repository secrets; GitHub may require maintainer approval
before running workflows for new contributors.

**Squash merges are not accepted:** they collapse individual commit messages and lose their Mandao
trailers. Use **Create a merge commit** or **Rebase and merge** and preserve each commit message and
trailer. See the [maintainer checklist](docs/maintainer-checklist.md) for repository settings.

## Releasing

Mandao is published to npm with **trusted publishing** (OIDC from GitHub Actions): no npm token is
stored anywhere. Provenance is attached to every release.

### First publication (once, by a maintainer)

This historical bootstrap procedure is outside the improvement program. Do not run a manual
`npm publish` during these phases: the current `prepublishOnly` lifecycle runs the full suite locally.
Use PR CI and the trusted-publisher workflow for releases; Phase 6 will reconcile delivery lifecycles
with the configured pre-push policy.

The trusted publisher can only be configured on a package that exists, so the first version is
published by hand:

1. `npm login` with an account that has two-factor authentication.
2. Use a commit whose complete PR CI passed; run `npm ci`, lint, typecheck, build and impacted tests locally.
3. `npm publish --tag next` (2FA prompt). `--tag next` keeps it off `latest` until it is validated.

### Configure GitHub Actions as trusted publisher (once)

On npmjs.com → package `mandao` → **Settings** → **Trusted publishing** → **GitHub Actions**:

| Field | Value |
|---|---|
| Organization or user | `JuanGuzman-io` |
| Repository | `mandao` |
| Workflow filename | `release.yml` (the file name only) |
| Environment | leave empty |

A new configuration must complete a successful publish within 2 days, or it expires. Then, in the same
settings, require two-factor authentication and disallow tokens for publishing.

### Every release

1. Add changesets with `npx changeset` as changes land.
2. Run the **Release** workflow (Actions → Release → Run workflow) on `main`. It checks, builds, runs
   the smoke test, then either opens the "version packages" PR or, once that PR is merged, publishes
   with OIDC. A manual run on a tag publishes that tag's package version directly; other refs are skipped.
3. Promote a validated `next` release with `npm dist-tag add mandao@<version> latest`.

Requirements the workflow already meets: `id-token: write`, Node 22.14 or later, npm 11.5.1 or later.
