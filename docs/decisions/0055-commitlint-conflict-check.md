# 0055 — Commitlint conflict check

**Status:** Accepted (Phase 12)

## Context

Mandao has its own commit standard: Conventional Commits with an emoji prefix per type and trailers. A project
may already own a commitlint config, often `@commitlint/config-conventional`, whose `header`, `subject-case`
and type parser reject an emoji prefix, so every Mandao commit would fail the project's hook. Mandao must not
guess conventions from history, and it must not touch config it does not own.

## Decision

- **`commits.emoji: false`** (in addition to the per-type map, still the default) means plain Conventional
  Commits: no emoji in generated subjects. It is honoured by the commit-message builder (`run commit-msg`,
  `run commit`, approval and ledger docs commits), by the delivery record commit of `mandao deliver` (which also carries the spec's `Refs` trailer, as the generated commitlint requires on spec branches), by the generated `.mandao/commitlint.config.mjs` (plain
  `headerPattern`, no `mandao-emoji` rule; the `Refs` trailer and length rules stay, the length counting the
  whole header) and by the guide's Commits section. The emoji-uniqueness check applies to the map only.
- **`mandao doctor` conflict check**, static: it reads the file as text and never executes it. Detected:
  `commitlint.config.{js,cjs,mjs,ts,cts}`, `.commitlintrc*`, `.config/commitlintrc*` and a `commitlint` key in `package.json`, at the workspace root and, in a polyrepo, at each project's repository root. Ignored:
  Mandao's own `.mandao/commitlint.config.mjs`, and a project config that extends it.
  - extends `@commitlint/config-conventional` or `@commitlint/config-angular` (commitlint resolves shorthands such as `conventional` to different, third-party package names, so they are not matched) and `commits.emoji` is not `false`: **warn**, suggest
    `commits.emoji: false` (or extending Mandao's config);
  - custom `rules` or `parserPreset` and no extension of Mandao's config: **info**, suggest
    `extends: ['./.mandao/commitlint.config.mjs']`, because Mandao cannot evaluate them.
- Mandao never edits the user's commitlint config.
- **Hooks:** `init` and `sync` never create or modify files under the git hooks folder of a user project.
  `scripts/install-hooks.mjs` runs from `prepare` in Mandao's own repository and is not in package.json `files`,
  so it is never published. A test pins both.

## Consequences

A project with `config-conventional` learns before its first rejected commit and has a one-line fix. Static
detection can miss a config built dynamically, and it matches text, so an unusual config may be reported as
info only; it never blocks. Opting out of the emoji is a project-wide choice made in `.mandao/config.yml`.
