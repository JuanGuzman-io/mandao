# Contributing to Mandao

## Development

```sh
npm ci            # also installs the pre-commit hook (lint + typecheck)
npm run check     # typecheck, lint, tests
npm run build
npm run smoke     # pack, install the tarball in a fresh repo, run init and doctor
```

Commits follow `<emoji> <type>(<scope>): <subject>` (see `AGENTS.md`). Every change ships with tests.

## Releasing

Mandao is published to npm with **trusted publishing** (OIDC from GitHub Actions): no npm token is
stored anywhere. Provenance is attached to every release.

### First publication (once, by a maintainer)

The trusted publisher can only be configured on a package that exists, so the first version is
published by hand:

1. `npm login` with an account that has two-factor authentication.
2. `npm ci && npm run check && npm run build && npm run smoke`
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
2. Run the **Release** workflow (Actions → Release → Run workflow). It checks, builds, runs the smoke
   test, then either opens the "version packages" PR or, once that PR is merged, publishes with OIDC.
3. Promote a validated `next` release with `npm dist-tag add mandao@<version> latest`.

Requirements the workflow already meets: `id-token: write`, Node 22.14 or later, npm 11.5.1 or later.
