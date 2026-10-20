---
schema_version: 1
rule: commits
---

# Commits

## Cadence

- One commit per task, only after the Reviewer's PASS. Rework attempts are never committed.
- Each commit leaves lint and the area's tests green.
- `tasks.md` is updated in the same commit; `execution.md` records the hash.

## Format

```
✨ feat(api): add remember-me token endpoint

Issue long-lived refresh tokens when the user opts in, capped by
the configurable session policy defined in the contract.

Refs: PROJ-123
Mandao-Task: T2
Mandao-AC: AC-1, AC-3
```

- Header: `<emoji> <type>(<scope>): <subject>`. Emoji first, unicode, imperative mood, at most the
  configured length (72 by default) without the emoji.
- Scope: the project in a monorepo or polyrepo, the module in a single repo.
- Emoji map: fixed per type in `.mandao/config.yml` (`commits.emoji`); never choose freely. A breaking
  change uses the `breaking` emoji instead of the type's.
- Breaking: `!` after the scope plus a `BREAKING CHANGE:` trailer (mandatory when a contract changes).
- Trailers: `Refs`, `Mandao-Task`, `Mandao-AC`; quick changes use `Mandao-Quick: <name>`.
- Closing keywords (`Fixes <ID>`) only on the final commit or the PR.

`.mandao/commitlint.config.mjs` enforces the header, the emoji ↔ type map and the `Refs` trailer on
spec branches.
