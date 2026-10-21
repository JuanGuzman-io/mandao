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
| 0 · Gates | `format`, `lint`, `typecheck`, impacted `test` (see test-policy.md), `secrets` scan, `audit` of new dependencies, light `sast`, clean-code `metrics` | Always, including quick |
| 1 · Core | Spec conformance, contract, test policy, `AGENTS.md` of touched modules, `standards.md`, semantic clean code | Every task |
| 2 · Lenses | security, performance, data/migrations, accessibility, AI | Only when the task carries the matching risk tag |
| 3 · Adversarial | Panel review of the whole design | `full` depth or high-risk designs only |

Gate commands come from `projects[].gates` in `.mandao/config.yml`. A missing gate is reported, not
invented.

Test policy at level 1 includes the evidence: a `RED` row for a task with mandatory tests, or `MUTANT`
rows for an `evidence: mutation` task. For the latter, check the classification against the diff: any
change to production behavior means it is not characterization → FAIL. Each recorded mutation
(`mutations/<Tn>-<n>.md`) must change what an assertion protects.

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
is available, in this order (ADR 0021):

1. `reviewer`, or `reviewer_alt` when the Implementer ran on the Reviewer's model;
2. when that would be the Implementer's own model (e.g. strong tasks in Claude Code): the reviewer of
   **another installed and logged-in harness**, run by Mandao as a read-only process
   (`mandao run review --via <harness>`) with the Leader's gate results;
3. otherwise the review runs in a clean context on the same model and records `reduced independence`.

The Reviewer **never runs on a lower tier or effort than the Implementer** (ADR 0020): a weaker model on
another vendor is not an acceptable substitute. Independence never blocks.

Who reviewed is recorded by the scripts from the agent or process actually invoked, never from what a
model says about itself (agent files and `models.yml`); a claim that names a different model is recorded
as `identity mismatch`. A FAIL is checkpointed with its first blocking finding (`--reason`).

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
  security rule. Rework. Every finding is tagged `[<lens>/<severity>]`; `[security/high]` and
  `[security/critical]` are always blocking, and `mandao run checkpoint` refuses a PASS that carries one.
- **Advisory**: improvements and preferences. Recorded in `execution.md`, feeds Kaizen, never reopens
  the loop.

The Reviewer fails a task when module behavior, contracts or conventions changed and the module's
`AGENTS.md` was not updated, or when a new module `AGENTS.md` lacks its `CLAUDE.md` pointer in a
workspace that uses Claude Code.
