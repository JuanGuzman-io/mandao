---
schema_version: 1
rule: quick-gate
---

# Quick gate

Quick is for changes that need no spec. It is double-checked.

## Pre-check (before touching code, with the graph or the fallback)

All must hold:

- one project and one module;
- at most 3 files and about 100 changed lines, estimated;
- no new dependencies;
- no migrations or schema changes;
- no changes to API contracts, events or public interfaces;
- no shared library touched (it affects every consumer);
- none of the tags `auth`, `payments`, `pii`, `migration`;
- no new or modified business rule, and no constitution impact;
- `ai` projects: no prompt, model or retrieval change.

## Post-check (on the real diff)

Run the quick-check script. If `withinLimits` is false, stop: do not commit as quick, keep the work
as a draft, and escalate to `story` or `specify` with what you learned and the script's `reasons`.

## Never skipped

Level 0 gates, the impacted tests, a lite review (core checklist only), a `quick-log.md` entry, and a
commit with the `Mandao-Quick: <name>` trailer.
