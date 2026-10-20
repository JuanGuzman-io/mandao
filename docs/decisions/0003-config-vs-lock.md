# 0003 — Config is intent, lock is resolution

**Status:** Accepted

## Context
The brief says `sync` regenerates harness files "from the lock". A lock alone cannot regenerate
content: it records what was produced, not what the user wants.

## Decision
- `.mandao/config.yml` is the user's intent: workspace, projects, harnesses, presets, paths, models.
- `.mandao/mandao.lock` is written only by the CLI: Mandao version, config hash, resolved layers,
  installed skills and every generated file with its ownership and content hash.
- `sync` re-resolves from config, then uses the lock to detect drift (a generated file edited by
  hand) and orphans (files that a previous sync generated and the current one does not).
- A drifted file is never overwritten without `--force`. The CLI tells the user to move the change
  into `.mandao/overrides/`.

## Consequences
- `sync` is idempotent: running it twice produces no changes.
- Hand edits to generated files are detected instead of silently lost.
