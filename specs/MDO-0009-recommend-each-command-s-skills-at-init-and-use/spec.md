---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
depth: lite
projects: [mandao]
status: approved
---

# Spec — Recommend each command's skills at init and use them in story and specify

The catalog already says which skills each command uses (`bootstrap`, `binding: core`, `phases`);
one pure function reads it, and `init`, `doctor` and the story/specify commands use that answer, the
same for every harness ([C-1](#c-1)). `init` installs through the same path as `mandao skills add`,
after the person picks. A skill with a repository source is copied at a pinned commit into the project
skills folder of each chosen harness ([P3](#p3), [P4](#p4)).

## Functional requirements

<a id="fr1"></a>
### FR-1 — The commands' skills, for every harness
Serves: AC-1, AC-3
Projects: mandao

A command uses a skill when the skill is in the catalog's `bootstrap`, has `binding: core`, is not
`bundled`, and lists the command in `phases`. The set does not depend on the chosen harnesses.

#### S-1.1 — The four skills and their commands
- **Given** the catalog of this branch
- **When** the commands' skills are computed
- **Then** they are graphify, software-architect, product-manager-toolkit and brainstorming, each with
  the commands that use it (brainstorming and product-manager-toolkit: constitution, story, specify)
- **BUT it must NOT** include mandao-skills (bundled) or any stack, profile or conditional skill (C1)

#### S-1.2 — Harnesses other than Claude Code
- **Given** the harnesses `[codex, opencode, copilot, antigravity]`
- **When** init computes the skills to offer
- **Then** it offers the same four skills as S-1.1

<a id="fr2"></a>
### FR-2 — init offers the skills and installs only the accepted ones
Serves: AC-1, AC-1/C1, AC-1/C2
Projects: mandao

After writing the config and syncing, interactive `init` shows the skills of FR-1 and asks which to
install, with nothing selected. The selected ones go through the `skills add` path: install, verify
and pin in `.mandao/mandao.lock`.

#### S-2.1 — What the offer shows
- **Given** an interactive `init` with Claude Code and Codex chosen
- **When** init reaches the skills step
- **Then** each skill shows its description, source, pinned version, vetted state and the commands
  that use it
- **AND IT MUST** show, before the question, how each would be installed: the shell commands, or the
  repository, tag and the folders it would be copied into (C1)

#### S-2.2 — The person accepts one skill
- **Given** the offer of S-2.1
- **When** the person selects product-manager-toolkit only
- **Then** only its install runs, and the lock pins it once verified

#### S-2.3 — Nothing runs before the answer
- **Given** the offer of S-2.1
- **When** the person has not answered yet, selects nothing, or cancels
- **Then** init finishes and the lock pins no skill
- **BUT it must NOT** run any installer or copy before the answer, nor start with any skill selected
  (C1)

<a id="fr3"></a>
### FR-3 — A repository source is copied at its pinned commit into each harness's skills folder
Serves: AC-1/C3, AC-1/C4, AC-3, AC-3/C1
Projects: mandao

A `git` source (`url`, `ref` tag, `commit`, `path`) is fetched with `git` into a temporary folder
outside the project, checked against `commit`, and its `path` folder is copied as `<folder>/<id>/` into
the project skills folder of each chosen harness ([D3](#d3)); then the temporary folder is removed. By
default only `SKILL.md` and its documents are copied; executable scripts only with `--with-scripts`
([C-2](#c-2)). The lock pins the skill with its commit and whether its scripts were copied. The same
applies to `mandao skills add`.

#### S-3.1 — Copied for two harnesses
- **Given** harnesses `[claude, codex]` and brainstorming accepted, with `git` on PATH
- **When** the install runs
- **Then** `skills/brainstorming` of obra/superpowers at `v7.0.0` (commit `bb92a77…`) is in
  `.claude/skills/brainstorming/` and `.agents/skills/brainstorming/`, and the lock pins brainstorming
  with that commit
- **BUT it must NOT** overwrite a `<folder>/<id>/` that already exists; that folder is left as is and
  the output says so (C1)

#### S-3.2 — The tag no longer points at the pinned commit
- **Given** the fetched tag resolves to a commit other than the catalog's `commit`
- **When** the install runs
- **Then** nothing is copied, the skill is `failed` with the two commits in the detail, and the lock
  does not pin it

#### S-3.3 — `git` missing or the fetch fails
- **Given** an accepted repository skill, and `git` not on PATH or the fetch exiting non-zero
- **When** the install runs
- **Then** the skill is reported pending with the manual step: repository, tag, commit, folder and the
  target folders
- **AND IT MUST** let init finish with exit code 0 (C1)

#### S-3.4 — Scripts stay out by default
- **Given** an accepted skill whose folder holds `SKILL.md`, documents and executable scripts (as
  brainstorming's `scripts/start-server.sh`)
- **When** the install runs without `--with-scripts`
- **Then** `SKILL.md` and the documents are copied, and the output names each script left out and how
  to add it (`--with-scripts`)
- **BUT it must NOT** copy any script: a file with the executable bit, a script extension (`.sh`,
  `.bash`, `.zsh`, `.js`, `.mjs`, `.cjs`, `.ts`, `.py`, `.rb`, `.ps1`, `.bat`, `.cmd`) or anything under
  a `scripts/` folder (C1)

#### S-3.5 — Scripts with explicit opt-in
- **Given** the same skill
- **When** the install runs with `--with-scripts` (on `init` or `skills add`)
- **Then** the whole folder is copied and the lock records that its scripts were copied
- **AND IT MUST** warn before copying that the scripts are third-party code and that brainstorming's
  start a local server (C1)

<a id="fr4"></a>
### FR-4 — `init --yes` lists the skills and installs nothing
Serves: AC-2, AC-2/C1
Projects: mandao

#### S-4.1 — Non-interactive init
- **Given** a workspace without `.mandao/config.yml`
- **When** `mandao init --yes` runs
- **Then** the output lists each skill of FR-1 with its version and source, and the line
  `mandao skills add <ids>` to install them later
- **BUT it must NOT** run any installer, copy any folder or pin any skill in the lock (C1)

<a id="fr5"></a>
### FR-5 — story and specify say when to use each skill, for every harness
Serves: AC-4, AC-4/C1
Projects: mandao

#### S-5.1 — Rendered for each harness
- **Given** a workspace with `claude`, `codex`, `opencode`, `copilot` and `antigravity`
- **When** `/mandao-story` and `/mandao-specify` are rendered
- **Then** each render says to use brainstorming when the story starts from nothing (no code and no
  tracker context) and product-manager-toolkit when there is code and product context, and that the
  command's own steps continue after brainstorming instead of another skill's plan ([P3](#p3))
- **AND IT MUST** say that, when the skill is missing, the command follows its own steps and notes
  in its output which skill was missing (C1)

<a id="fr6"></a>
### FR-6 — doctor names the commands that lose a missing skill
Serves: AC-5, AC-5/C1
Projects: mandao

For each skill of FR-1 that is not found for a configured harness (no `SKILL.md` for it in a project or
home folder that harness reads, [P4](#p4)), doctor reports one finding: the skill, the harnesses and
commands that lose it, what they do without it (the catalog's `fallback`) and the fix
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
| AC-1 | C3: copied into each harness's folder, or the manual step | FR-3 / S-3.1, S-3.3 | covered |
| AC-1 | C4: scripts only with `--with-scripts` | FR-3 / S-3.4/C1, S-3.5/C1 | covered |
| AC-2 | main | FR-4 / S-4.1 | covered |
| AC-2 | C1: nothing installed or pinned | FR-4 / S-4.1/C1 | covered |
| AC-3 | main | FR-1 / S-1.2; FR-3 / S-3.1 | covered |
| AC-3 | C1: init never blocked by a failed copy | FR-3 / S-3.2, S-3.3/C1 | covered |
| AC-4 | main | FR-5 / S-5.1 | covered |
| AC-4 | C1: fallback, keeps working | FR-5 / S-5.1/C1 | covered |
| AC-5 | main | FR-6 / S-6.1, S-6.2 | covered |
| AC-5 | C1: fresh workspace stays clean | FR-6 / S-6.2/C1 | covered |

## Decisions

<a id="d1"></a>
### D1 — The catalog is the only source of which command uses which skill

- New pure `commandSkills(catalog)` in `src/skills/`, used by init, doctor and `skills add`.
  brainstorming and product-manager-toolkit add `specify` to their `phases`. A new optional catalog
  field `fallback` says what the commands do without the skill.
- Rejected: a `skills:` list in each command's frontmatter (a second source next to `phases`, they
  would drift). Rejected: a list hard-coded in init. Rejected: a catalog field naming harnesses: since
  [C-1](#c-1) every skill serves every harness, so there is nothing to filter.

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
### D3 — One install route for every harness: copy the pinned folder of a `git` source

Decided by [C-1](#c-1).

- brainstorming and product-manager-toolkit become `git` sources, like software-architect. A `git`
  source gains a required `commit` (40 hex), verified at admission ([P3](#p3)):
  superpowers `v7.0.0` → `bb92a77741419a4ab5f06e711a283343f1ada0c3`, claude-skills `v2.12.0` →
  `437f321c8cadf9f68ba0d8440ef02dc21ebb3d72`, akili-specs `v2.34.1` →
  `b04e03f555ec26b0221b0675a3225a9d0da3200d`.
- `installSkills` copies a `git` source instead of printing a manual note: `git clone --depth 1
  --branch <ref> --filter=blob:none --sparse <url> <tmp>`, `sparse-checkout set <path>`, `rev-parse HEAD`
  must equal `commit`, then the folder is copied. `<tmp>` is under the OS temporary folder and removed
  in every outcome. The lock entry gains an optional `commit` and `scripts` (true when they were
  copied).
- What is copied ([C-2](#c-2)): `SKILL.md` and the documents of the folder. Scripts (executable bit, a
  script extension, or under `scripts/`) are left out and listed, unless the person passes
  `--with-scripts` on `init` or `skills add`; then a warning names them as third-party code (and
  brainstorming's as starting a local server) before the copy. Rejected: copying everything (third-party
  executables in the person's repository by default). Rejected: a prompt per skill for its scripts (the
  maintainer chose an explicit flag).
- Target folders, from the harnesses' docs ([P4](#p4)): Claude Code `.claude/skills`; Codex and
  Antigravity `.agents/skills`; OpenCode `.agents/skills`; Copilot `.github/skills`. OpenCode and
  Copilot also read `.claude/skills` and `.agents/skills`, so they add no folder when one of those is
  already a target. The map lives next to `SKILL_DIRS` in `src/skills/install.ts`.
- Rejected: the Claude Code plugin route (Claude Code only, [C-1](#c-1); P1 is no longer needed).
  Rejected: `npx skills add` (another tool's pinning, not verified here). Rejected: GitHub tarball
  downloads (host-specific, the whole repository). Rejected: shipping the skills inside Mandao (BR-8).
  Rejected: trusting the tag alone (tags can move; the commit is what was vetted).

<a id="d4"></a>
### D4 — doctor: `warn` for a pinned skill that is gone, `info` for one never installed

- Resolves the story's CONFLICT ([story.md#assumptions](story.md#assumptions)): a person who declined
  a skill at init is not warned forever, and `init` → `sync` → `doctor` stays clean
  (`test/integration/engine.test.ts:95`). A pinned skill that disappears is a regression: `warn`.
- New `src/engine/doctor-skills.ts`, detection with the folders of [D3](#d3) per configured harness
  and an injectable runner.
- Rejected: `warn` for every missing skill (breaks the critical flow, and nags a person who said no).
  Rejected: recording declined skills in config (new data for no extra value).

<a id="d5"></a>
### D5 — The skill guidance in story and specify renders for every harness

Changed by [C-1](#c-1).

- A short plain paragraph (no harness conditional) in `core/commands/story.md` §2 and
  `core/commands/specify.md` §3: when to use each skill, that the command's steps continue after
  brainstorming (its hand-off to `superpowers:writing-plans` is not installed, [P3](#p3)), and what to
  do when a skill is missing.
- Rejected: a shared rule template (one paragraph in two commands; a template adds a file for it).

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `core/catalog` | `specify` in the phases of brainstorming and product-manager-toolkit; both become `git` sources; `commit` on the three `git` sources; `fallback` on the four core skills | `core/catalog/skills.yml` (software-architect) |
| mandao | `src/schemas` | Required `commit` on a `git` source; optional `fallback` on a skill; optional `commit` on a lock skill | `src/schemas/catalog.ts` (`verify`) |
| mandao | `src/skills` | New `command-skills.ts` (`commandSkills`) | `src/skills/install.ts` (`installStep`) |
| mandao | `src/skills` | `git` source: fetch, check commit, copy into the harness folders; folder map | `src/skills/install.ts` |
| mandao | `src/cli` | New `init-skills.ts`; `init.ts` calls it after sync | `src/cli/init-budget.ts` |
| mandao | `src/cli` | `skills.ts`: shared install-verify-pin; copy plan and results | `src/cli/skills.ts` |
| mandao | `src/engine` | New `doctor-skills.ts`, wired in `doctor.ts` | `src/engine/doctor-codex.ts` |
| mandao | `core/commands` | Skill guidance in `story.md` and `specify.md`, every harness | `core/commands/constitution.md` (step 1, brainstorming) |
| mandao | `docs` | `cli.md` (init skills step, `--yes`, copy); `schemas.md` (`commit`, `fallback`, `git` copies) | `docs/cli.md` |
| mandao | `test` | Unit and integration tests per task; copies tested against a local tagged repository (`file://`), no network | `test/unit/skills.test.ts`, `test/integration/engine.test.ts` |

## Risks and impacts

- Risk tags: `infra` (init fetches third-party repositories and writes into the project),
  `public-api` (init's behavior and output, catalog and lock schemas).
- Third-party files land in the person's repository: only after their selection, only the pinned
  commit, never over an existing folder, and without executable scripts unless the person passes
  `--with-scripts` ([C-2](#c-2); brainstorming's `scripts/start-server.sh` starts a local server,
  [P3](#p3)). A skill whose `SKILL.md` refers to a script left out still installs; the output says
  which scripts were left out. Committing the copies is the person's choice; the output says where
  they are.
- When Claude Code and Codex are both chosen, OpenCode and Copilot see two identical copies of a
  skill (`.claude/skills` and `.agents/skills`), as they already do for Mandao's own commands.
  ASSUMPTION(source: [P4](#p4) lists both folders; behavior with a repeated name not documented): an
  identical copy is harmless. Confirm: maintainer, on the first live run.

## Constitution Impact

Proposals; /mandao-close applies them with approval.

- `docs/constitution/critical-flows.md`: new row "`init` runs no skill installer or copy before the
  person selects it", e2e in the init integration test; the `skills add` row's `OPEN` is covered by the
  same shared confirmation path.
- `docs/constitution/business-rules.md`: new rule "init never preselects nor installs a skill without
  the person's selection; `--yes` lists only (as for the budget)". BR-8: note that a `git` source is
  copied into the person's project at install, never into the package.
- `docs/constitution/architecture.md` external systems: "Skill repositories: `git` fetch of a pinned
  commit after confirmation".

## Product Impact

- `docs/constitution/product.md`: init now recommends the commands' skills, for every harness.

## Module Docs Impact

None: no module `AGENTS.md` describes init, doctor findings or skill sources.

## Consistency Check

| ID | Type | Severity | Owner | Status |
|---|---|---|---|---|
| CC-1 | CONFLICT request ↔ critical flow | normal | maintainer | proposed in [D4](#d4), decided at the first approval, kept |
| CC-2 | CONTRADICTION approved D3/D5 ↔ maintainer answer | critical | maintainer | resolved by [C-1](#c-1) |
| CC-3 | RULE D3 copy ↔ BR-8 "referenced, never vendored" | normal | maintainer | no conflict: BR-8 is about the package; copies go to the person's project. Note proposed in Constitution Impact |
| CC-4 | PREMISE P3: brainstorming hands off to `superpowers:writing-plans`, not copied | normal | dev | handled in [D5](#d5) and S-5.1 |

## Open items

- CONFLICT: see CC-1 and [story.md#assumptions](story.md#assumptions).
- ASSUMPTION: identical copies seen twice by OpenCode or Copilot are harmless (see Risks).
- Worktree state: implement stopped during T1 with uncommitted changes; what fits and what changes is
  listed under [T1](#t1).

## Clarifications

<a id="c-1"></a>
### C-1 — Must the commands' skills reach every harness, not only Claude Code? (2026-10-21)

- **Answer:** Yes. "It must work for every harness, not only Claude Code." One mechanism for every
  harness: the catalog gives these skills a pinned repository source (url, tag, path); `init` and
  `skills add` copy that folder, at the pinned tag and its commit SHA (recorded in the lock), into the
  project skills folder of each chosen harness, after the person confirms. Which folder each harness
  reads is a premise to verify, never a guess.
- **Answered by:** maintainer, after the first approval.
- **Effect:** replaces the approved decision "Claude Code plugins only; on Codex, OpenCode or Copilot
  the two skills are left out". FR-1, FR-3 and FR-5, D1, D3 and D5, AC-1/C3, AC-3 and AC-4 change; P1
  and P2 leave the ledger; P3 and P4 are added and verified. D2 and D4 and the `specify` phase are
  kept. The spec goes back to `draft` for one new approval.

<a id="c-2"></a>
### C-2 — Are a skill's executable scripts copied with it? (2026-10-21)

- **Answer:** Not by default. "Scripts de brainstorming: no se copian por defecto. Se instala solo
  `SKILL.md` y sus documentos. Los scripts ejecutables solo con opt-in explícito (`--with-scripts`), con
  una advertencia de que es código de terceros que levanta un servidor local."
- **Answered by:** maintainer, before the second approval.
- **Effect:** AC-1 gains C4; FR-3 gains S-3.4 and S-3.5; D3 says what is copied and adds `scripts` to
  the lock entry; the brainstorming risk is narrowed; T2 covers the two scenarios. Applies to every
  `git` source, not only brainstorming.

## Premise Ledger

<a id="p3"></a>
### P3 — Each repository source resolves its tag to one commit, and its folder is self-contained (High)

If false: D3 cannot pin a commit or the copied folder misses files. Verified: [E3](#e3). Found: the
tags of superpowers and claude-skills are annotated (the commit is the peeled `^{}`), and brainstorming
hands off to `superpowers:writing-plans`, which is not copied (CC-4).

<a id="p4"></a>
### P4 — Each harness reads the project skills folder Mandao copies into (High)

If false: a copied skill is invisible to that harness, and D3's folder map and doctor's detection are
wrong for it. Verified from each harness's official docs: [E4](#e4). Not proven: a live load in each
harness (Antigravity is untested, `src/adapters/antigravity.ts`); the Copilot evidence covers VS Code,
the target of the Copilot adapter.

## Tasks

<a id="t1"></a>
### [ ] T1 — The catalog says which command uses which skill and where it comes from; story and specify say when to use them

- **What:** `commandSkills`, `fallback` and the `specify` phase of [D1](#d1); the `git` sources with
  `commit` and the lock's `commit` of [D3](#d3) (schemas and catalog only, no copying yet); the
  guidance of [D5](#d5) in story and specify.
- **Worktree changes from the stopped run:**
  - Keep: `specify` in the phases of both skills (`core/catalog/skills.yml`); the `phases` comment in
    `docs/schemas.md`; the guidance paragraph and the tests S-1.1, S-1.1/C1, S-5.1 and S-5.1/C1.
  - Change: remove `harnesses` from `src/schemas/catalog.ts`, the catalog, `docs/schemas.md` and
    `commandSkills` (D1 rejects it); drop the `<!-- mandao:if harness=claude -->` wrapper and the
    "(Claude Code)" label in `story.md` and `specify.md`, and add the brainstorming hand-off sentence;
    rewrite the S-1.2 test (every harness gets the four skills) and turn the S-5.2 test into S-5.1 over
    every harness; replace the two `plugin` sources with `git` sources and add `commit` and `fallback`.
  - The red tests recorded in `_log/progress.yml` change with them: record them again.
- **Done when:**
  - S-1.1, S-1.1/C1 and S-1.2 hold.
  - S-5.1 and S-5.1/C1 hold in the render of both commands for each of the five harnesses, with no
    leftover `{{` or `mandao:if`; `test/unit/content.test.ts` passes.
  - The catalog validates with `commit` on every `git` source.

```yaml
project: mandao
kind: feat
tier: standard
files: [core/catalog/skills.yml, src/schemas/catalog.ts, src/schemas/lock.ts, src/skills/command-skills.ts, core/commands/story.md, core/commands/specify.md, docs/schemas.md, test/unit/command-skills.test.ts, test/unit/content.test.ts]
exemplar: src/skills/install.ts
ac: [AC-1, AC-3, AC-4, AC-4/C1]
scenarios: [S-1.1, S-1.1/C1, S-1.2, S-5.1, S-5.1/C1]
test_levels: { S-1.1: unit, S-1.1/C1: unit, S-1.2: unit, S-5.1: unit, S-5.1/C1: unit }
evidence: tdd
risk_tags: [public-api]
depends_on: []
parallel_safe: false
verify: npx vitest run test/unit/command-skills.test.ts test/unit/content.test.ts
```

### [ ] T2 — init offers the skills and copies only what the person selects

- **What:** `init-skills.ts` and the shared install path of [D2](#d2); the `git` copy and the folder
  map of [D3](#d3).
- **Done when:**
  - S-2.1 to S-2.3 hold with mocked prompts and a recording runner: the runner has no call and no
    folder is written before the multiselect resolves.
  - S-3.1 to S-3.5 hold against a local tagged repository (`file://`): copies in both folders, lock
    `commit`, no overwrite, a moved tag fails, a missing `git` is pending, scripts left out and listed
    by default and copied with a warning under `--with-scripts`, and the temporary folder is gone in
    every case.
  - S-4.1 holds by running `mandao init --yes` as a process in a temporary workspace.

```yaml
project: mandao
kind: feat
tier: strong
files: [src/cli/init-skills.ts, src/cli/init.ts, src/cli/skills.ts, src/skills/install.ts, docs/cli.md, test/unit/skills.test.ts, test/integration/init-skills.test.ts]
exemplar: src/cli/init-budget.ts
ac: [AC-1, AC-1/C1, AC-1/C2, AC-1/C3, AC-1/C4, AC-2, AC-2/C1, AC-3, AC-3/C1]
scenarios: [S-2.1, S-2.1/C1, S-2.2, S-2.3, S-2.3/C1, S-3.1, S-3.1/C1, S-3.2, S-3.3, S-3.3/C1, S-3.4, S-3.4/C1, S-3.5, S-3.5/C1, S-4.1, S-4.1/C1]
test_levels: { S-2.1: e2e, S-2.1/C1: e2e, S-2.2: e2e, S-2.3: e2e, S-2.3/C1: e2e, S-3.1: unit, S-3.1/C1: unit, S-3.2: unit, S-3.3: unit, S-3.3/C1: e2e, S-3.4: unit, S-3.4/C1: unit, S-3.5: unit, S-3.5/C1: unit, S-4.1: e2e, S-4.1/C1: e2e }
evidence: tdd
risk_tags: [infra, public-api]
depends_on: [T1]
parallel_safe: false
verify: npx vitest run test/unit/skills.test.ts test/integration/init-skills.test.ts test/integration/cli.test.ts
```

### [ ] T3 — doctor names the commands that lose a missing skill

- **What:** `doctor-skills.ts` with the levels of [D4](#d4) and the folders of [D3](#d3), wired in
  `runDoctor`.
- **Done when:**
  - S-6.1 holds: a pinned, missing skill gives the `warn` with its harnesses, commands, fallback and
    fix.
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
depends_on: [T1, T2]
parallel_safe: false
verify: npx vitest run test/unit/doctor-skills.test.ts test/integration/engine.test.ts test/integration/doctor-cli.test.ts
```

## Evidence

Recorded with `mandao run premise MDO-0009 <Pn>` on 2026-10-21 (`_log/premises/P3.md`, `P4.md`). The
probes are `_log/premises/probes/p3-repository-sources.sh` (`ls-remote` and a sparse, blob-less clone
into the runner's temporary folder) and `p4-harness-skill-folders.sh` (fetches the docs pages).

<a id="e3"></a>
<details><summary>E3 — P3</summary>

Exit 0:

```
=== https://github.com/obra/superpowers v7.0.0 skills/brainstorming
bb92a77741419a4ab5f06e711a283343f1ada0c3	refs/tags/v7.0.0^{}
HEAD bb92a77741419a4ab5f06e711a283343f1ada0c3
./SKILL.md  ./builder-check-prompt.md  ./visual-companion.md  ./scripts/{frame-template.html,helper.js,server.cjs,start-server.sh,stop-server.sh}
192:software, invoke superpowers:writing-plans and no other skill.
=== https://github.com/alirezarezvani/claude-skills v2.12.0 product-team/skills/product-manager-toolkit
437f321c8cadf9f68ba0d8440ef02dc21ebb3d72	refs/tags/v2.12.0^{}
HEAD 437f321c8cadf9f68ba0d8440ef02dc21ebb3d72
./SKILL.md  ./assets/…  ./references/…  ./scripts/{customer_interview_analyzer.py,rice_prioritizer.py}
references that leave the folder: (none)
=== https://github.com/JuankCadavid/akili-specs v2.34.1 .claude/skills/software-architect
b04e03f555ec26b0221b0675a3225a9d0da3200d	refs/tags/v2.34.1
HEAD b04e03f555ec26b0221b0675a3225a9d0da3200d
./SKILL.md  ./references/…
references that leave the folder: (none)
```

</details>

<a id="e4"></a>
<details><summary>E4 — P4</summary>

Exit 0, folder mentions per page:

```
=== claude https://code.claude.com/docs/en/skills.md          .claude/skills: 54, others: 0
=== codex https://learn.chatgpt.com/docs/build-skills.md      .agents/skills: 5, others: 0
  | `REPO` | `$REPO_ROOT/.agents/skills` <br /> The topmost root folder when you launch Codex inside a Git repository.
=== opencode https://opencode.ai/docs/skills/
  Project config: .opencode/skills/<name>/SKILL.md
  Project Claude-compatible: .claude/skills/<name>/SKILL.md
  Project agent-compatible: .agents/skills/<name>/SKILL.md
=== copilot https://code.visualstudio.com/docs/copilot/customization/agent-skills
  <td><code>.github/skills/</code>, <code>.claude/skills/</code>, <code>.agents/skills/</code></td>
=== antigravity https://antigravity.google/docs/skills
  Note: Antigravity defaults to .agents/skills
  <workspace-root>/.agents/skills/<skill-folder>/   Workspace-specific
```

</details>
