# 0024 — Memory floors per operation, recorded forced runs, verified model suggestions

**Status:** Accepted · 2026-10-20

## 1. Memory floors per operation

`resources.operations.{build,tests,e2e}.min_free_memory_mb` gives each operation its own floor
(defaults 1024, 2048 and 3072 MB): a build does not need what an e2e suite needs. A project overrides
one operation without repeating the others; the old `min_free_memory_mb` stays as the tests floor when
`operations.tests` is not set. Under the floor a run gets one worker; under half of it, it is deferred.
`mandao run resources --kind build` lets an agent check before building; `implement` does so and never
forces on its own.

## 2. Forced runs are recorded

A deferred run goes ahead only when forced — `--force`, `MANDAO_FORCE=1`, or `RG_FORCE=1` — and every
forced run is recorded: always as a JSON line in `.mandao/cli.log` (git-ignored, machine-specific), and,
when one spec has a task in progress, in its `execution.md` under `## Forced runs`, outside the verdict
table so it never counts as a verdict.

Note: the guard that blocked builds during iteration 2b is **not** Mandao's. It is a Claude Code hook in
the user's own settings (`~/.claude/resource-guard/guard.py`, build floor 4500 MB). Mandao honours
`RG_FORCE=1` as a force signal and records it, but does not change that hook; its thresholds are the
user's to tune.

## 3. Models are suggested only when verified

Optional models in `recommendations.yml` may carry `source` (an official page) and `reviewed` (the date
it was checked). `doctor` suggests an optional model — e.g. Codex's `gpt-6-astra` as the reviewer for
strong tasks implemented on Opus — only when both are present, and quotes them. `gpt-6-astra` was
verified on 2026-10-20 at https://learn.chatgpt.com/docs/models.md (model card: Codex CLI, IDE
extension, API access; "Some paid plans omit Astra Extra High") and
https://developers.openai.com/api/docs/models (model ID `gpt-6-astra`).
