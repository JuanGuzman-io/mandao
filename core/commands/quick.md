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
  - rules/budget.md
  - rules/telemetry.md
scripts: [cost, quick-check, spec-new, quick-log, event]
approval: none
---

# /mandao-quick

Budget: follow `{{template:rules/budget.md}}` at the start and at the end.
Telemetry: follow `{{template:rules/telemetry.md}}` for event calls and categories.

Change: {{arg:change}}

Follow `{{template:rules/context.md}}` and the gate in `{{template:rules/quick-gate.md}}`.

## 1. Pre-check

1. Locate the change with the graph (or search): project, module and the files to touch. Do not estimate
   its size: the post-check measures the real diff.
2. Check every pre-check condition of the quick gate. Name the project and module.
3. If any condition fails, do not edit anything. Explain which one and recommend {{command:story}} or
   {{command:specify}}, passing along what you found.

## 2. Branch and worktree

Unless the session already runs on a quick branch, open it with
`{{script:spec-new}} "<name>" --id quick --type <story|bug> --create --harness {{harness}} --first "/mandao-quick <change>"` (the id already says `quick`: do not repeat it
in the name). It creates the quick's branch from the branching model's `base`, in this checkout carrying the
uncommitted work (a worktree when another spec is open here), and records the request, so delivery finds it.
Never run git yourself; show its `issues` and stop if there are any. With `mode: worktree`, move into `dir` first:
<!-- mandao:if harness=claude -->
call `EnterWorktree` with the worktree path (`dir`) and go on without a new session; if it is refused or fails, print
the `resume` field of the `spec-new` output and stop: do not go on working in the main checkout.
<!-- mandao:endif -->
<!-- mandao:if !harness=claude -->
print the `resume` field of the `spec-new` output (the command that opens this harness there) and stop.
<!-- mandao:endif -->
Skip this step when the session already runs on a quick branch.

## 3. Change

- Edit only what the change needs. No refactors, no drive-by fixes; report opportunities instead.
- Follow `standards.md` and the module's `AGENTS.md`. Update that `AGENTS.md` if behavior or
  conventions changed.

## 4. Post-check

Run `{{script:quick-check}}` and read its JSON.

- `withinLimits: false` → stop. Do not commit. Keep the work as a draft (stash or a draft branch),
  and escalate to {{command:story}} or {{command:specify}} with the `reasons` and what you learned.
- Otherwise continue.

## 5. Gates and lite review

1. Run the level 0 gates configured in `projects[].gates` for the touched project (format, lint,
   typecheck, impacted tests, secrets, audit when dependencies changed, sast, metrics). Report any
   gate that is not configured; never skip silently.
2. Lite review per `{{template:rules/review.md}}`: the core checklist on the diff, without lenses,
   run by the `mandao-reviewer` agent in a separate context, never by you. Use a model different from
   the one that made the change when available (`mandao-reviewer-alt` if the reviewer shares your
   model). Otherwise record `reduced independence` in the log. A blocking finding means fix it or
   escalate.

## 6. Record and commit

1. Record the cost first: `{{script:cost}} quick --record --command quick --harness {{harness}}` (it holds only what was spent
   from the quick's start), so that it is committed with the quick.
2. Record the row with `{{script:quick-log}} <name> --gates "<gate results>" --verdict <PASS|FAIL>
   --reviewer <agent you invoked> --harness {{harness}}` (`self` when the review ran in your own
   context; add `--reduced-independence` when the reviewer ran on your model). The script measures files
   and lines from the diff, reads the reviewer's model from its agent file and puts every review note in
   the Review column: never type a model name or a review note into the log. Pass what the reviewer said about itself, verbatim,
   as `--claimed-reviewer`; it is only compared.
3. Commit following `{{template:rules/commits.md}}`, with the trailer `Mandao-Quick: <name>` and,
   when a spec id is active, `Refs: <ID>`. Example (without the emoji when `commits.emoji` is false):

   ```
   🐛 fix(web): correct checkout button label

   Mandao-Quick: checkout-label
   ```

   The commit lists the code files, `specs/quick/quick-log.md` and `{{paths.specs}}/quick/_log/costs.yml`.
4. Report: what changed, gates run, review result, commit hash.
5. Deliver in this session through the same grouped, confirmed flow as a spec: `{{mandao}} deliver quick/<slug> --list`,
   one grouped question to the PE (destination and level), then
   `{{mandao}} deliver quick/<slug> --target <branch> --scope <all|push-pr|nothing>`. A manual-provider path pushes and prints PR steps; without verifiable CI,
   merge remains with the user.
