---
schema_version: 1
tracker: none
type: story
id: MDO-0009
url:
parent:
projects: [mandao]
lane: normal
status: in-progress
sources:
  - { ref: "_log/start.yml", kind: request, date: 2026-10-21 }
  - { ref: "maintainer conversation (context agreed for /mandao-specify)", kind: conversation, date: 2026-10-21 }
  - { ref: "core/catalog/skills.yml", kind: code, date: 2026-10-21 }
  - { ref: "src/cli/init.ts, src/cli/skills.ts, src/skills/install.ts, src/engine/doctor.ts", kind: code, date: 2026-10-21 }
  - { ref: "core/commands/story.md, core/commands/specify.md, core/commands/constitution.md §6", kind: code, date: 2026-10-21 }
  - { ref: "docs/constitution/critical-flows.md", kind: constitution, date: 2026-10-21 }
---

# Recommend each command's skills at init and use them in story and specify

A person setting up Mandao learns at `init` which skills the commands use, and installs them only if
they say yes. `story` and `specify` say when each skill helps and work without it, and `doctor` says
which command loses a missing skill.

## Who

The person who runs `mandao init` in a workspace (developer or tech lead), and the PO or developer who
later runs `/mandao-story` and `/mandao-specify`.

## Problem

`init` installs no skills and does not mention them. The catalog binds product-manager-toolkit and
brainstorming to the story phase, but `/mandao-story` never names them, so they only come in at the
constitution (step 6), if at all. When a skill is missing, nothing tells the person which command
works with less help.

## Value

The person decides about the commands' skills on day one, with the facts needed to decide (what each
does, where it comes from, which version). Stories and specs get better elicitation when the skill is
there, and still work when it is not. Missing skills stop being silent.

## Scope

- `init` lists the skills that the commands use, the same for every harness: what each does, its
  source and its pinned version, and installs only the ones the person accepts, into each chosen
  harness ([spec.md#c-1](spec.md#c-1)).
- `init --yes` lists them and how to install them later; it installs nothing.
- `/mandao-story` and `/mandao-specify` say when to use brainstorming (a story starting from nothing)
  and product-manager-toolkit (existing code and product context), and what to do when the skill is
  missing.
- `doctor` reports a missing skill and names the commands that lose it.

## Out of scope

- New catalog entries or new skills.
- An `init` flag that installs skills without a prompt (`mandao skills add` covers it after init).
- Installing the whole plugin a skill comes from (only the skill's own folder is copied).
- Changing constitution step 6 (project and stack skills).

## Acceptance criteria

### AC-1 — init offers the commands' skills and installs only what the person accepts
critical: true

- **GIVEN** a workspace without `.mandao/config.yml`, and harnesses chosen in `init`
- **WHEN** the person runs `mandao init` interactively
- **THEN** init lists each skill the chosen harnesses' commands use, and installs and pins only the
  ones the person accepts
- **AND IT MUST** show, for each skill, what it does, its source, its pinned version and the commands
  that use it (C1)
- **BUT it must NOT** run any installer before the person says yes, nor preselect any skill (C2)
- **AND IT MUST** copy each accepted skill, at its pinned version, into the skills folder of every
  chosen harness, and otherwise print the exact manual step (C3)
- **BUT it must NOT** copy a skill's executable scripts unless the person asks with `--with-scripts`;
  by default only `SKILL.md` and its documents are installed ([spec.md#c-2](spec.md#c-2)) (C4)

### AC-2 — init --yes lists the skills and installs nothing
critical: true

- **GIVEN** a workspace without `.mandao/config.yml`
- **WHEN** the person runs `mandao init --yes`
- **THEN** init prints the commands' skills and the command that installs them later
- **BUT it must NOT** install or pin any skill (C1)

### AC-3 — the same skills for every harness
critical: false

- **GIVEN** the person chose only harnesses other than Claude Code (Codex, OpenCode, Copilot,
  Antigravity)
- **WHEN** init offers skills
- **THEN** it offers the same skills as for Claude Code, and installs the accepted ones where those
  harnesses read them ([spec.md#c-1](spec.md#c-1))
- **BUT it must NOT** fail or block because a skill cannot be installed (C1)

### AC-4 — story and specify say when to use each skill, and work without it
critical: false

- **GIVEN** a workspace generated for any harness
- **WHEN** the person runs `/mandao-story` or `/mandao-specify`
- **THEN** the command says to use brainstorming when the story starts from nothing and
  product-manager-toolkit when there is code and product context
- **AND IT MUST** say what to do when the skill is missing, and keep going without it (C1)

### AC-5 — doctor names the command that loses a missing skill
critical: true

- **GIVEN** a workspace where a skill used by a command is not installed
- **WHEN** the person runs `mandao doctor`
- **THEN** doctor reports the skill, the commands that lose it, what they do without it, and how to
  install it
- **BUT it must NOT** turn the doctor of a freshly initialized workspace into a failing one (C1)

## Dependencies

- The catalog entries for brainstorming and product-manager-toolkit (`core/catalog/skills.yml`),
  verified 2026-10-20.
- The pinned repository of each skill and the skills folder each harness reads: premises verified in
  the spec ([spec.md#p3](spec.md#p3), [spec.md#p4](spec.md#p4)).

## UX references

- The budget question in `init` (`src/cli/init-budget.ts`): no default chosen for the person.
- The plan and results printed by `mandao skills add` (`src/cli/skills.ts`).

## Data involved

- `.mandao/mandao.lock`, `skills:` list: the skills pinned after install, now with the exact version
  (commit) of each copied skill.
- The copied skill folders in the project, one per chosen harness's skills folder.

<a id="assumptions"></a>
## Assumptions and open questions

- ASSUMPTION(source: `core/catalog/skills.yml` `bootstrap` and `phases`): "the skills the commands use"
  are the catalog's bootstrap skills with `binding: core`, except those bundled with Mandao, linked to
  commands by their `phases`. Confirm: maintainer.
- CONFLICT(a: request "doctor warns when a skill a command uses is missing", b:
  `docs/constitution/critical-flows.md` "`init` → `sync` → `doctor` clean on a new workspace", asserted
  as no errors and no warnings in `test/integration/engine.test.ts:95`, decides: maintainer). Proposal
  in [spec.md#d4](spec.md#d4): a warning when a pinned skill is gone, an info line when it was never
  installed.
