# 0014 — Pin the Claude 5.5 family by model ID

**Status:** Accepted · 2026-10-20 · refines ADR 0011 and ADR 0012 (decision 5)

## Context
The Claude Code recommendations used the aliases `opus`, `sonnet` and `haiku`. Aliases move to the
newest model of each family on every Claude Code release, so the model a role uses could change
without anyone choosing it, and two teammates on different Claude Code versions could run different
models.

## Decision
- Claude Code recommendations use full model IDs of the 5.5 family, verified on 2026-10-20 in the
  Claude Code model-config docs and the Claude models overview: `claude-opus-5-5`, `claude-sonnet-5-5`,
  `claude-haiku-5-5` (Fable: `claude-fable-5-1`, optional).
  - leader, reviewer, implementer.strong: `claude-opus-5-5`
  - reviewer_alt, implementer.standard, tester: `claude-sonnet-5-5`
  - implementer.fast: `claude-haiku-5-5`
  - simple mode: implementer `claude-sonnet-5-5`, reviewer `claude-opus-5-5`
- The aliases stay available as `optional`, noted as "not pinned".
- Claude Code maps these Anthropic IDs to Bedrock and Google Cloud IDs itself; pinned IDs work on every
  provider that offers the 5.5 family.
- Recommendations may declare `harness_version` (`min` and the `command` that prints it). The 5.5
  family needs Claude Code 2.1.293 or later (Haiku 5.5); `doctor` warns when the installed harness is
  older.
- Copilot already names explicit models (`Claude Sonnet 5.5`, `Claude Haiku 5.5`); Claude Opus 5.5
  stays optional there because Copilot Pro does not include it.
- `update` records a hash of each harness's recommendation in the lock instead of its review date, so
  a revision made on the same day is still offered once.

## Consequences
- Moving to a newer family is an explicit Mandao release (a new recommendation and `reviewed` date),
  offered by `update` and accepted with `mandao models set`.
- Teams on old Claude Code releases see a `doctor` warning instead of failed requests.
