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

Publication readiness is item 4 of [Phase 11 in the backlog](docs/backlog.md#phase-11--beta-preparation).
The maintainer publishes the first version, `0.1.0-beta.0`, by hand, because the trusted publisher can
only be configured on a package that exists. `prepublishOnly` runs `npm run check` (typecheck, lint, the
full test suite and `diagrams:check`) and then the build, so a publish runs the full suite locally; that
is expected for a publish. During ordinary phase work, never run `npm run check` or a manual publish
locally: the full suite runs in PR CI.

1. `npm login` with an account that has two-factor authentication.
2. Use a commit whose complete PR CI passed; run `npm ci`, lint, typecheck, build and impacted tests locally.
3. `node scripts/publish-tag.mjs --provenance=false` (2FA prompt). Extra arguments go to `npm publish`; this
   first, hand-run publish needs `--provenance=false` because `publishConfig.provenance` only works in
   CI (npm fails with EUSAGE outside a supported provider). Provenance comes with the workflow publishes
   after that. The script applies the dist-tag rule below by hand: no stable
   version exists yet, so it publishes with `--tag beta` and then sets `latest` to the same version.
4. `npm dist-tag ls mandao` to confirm both `beta` and `latest` point at `0.1.0-beta.0`.
5. Push the local tag the script created: `git push origin v0.1.0-beta.0`.

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
   Changesets only versions; the publish step is `scripts/publish-tag.mjs` (`npm run release`, which also runs `changeset git-tag`),
   which always passes an explicit dist-tag (see below).
3. For the stable release, run `npx changeset pre exit` and merge the resulting version PR.
4. After every publish, verify the tags with `npm dist-tag ls mandao`.

### Dist-tag rule

`scripts/publish-tag.mjs` decides from the version being published and the versions already on the
registry (`npm view mandao versions --json`; a 404 means none):

| Case | Publish | `latest` |
|---|---|---|
| Prerelease, no stable version published yet | `--tag beta` | also set to this version (`npm dist-tag add`), so `latest` is the newest beta during the beta period |
| Prerelease, a stable version exists | `--tag beta` | untouched |
| Stable | `--tag latest` | set by the publish |

A version already on the registry is not published again. The script publishes, runs `changeset git-tag`
(local tags), prints `New tag: mandao@<v>`, then sets the extra tag. If `npm dist-tag add` is refused
(trusted publishing may authorize only publish), the script exits 1: the workflow run fails before the
action pushes the tags or creates the GitHub release. Run the `npm dist-tag add mandao@<v> latest` command
the script printed by hand, then rerun the workflow: it finds the version published and `latest` set, and
the action then pushes the tag and creates the release. During the beta this manual step may be needed.
Rerunning after a fully successful run may fail on the release that already exists.

Requirements the workflow already meets: `id-token: write`, Node 22.14 or later, npm 11.5.1 or later.
