---
schema_version: 1
rule: commits
---

# Commits

## Cadence

- One commit per task, only after the Reviewer's PASS. Rework attempts are never committed.
- Each commit leaves lint and the impacted tests green.
- `tasks.md` is updated in the same commit; the `Mandao-Task` trailer links the task to its commit.

## Format

```
✨ feat(api): add remember-me token endpoint

Issue long-lived refresh tokens when the user opts in, capped by
the configurable session policy defined in the contract.

Refs: MDO-0012
Tracker: CU-86e3w5954
Mandao-Task: T2
Mandao-AC: AC-1, AC-3
```

- Header: `<emoji> <type>(<scope>): <subject>`. Emoji first, unicode, imperative mood, at most the
  configured length (72 by default) without the emoji.
- With `commits.emoji: false` in `.mandao/config.yml` the header is plain Conventional Commits,
  `<type>(<scope>): <subject>`: no emoji, no emoji map, and the length limit counts the whole header.
- Type: a task's commit takes the task's `kind` from `tasks.md`, checked against the real diff (a
  commit that only changes tests is `test`, only documentation is `docs`).
- Scope: the project in a monorepo or polyrepo, the module in a single repo.
- Emoji map: fixed per type in `.mandao/config.yml` (`commits.emoji`); never choose freely. A breaking
  change uses the `breaking` emoji instead of the type's.
- Breaking: `!` after the scope plus a `BREAKING CHANGE:` trailer (mandatory when a contract changes).
- Trailers: `Refs` (the spec id), `Tracker` (the tracker item reference, when the story has a `tracker_id`;
  the scripts add it), `Mandao-Task`, `Mandao-AC`; quick changes use `Mandao-Quick: <name>`.
- Closing keywords (`Fixes <ID>`) only on the final commit or the PR.

`.mandao/commitlint.config.mjs` enforces the header, the emoji ↔ type map (unless `commits.emoji` is
false) and the `Refs` trailer on spec branches. A project's own commitlint config that extends
`@commitlint/config-conventional` rejects the emoji prefix: `mandao doctor` warns and suggests
`commits.emoji: false`.
