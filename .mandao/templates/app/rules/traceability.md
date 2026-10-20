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
| `Tn` | `tasks.md` (`### [ ] Tn — title`) | reused after a task is dropped |

## The chain

```
AC-n → FR-n → scenario → Tn → test → commit
```

Every link is explicit:

- Each `FR` lists the `AC` it serves. Each `AC` appears in the **AC → FR matrix**.
- Each scenario names its clauses. Clauses that start with `BUT it must NOT` or `AND IT MUST` are
  covered one by one.
- Each task lists the `AC` and scenarios it implements and the tests that prove them.
- Each commit carries `Mandao-Task: Tn` and `Mandao-AC: AC-…` trailers.
- Edge clauses carry an explicit id: `- **BUT it must NOT** … (C1)`. A requirement covers a clause only
  when its `Serves:` line cites it exactly (`AC-1/C1`); a task covers a scenario clause only when its
  `scenarios` list cites it (`S-1.1/C1`). `mandao run trace` checks all of this.

## Coverage rules

- Coverage closes per **scenario and clause**, not per requirement ID.
- A gap is never discharged by citing a different requirement. A clearance quotes the exact clause
  it covers.
- An `AC` flagged `critical: true` needs an e2e (or, in `ai` projects, an eval) at verify time.
