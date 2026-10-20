---
schema_version: 1
rule: traceability
---

# Traceability

## Stable IDs

| ID | Lives in | Never |
|---|---|---|
| `AC-n` | `story.md` | renumbered; a removed AC keeps its number with status `removed` |
| `FR-n`, `NFR-n` | `requirements.md` | reused for a different requirement |
| `S-n.m` | scenario *m* of `FR-n` in `requirements.md` | split across files |
| `T-n` | `tasks.md` | reused after a task is dropped |

## The chain

```
AC-n → FR-n → scenario → T-n → test → commit
```

Every link is explicit:

- Each `FR` lists the `AC` it serves. Each `AC` appears in the **AC → FR matrix**.
- Each scenario names its clauses. Clauses that start with `BUT it must NOT` or `AND IT MUST` are
  covered one by one.
- Each task lists the `AC` and scenarios it implements and the tests that prove them.
- Each commit carries `Mandao-Task: T-n` and `Mandao-AC: AC-…` trailers.

## Coverage rules

- Coverage closes per **scenario and clause**, not per requirement ID.
- A gap is never discharged by citing a different requirement. A clearance quotes the exact clause
  it covers.
- An `AC` flagged `critical: true` needs an e2e (or, in `ai` projects, an eval) at verify time.
