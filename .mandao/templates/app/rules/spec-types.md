---
schema_version: 1
rule: spec-types
---

# Flows by spec type

Loaded by `specify` only when the story's `type` is not `story`.

- `bug` → reproduction, expected vs actual, root cause with evidence, a mandatory regression test; lite by
  default.
- `enhancement` → requirements written as ADDED / MODIFIED / REMOVED against the current behavior.
- `task` → offer the quick gate first (`/mandao-quick`).
- `epic` → do not specify; propose the stories it breaks into.
- `performance` → measure before and after under the protocol of `/mandao-perf` (planned).
