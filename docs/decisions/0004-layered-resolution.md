# 0004 — Layered resolution with frontmatter patches

**Status:** Accepted

## Context
Teams need to adapt commands without forking them, and `update` must never destroy their changes.

## Decision
- Precedence is `.mandao/overrides/ > presets (declared order, later wins) > core`, resolved per file.
- A layer may replace a document entirely (`commands/<id>.md`) or patch only its frontmatter
  (`commands/<id>.patch.yml`). Patches merge objects recursively, replace arrays, and delete keys set
  to `null`.
- A patch applies only on top of the layer that provides the full document. A patch below a full
  replacement is ignored.
- Templates resolve per key (`shared/x.md`, `ai/x.md`); profile-specific keys win over `shared/` at
  render time.
- Content errors (schema, id/file mismatch, orphan patches, broken `flow` or `must_differ_from`
  references) are collected and reported together.
- `update` re-resolves and never writes to `.mandao/overrides/`.

## Consequences
- Patches survive upstream body changes, so overrides do not rot on each `update`.
- Full replacements do rot; `doctor` will be able to flag overrides whose core counterpart changed.
