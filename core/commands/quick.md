---
schema_version: 1
id: quick
title: Quick
description: "Make a trivial, low-risk change without a spec, behind a double-checked gate that escalates when the change is not actually trivial."
status: stable
flow: { after: [], next: [story, specify] }
arguments:
  - name: change
    description: What to change, in one sentence
    required: true
inputs:
  - { path: "{{paths.constitution}}/standards.md" }
  - { path: AGENTS.md }
outputs:
  - { path: "{{paths.specs}}/quick/quick-log.md" }
  - { path: "(code)", description: the change itself, in one commit with a Mandao-Quick trailer }
capabilities: [read, search, edit, shell, agents]
templates:
  - rules/context.md
  - rules/quick-gate.md
  - rules/review.md
  - rules/commits.md
  - spec/quick-log.md
scripts: [quick-check]
approval: none
---

# /mandao-quick

Change: {{arg:change}}

Follow `{{template:rules/context.md}}` and the gate in `{{template:rules/quick-gate.md}}`.

## 1. Pre-check

1. Locate the change with the graph (or search): project, module, files, estimated lines.
2. Check every pre-check condition of the quick gate. Name the project and module.
3. If any condition fails, do not edit anything. Explain which one and recommend {{command:story}} or
   {{command:specify}}, passing along what you found.

## 2. Change

- Edit only what the change needs. No refactors, no drive-by fixes; report opportunities instead.
- Follow `standards.md` and the module's `AGENTS.md`. Update that `AGENTS.md` if behavior or
  conventions changed.

## 3. Post-check

Run `{{script:quick-check}}` and read its JSON.

- `withinLimits: false` → stop. Do not commit. Keep the work as a draft (stash or a draft branch),
  and escalate to {{command:story}} or {{command:specify}} with the `reasons` and what you learned.
- Otherwise continue.

## 4. Gates and lite review

1. Run the level 0 gates configured in `projects[].gates` for the touched project (format, lint,
   typecheck, test for the area, secrets, audit when dependencies changed, sast, metrics). Report any
   gate that is not configured; never skip silently.
2. Lite review per `{{template:rules/review.md}}`: the core checklist on the diff, without lenses,
   run by the `mandao-reviewer` agent in a separate context, never by you. Use a model different from
   the one that made the change when available (`mandao-reviewer-alt` if the reviewer shares your
   model). Otherwise record `reduced independence` in the log. A blocking finding means fix it or
   escalate.

## 5. Record and commit

1. Append a row to `{{paths.specs}}/quick/quick-log.md` (create it from
   `{{template:spec/quick-log.md}}` if missing): date, name, project, files, lines, gates, review,
   commit.
2. Commit following `{{template:rules/commits.md}}`, with the trailer `Mandao-Quick: <name>` and,
   when a spec id is active, `Refs: <ID>`. Example:

   ```
   🐛 fix(web): correct checkout button label

   Mandao-Quick: checkout-label
   ```
3. Report: what changed, gates run, review result, commit hash.
