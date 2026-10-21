---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
depth: lite
projects: [mandao]
status: approved
---

# Spec — Recommend each command's skills at init and use them in story and specify

The catalog already says which skills each command uses (`bootstrap`, `binding: core`, `phases`);
one pure function reads it per harness, and `init`, `doctor` and the story/specify commands use that
answer. `init` installs through the same path as `mandao skills add`, after the person picks, and
Claude Code plugins install from the terminal with `claude plugin` ([P1](#p1)).

## Functional requirements

<a id="fr1"></a>
### FR-1 — The commands' skills, per harness
Serves: AC-1, AC-3
Projects: mandao

A command uses a skill when the skill is in the catalog's `bootstrap`, has `binding: core`, is not
`bundled`, and lists the command in `phases`. A `plugin` source applies only to Claude Code; every
other source applies to every harness.

#### S-1.1 — Claude Code chosen
- **Given** the harnesses `[claude]`
- **When** the commands' skills are computed
- **Then** they are graphify, software-architect, product-manager-toolkit and brainstorming, each with
  the commands that use it (brainstorming and product-manager-toolkit: constitution, story, specify)
- **BUT it must NOT** include mandao-skills (bundled) or any stack, profile or conditional skill (C1)

#### S-1.2 — No harness with Claude Code plugins
- **Given** the harnesses `[codex, opencode]`
- **When** the commands' skills are computed
- **Then** product-manager-toolkit and brainstorming are not in the result; graphify and
  software-architect are

<a id="fr2"></a>
### FR-2 — init offers the skills and installs only the accepted ones
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

After writing the config and syncing, interactive `init` shows the skills of FR-1 and asks which to
install, with nothing selected. The selected ones go through the `skills add` path: install, verify
and pin in `.mandao/mandao.lock`.

#### S-2.1 — What the offer shows
- **Given** an interactive `init` with Claude Code chosen
- **When** init reaches the skills step
- **Then** each skill shows its description, source, pinned version, vetted state and the commands
  that use it
- **AND IT MUST** show the commands that would install it before the question (C1)

#### S-2.2 — The person accepts one skill
- **Given** the offer of S-2.1
- **When** the person selects product-manager-toolkit only
- **Then** only its installer runs, and the lock pins it once verified

#### S-2.3 — Nothing runs before the answer
- **Given** the offer of S-2.1
- **When** the person has not answered yet, selects nothing, or cancels
- **Then** init finishes and the lock pins no skill
- **BUT it must NOT** run any installer before the answer, nor start with any skill selected (C1)

<a id="fr3"></a>
### FR-3 — Claude Code plugins install from the terminal, or the command is printed
Serves: AC-1/C3, AC-3/C1
Projects: mandao

A `plugin` source installs with `claude plugin <args>` for each catalog command `/plugin <args>`,
in the default (user) scope. When `claude` is not on PATH or a command fails, the skill is pending and
the `/plugin` commands are printed to run in Claude Code. The same applies to `mandao skills add`.

#### S-3.1 — The `claude` CLI is available
- **Given** `claude` on PATH and product-manager-toolkit accepted
- **When** the installers run
- **Then** `claude plugin marketplace add alirezarezvani/claude-skills` and then
  `claude plugin install product-skills@claude-code-skills` run, and the skill is pinned once verified
- **BUT it must NOT** pass `-y`, `--yes` or `--accept-command` to `claude plugin` (C1)

#### S-3.2 — The `claude` CLI is missing or fails
- **Given** product-manager-toolkit accepted and `claude` not on PATH, or a `claude plugin` command
  exiting non-zero
- **When** the installers run
- **Then** the skill is reported pending with `/plugin marketplace add alirezarezvani/claude-skills`
  and `/plugin install product-skills@claude-code-skills` to run in Claude Code
- **AND IT MUST** let init finish with exit code 0 (C1)

<a id="fr4"></a>
### FR-4 — `init --yes` lists the skills and installs nothing
Serves: AC-2, AC-2/C1
Projects: mandao

#### S-4.1 — Non-interactive init
- **Given** a workspace without `.mandao/config.yml`
- **When** `mandao init --yes` runs
- **Then** the output lists each skill of FR-1 with its version and source, and the line
  `mandao skills add <ids>` to install them later
- **BUT it must NOT** run any installer or pin any skill in the lock (C1)

<a id="fr5"></a>
### FR-5 — story and specify say when to use each skill
Serves: AC-4, AC-4/C1, AC-4/C2
Projects: mandao

#### S-5.1 — Rendered for Claude Code
- **Given** a workspace with the `claude` harness
- **When** `/mandao-story` and `/mandao-specify` are rendered
- **Then** each says to use brainstorming when the story starts from nothing (no code and no tracker
  context) and product-manager-toolkit when there is code and product context
- **AND IT MUST** say that, when the skill is missing, the command follows its own steps and notes
  in its output which skill was missing (C1)

#### S-5.2 — Rendered for other harnesses
- **Given** a workspace with `codex`, `opencode`, `copilot` and `antigravity`
- **When** `/mandao-story` and `/mandao-specify` are rendered
- **Then** the commands render and validate as today
- **BUT it must NOT** contain `brainstorming` or `product-manager-toolkit` (C1)

<a id="fr6"></a>
### FR-6 — doctor names the commands that lose a missing skill
Serves: AC-5, AC-5/C1
Projects: mandao

For each skill of FR-1 for the configured harnesses that is not found, doctor reports one finding:
the skill, the commands that lose it, what they do without it (the catalog's `fallback`) and the fix
`mandao skills add <id>`. Skills doctor already reports as optional tools (graphify) are skipped.

#### S-6.1 — A pinned skill is gone
- **Given** brainstorming pinned in the lock and not found
- **When** `mandao doctor` runs
- **Then** a `warn` finding reads like `brainstorming is missing: constitution, story, specify lose it
  (<fallback>)` with the fix `mandao skills add brainstorming`

#### S-6.2 — A skill was never installed
- **Given** a freshly initialized workspace where no skill was installed
- **When** `mandao doctor` runs
- **Then** each missing skill gives an `info` finding with the same content as S-6.1
- **BUT it must NOT** add any `warn` or `error` finding, so the critical flow stays clean (C1)

## AC → FR matrix

| AC | Clause | FR / scenario | Status |
|---|---|---|---|
| AC-1 | main | FR-1 / S-1.1; FR-2 / S-2.2 | covered |
| AC-1 | C1: what, source, version, commands | FR-2 / S-2.1, S-2.1/C1 | covered |
| AC-1 | C2: nothing before yes, nothing preselected | FR-2 / S-2.3/C1 | covered |
| AC-1 | C3: plugin from terminal or printed | FR-3 / S-3.1, S-3.2 | covered |
| AC-2 | main | FR-4 / S-4.1 | covered |
| AC-2 | C1: nothing installed or pinned | FR-4 / S-4.1/C1 | covered |
| AC-3 | main | FR-1 / S-1.2 | covered |
| AC-3 | C1: init never blocked by a plugin | FR-3 / S-3.2/C1 | covered |
| AC-4 | main | FR-5 / S-5.1 | covered |
| AC-4 | C1: fallback, keeps working | FR-5 / S-5.1/C1 | covered |
| AC-4 | C2: no plugin names elsewhere | FR-5 / S-5.2/C1 | covered |
| AC-5 | main | FR-6 / S-6.1, S-6.2 | covered |
| AC-5 | C1: fresh workspace stays clean | FR-6 / S-6.2/C1 | covered |

## Decisions

<a id="d1"></a>
### D1 — The catalog is the only source of which command uses which skill

- New pure `commandSkills(catalog, harnesses)` in `src/skills/`, used by init, doctor and
  `skills add`. brainstorming and product-manager-toolkit add `specify` to their `phases`. A new
  optional catalog field `fallback` says what the commands do without the skill.
- Rejected: a `skills:` list in each command's frontmatter (a second source next to `phases`, they
  would drift). Rejected: a list hard-coded in init. Rejected: a catalog field naming harnesses (the
  source type already says it: only `plugin` is harness-bound).

<a id="d2"></a>
### D2 — init offers the skills after sync, through the `skills add` path

- A new `src/cli/init-skills.ts`, shaped like `init-budget.ts`: a `p.note` with the plan (the same
  lines `skills add` prints), then `p.multiselect` with no initial values and `required: false`. The
  lock exists only after sync, so the step runs after it. `skillsAdd`'s install-verify-pin body moves
  into a shared function that both call.
- `--yes`: print the list and `mandao skills add <ids>`; never install (like the budget, no default is
  chosen for the person).
- Rejected: one confirmation for all (the person cannot choose each). Rejected: a confirm per skill
  (more prompts for the same answer). Rejected: a `--skills` flag in this story (out of scope; `skills
  add` covers the scripted case).

<a id="d3"></a>
### D3 — Plugins install with `claude plugin`, falling back to printing

- `installStep` for a `plugin` source returns a shell step with `/plugin <args>` mapped to
  `claude plugin <args>`, plus the original commands as the in-agent fallback. `installSkills`
  already reports a missing binary as pending; a failing command becomes pending with the fallback
  instead of `failed`. `printResults` prints the fallback as "run in Claude Code".
- No `-y`: the CLI's own confirmation of marketplace-declared commands stays with the person
  (business rule: installers need the person's confirmation). Default scope (user), the folder that
  `isInstalled` already searches (`~/.claude/plugins`).
- Rejected: always printing (P1 shows the CLI can install). Rejected: `--scope project` (writes plugin
  settings into the repository; not asked for).

<a id="d4"></a>
### D4 — doctor: `warn` for a pinned skill that is gone, `info` for one never installed

- Resolves the story's CONFLICT ([story.md#assumptions](story.md#assumptions)): a person who declined
  a skill at init is not warned forever, and `init` → `sync` → `doctor` stays clean
  (`test/integration/engine.test.ts:95`). A pinned skill that disappears is a regression: `warn`.
- New `src/engine/doctor-skills.ts`, detection with `isInstalled` and an injectable runner.
- Rejected: `warn` for every missing skill (breaks the critical flow, and nags a person who said no).
  Rejected: recording declined skills in config (new data for no extra value).

<a id="d5"></a>
### D5 — The skill guidance in story and specify renders only for Claude Code

- A short `<!-- mandao:if harness=claude -->` block in `core/commands/story.md` §2 and
  `core/commands/specify.md` §3. Other harnesses get today's text, which already works without them.
- Rejected: a shared rule template (templates are per profile, not per harness, so the plugin names
  would reach every harness).

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `core/catalog` | `specify` in the phases of brainstorming and product-manager-toolkit; `fallback` on the four core skills | `core/catalog/skills.yml` |
| mandao | `src/schemas` | Optional `fallback` on a catalog skill | `src/schemas/catalog.ts` (`verify`) |
| mandao | `src/skills` | New `command-skills.ts` (`commandSkills`) | `src/skills/install.ts` (`installStep`) |
| mandao | `src/skills` | `plugin` → `claude plugin` shell step with in-agent fallback | `src/skills/install.ts` |
| mandao | `src/cli` | New `init-skills.ts`; `init.ts` calls it after sync | `src/cli/init-budget.ts` |
| mandao | `src/cli` | `skills.ts`: shared install-verify-pin; fallback printing | `src/cli/skills.ts` |
| mandao | `src/engine` | New `doctor-skills.ts`, wired in `doctor.ts` | `src/engine/doctor-codex.ts` |
| mandao | `core/commands` | Claude-only skill guidance in `story.md` and `specify.md` | `core/commands/constitution.md` (step 1, brainstorming) |
| mandao | `docs` | `cli.md` (init skills step, `--yes`); `schemas.md` (`fallback`) | `docs/cli.md` |
| mandao | `test` | Unit and integration tests per task | `test/unit/skills.test.ts`, `test/integration/engine.test.ts` |

## Risks and impacts

- Risk tags: `infra` (init runs third-party installers), `public-api` (init's behavior and output,
  catalog schema).
- A third-party installer runs on the person's machine: only after their selection, never with `-y`,
  only commands pinned in the catalog.
- `claude plugin` may prompt; stdio is inherited (as for every `skills add` installer), so the person
  answers it.

## Constitution Impact

Proposals; /mandao-close applies them with approval.

- `docs/constitution/critical-flows.md`: new row "`init` runs no skill installer before the person
  selects it", e2e in the init integration test; the `skills add` row's `OPEN` is covered by the same
  shared confirmation path.
- `docs/constitution/business-rules.md`: new rule "init never preselects nor installs a skill without
  the person's selection; `--yes` lists only (as for the budget)".

## Product Impact

- `docs/constitution/product.md`: init now recommends the commands' skills.

## Module Docs Impact

None: no module `AGENTS.md` describes init or doctor findings.

## Consistency Check

| ID | Type | Severity | Owner | Status |
|---|---|---|---|---|
| CC-1 | CONFLICT request ↔ critical flow | medium | maintainer | proposed in [D4](#d4), decided at approval |

## Open items

- CONFLICT: see CC-1 and [story.md#assumptions](story.md#assumptions).
- ASSUMPTION(source: catalog `bootstrap`): the commands' skills are FR-1's set, so graphify and
  software-architect are offered too. Confirm: maintainer.
- ASSUMPTION(source: [P2](#p2) unverified): `isInstalled` finds plugin skills under
  `~/.claude/plugins`. If not, doctor reports installed plugins as missing; T2 checks it on a real
  install before pinning anything.

## Clarifications

None.

## Premise Ledger

<a id="p1"></a>
### P1 — The `claude` CLI installs plugins and adds marketplaces from a terminal (High)

If false: D3 falls back to printing only, and FR-3/S-3.1 goes away. Verified: [E1](#e1).

<a id="p2"></a>
### P2 — A plugin installed with `claude plugin install` leaves `skills/<id>/SKILL.md` under `~/.claude/plugins` (High)

If false: `isInstalled` misses installed plugins; doctor and the install verification need another
detection (for example `claude plugin list --json`). UNVERIFIED: the premise runner sets `HOME` to a
scratch folder inside the worktree, so a recorded run cannot read the person's plugin folder, and
installing a plugin to prove it is not a read-only run.

## Tasks

### [ ] T1 — The catalog says which command uses which skill, and story and specify say when to use them

- **What:** `commandSkills` and the catalog changes of [D1](#d1); the Claude-only guidance of
  [D5](#d5) in story and specify.
- **Done when:**
  - S-1.1 and S-1.1/C1 hold for `[claude]`; S-1.2 holds for `[codex, opencode]`.
  - S-5.1 and S-5.1/C1 hold in the Claude Code render of both commands.
  - S-5.2/C1 holds for every other harness; `test/unit/content.test.ts` passes.

```yaml
project: mandao
kind: feat
tier: standard
files: [core/catalog/skills.yml, src/schemas/catalog.ts, src/skills/command-skills.ts, core/commands/story.md, core/commands/specify.md, docs/schemas.md, test/unit/command-skills.test.ts, test/unit/content.test.ts]
exemplar: src/skills/install.ts
ac: [AC-1, AC-3, AC-4, AC-4/C1, AC-4/C2]
scenarios: [S-1.1, S-1.1/C1, S-1.2, S-5.1, S-5.1/C1, S-5.2, S-5.2/C1]
test_levels: { S-1.1: unit, S-1.1/C1: unit, S-1.2: unit, S-5.1: unit, S-5.1/C1: unit, S-5.2: unit, S-5.2/C1: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: []
parallel_safe: false
verify: npx vitest run test/unit/command-skills.test.ts test/unit/content.test.ts
```

### [ ] T2 — init offers the skills and installs only what the person selects

- **What:** `init-skills.ts` and the shared install path of [D2](#d2); the `claude plugin` step of
  [D3](#d3).
- **Done when:**
  - S-2.1 to S-2.3 hold with mocked prompts and a recording runner: the runner has no call before the
    multiselect resolves.
  - S-3.1 and S-3.2 hold with a fake runner; S-3.1/C1: no `-y` in any recorded command.
  - S-4.1 holds by running `mandao init --yes` as a process in a temporary workspace.
  - Before pinning, P2 is checked once on a real install by the implementer and recorded in
    `_log/execution.md`; if it fails, stop and report.

```yaml
project: mandao
kind: feat
tier: strong
files: [src/cli/init-skills.ts, src/cli/init.ts, src/cli/skills.ts, src/skills/install.ts, docs/cli.md, test/unit/skills.test.ts, test/integration/init-skills.test.ts]
exemplar: src/cli/init-budget.ts
ac: [AC-1, AC-1/C1, AC-1/C2, AC-1/C3, AC-2, AC-2/C1, AC-3/C1]
scenarios: [S-2.1, S-2.1/C1, S-2.2, S-2.3, S-2.3/C1, S-3.1, S-3.1/C1, S-3.2, S-3.2/C1, S-4.1, S-4.1/C1]
test_levels: { S-2.1: e2e, S-2.1/C1: e2e, S-2.2: e2e, S-2.3: e2e, S-2.3/C1: e2e, S-3.1: unit, S-3.1/C1: unit, S-3.2: unit, S-3.2/C1: e2e, S-4.1: e2e, S-4.1/C1: e2e }
evidence: tdd
risk_tags: [infra, public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/skills.test.ts test/integration/init-skills.test.ts test/integration/cli.test.ts
```

### [ ] T3 — doctor names the commands that lose a missing skill

- **What:** `doctor-skills.ts` with the levels of [D4](#d4), wired in `runDoctor`.
- **Done when:**
  - S-6.1 holds: a pinned, missing skill gives the `warn` with its commands, fallback and fix.
  - S-6.2 holds and S-6.2/C1: the "clean after sync" test in `engine.test.ts` still finds no `warn`
    or `error`.
  - graphify gives one finding, not two.

```yaml
project: mandao
kind: feat
tier: standard
files: [src/engine/doctor-skills.ts, src/engine/doctor.ts, test/unit/doctor-skills.test.ts, test/integration/engine.test.ts]
exemplar: src/engine/doctor-codex.ts
ac: [AC-5, AC-5/C1]
scenarios: [S-6.1, S-6.2, S-6.2/C1]
test_levels: { S-6.1: unit, S-6.2: unit, S-6.2/C1: e2e }
evidence: tdd
risk_tags: []
depends_on: [T1]
parallel_safe: true
verify: npx vitest run test/unit/doctor-skills.test.ts test/integration/engine.test.ts test/integration/doctor-cli.test.ts
```

## Evidence

Recorded with `mandao run premise MDO-0009 P1` (`_log/premises/P1.md`), commit 4741ec8. The probe is
`_log/premises/probes/p1-claude-plugin-cli.sh` (only `--help` and `--version`).

<a id="e1"></a>
<details><summary>E1 — P1</summary>

Exit 0, Claude Code 2.1.305:

```
Usage: claude plugin marketplace add [options] <source>
  --scope <scope>      Where to declare the marketplace: user (default), project, or local
Usage: claude plugin install|i [options] <plugin>
Install a plugin from available marketplaces (use plugin@marketplace for specific marketplace)
  -s, --scope <scope>        Installation scope: user, project, or local (default: "user")
  -y, --yes                  Accept the displayed marketplace-declared command without the
                             confirmation prompt
```

Not proven by this run: that an install completes without a prompt. D3 inherits stdio, so a prompt
reaches the person.

</details>
