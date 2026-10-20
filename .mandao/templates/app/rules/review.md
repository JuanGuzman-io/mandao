---
schema_version: 1
rule: review
---

# Review model

Skills teach, the constitution decides, the Reviewer enforces. The Reviewer builds its checklist from
`standards.md`, `security.md`, the spec, the contract and the active skills. It never invents rules.

## Levels

| Level | What | When |
|---|---|---|
| 0 · Gates | `format`, `lint`, `typecheck`, area `test`, `secrets` scan, `audit` of new dependencies, light `sast`, clean-code `metrics` | Always, including quick |
| 1 · Core | Spec conformance, contract, test policy, `AGENTS.md` of touched modules, `standards.md`, semantic clean code | Every task |
| 2 · Lenses | security, performance, data/migrations, accessibility, AI | Only when the task carries the matching risk tag |
| 3 · Adversarial | Panel review of the whole design | `full` depth or high-risk designs only |

Gate commands come from `projects[].gates` in `.mandao/config.yml`. A missing gate is reported, not
invented.

## Risk tags → lenses

| Tags | Lens |
|---|---|
| `auth`, `input`, `pii`, `payments`, `public-api`, `infra` | security |
| `perf` | performance |
| `migration`, `pii` | data |
| `ui` | accessibility |
| `ai-prompt` | AI: prompt injection, PII sent to models, cost |

`auth`, `payments`, `pii` and `migration` never go through quick.

## Independence

The Reviewer always works in a context separate from the author's, and on a different model when one
is available (`reviewer`, or `reviewer_alt` when the Implementer ran on the Reviewer's model). When no
different model is available, the review still happens in a clean context and `execution.md` (or
`quick-log.md`) records `reduced independence`. It never blocks.

## Quick changes

Quick gets a **lite** review: the core Reviewer (level 1) on the diff, without lenses, in a separate
context. Tasks with risk tags cannot be quick, so no lens applies.

## Inputs

The Reviewer receives only the diff, the task brief and the rules of the active lenses. It does not
receive the Implementer's reasoning.

## Verdict

`PASS` or `FAIL`. Each finding states: what was found (with location), the violated rule (quoted with
its source file), and the remediation.

- **Blocking**: violates the spec, the constitution, the contract, a mandatory test, or a high-severity
  security rule. Rework.
- **Advisory**: improvements and preferences. Recorded in `execution.md`, feeds Kaizen, never reopens
  the loop.

The Reviewer fails a task when module behavior, contracts or conventions changed and the module's
`AGENTS.md` was not updated.
