---
schema_version: 1
id: story
title: Story
description: "Create or enrich a user story with enough business context: sufficiency rubric, sources, AC-n with critical flags."
status: stub
flow: { after: [constitution], next: [specify] }
arguments:
  - name: ref
    description: "Tracker id or URL, or a one-line idea"
inputs:
  - { path: ".mandao/sources.yml" }
  - { path: "{{paths.constitution}}/" }
outputs:
  - { path: "{{paths.specs}}/<ID>-<slug>/story.md" }
tier: standard
capabilities: [read, search, edit, mcp]
templates:
  - rules/context.md
  - spec/story.md
---

# /mandao-story

> **Not implemented yet** in this Mandao version. This file declares the command's contract
> (arguments, inputs, outputs) so other mandaos and `AGENTS.md` can reference it.

Arguments: {{args}}

Tell the user this mandao is not available yet, summarize what it will do (below), and suggest the
closest available step.

## Planned behavior

- Reads `.mandao/sources.yml` to pull or create the story in the team's tracker.
- Checks a fixed sufficiency rubric: who, problem, value, scope and non-scope, acceptance criteria, dependencies, UX, data.
- Searches missing items in order: constitution → code/graph → tracker → chat → design; then asks at most 5 questions.
- Writes `story.md` from `{{template:spec/story.md}}` in business language, AC numbered `AC-n`, `critical: true` when they touch `critical-flows.md`.
- Follows `{{template:rules/context.md}}`: unresolved items are `ASSUMPTION` or `OPEN`; a critical `OPEN` blocks specify.
