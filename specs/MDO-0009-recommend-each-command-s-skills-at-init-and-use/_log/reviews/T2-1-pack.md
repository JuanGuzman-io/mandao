# Review pack — T2, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T2-1.md`.

## Brief

```json
{
  "spec": "MDO-0009-recommend-each-command-s-skills-at-init-and-use",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "strong",
    "files": [
      "src/cli/init-skills.ts",
      "src/cli/init.ts",
      "src/cli/skills.ts",
      "src/skills/install.ts",
      "docs/cli.md",
      "test/unit/skills.test.ts",
      "test/integration/init-skills.test.ts"
    ],
    "exemplar": "src/cli/init-budget.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-1/C2",
      "AC-1/C3",
      "AC-1/C4",
      "AC-2",
      "AC-2/C1",
      "AC-3",
      "AC-3/C1"
    ],
    "scenarios": [
      "S-2.1",
      "S-2.1/C1",
      "S-2.2",
      "S-2.3",
      "S-2.3/C1",
      "S-3.1",
      "S-3.1/C1",
      "S-3.2",
      "S-3.3",
      "S-3.3/C1",
      "S-3.4",
      "S-3.4/C1",
      "S-3.5",
      "S-3.5/C1",
      "S-4.1",
      "S-4.1/C1"
    ],
    "test_levels": {
      "S-2.1": "e2e",
      "S-2.1/C1": "e2e",
      "S-2.2": "e2e",
      "S-2.3": "e2e",
      "S-2.3/C1": "e2e",
      "S-3.1": "unit",
      "S-3.1/C1": "unit",
      "S-3.2": "unit",
      "S-3.3": "unit",
      "S-3.3/C1": "e2e",
      "S-3.4": "unit",
      "S-3.4/C1": "unit",
      "S-3.5": "unit",
      "S-3.5/C1": "unit",
      "S-4.1": "e2e",
      "S-4.1/C1": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [
      "infra",
      "public-api"
    ],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/skills.test.ts test/integration/init-skills.test.ts test/integration/cli.test.ts",
    "tests": {
      "unit": [
        "S-3.1",
        "S-3.1/C1",
        "S-3.2",
        "S-3.3",
        "S-3.4",
        "S-3.4/C1",
        "S-3.5",
        "S-3.5/C1"
      ],
      "e2e": [
        "S-2.1",
        "S-2.1/C1",
        "S-2.2",
        "S-2.3",
        "S-2.3/C1",
        "S-3.3/C1",
        "S-4.1",
        "S-4.1/C1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T2",
    "title": "init offers the skills and copies only what the person selects",
    "done": false,
    "line": 412
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a workspace without `.mandao/config.yml`, and harnesses chosen in `init` · **WHEN** the person runs `mandao init` interactively · **THEN** init lists each skill the chosen harnesses' commands use, and installs and pins only the ones the person accepts · **AND IT MUST** show, for each skill, what it does, its source, its pinned version and the commands that use it · **BUT it must NOT** run any installer before the person says yes, nor preselect any skill · **AND IT MUST** copy each accepted skill, at its pinned version, into the skills folder of every chosen harness, and otherwise print the exact manual step · **BUT it must NOT** copy a skill's executable scripts unless the person asks with `--with-scripts`; by default only `SKILL.md` and its documents are installed ([spec.md#c-2](spec.md#c-2))"
    },
    {
      "ref": "AC-1/C1",
      "text": "**AND IT MUST** show, for each skill, what it does, its source, its pinned version and the commands that use it"
    },
    {
      "ref": "AC-1/C2",
      "text": "**BUT it must NOT** run any installer before the person says yes, nor preselect any skill"
    },
    {
      "ref": "AC-1/C3",
      "text": "**AND IT MUST** copy each accepted skill, at its pinned version, into the skills folder of every chosen harness, and otherwise print the exact manual step"
    },
    {
      "ref": "AC-1/C4",
      "text": "**BUT it must NOT** copy a skill's executable scripts unless the person asks with `--with-scripts`; by default only `SKILL.md` and its documents are installed ([spec.md#c-2](spec.md#c-2))"
    },
    {
      "ref": "AC-2",
      "text": "**GIVEN** a workspace without `.mandao/config.yml` · **WHEN** the person runs `mandao init --yes` · **THEN** init prints the commands' skills and the command that installs them later · **BUT it must NOT** install or pin any skill"
    },
    {
      "ref": "AC-2/C1",
      "text": "**BUT it must NOT** install or pin any skill"
    },
    {
      "ref": "AC-3",
      "text": "**GIVEN** the person chose only harnesses other than Claude Code (Codex, OpenCode, Copilot, Antigravity) · **WHEN** init offers skills · **THEN** it offers the same skills as for Claude Code, and installs the accepted ones where those harnesses read them ([spec.md#c-1](spec.md#c-1)) · **BUT it must NOT** fail or block because a skill cannot be installed"
    },
    {
      "ref": "AC-3/C1",
      "text": "**BUT it must NOT** fail or block because a skill cannot be installed"
    }
  ],
  "scenarios": [
    {
      "ref": "S-2.1",
      "text": "**Given** an interactive `init` with Claude Code and Codex chosen · **When** init reaches the skills step · **Then** each skill shows its description, source, pinned version, vetted state and the commands that use it · **AND IT MUST** show, before the question, how each would be installed: the shell commands, or the repository, tag and the folders it would be copied into"
    },
    {
      "ref": "S-2.1/C1",
      "text": "**AND IT MUST** show, before the question, how each would be installed: the shell commands, or the repository, tag and the folders it would be copied into"
    },
    {
      "ref": "S-2.2",
      "text": "**Given** the offer of S-2.1 · **When** the person selects product-manager-toolkit only · **Then** only its install runs, and the lock pins it once verified"
    },
    {
      "ref": "S-2.3",
      "text": "**Given** the offer of S-2.1 · **When** the person has not answered yet, selects nothing, or cancels · **Then** init finishes and the lock pins no skill · **BUT it must NOT** run any installer or copy before the answer, nor start with any skill selected"
    },
    {
      "ref": "S-2.3/C1",
      "text": "**BUT it must NOT** run any installer or copy before the answer, nor start with any skill selected"
    },
    {
      "ref": "S-3.1",
      "text": "**Given** harnesses `[claude, codex]` and brainstorming accepted, with `git` on PATH · **When** the install runs · **Then** `skills/brainstorming` of obra/superpowers at `v7.0.0` (commit `bb92a77…`) is in `.claude/skills/brainstorming/` and `.agents/skills/brainstorming/`, and the lock pins brainstorming with that commit · **BUT it must NOT** overwrite a `<folder>/<id>/` that already exists; that folder is left as is and the output says so"
    },
    {
      "ref": "S-3.1/C1",
      "text": "**BUT it must NOT** overwrite a `<folder>/<id>/` that already exists; that folder is left as is and the output says so"
    },
    {
      "ref": "S-3.2",
      "text": "**Given** the fetched tag resolves to a commit other than the catalog's `commit` · **When** the install runs · **Then** nothing is copied, the skill is `failed` with the two commits in the detail, and the lock does not pin it"
    },
    {
      "ref": "S-3.3",
      "text": "**Given** an accepted repository skill, and `git` not on PATH or the fetch exiting non-zero · **When** the install runs · **Then** the skill is reported pending with the manual step: repository, tag, commit, folder and the target folders · **AND IT MUST** let init finish with exit code 0"
    },
    {
      "ref": "S-3.3/C1",
      "text": "**AND IT MUST** let init finish with exit code 0"
    },
    {
      "ref": "S-3.4",
      "text": "**Given** an accepted skill whose folder holds `SKILL.md`, documents and executable scripts (as brainstorming's `scripts/start-server.sh`) · **When** the install runs without `--with-scripts` · **Then** `SKILL.md` and the documents are copied, and the output names each script left out and how to add it (`--with-scripts`) · **BUT it must NOT** copy any script: a file with the executable bit, a script extension (`.sh`, `.bash`, `.zsh`, `.js`, `.mjs`, `.cjs`, `.ts`, `.py`, `.rb`, `.ps1`, `.bat`, `.cmd`) or anything under a `scripts/` folder"
    },
    {
      "ref": "S-3.4/C1",
      "text": "**BUT it must NOT** copy any script: a file with the executable bit, a script extension (`.sh`, `.bash`, `.zsh`, `.js`, `.mjs`, `.cjs`, `.ts`, `.py`, `.rb`, `.ps1`, `.bat`, `.cmd`) or anything under a `scripts/` folder"
    },
    {
      "ref": "S-3.5",
      "text": "**Given** the same skill · **When** the install runs with `--with-scripts` (on `init` or `skills add`) · **Then** the whole folder is copied and the lock records that its scripts were copied · **AND IT MUST** warn before copying that the scripts are third-party code and that brainstorming's start a local server"
    },
    {
      "ref": "S-3.5/C1",
      "text": "**AND IT MUST** warn before copying that the scripts are third-party code and that brainstorming's start a local server"
    },
    {
      "ref": "S-4.1",
      "text": "**Given** a workspace without `.mandao/config.yml` · **When** `mandao init --yes` runs · **Then** the output lists each skill of FR-1 with its version and source, and the line `mandao skills add <ids>` to install them later · **BUT it must NOT** run any installer, copy any folder or pin any skill in the lock"
    },
    {
      "ref": "S-4.1/C1",
      "text": "**BUT it must NOT** run any installer, copy any folder or pin any skill in the lock"
    }
  ],
  "project": {
    "name": "mandao",
    "path": ".",
    "gates": {
      "format": "npx biome format .",
      "lint": "npm run lint",
      "typecheck": "npm run typecheck",
      "test": "npm test",
      "build": "npm run build",
      "secrets": "gitleaks git . --redact --no-banner",
      "audit": "npm audit --omit=dev",
      "sast": "semgrep scan --config p/typescript --config p/javascript --error --metrics=off",
      "metrics": "npx biome lint --only=complexity/noExcessiveCognitiveComplexity --only=complexity/noExcessiveLinesPerFunction --only=style/noExcessiveLinesPerFile"
    }
  },
  "skillMap": [
    "| graphify | core | constitution, specify, implement, close | all | 0.9.92, pinned in the lock; Claude Code hooks through `mandao hook graph-guard` (roles with a shell only, ADR 0021) and git hooks installed |",
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`; Codex copy in `.agents/skills/codebase-conventions/`; generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [
    "security"
  ],
  "loop": {
    "task": "T2",
    "tier": "strong",
    "attempt": 1,
    "failsAtTier": 0,
    "tdd": {
      "required": true,
      "testsBy": "tester",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-opus-5-5"
    },
    "reviewer": {
      "role": "reviewer",
      "model": "claude-opus-5-5"
    },
    "notes": [
      "reduced independence"
    ],
    "action": "review",
    "reason": "implementation reported, awaiting review"
  },
  "impact": {
    "source": "runner",
    "runner": "vitest",
    "graphTests": [
      "test/integration/approve.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/skills-list.test.ts"
    ],
    "files": [
      "src/cli/init-skills.ts",
      "src/cli/init.ts",
      "src/cli/skills.ts",
      "src/skills/install.ts",
      "docs/cli.md",
      "test/unit/skills.test.ts",
      "test/integration/init-skills.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/skills-list.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/cli/init-skills.ts src/cli/init.ts src/cli/skills.ts src/skills/install.ts docs/cli.md test/unit/skills.test.ts test/integration/init-skills.test.ts test/integration/approve.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/leader-scripts.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/skills-list.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/extensions.ts",
      "src/cli/setup.ts",
      "src/skills/git-copy.ts",
      "test/unit/skills-list.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/skills.test.ts",
      "test/integration/init-skills.test.ts"
    ],
    "changed": [
      "test/unit/skills.test.ts",
      "test/integration/init-skills.test.ts"
    ]
  }
}
```

## Gates — T2, attempt 1

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | PASS | 0 |
| lint | PASS | 0 |
| typecheck | PASS | 0 |
| test | NOT_INSTALLED | 0 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/AGENTS.md b/AGENTS.md
index 3ce06eb..b26fa9c 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -19,7 +19,7 @@ Spec-driven development with [Mandao](https://www.npmjs.com/package/mandao): com
 | Render | `src/render/` | Tokens, conditionals, template install | — |
 | Writer | `src/writer/` | Change plan, drift, orphans | `src/writer/AGENTS.md` |
 | Models | `src/models/` | Role → model resolution | — |
-| Skills | `src/skills/` | Catalog installs | — |
+| Skills | `src/skills/` | Catalog installs and `git` skill copies | `src/skills/AGENTS.md` |
 | Scripts | `src/scripts/` | `mandao run` helpers | — |
 | Spec domain | `src/spec/` | Loop, evidence, costs, tracing and closure | `src/spec/AGENTS.md` |
 | Commit policy | `src/commits/` | Generated commitlint rules | — |
diff --git a/docs/cli.md b/docs/cli.md
index 47b62ee..8141c02 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -4,14 +4,14 @@
 
 | Command | What it does |
 |---|---|
-| `mandao init [dir]` | Set up the workspace (or `[dir]`, created with `git init` if needed). `--harness`, `--profile <app\|ai\|data>` (work type), `--model-profile <peak\|balanced\|economy>`, `--budget <usd\|none>`, `--shadow`, `--scope global` for `/mandao-init`, `--yes` for no prompts |
+| `mandao init [dir]` | Set up the workspace (or `[dir]`, created with `git init` if needed). `--harness`, `--profile <app\|ai\|data>` (work type), `--model-profile <peak\|balanced\|economy>`, `--budget <usd\|none>`, `--shadow`, `--with-scripts` (see [Skills at init](#skills-at-init)), `--scope global` for `/mandao-init`, `--yes` for no prompts |
 | `mandao sync` | Regenerate harness files from `.mandao/config.yml`; never overwrites hand edits without `--force`; `--dry-run` shows the changes |
 | `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks |
 | `mandao doctor --json` | Same findings as one JSON document for CI (`counts` per level, `findings`); nothing else on stdout. See [schemas.md](schemas.md) |
 | `mandao update` | Re-resolve with the installed version; overrides and model choices are never touched |
 | `mandao harness add <id...>` | Generate files for more harnesses |
 | `mandao models` · `models set <role> <model>` · `models mode <simple\|routed>` · `models profile <peak\|balanced\|economy>` | Show and choose the model per role (leader, reviewer, reviewer_alt, implementer, tester); a profile switches every role at once and keeps your own choices |
-| `mandao skills add <id\|pack>` | Install catalog skills with their ecosystem tool (after confirmation), verify and pin them |
+| `mandao skills add <id\|pack>` | Install catalog skills with their ecosystem tool, or copy a repository skill at its pinned commit (after confirmation), verify and pin them. `--with-scripts` also copies a repository skill's scripts |
 | `mandao skills list` | List skills pinned in the workspace lock |
 | `mandao start "<description\|ID>"` | Create the spec's branch and worktree and set it up (env files, dependencies, setup hooks, graph, baseline); print or `--open` the harness there. `--quick`, `--hotfix`, `--type` |
 | `mandao worktree list \| clean` | Spec worktrees; `clean` removes only merged ones that hold no work, never forced |
@@ -19,6 +19,35 @@
 | `mandao run cost <spec>` | Spend per command and role, with its basis (billed or subscription equivalent); see [Cost](#cost) |
 | `mandao run …` | Helper scripts the commands call, with compact JSON on stdout (`MANDAO_JSON=pretty` for people). `mandao run --help` lists them all: planning (`spec-new`, `trace`, `tasks`, `brief`), the Leader loop (`step`, `checkpoint`, `gates`, `review-pack`, `review`, `red`, `mutation`, `commit`, `implement-summary`), verify and close (`verify-plan`, `kaizen`, `impacts`, `publish-plan`, `pr-plan`), and tests under the resource budget (`impact`, `tests`, `build`, `resources`) |
 
+## Skills at init
+
+The commands use a few catalog skills (graphify, brainstorming, product-manager-toolkit,
+software-architect). After writing the config and syncing, `init` offers them:
+
+- **What it shows first.** For each skill: what it does, its source, pinned version, vetted state,
+  the commands that use it, and how it would be installed (the shell commands, or the repository, tag,
+  commit and the folders it would be copied into). Nothing runs before you answer.
+- **The question.** A multiselect with nothing selected. Selecting none, or cancelling, finishes init
+  and pins no skill.
+- **What happens to the selection.** It goes through the same path as `mandao skills add`: install,
+  verify, and pin in `.mandao/mandao.lock`. A skill that cannot be installed is reported as pending
+  with the manual step; init still finishes.
+- **Repository skills** (`git` sources) are fetched with `git` into a temporary folder outside the
+  project, at the catalog's tag. The tag must resolve to the pinned `commit`, or nothing is copied and
+  the skill is `failed`. The skill folder is then copied as `<folder>/<id>/` into the skills folder of
+  each chosen harness. Claude Code uses `.claude/skills`. Codex, Antigravity and OpenCode use
+  `.agents/skills`. Copilot uses `.github/skills`. OpenCode and Copilot add no folder when
+  `.claude/skills` or `.agents/skills` is already a target. A `<folder>/<id>/` that already exists is
+  left as is, and the output says so. The temporary folder is always removed. The lock records the
+  commit.
+- **Scripts stay out by default.** Only `SKILL.md` and its documents are copied. A script is a file
+  with the executable bit, a script extension (`.sh`, `.js`, `.py`, …) or anything under a `scripts/`
+  folder. The output names each script left out. `--with-scripts` (on `init` or `skills add`) copies
+  them too, after a warning that they are third-party code (brainstorming's start a local server). The
+  lock then records `scripts: true`. Symlinks are never copied.
+- **`init --yes`** installs nothing. It lists each skill with its version and source, and prints the
+  `mandao skills add <ids>` line that installs them later.
+
 ## Approving without a model session
 
 `mandao approve <spec> <step>` checks the same gates the command would, sets the status, records who
diff --git a/docs/schemas.md b/docs/schemas.md
index 64656b1..4bb761a 100644
--- a/docs/schemas.md
+++ b/docs/schemas.md
@@ -177,8 +177,9 @@ packs:
 
 Source types: `skills` (`npx skills add <ref>`), `npm`, `command` (a documented shell installer,
 e.g. `uv tool install …`), `plugin` (an agent-side install such as `/plugin install …`, printed for the
-user), `git` (copied by hand) and `bundled`. Any source may declare `verify`, a command that proves the
+user), `git` (fetched at `ref`, checked against `commit`, and its `path` folder copied into each harness
+skills folder; see [cli.md](cli.md#skills-at-init)) and `bundled`. Any source may declare `verify`, a command that proves the
 install. A `git` source requires `commit` (40 hex), the commit the `ref` must resolve to; the lock skill entry
-records it (optional `commit`). `fallback` says what the commands do without the skill.
+records it (optional `commit`), and `scripts: true` when its scripts were copied with `--with-scripts`. `fallback` says what the commands do without the skill.
 `commandSkills(catalog)` in `src/skills/command-skills.ts` lists the `bootstrap` skills that are `binding: core`
 and not `bundled`, with their commands (`phases`), for every harness. Every referenced skill and facet must exist. At most ~10 project skills on top of the bootstrap.
diff --git a/src/cli/extensions.ts b/src/cli/extensions.ts
index 3b766a8..c70c257 100644
--- a/src/cli/extensions.ts
+++ b/src/cli/extensions.ts
@@ -34,5 +34,6 @@ export function registerExtensions(program: Command, ctx: CliContext) {
     .command('add <ids...>')
     .description('Install catalog skills (or packs) with their ecosystem tool, verify them and pin them in the lock')
     .option('-y, --yes', 'install without asking for confirmation (CI)')
-    .action((ids: string[], opts: { yes?: boolean }) => skillsAdd(ctx, ids, opts));
+    .option('--with-scripts', "also copy a repository skill's executable scripts (third-party code; left out by default)")
+    .action((ids: string[], opts: { yes?: boolean; withScripts?: boolean }) => skillsAdd(ctx, ids, opts));
 }
diff --git a/src/cli/init.ts b/src/cli/init.ts
index c9bd2ac..6e6155b 100644
--- a/src/cli/init.ts
+++ b/src/cli/init.ts
@@ -1,8 +1,6 @@
 import { execFileSync } from 'node:child_process';
-import { existsSync } from 'node:fs';
-import { join } from 'node:path';
 import * as p from '@clack/prompts';
-import { CONFIG_FILE, hasConfig, MODELS_FILE, SOURCES_FILE, writeYaml } from '../engine/files.js';
+import { CONFIG_FILE, hasConfig } from '../engine/files.js';
 import { syncGlobal, syncProject } from '../engine/sync.js';
 import { forProviders, profileChoices } from '../models/defaults.js';
 import { readRecommendations } from '../models/load.js';
@@ -24,9 +22,10 @@ import {
   TIERS,
 } from '../schemas/index.js';
 import { type DetectedProject, type DetectedWorkspace, detectWorkspace } from '../workspace/detect.js';
-import { createIfMissing } from '../writer/files.js';
 import { chooseBudget } from './init-budget.js';
+import { writeInitFiles } from './init-files.js';
 import { chooseProfile } from './init-profile.js';
+import { offerSkills } from './init-skills.js';
 import { c, harnessSetupNotes, printChanges, printWarnings } from './output.js';
 
 export type PolyrepoStrategy = 'workspace-repo' | 'home' | 'local';
@@ -47,6 +46,8 @@ export interface InitOptions {
   shadow?: boolean;
   /** USD per spec; `none` for no cap. Never defaulted: a person sets it (ADR 0036). */
   budget?: string;
+  /** Copy the accepted skills' executable scripts too (C-2); off by default. */
+  withScripts?: boolean;
 }
 
 const HARNESS_LABEL: Record<HarnessId, string> = {
@@ -275,49 +276,11 @@ function initWorkspaceRepo(root: string) {
   execFileSync('git', ['init', '--quiet'], { cwd: root });
 }
 
-const OVERRIDES_README = `# Overrides
-
-Files here win over presets and Mandao core. \`mandao update\` never touches this folder.
-
-- Replace a whole command: \`commands/<id>.md\`
-- Patch only its frontmatter: \`commands/<id>.patch.yml\` (objects merge, arrays replace, \`null\` deletes)
-- Replace a template: \`templates/<shared|app|ai|data>/<name>\`
-- Replace or patch a persona: \`personas/<id>.md\` or \`personas/<id>.patch.yml\`
-
-Run \`mandao sync\` after editing.
-`;
-
-const SOURCES_TEMPLATE = {
-  schema_version: 1,
-  tracker: 'none',
-  docs: [],
-  meetings: [],
-  chat: [],
-  design: [],
-};
-
 /** Workspace flags that are only written when set: local-only polyrepo, shadow mode (ADR 0030). */
 function modeFlags(localOnly: boolean | undefined, opts: InitOptions): Pick<ConfigInput, 'local_only' | 'shadow'> {
   return { ...(localOnly ? { local_only: true } : {}), ...(opts.shadow ? { shadow: true } : {}) };
 }
 
-/** The config, and the models, sources and overrides files when they are missing. */
-function writeInitFiles(root: string, config: ConfigInput, models: Models) {
-  writeYaml(join(root, CONFIG_FILE), config, '# Mandao configuration. Run `mandao sync` after editing. Schema: docs/schemas.md');
-  if (!existsSync(join(root, MODELS_FILE))) {
-    writeYaml(
-      join(root, MODELS_FILE),
-      models,
-      '# Model per role and harness. Change with `mandao models set <role> <model>`; see `mandao models`.',
-    );
-  }
-  if (!existsSync(join(root, SOURCES_FILE))) {
-    writeYaml(join(root, SOURCES_FILE), SOURCES_TEMPLATE, '# Where business context lives: tracker, docs, chat, design, transcripts.');
-  }
-  const overrides = join(root, '.mandao', 'overrides');
-  createIfMissing(join(overrides, 'README.md'), OVERRIDES_README);
-}
-
 export async function runInit(root: string, opts: InitOptions) {
   const interactive = !opts.yes;
   if (interactive) p.intro(c.bold('mandao init'));
@@ -392,6 +355,7 @@ export async function runInit(root: string, opts: InitOptions) {
   const result = syncProject(root, { force: opts.force });
   printChanges(result.changes);
   printWarnings(result.warnings);
+  await offerSkills(root, harnesses, opts);
 
   const next = [...harnessSetupNotes(harnesses), 'Next: open your agent here and run /mandao-constitution.'].join('\n');
   interactive ? p.outro(next) : console.log(next);
diff --git a/src/cli/setup.ts b/src/cli/setup.ts
index a0ef27f..952aa8e 100644
--- a/src/cli/setup.ts
+++ b/src/cli/setup.ts
@@ -48,6 +48,7 @@ export function registerSetup(program: Command, ctx: CliContext) {
     .option('--polyrepo <strategy>', 'workspace-repo | home | local (polyrepo only)')
     .option('--home <path>', 'home repository path when --polyrepo home')
     .option('--budget <usd>', 'cost cap per spec in USD, or "none" (asked when interactive; no default)')
+    .option('--with-scripts', "also copy the accepted skills' executable scripts (third-party code; left out by default)")
     .option('-y, --yes', 'accept detected defaults without prompting')
     .option('--force', 'overwrite an existing config and drifted generated files')
     .option('--shadow', 'shadow mode for pilots: generated files go to .git/info/exclude and tracked files are never touched')
diff --git a/src/cli/skills.ts b/src/cli/skills.ts
index 8a3b11e..7d5d198 100644
--- a/src/cli/skills.ts
+++ b/src/cli/skills.ts
@@ -3,8 +3,17 @@ import * as p from '@clack/prompts';
 import { readCatalog } from '../engine/catalog.js';
 import { LOCK_FILE, LOCK_HEADER, readConfig, readLock, writeYaml } from '../engine/files.js';
 import { home } from '../engine/global.js';
-import { type Catalog, type Lock, MAX_PROJECT_SKILLS } from '../schemas/index.js';
-import { installSkills, installStep, pinSkills, type SkillResult, shellRunner } from '../skills/install.js';
+import { type Catalog, type HarnessId, type Lock, MAX_PROJECT_SKILLS } from '../schemas/index.js';
+import {
+  describeStep,
+  type InstallOptions,
+  installSkills,
+  installStep,
+  pinSkills,
+  type SkillResult,
+  shellRunner,
+  skillFolders,
+} from '../skills/install.js';
 import { type CliContext, editConfig } from './context.js';
 import { c } from './output.js';
 
@@ -26,14 +35,16 @@ export function selectSkills(ids: string[], catalog: Catalog, lock: Lock): { wan
   return { wanted, packs };
 }
 
-function printPlan(wanted: string[], catalog: Catalog) {
-  for (const id of wanted) {
-    const s = catalog.skills[id]!;
-    const step = installStep(id, s);
-    const how = step.kind === 'manual' ? step.note : step.commands.join(' && ');
-    const badge = s.vetted ? c.green('vetted  ') : c.yellow('unvetted');
-    console.log(`  ${badge} ${id}@${s.version} ${c.dim(`(${s.author}, ${s.license})`)}\n           ${how}`);
-  }
+/** One skill as the plan shows it: vetted state, id, version, author and license, then how it installs. Pure. */
+export function planLines(id: string, catalog: Catalog, harnesses: readonly HarnessId[]): string[] {
+  const s = catalog.skills[id]!;
+  const badge = s.vetted ? c.green('vetted  ') : c.yellow('unvetted');
+  const how = describeStep(id, installStep(id, s), skillFolders(harnesses));
+  return [`  ${badge} ${id}@${s.version} ${c.dim(`(${s.author}, ${s.license})`)}`, `           ${how}`];
+}
+
+function printPlan(wanted: string[], catalog: Catalog, harnesses: readonly HarnessId[]) {
+  for (const id of wanted) console.log(planLines(id, catalog, harnesses).join('\n'));
 }
 
 /** Pinned skills in the order every `skills list` output uses: by id. Pure. */
@@ -84,7 +95,7 @@ const STATUS_LABEL: Record<SkillResult['status'], string> = {
 function printResults(results: SkillResult[]) {
   for (const r of results) {
     console.log(`  ${STATUS_LABEL[r.status]} ${r.id}${r.detail ? c.dim(` — ${r.detail}`) : ''}`);
-    if (r.status !== 'pending' || r.step.kind === 'manual') continue;
+    if (r.status !== 'pending' || r.step.kind === 'manual' || r.step.kind === 'copy') continue;
     const where = r.step.kind === 'agent' ? 'in your agent' : 'in a terminal';
     for (const cmd of r.step.commands) console.log(`             run ${where}: ${cmd}`);
   }
@@ -94,23 +105,36 @@ function printResults(results: SkillResult[]) {
   );
 }
 
+/**
+ * The install-verify-pin path shared by `skills add` and `init` (D2): runs the installers or copies
+ * (the caller has already confirmed), prints each result and pins what was verified in the lock.
+ */
+export function installAndPin(root: string, ids: string[], catalog: Catalog, opts: InstallOptions): SkillResult[] {
+  const lockPath = join(root, LOCK_FILE);
+  const lock = readLock(lockPath);
+  if (!lock) throw new Error('No lock found: run `mandao sync` first.');
+  const results = installSkills(ids, catalog, root, home(), shellRunner, opts);
+  printResults(results);
+  writeYaml(lockPath, pinSkills(lock, results, catalog), LOCK_HEADER);
+  return results;
+}
+
 /** `mandao skills add`: show the installers, confirm, run, verify, and pin what was verified. */
-export async function skillsAdd(ctx: CliContext, ids: string[], opts: { yes?: boolean }) {
+export async function skillsAdd(ctx: CliContext, ids: string[], opts: { yes?: boolean; withScripts?: boolean }) {
   const catalog = readCatalog();
-  const lockPath = join(ctx.root(), LOCK_FILE);
-  const lock = readLock(lockPath);
+  const lock = readLock(join(ctx.root(), LOCK_FILE));
   if (!lock) throw new Error('No lock found: run `mandao sync` first.');
   const { wanted, packs } = selectSkills(ids, catalog, lock);
+  const harnesses = readConfig(ctx.root()).harnesses;
 
-  printPlan(wanted, catalog);
+  printPlan(wanted, catalog, harnesses);
   if (!opts.yes) {
     const ok = await p.confirm({ message: 'Run these installers now?' });
     if (p.isCancel(ok) || !ok) return console.log(c.dim('  Nothing installed.'));
   }
 
-  const results = installSkills(wanted, catalog, ctx.root(), home(), shellRunner);
-  printResults(results);
-  writeYaml(lockPath, pinSkills(lock, results, catalog), LOCK_HEADER);
+  const warn = (message: string) => console.log(c.yellow(`  ${message}`));
+  installAndPin(ctx.root(), wanted, catalog, { harnesses, withScripts: opts.withScripts, warn });
   if (packs.length) {
     const current = readConfig(ctx.root()).skill_packs;
     editConfig(ctx, (doc) => doc.set('skill_packs', [...new Set([...current, ...packs])]));
diff --git a/src/schemas/lock.ts b/src/schemas/lock.ts
index 8291b8a..bcc6cab 100644
--- a/src/schemas/lock.ts
+++ b/src/schemas/lock.ts
@@ -32,6 +32,8 @@ export const lockSchema = z.object({
           .string()
           .regex(/^[0-9a-f]{40}$/)
           .optional(),
+        /** True when a `git` source was copied with its executable scripts (`--with-scripts`). */
+        scripts: z.boolean().optional(),
       }),
     )
     .default([]),
diff --git a/src/skills/install.ts b/src/skills/install.ts
index c45ead5..6873a10 100644
--- a/src/skills/install.ts
+++ b/src/skills/install.ts
@@ -1,19 +1,22 @@
 import { spawnSync } from 'node:child_process';
 import { existsSync, readdirSync } from 'node:fs';
 import { join } from 'node:path';
-import type { Catalog, CatalogSkill, Lock } from '../schemas/index.js';
+import type { Catalog, CatalogSkill, HarnessId, Lock } from '../schemas/index.js';
 import { coreDir } from '../util/package-root.js';
+import { copyGitSkill } from './git-copy.js';
 
 export type InstallStep =
   /** Commands Mandao runs after confirmation. */
   | { kind: 'shell'; commands: string[] }
   /** Commands the user runs inside the agent (e.g. `/plugin install …`). */
   | { kind: 'agent'; commands: string[] }
+  /** A `git` source: fetch `ref`, check it is `commit`, copy `path` into each harness skills folder (D3). */
+  | { kind: 'copy'; url: string; ref: string; commit: string; path: string }
   /** Nothing to run: bundled with Mandao, or a source without a documented installer. */
   | { kind: 'manual'; note: string };
 
 /** Pure: how to install one catalog skill. */
-export function installStep(id: string, skill: CatalogSkill): InstallStep {
+export function installStep(_id: string, skill: CatalogSkill): InstallStep {
   const s = skill.source;
   switch (s.type) {
     case 'skills':
@@ -25,12 +28,25 @@ export function installStep(id: string, skill: CatalogSkill): InstallStep {
     case 'plugin':
       return { kind: 'agent', commands: s.install };
     case 'git':
-      return { kind: 'manual', note: `copy ${s.path ?? '.'} from ${s.url} at ${s.ref} into your harness skills folder as "${id}"` };
+      return { kind: 'copy', url: s.url, ref: s.ref, commit: s.commit, path: s.path ?? '.' };
     case 'bundled':
       return { kind: 'manual', note: 'bundled with Mandao' };
   }
 }
 
+/** Pure: one line saying how a step installs the skill; a copy names the folders it would write. */
+export function describeStep(id: string, step: InstallStep, folders: readonly string[]): string {
+  switch (step.kind) {
+    case 'shell':
+    case 'agent':
+      return step.commands.join(' && ');
+    case 'copy':
+      return `copy ${step.path} from ${step.url} at ${step.ref} (commit ${step.commit}) into ${folders.map((f) => `${f}/${id}`).join(', ')}`;
+    case 'manual':
+      return step.note;
+  }
+}
+
 export function sourceLabel(skill: CatalogSkill): string {
   const s = skill.source;
   switch (s.type) {
@@ -62,6 +78,31 @@ export const shellRunner: Runner = {
 
 const SKILL_DIRS = ['.claude/skills', '.agents/skills', '.github/skills'];
 
+/** The project skills folder each harness reads, from its official docs (D3, P4). */
+const HARNESS_FOLDER: Record<HarnessId, string> = {
+  claude: '.claude/skills',
+  codex: '.agents/skills',
+  antigravity: '.agents/skills',
+  opencode: '.agents/skills',
+  copilot: '.github/skills',
+};
+/** Harnesses that also read `.claude/skills` and `.agents/skills`: they add no folder when one is already a target. */
+const READS_SHARED: readonly HarnessId[] = ['opencode', 'copilot'];
+const SHARED_FOLDERS = ['.claude/skills', '.agents/skills'];
+
+/** Pure: the folders a skill is copied into for these harnesses, each once. */
+export function skillFolders(harnesses: readonly HarnessId[]): string[] {
+  const out: string[] = [];
+  const add = (folder: string) => {
+    if (!out.includes(folder)) out.push(folder);
+  };
+  for (const h of harnesses) if (!READS_SHARED.includes(h)) add(HARNESS_FOLDER[h]);
+  for (const h of READS_SHARED) {
+    if (harnesses.includes(h) && !out.some((f) => SHARED_FOLDERS.includes(f))) add(HARNESS_FOLDER[h]);
+  }
+  return out;
+}
+
 /** Looks for `skills/<id>/SKILL.md` inside installed plugins (bounded depth). */
 function inPlugins(dir: string, id: string, depth = 6): boolean {
   if (depth === 0 || !existsSync(dir)) return false;
@@ -90,45 +131,84 @@ export interface SkillResult {
   /** `installed`: verified now · `pending`: the user must act · `failed`: the installer or verification failed. */
   status: 'installed' | 'pending' | 'failed';
   detail?: string;
+  /** A `git` copy that included the skill's scripts (`--with-scripts`). */
+  scripts?: boolean;
+}
+
+export interface InstallOptions {
+  /** Harnesses whose skills folders a `git` source is copied into; default Claude Code. */
+  harnesses?: readonly HarnessId[];
+  /** Copy a `git` skill's executable scripts too (C-2); off by default. */
+  withScripts?: boolean;
+  /** Called before any script is copied; default prints to stdout. */
+  warn?: (message: string) => void;
 }
 
 /** The executable a shell command starts with, to check it exists before running it. */
 const firstBin = (command: string) => command.trim().split(/\s+/)[0] ?? '';
 
+function runShell(id: string, step: InstallStep & { kind: 'shell' }, skill: CatalogSkill, root: string, home: string, runner: Runner) {
+  const missing = step.commands.map(firstBin).find((bin) => !runner.has(bin));
+  if (missing) return { id, step, status: 'pending', detail: `${missing} is not available` } satisfies SkillResult;
+  for (const command of step.commands) {
+    if (!runner.run(command, root)) return { id, step, status: 'failed', detail: `failed: ${command}` } satisfies SkillResult;
+  }
+  return isInstalled(id, skill, root, home, runner)
+    ? ({ id, step, status: 'installed' } satisfies SkillResult)
+    : ({ id, step, status: 'failed', detail: 'installer finished but the skill could not be verified' } satisfies SkillResult);
+}
+
 /**
  * Runs the ecosystem installer for each skill (the caller has already confirmed), then verifies it.
- * When the tool is missing, the step is reported as pending so the command can be printed instead.
+ * A `git` source is copied at its pinned commit into each harness skills folder. When the tool is
+ * missing, the step is reported as pending so the command can be printed instead.
  */
-export function installSkills(ids: string[], catalog: Catalog, root: string, home: string, runner: Runner): SkillResult[] {
-  return ids.map((id) => {
+export function installSkills(
+  ids: string[],
+  catalog: Catalog,
+  root: string,
+  home: string,
+  runner: Runner,
+  opts: InstallOptions = {},
+): SkillResult[] {
+  return ids.map((id): SkillResult => {
     const skill = catalog.skills[id]!;
     const step = installStep(id, skill);
-    if (step.kind === 'manual') {
-      const ok = isInstalled(id, skill, root, home, runner);
-      const detail = skill.source.type === 'bundled' && !ok ? 'not shipped in this Mandao version' : step.note;
-      return { id, step, status: ok ? 'installed' : 'pending', detail };
-    }
-    if (step.kind === 'agent') {
-      return { id, step, status: isInstalled(id, skill, root, home, runner) ? 'installed' : 'pending' };
-    }
-    const missing = step.commands.map(firstBin).find((bin) => !runner.has(bin));
-    if (missing) return { id, step, status: 'pending', detail: `${missing} is not available` };
-    for (const command of step.commands) {
-      if (!runner.run(command, root)) return { id, step, status: 'failed', detail: `failed: ${command}` };
+    switch (step.kind) {
+      case 'manual': {
+        const ok = isInstalled(id, skill, root, home, runner);
+        const detail = skill.source.type === 'bundled' && !ok ? 'not shipped in this Mandao version' : step.note;
+        return { id, step, status: ok ? 'installed' : 'pending', detail };
+      }
+      case 'agent':
+        return { id, step, status: isInstalled(id, skill, root, home, runner) ? 'installed' : 'pending' };
+      case 'copy': {
+        const folders = skillFolders(opts.harnesses ?? ['claude']);
+        const outcome = copyGitSkill(id, step, root, runner, { ...opts, folders, manual: describeStep(id, step, folders) });
+        return { id, step, ...outcome };
+      }
     }
-    return isInstalled(id, skill, root, home, runner)
-      ? { id, step, status: 'installed' }
-      : { id, step, status: 'failed', detail: 'installer finished but the skill could not be verified' };
+    return runShell(id, step, skill, root, home, runner);
   });
 }
 
-/** Pins verified skills in the lock with their catalog metadata. */
+/** Pins verified skills in the lock with their catalog metadata, the commit of a `git` source and whether scripts were copied. */
 export function pinSkills(lock: Lock, results: SkillResult[], catalog: Catalog): Lock {
   const pinned = new Map(lock.skills.map((s) => [s.id, s]));
   for (const r of results) {
     if (r.status !== 'installed') continue;
     const s = catalog.skills[r.id]!;
-    pinned.set(r.id, { id: r.id, version: s.version, source: sourceLabel(s), author: s.author, license: s.license, vetted: s.vetted });
+    const commit = s.source.type === 'git' ? s.source.commit : undefined;
+    pinned.set(r.id, {
+      id: r.id,
+      version: s.version,
+      source: sourceLabel(s),
+      author: s.author,
+      license: s.license,
+      vetted: s.vetted,
+      ...(commit ? { commit } : {}),
+      ...(r.scripts ? { scripts: true } : {}),
+    });
   }
   return { ...lock, skills: [...pinned.values()].sort((a, b) => a.id.localeCompare(b.id)) };
 }
diff --git a/src/writer/AGENTS.md b/src/writer/AGENTS.md
index 088dfb0..0f5367b 100644
--- a/src/writer/AGENTS.md
+++ b/src/writer/AGENTS.md
@@ -8,4 +8,6 @@ Purpose: plan changes against disk and lock, detect drift and orphans, apply (AD
 
 Gotcha: engine and CLI orchestration writes user-intent files through this module's `writeText`,
 `createIfMissing` and `editYaml` helpers; it must not call filesystem writes directly (ADR 0007).
+Skill copies (`src/skills/git-copy.ts`) use `makeScratchDir` + `removeScratchDir(dir, tmpdir())` for the
+temporary clone and `copyNewFile`, which never overwrites and refuses symlinks.
 `log-integrity.ts` tracks script-owned spec evidence; preserve discrepancy detection when changing it.
diff --git a/src/writer/files.ts b/src/writer/files.ts
index a2fcedc..519efd4 100644
--- a/src/writer/files.ts
+++ b/src/writer/files.ts
@@ -1,5 +1,20 @@
-import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmdirSync, rmSync, writeFileSync } from 'node:fs';
-import { dirname, isAbsolute, relative } from 'node:path';
+import {
+  chmodSync,
+  constants,
+  copyFileSync,
+  cpSync,
+  existsSync,
+  lstatSync,
+  mkdirSync,
+  mkdtempSync,
+  readdirSync,
+  readFileSync,
+  rmdirSync,
+  rmSync,
+  writeFileSync,
+} from 'node:fs';
+import { tmpdir } from 'node:os';
+import { dirname, isAbsolute, join, relative } from 'node:path';
 import { type Document, parseDocument } from 'yaml';
 import { sha256 } from '../util/hash.js';
 import { recordLogWrite } from './log-integrity.js';
@@ -54,6 +69,23 @@ export function removeScratchDir(abs: string, within: string): void {
   rmSync(abs, { recursive: true, force: true });
 }
 
+/** A fresh folder under the OS temporary folder; the caller removes it with `removeScratchDir(dir, tmpdir())`. */
+export function makeScratchDir(prefix: string): string {
+  return mkdtempSync(join(tmpdir(), prefix));
+}
+
+/**
+ * Copies one regular file to a path that must not exist yet (a skill copy, D3 of MDO-0009), keeping its
+ * permission bits. Refuses a symlink or anything that is not a regular file; never overwrites.
+ */
+export function copyNewFile(src: string, dest: string): void {
+  const stat = lstatSync(src);
+  if (!stat.isFile()) throw new Error(`${src} is not a regular file`);
+  mkdirSync(dirname(dest), { recursive: true });
+  copyFileSync(src, dest, constants.COPYFILE_EXCL);
+  chmodSync(dest, stat.mode & 0o777);
+}
+
 /** Copies a file or a folder into place (worktree setup: env files, the graph cache). Never a symlink. */
 export function copyInto(src: string, dest: string): void {
   mkdirSync(dirname(dest), { recursive: true });
diff --git a/test/unit/skills.test.ts b/test/unit/skills.test.ts
index e204576..6da27ff 100644
--- a/test/unit/skills.test.ts
+++ b/test/unit/skills.test.ts
@@ -1,6 +1,10 @@
+// mandao-scans: none — lists only the temporary trees it creates.
+import { execFileSync } from 'node:child_process';
+import { chmodSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
+import { dirname, join } from 'node:path';
 import { describe, expect, test } from 'vitest';
 import { catalogSchema, lockSchema } from '../../src/schemas/index.js';
-import { installSkills, pinSkills, type Runner } from '../../src/skills/install.js';
+import { installSkills, pinSkills, type Runner, shellRunner, skillFolders } from '../../src/skills/install.js';
 import { makeTree } from '../helpers.js';
 
 const meta = { version: '1.0.0', author: 'a', license: 'MIT', vetted: true, binding: 'stack', phases: ['implement'], description: 'x' };
@@ -109,3 +113,255 @@ test('plugin skills are verified inside the plugins folder', async () => {
     ),
   ).toBe(true);
 });
+
+// ---- MDO-0009 T2: a `git` source is copied at its pinned commit into each harness's skills folder (FR-3, D3) ----
+
+const git = (cwd: string, ...args: string[]) =>
+  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
+    cwd,
+    encoding: 'utf8',
+  }).trim();
+
+const SCRIPT_EXTENSIONS = ['sh', 'bash', 'zsh', 'js', 'mjs', 'cjs', 'ts', 'py', 'rb', 'ps1', 'bat', 'cmd'];
+
+const SKILL_FILES: Record<string, string> = {
+  'SKILL.md': '---\nname: brainstorming\n---\nUpstream body\n',
+  'visual-companion.md': 'a document',
+  'reference/notes.md': 'a nested document',
+  'scripts/start-server.sh': '#!/bin/sh\necho serve\n',
+  'scripts/data.json': '{}',
+  'bin-tool': 'no extension, executable bit',
+  ...Object.fromEntries(SCRIPT_EXTENSIONS.map((ext) => [`extras/tool.${ext}`, 'x'])),
+};
+const EXECUTABLE = ['bin-tool'];
+const SCRIPTS = ['scripts/start-server.sh', 'scripts/data.json', 'bin-tool', ...SCRIPT_EXTENSIONS.map((ext) => `extras/tool.${ext}`)];
+const DOCS = ['SKILL.md', 'visual-companion.md', 'reference/notes.md'];
+
+/** A local git repository with the skill under `skills/brainstorming`, tagged `v7.0.0`. */
+function skillRepo() {
+  const dir = makeTree({});
+  git(dir, 'init', '--quiet', '--initial-branch=main');
+  git(dir, 'config', 'uploadpack.allowFilter', 'true');
+  for (const [file, content] of Object.entries(SKILL_FILES)) {
+    const full = join(dir, 'skills', 'brainstorming', file);
+    mkdirSync(dirname(full), { recursive: true });
+    writeFileSync(full, content);
+    if (EXECUTABLE.includes(file)) chmodSync(full, 0o755);
+  }
+  writeFileSync(join(dir, 'README.md'), 'outside the skill folder');
+  git(dir, 'add', '-A');
+  git(dir, 'commit', '--quiet', '-m', 'v7');
+  git(dir, 'tag', 'v7.0.0');
+  return { dir, url: `file://${dir}`, commit: git(dir, 'rev-parse', 'HEAD') };
+}
+
+function gitCatalog(url: string, commit: string) {
+  return catalogSchema.parse({
+    schema_version: 1,
+    bootstrap: ['brainstorming'],
+    skills: {
+      brainstorming: {
+        ...meta,
+        binding: 'core',
+        phases: ['constitution', 'story', 'specify'],
+        description: 'Elicit intent.',
+        version: '7.0.0',
+        source: { type: 'git', url, ref: 'v7.0.0', path: 'skills/brainstorming', commit },
+      },
+    },
+    technologies: {},
+  });
+}
+
+/** Runs `fn` with the OS temporary folder pointed at a fresh folder, and returns what `fn` left in it. */
+function leftInTemp<T>(fn: () => T): { value: T; left: string[] } {
+  const fresh = makeTree({});
+  const before = process.env.TMPDIR;
+  process.env.TMPDIR = fresh;
+  try {
+    const value = fn();
+    return { value, left: readdirSync(fresh) };
+  } finally {
+    if (before === undefined) delete process.env.TMPDIR;
+    else process.env.TMPDIR = before;
+  }
+}
+
+const emptyLock = () => lockSchema.parse({ schema_version: 1, mandao: '0.1.0', config_hash: 'sha256-x', layers: [], files: [] });
+const gitRunner = (): Runner & { ran: string[] } => {
+  const ran: string[] = [];
+  return {
+    ran,
+    run: (cmd, cwd) => {
+      ran.push(cmd);
+      return shellRunner.run(cmd, cwd);
+    },
+    has: (bin) => shellRunner.has(bin),
+  };
+};
+
+describe('skillFolders (D3 folder map, AC-3)', () => {
+  test('S-3.1 AC-3: each harness maps to the folder it reads, with no duplicates', () => {
+    expect(skillFolders(['claude', 'codex']).sort()).toEqual(['.agents/skills', '.claude/skills']);
+    expect(skillFolders(['codex', 'antigravity'])).toEqual(['.agents/skills']);
+    expect(skillFolders(['opencode'])).toEqual(['.agents/skills']);
+    expect(skillFolders(['copilot'])).toEqual(['.github/skills']);
+  });
+
+  test('S-3.1 AC-3: OpenCode and Copilot add no folder when .claude or .agents is already a target', () => {
+    expect(skillFolders(['claude', 'copilot', 'opencode'])).toEqual(['.claude/skills']);
+    expect(skillFolders(['copilot', 'codex'])).toEqual(['.agents/skills']);
+  });
+});
+
+describe('git source install (FR-3)', () => {
+  test('S-3.1: copies the pinned folder into both harness folders, pins the commit, and removes the temporary folder', () => {
+    const repo = skillRepo();
+    const root = makeTree({});
+    const catalog = gitCatalog(repo.url, repo.commit);
+    const { value, left } = leftInTemp(() =>
+      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
+    );
+    expect(value[0]).toMatchObject({ id: 'brainstorming', status: 'installed' });
+    for (const folder of ['.claude/skills', '.agents/skills']) {
+      expect(readFileSync(join(root, folder, 'brainstorming', 'SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
+      expect(existsSync(join(root, folder, 'brainstorming', '.git'))).toBe(false);
+      expect(existsSync(join(root, folder, 'brainstorming', 'README.md'))).toBe(false);
+    }
+    expect(left).toEqual([]);
+    const pinned = pinSkills(emptyLock(), value, catalog);
+    expect(pinned.skills).toHaveLength(1);
+    expect(pinned.skills[0]).toMatchObject({ id: 'brainstorming', version: '7.0.0', commit: repo.commit });
+  });
+
+  test('S-3.1/C1: a folder that already exists is left as is, the output says so, and the other folder is still copied', () => {
+    const repo = skillRepo();
+    const root = makeTree({ '.claude/skills/brainstorming/SKILL.md': 'my own edits' });
+    const [r] = installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, gitRunner(), {
+      harnesses: ['claude', 'codex'],
+    });
+    expect(readFileSync(join(root, '.claude/skills/brainstorming/SKILL.md'), 'utf8')).toBe('my own edits');
+    expect(existsSync(join(root, '.claude/skills/brainstorming/visual-companion.md'))).toBe(false);
+    expect(readFileSync(join(root, '.agents/skills/brainstorming/SKILL.md'), 'utf8')).toBe(SKILL_FILES['SKILL.md']);
+    expect(r?.detail).toMatch(/already exists/i);
+    expect(r?.detail).toContain('.claude/skills/brainstorming');
+  });
+
+  test('S-3.2: a tag that moved to another commit copies nothing, fails with both commits, and is not pinned', () => {
+    const repo = skillRepo();
+    const catalog = gitCatalog(repo.url, repo.commit);
+    writeFileSync(join(repo.dir, 'skills/brainstorming/SKILL.md'), 'tampered');
+    git(repo.dir, 'commit', '--quiet', '-am', 'moved');
+    git(repo.dir, 'tag', '-f', 'v7.0.0');
+    const moved = git(repo.dir, 'rev-parse', 'HEAD');
+    expect(moved).not.toBe(repo.commit);
+    const root = makeTree({});
+    const { value, left } = leftInTemp(() =>
+      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
+    );
+    expect(value[0]?.status).toBe('failed');
+    expect(value[0]?.detail).toContain(repo.commit);
+    expect(value[0]?.detail).toContain(moved);
+    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
+    expect(existsSync(join(root, '.agents/skills/brainstorming'))).toBe(false);
+    expect(left).toEqual([]);
+    expect(pinSkills(emptyLock(), value, catalog).skills).toEqual([]);
+  });
+
+  const manualStep = (detail: string | undefined, url: string, commit: string) => {
+    for (const part of [url, 'v7.0.0', commit, 'skills/brainstorming', '.claude/skills', '.agents/skills']) expect(detail).toContain(part);
+  };
+
+  test('S-3.3: git not on PATH leaves the skill pending with the manual step, runs nothing and copies nothing', () => {
+    const repo = skillRepo();
+    const ran: string[] = [];
+    const runner: Runner = {
+      run: (cmd) => {
+        ran.push(cmd);
+        return true;
+      },
+      has: (bin) => bin !== 'git',
+    };
+    const root = makeTree({});
+    const { value, left } = leftInTemp(() =>
+      installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, runner, { harnesses: ['claude', 'codex'] }),
+    );
+    expect(value[0]?.status).toBe('pending');
+    manualStep(value[0]?.detail, repo.url, repo.commit);
+    expect(ran).toEqual([]);
+    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
+    expect(left).toEqual([]);
+  });
+
+  test('S-3.3: a fetch that exits non-zero leaves the skill pending with the manual step and nothing behind', () => {
+    const repo = skillRepo();
+    const url = 'file:///nonexistent/mandao-no-such-repository';
+    const root = makeTree({});
+    const catalog = gitCatalog(url, repo.commit);
+    const { value, left } = leftInTemp(() =>
+      installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] }),
+    );
+    expect(value[0]?.status).toBe('pending');
+    manualStep(value[0]?.detail, url, repo.commit);
+    expect(existsSync(join(root, '.claude/skills/brainstorming'))).toBe(false);
+    expect(left).toEqual([]);
+    expect(pinSkills(emptyLock(), value, catalog).skills).toEqual([]);
+  });
+
+  test('S-3.4 and S-3.4/C1: without --with-scripts, documents are copied and no script is, and each one left out is named', () => {
+    const repo = skillRepo();
+    const root = makeTree({});
+    const catalog = gitCatalog(repo.url, repo.commit);
+    const [r] = installSkills(['brainstorming'], catalog, root, root, gitRunner(), { harnesses: ['claude', 'codex'] });
+    expect(r?.status).toBe('installed');
+    for (const folder of ['.claude/skills', '.agents/skills']) {
+      for (const doc of DOCS) expect(existsSync(join(root, folder, 'brainstorming', doc)), `${folder}/${doc}`).toBe(true);
+      for (const script of SCRIPTS) expect(existsSync(join(root, folder, 'brainstorming', script)), `${folder}/${script}`).toBe(false);
+    }
+    for (const script of SCRIPTS) expect(r?.detail, script).toContain(script);
+    expect(r?.detail).toContain('--with-scripts');
+    const pinned = pinSkills(emptyLock(), [r!], catalog).skills[0];
+    expect(pinned?.commit).toBe(repo.commit);
+    expect(pinned?.scripts).not.toBe(true);
+  });
+
+  test('S-3.5: with --with-scripts the whole folder is copied and the lock records that scripts were copied', () => {
+    const repo = skillRepo();
+    const root = makeTree({});
+    const catalog = gitCatalog(repo.url, repo.commit);
+    const [r] = installSkills(['brainstorming'], catalog, root, root, gitRunner(), {
+      harnesses: ['claude', 'codex'],
+      withScripts: true,
+      warn: () => {},
+    });
+    expect(r?.status).toBe('installed');
+    for (const folder of ['.claude/skills', '.agents/skills']) {
+      for (const file of [...DOCS, ...SCRIPTS])
+        expect(existsSync(join(root, folder, 'brainstorming', file)), `${folder}/${file}`).toBe(true);
+    }
+    expect(statSync(join(root, '.claude/skills/brainstorming/bin-tool')).mode & 0o111).not.toBe(0);
+    expect(pinSkills(emptyLock(), [r!], catalog).skills[0]).toMatchObject({ id: 'brainstorming', commit: repo.commit, scripts: true });
+  });
+
+  test('S-3.5/C1: the warning (third-party code, brainstorming starts a local server) comes before anything is copied', () => {
+    const repo = skillRepo();
+    const root = makeTree({});
+    const warnings: string[] = [];
+    const copiedWhenWarned: boolean[] = [];
+    installSkills(['brainstorming'], gitCatalog(repo.url, repo.commit), root, root, gitRunner(), {
+      harnesses: ['claude', 'codex'],
+      withScripts: true,
+      warn: (message) => {
+        warnings.push(message);
+        copiedWhenWarned.push(
+          existsSync(join(root, '.claude/skills/brainstorming')) || existsSync(join(root, '.agents/skills/brainstorming')),
+        );
+      },
+    });
+    const all = warnings.join('\n');
+    expect(all).toMatch(/third-party/i);
+    expect(all).toMatch(/local server/i);
+    expect(copiedWhenWarned.length).toBeGreaterThan(0);
+    expect(copiedWhenWarned.every((copied) => !copied)).toBe(true);
+  });
+});

--- /dev/null
+++ b/src/cli/init-files.ts (new file)
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE, MODELS_FILE, SOURCES_FILE, writeYaml } from '../engine/files.js';
import type { ConfigInput, Models } from '../schemas/index.js';
import { createIfMissing } from '../writer/files.js';

const OVERRIDES_README = `# Overrides

Files here win over presets and Mandao core. \`mandao update\` never touches this folder.

- Replace a whole command: \`commands/<id>.md\`
- Patch only its frontmatter: \`commands/<id>.patch.yml\` (objects merge, arrays replace, \`null\` deletes)
- Replace a template: \`templates/<shared|app|ai|data>/<name>\`
- Replace or patch a persona: \`personas/<id>.md\` or \`personas/<id>.patch.yml\`

Run \`mandao sync\` after editing.
`;

const SOURCES_TEMPLATE = {
  schema_version: 1,
  tracker: 'none',
  docs: [],
  meetings: [],
  chat: [],
  design: [],
};

/** The config, and the models, sources and overrides files when they are missing. */
export function writeInitFiles(root: string, config: ConfigInput, models: Models) {
  writeYaml(join(root, CONFIG_FILE), config, '# Mandao configuration. Run `mandao sync` after editing. Schema: docs/schemas.md');
  if (!existsSync(join(root, MODELS_FILE))) {
    writeYaml(
      join(root, MODELS_FILE),
      models,
      '# Model per role and harness. Change with `mandao models set <role> <model>`; see `mandao models`.',
    );
  }
  if (!existsSync(join(root, SOURCES_FILE))) {
    writeYaml(join(root, SOURCES_FILE), SOURCES_TEMPLATE, '# Where business context lives: tracker, docs, chat, design, transcripts.');
  }
  const overrides = join(root, '.mandao', 'overrides');
  createIfMissing(join(overrides, 'README.md'), OVERRIDES_README);
}

--- /dev/null
+++ b/src/cli/init-skills.ts (new file)
import * as p from '@clack/prompts';
import { readCatalog } from '../engine/catalog.js';
import type { Catalog, HarnessId } from '../schemas/index.js';
import { type CommandSkill, commandSkills } from '../skills/command-skills.js';
import { sourceLabel } from '../skills/install.js';
import { c } from './output.js';
import { installAndPin, planLines } from './skills.js';

/** Pure: what the offer shows for one skill: what it does, source, version, vetted state, commands and how it installs. */
function offerLines(skill: CommandSkill, catalog: Catalog, harnesses: readonly HarnessId[]): string[] {
  const s = catalog.skills[skill.id]!;
  return [
    ...planLines(skill.id, catalog, harnesses),
    `           ${s.description}`,
    `           used by ${skill.commands.map((cmd) => `/mandao-${cmd}`).join(', ')} · source ${sourceLabel(s)}`,
  ];
}

/** `--yes`: the list and the command that installs them later; nothing runs (like the budget, no default is chosen). */
function listOnly(skills: CommandSkill[], catalog: Catalog) {
  console.log('Skills the commands use (none installed; init --yes never installs one):');
  for (const { id } of skills) {
    const s = catalog.skills[id]!;
    console.log(`  ${id}@${s.version} ${sourceLabel(s)}`);
  }
  console.log(`Install them later with: mandao skills add ${skills.map((s) => s.id).join(' ')}`);
}

/**
 * The init step that offers the commands' skills (FR-2, D2), after sync so the lock exists. It shows
 * each skill and how it would be installed, then asks with nothing selected; only the selection goes
 * through the `skills add` path. Cancel or no selection installs and pins nothing. A skill that cannot
 * be installed is reported and never fails init.
 */
export async function offerSkills(
  root: string,
  harnesses: readonly HarnessId[],
  opts: { yes?: boolean; withScripts?: boolean },
): Promise<void> {
  const catalog = readCatalog();
  const skills = commandSkills(catalog);
  if (!skills.length) return;
  if (opts.yes) return listOnly(skills, catalog);
  p.note(skills.flatMap((s) => offerLines(s, catalog, harnesses)).join('\n'), 'Skills the commands use');
  const picked = await p.multiselect({
    message: 'Which skills should Mandao install now? (space to select, enter to confirm; none is fine)',
    options: skills.map((s) => ({ value: s.id, label: s.id, hint: s.commands.join(', ') })),
    required: false,
  });
  if (p.isCancel(picked) || picked.length === 0) {
    p.log.info(`No skills installed. Add them later with ${c.bold('mandao skills add <id>')}.`);
    return;
  }
  installAndPin(root, picked, catalog, { harnesses, withScripts: opts.withScripts, warn: (m) => p.log.warn(m) });
}

--- /dev/null
+++ b/src/skills/AGENTS.md (new file)
# src/skills — catalog installs

Purpose: say how a catalog skill installs, run or copy it after the person confirms, verify it, and
pin it in the lock (`installSkills`, `pinSkills` in `install.ts`; `commandSkills` in `command-skills.ts`).

- `installSkills(ids, catalog, root, home, runner, { harnesses, withScripts, warn })` is the one path
  `mandao skills add` and `init` share (through `installAndPin` in `src/cli/skills.ts`).
- A `git` source is copied, not run (`git-copy.ts`, MDO-0009 D3): shallow sparse clone of `ref` into
  a scratch folder under `os.tmpdir()`, `HEAD` must equal the catalog `commit`, then `path` is copied
  as `<folder>/<id>/` into each folder of `skillFolders(harnesses)`. The scratch folder is removed in
  every outcome. An existing `<folder>/<id>/` is never overwritten.
- Scripts (executable bit, script extension, or under `scripts/`) are left out and named unless
  `withScripts`; then `warn` is called before any copy and the lock records `scripts: true`.
- `pending` means the person must act (tool missing, fetch failed: the detail is the manual step);
  `failed` means something was wrong (moved tag, unsafe path, installer error). Neither throws.

Security: git runs with an argument array (never a shell string), `protocol.ext.allow=never` and only
`https`, `http`, `ssh`, `git` or `file` URLs. A `path` with `..`, a leading `-` or an absolute path is
refused, the resolved folder must stay inside the clone, and symlinks are never followed nor copied.
Writes go through `src/writer` (`makeScratchDir`, `copyNewFile`, `removeScratchDir`, ADR 0007).

Gotcha: tests copy from a local tagged repository (`file://`) and need `uploadpack.allowFilter` for
the `--filter=blob:none` clone; no test touches the network.

--- /dev/null
+++ b/src/skills/CLAUDE.md (new file)
@AGENTS.md

--- /dev/null
+++ b/src/skills/git-copy.ts (new file)
import { spawnSync } from 'node:child_process';
import { lstatSync, readdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, sep } from 'node:path';
import { copyNewFile, makeScratchDir, removeScratchDir } from '../writer/files.js';
import type { InstallOptions, InstallStep, Runner, SkillResult } from './install.js';

type CopyStep = InstallStep & { kind: 'copy' };
type Outcome = Pick<SkillResult, 'status' | 'detail' | 'scripts'>;

/** Script extensions left out by default (C-2, S-3.4). */
const SCRIPT_EXTENSIONS = new Set(['.sh', '.bash', '.zsh', '.js', '.mjs', '.cjs', '.ts', '.py', '.rb', '.ps1', '.bat', '.cmd']);
/** Transports a catalog `url` may use; anything else (e.g. `ext::`) is refused before git runs. */
const ALLOWED_PROTOCOLS = new Set(['https:', 'http:', 'ssh:', 'git:', 'file:']);
/** What a skill's scripts do beyond being third-party code, when known (P3). */
const SCRIPT_NOTES: Record<string, string> = {
  brainstorming: "brainstorming's scripts start a local server.",
};

const exists = (path: string) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;

/** A file is a script when it has the executable bit, a script extension, or sits under a `scripts/` folder. */
function isScript(rel: string, mode: number): boolean {
  return (mode & 0o111) !== 0 || SCRIPT_EXTENSIONS.has(extname(rel).toLowerCase()) || rel.split('/').slice(0, -1).includes('scripts');
}

/** Runs git with an argument array (never a shell string), no prompts, and no `ext::` transport. */
function git(args: string[], cwd: string, input?: string) {
  return spawnSync('git', ['-c', 'protocol.ext.allow=never', ...args], {
    cwd,
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
  });
}

/** Pure: why a catalog `url` or `path` is refused, or undefined when it is safe to fetch and copy. */
function unsafe(step: CopyStep): string | undefined {
  let protocol = '';
  try {
    protocol = new URL(step.url).protocol;
  } catch {
    return `unsupported repository URL ${step.url}`;
  }
  if (!ALLOWED_PROTOCOLS.has(protocol)) return `unsupported repository URL ${step.url}`;
  const parts = step.path.split(/[\\/]/);
  if (isAbsolute(step.path) || step.path.startsWith('-') || parts.includes('..')) return `unsafe skill path ${step.path}`;
  return undefined;
}

/** Shallow, sparse fetch of the tag into `dir`; returns the commit it resolved to, or the reason it failed. */
function fetchTag(step: CopyStep, dir: string): { head: string } | { error: string } {
  const clone = git(['clone', '--quiet', '--depth', '1', '--branch', step.ref, '--filter=blob:none', '--sparse', '--', step.url, dir], dir);
  if (clone.status !== 0) return { error: `fetch failed${clone.stderr ? `: ${clone.stderr.trim().split('\n')[0]}` : ''}` };
  const sparse =
    step.path === '.' ? git(['sparse-checkout', 'disable'], dir) : git(['sparse-checkout', 'set', '--stdin'], dir, `${step.path}\n`);
  if (sparse.status !== 0) return { error: `checkout of ${step.path} failed` };
  const head = git(['rev-parse', 'HEAD'], dir);
  if (head.status !== 0) return { error: 'could not read the fetched commit' };
  return { head: head.stdout.trim() };
}

interface Plan {
  src: string;
  docs: string[];
  scripts: string[];
  /** Symlinks are never followed nor copied. */
  links: string[];
}

function walk(dir: string, rel: string, plan: Plan) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) plan.links.push(r);
    else if (e.isDirectory()) walk(full, r, plan);
    else if (e.isFile()) (isScript(r, lstatSync(full).mode) ? plan.scripts : plan.docs).push(r);
  }
}

/** The files of the skill folder, after checking it is a real folder inside the clone with a SKILL.md. */
function planCopy(clone: string, path: string): Plan | { error: string } {
  const src = join(clone, path);
  const stat = lstatSync(src, { throwIfNoEntry: false });
  if (!stat?.isDirectory()) return { error: `${path} is not a folder at the pinned commit` };
  const base = realpathSync(clone);
  const real = realpathSync(src);
  if (real !== base && !real.startsWith(base + sep)) return { error: `${path} resolves outside the repository` };
  const plan: Plan = { src: real, docs: [], scripts: [], links: [] };
  walk(real, '', plan);
  if (!plan.docs.includes('SKILL.md')) return { error: `no SKILL.md in ${path} at the pinned commit` };
  return plan;
}

/** Copies the files into `dest` (never over an existing file, never a symlink), keeping their permission bits. */
function copyFiles(src: string, dest: string, files: string[]) {
  for (const rel of files) copyNewFile(join(src, rel), join(dest, rel));
}

function copiedDetail(id: string, plan: Plan, written: string[], kept: string[], withScripts: boolean): string {
  const parts = [`copied into ${written.join(', ')}`, ...kept];
  if (plan.scripts.length && !withScripts) {
    parts.push(
      `left out ${plan.scripts.length} script(s): ${plan.scripts.join(', ')}; add them with \`mandao skills add ${id} --with-scripts\``,
    );
  }
  if (plan.links.length) parts.push(`left out symlink(s): ${plan.links.join(', ')}`);
  return parts.join('; ');
}

function copyPlan(
  id: string,
  step: CopyStep,
  plan: Plan,
  targets: { rel: string; abs: string }[],
  kept: string[],
  opts: InstallOptions,
): Outcome {
  const withScripts = Boolean(opts.withScripts) && plan.scripts.length > 0;
  if (withScripts) {
    const warn = opts.warn ?? ((m: string) => console.log(m));
    warn(
      `${id}: copying ${plan.scripts.length} script(s) (${plan.scripts.join(', ')}). They are third-party code from ${step.url}; review them before running them.${SCRIPT_NOTES[id] ? ` ${SCRIPT_NOTES[id]}` : ''}`,
    );
  }
  const files = withScripts ? [...plan.docs, ...plan.scripts] : plan.docs;
  for (const t of targets) copyFiles(plan.src, t.abs, files);
  return {
    status: 'installed',
    detail: copiedDetail(
      id,
      plan,
      targets.map((t) => t.rel),
      kept,
      withScripts,
    ),
    ...(withScripts ? { scripts: true } : {}),
  };
}

/**
 * Fetches a `git` source into a temporary folder outside the project, checks the tag is the pinned
 * commit, and copies the skill folder as `<folder>/<id>/` into each target folder that does not exist
 * yet (D3). Scripts only with `withScripts` (C-2). The temporary folder is removed in every outcome.
 */
export function copyGitSkill(
  id: string,
  step: CopyStep,
  root: string,
  runner: Runner,
  opts: InstallOptions & { folders: string[]; manual: string },
): Outcome {
  const refused = unsafe(step);
  if (refused) return { status: 'failed', detail: `${refused}; nothing copied` };
  const targets = opts.folders.map((f) => ({ rel: `${f}/${id}`, abs: join(root, f, id) }));
  const existing = targets.filter((t) => exists(t.abs));
  const kept = existing.length ? [`already exists, left as is: ${existing.map((t) => t.rel).join(', ')}`] : [];
  const fresh = targets.filter((t) => !exists(t.abs));
  if (!fresh.length) return { status: 'installed', detail: kept.join('; ') };
  const manual = `install it by hand: ${opts.manual}`;
  if (!runner.has('git')) return { status: 'pending', detail: `git is not available; ${manual}` };
  const tmp = makeScratchDir('mandao-skill-');
  try {
    const fetched = fetchTag(step, tmp);
    if ('error' in fetched) return { status: 'pending', detail: `${fetched.error}; ${manual}` };
    if (fetched.head !== step.commit) {
      return {
        status: 'failed',
        detail: `tag ${step.ref} resolves to ${fetched.head}, not the pinned commit ${step.commit}; nothing copied`,
      };
    }
    const plan = planCopy(tmp, step.path);
    if ('error' in plan) return { status: 'failed', detail: `${plan.error}; nothing copied` };
    return copyPlan(id, step, plan, fresh, kept, opts);
  } finally {
    removeScratchDir(tmp, tmpdir());
  }
}

--- /dev/null
+++ b/test/integration/init-skills.test.ts (new file)
import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { runInit } from '../../src/cli/init.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { LOCK_FILE, readLock } from '../../src/engine/files.js';
import { commandSkills } from '../../src/skills/command-skills.js';
import { makeTree, pkg } from '../helpers.js';

// MDO-0009 T2: `init` offers the commands' skills and copies only what the person selects (FR-2, FR-3, FR-4).
// Prompts are mocked like the budget question; the git source is a local tagged repository (file://).

const state = vi.hoisted(() => ({
  /** What the skills multiselect answers; the test sets it per case. */
  answer: [] as unknown,
  /** Everything init showed: notes, log lines and console output, in order. */
  shown: [] as string[],
  /** Snapshot taken the moment the skills question is asked. */
  atQuestion: undefined as
    | undefined
    | { shown: string; runnerCalls: string[]; options: unknown; initialValues: unknown; required: unknown },
  runnerCalls: [] as string[],
  root: '',
}));

vi.mock('@clack/prompts', () => {
  const noop = () => {};
  return {
    intro: noop,
    outro: (m: string) => state.shown.push(String(m)),
    cancel: noop,
    isCancel: (v: unknown) => typeof v === 'symbol',
    note: (message: string, title?: string) => state.shown.push(`${title ?? ''}\n${message}`),
    log: {
      info: (m: string) => state.shown.push(String(m)),
      warn: (m: string) => state.shown.push(String(m)),
      message: noop,
      step: noop,
      success: noop,
      error: noop,
    },
    spinner: () => ({ start: noop, stop: noop, message: noop }),
    confirm: async () => true,
    text: async () => '',
    select: async (o: { initialValue?: unknown; options: { value: unknown }[] }) => o.initialValue ?? o.options[0]?.value,
    multiselect: async (o: { message: string; options: { value: string }[]; initialValues?: unknown; required?: unknown }) => {
      if (!o.options.some((x) => x.value === 'brainstorming')) return o.initialValues ?? [];
      state.atQuestion = {
        shown: state.shown.join('\n'),
        runnerCalls: [...state.runnerCalls],
        options: o.options,
        initialValues: o.initialValues,
        required: o.required,
      };
      return state.answer;
    },
  };
});

vi.mock('../../src/skills/install.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/skills/install.js')>();
  return {
    ...real,
    shellRunner: {
      run: (command: string, cwd: string) => {
        state.runnerCalls.push(command);
        return real.shellRunner.run(command, cwd);
      },
      has: (bin: string) => real.shellRunner.has(bin),
    },
  };
});

const SKILLS: Record<string, string> = {
  brainstorming: 'skills/brainstorming',
  'product-manager-toolkit': 'product-team/skills/product-manager-toolkit',
  'software-architect': '.claude/skills/software-architect',
};

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

/** A local repository holding the three git skills at their catalog paths, tagged `v1.0.0`. */
function skillRepo() {
  const dir = makeTree({});
  git(dir, 'init', '--quiet', '--initial-branch=main');
  git(dir, 'config', 'uploadpack.allowFilter', 'true');
  for (const [id, path] of Object.entries(SKILLS)) {
    mkdirSync(join(dir, path, 'scripts'), { recursive: true });
    writeFileSync(join(dir, path, 'SKILL.md'), `---\nname: ${id}\n---\n`);
    writeFileSync(join(dir, path, 'guide.md'), 'a document');
    writeFileSync(join(dir, path, 'scripts', 'run.sh'), '#!/bin/sh\n');
  }
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'skills');
  git(dir, 'tag', 'v1.0.0');
  return { url: `file://${dir}`, commit: git(dir, 'rev-parse', 'HEAD') };
}

let source: { url: string; commit: string } = { url: '', commit: '' };

vi.mock('../../src/engine/catalog.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/catalog.js')>();
  return {
    ...real,
    readCatalog: () => {
      const catalog = real.readCatalog();
      for (const [id, path] of Object.entries(SKILLS)) {
        const skill = catalog.skills[id]!;
        skill.source = { type: 'git', url: source.url, ref: 'v1.0.0', path, commit: source.commit };
      }
      return catalog;
    },
  };
});

let exit: MockInstance<typeof process.exit>;

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  state.shown = [];
  state.atQuestion = undefined;
  state.runnerCalls = [];
  state.answer = [];
  source = skillRepo();
  state.root = makeTree({ '.git/': '', 'package.json': pkg('shop') });
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    state.shown.push(args.join(' '));
  });
  exit = vi.spyOn(process, 'exit');
  exit.mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code}) called`);
  }) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
});

const initOptions = {
  scope: 'project',
  defaultProfile: 'app',
  languageBusiness: 'en',
  languageTechnical: 'en',
  budget: 'none',
  modelsMode: 'simple',
  modelProfile: 'peak',
} as const;
const init = (harness: string[], extra: Record<string, unknown> = {}) => runInit(state.root, { ...initOptions, harness, ...extra });
const lockSkills = () => readLock(join(state.root, LOCK_FILE))?.skills ?? [];
const folder = (base: string, id: string) => join(state.root, base, id);

describe('init offers the skills (FR-2)', () => {
  test('S-2.1 and AC-1/C1: before the question, each skill shows what it does, source, version, vetted state and its commands', async () => {
    await init(['claude', 'codex']);
    const catalog = readCatalog();
    expect(state.atQuestion, 'the skills question was asked').toBeDefined();
    const shown = state.atQuestion!.shown;
    for (const { id, commands } of commandSkills(catalog)) {
      const skill = catalog.skills[id]!;
      expect(shown, id).toContain(id);
      expect(shown, `${id} version`).toContain(skill.version);
      expect(shown, `${id} description`).toContain(skill.description);
      for (const command of commands) expect(shown, `${id} command ${command}`).toContain(command);
    }
    expect(shown).toMatch(/vetted/i);
    expect(shown).toContain(source.url);
    expect(shown).toContain('v1.0.0');
  });

  test('S-2.1/C1: before the question, it shows how each is installed: the shell commands, or repository, tag and the folders', async () => {
    await init(['claude', 'codex']);
    const shown = state.atQuestion!.shown;
    expect(shown).toContain('.claude/skills');
    expect(shown).toContain('.agents/skills');
    expect(shown).toContain('skills/brainstorming');
    expect(shown).toContain('uv tool install graphifyy==0.9.92');
  });

  test('S-2.3/C1 and AC-1/C2: no skill starts selected and the question is not required', async () => {
    await init(['claude', 'codex']);
    const { initialValues, required, options } = state.atQuestion!;
    expect(initialValues === undefined || (Array.isArray(initialValues) && initialValues.length === 0)).toBe(true);
    expect(required).not.toBe(true);
    const offered = (options as { value: string }[]).map((o) => o.value);
    expect(offered.sort()).toEqual(
      commandSkills(readCatalog())
        .map((s) => s.id)
        .sort(),
    );
  });

  test('S-2.3/C1: nothing was run and no folder written when the question is asked', async () => {
    await init(['claude', 'codex']);
    expect(state.atQuestion!.runnerCalls).toEqual([]);
    for (const id of Object.keys(SKILLS)) {
      expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
      expect(existsSync(folder('.agents/skills', id)), id).toBe(false);
    }
  });
});

describe('init installs only the selection (AC-1, AC-3)', () => {
  test('S-2.2 and AC-1/C3: selecting product-manager-toolkit only copies it into both folders and pins it with its commit', async () => {
    state.answer = ['product-manager-toolkit'];
    await init(['claude', 'codex']);
    for (const base of ['.claude/skills', '.agents/skills']) {
      expect(existsSync(join(folder(base, 'product-manager-toolkit'), 'SKILL.md'))).toBe(true);
      expect(existsSync(folder(base, 'brainstorming'))).toBe(false);
      expect(existsSync(folder(base, 'software-architect'))).toBe(false);
    }
    const pinned = lockSkills();
    expect(pinned.map((s) => s.id)).toEqual(['product-manager-toolkit']);
    expect(pinned[0]).toMatchObject({ commit: source.commit });
  });

  test('S-2.3: selecting nothing finishes init and pins no skill', async () => {
    state.answer = [];
    await init(['claude', 'codex']);
    expect(lockSkills()).toEqual([]);
    for (const id of Object.keys(SKILLS)) expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
    expect(existsSync(join(state.root, '.mandao/config.yml'))).toBe(true);
  });

  test('S-2.3: cancelling the question finishes init without exiting and pins no skill', async () => {
    state.answer = Symbol('cancel');
    await init(['claude', 'codex']);
    expect(exit).not.toHaveBeenCalled();
    expect(lockSkills()).toEqual([]);
    for (const id of Object.keys(SKILLS)) expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
    expect(readLock(join(state.root, LOCK_FILE))).toBeDefined();
  });

  test('AC-3: with only Codex chosen the same skills are offered and the accepted one lands where Codex reads', async () => {
    state.answer = ['brainstorming'];
    await init(['codex']);
    const offered = (state.atQuestion!.options as { value: string }[]).map((o) => o.value).sort();
    expect(offered).toEqual(
      commandSkills(readCatalog())
        .map((s) => s.id)
        .sort(),
    );
    expect(existsSync(join(folder('.agents/skills', 'brainstorming'), 'SKILL.md'))).toBe(true);
    expect(existsSync(folder('.claude/skills', 'brainstorming'))).toBe(false);
    expect(lockSkills().map((s) => s.id)).toEqual(['brainstorming']);
  });

  test('AC-1/C4: by default the accepted skill is copied without its scripts, which are named; --with-scripts copies them', async () => {
    state.answer = ['brainstorming'];
    await init(['claude']);
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'guide.md'))).toBe(true);
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'scripts', 'run.sh'))).toBe(false);
    expect(state.shown.join('\n')).toContain('--with-scripts');
    expect(lockSkills()[0]?.scripts).not.toBe(true);
  });

  test('AC-1/C4: --with-scripts on init copies the scripts, warns, and records it in the lock', async () => {
    state.answer = ['brainstorming'];
    await init(['claude'], { withScripts: true });
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'scripts', 'run.sh'))).toBe(true);
    expect(state.shown.join('\n')).toMatch(/third-party/i);
    expect(lockSkills()[0]).toMatchObject({ id: 'brainstorming', commit: source.commit, scripts: true });
  });

  test('S-3.3/C1 and AC-3/C1: an accepted skill whose fetch fails does not fail init; it is reported pending and not pinned', async () => {
    source = { url: 'file:///nonexistent/mandao-no-such-repository', commit: source.commit };
    state.answer = ['brainstorming'];
    await expect(init(['claude', 'codex'])).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
    expect(lockSkills()).toEqual([]);
    const shown = state.shown.join('\n');
    expect(shown).toMatch(/pending/i);
    expect(shown).toContain(source.commit);
    expect(existsSync(folder('.claude/skills', 'brainstorming'))).toBe(false);
  });
});

describe('init --yes as a process (FR-4)', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const cache = join(root, 'node_modules', '.cache');
  let outDir = '';

  beforeAll(async () => {
    mkdirSync(cache, { recursive: true });
    outDir = join(cache, `mandao-init-skills-${process.pid}`);
    // Same entry, format, target and platform as tsup.config.ts; the bundle sits in the repository so core/ is found.
    await build({
      entry: { cli: join(root, 'src/cli/index.ts') },
      format: ['esm'],
      target: 'node22',
      platform: 'node',
      outDir,
      config: false,
      silent: true,
    });
  }, 60_000);

  afterAll(async () => {
    const { rmSync } = await import('node:fs');
    if (outDir) rmSync(outDir, { recursive: true, force: true });
  });

  /** Fake installers on PATH: each leaves a marker if anything runs it. */
  function shims() {
    const dir = makeTree({});
    const marker = join(dir, 'RAN');
    for (const bin of ['uv', 'npx', 'npm', 'graphify', 'pip', 'pipx']) {
      const file = join(dir, bin);
      writeFileSync(file, `#!/bin/sh\necho "${bin} $@" >> "${marker}"\nexit 0\n`);
      chmodSync(file, 0o755);
    }
    return { dir, marker };
  }

  function runYes() {
    const cwd = makeTree({ '.git/': '', 'package.json': pkg('shop') });
    const { dir, marker } = shims();
    const result = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'init', '--yes'], {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      env: { ...process.env, MANDAO_HOME: makeTree({}), PATH: `${dir}:${process.env.PATH}` },
    });
    return { cwd, marker, status: result.status, out: `${result.stdout}\n${result.stderr}` };
  }

  /** The catalog the built CLI reads: this file mocks `readCatalog` to local repositories. */
  const realCatalog = async () =>
    (await vi.importActual<typeof import('../../src/engine/catalog.js')>('../../src/engine/catalog.js')).readCatalog();

  test('S-4.1: init --yes lists each skill with its version and source and the line `mandao skills add <ids>`', async () => {
    const { status, out } = runYes();
    expect(status, out).toBe(0);
    const catalog = await realCatalog();
    const skills = commandSkills(catalog);
    expect(skills.length).toBeGreaterThan(0);
    const line = out.split('\n').find((l) => /mandao skills add\s+\S/.test(l));
    expect(line, 'a `mandao skills add <ids>` line').toBeDefined();
    for (const { id } of skills) {
      const s = catalog.skills[id]!;
      const src = s.source as { url?: string; repo?: string };
      expect(out, id).toContain(id);
      expect(out, `${id} version`).toContain(s.version);
      expect(out, `${id} source`).toContain((src.url ?? src.repo)!.replace(/^https?:\/\//, ''));
      expect(line, `${id} in the add line`).toContain(id);
    }
  }, 60_000);

  test('S-4.1/C1 and AC-2/C1: init --yes runs no installer, copies no folder and pins no skill', async () => {
    const { cwd, marker, status, out } = runYes();
    expect(status, out).toBe(0);
    expect(existsSync(marker), 'an installer ran').toBe(false);
    for (const { id } of commandSkills(await realCatalog())) {
      for (const base of ['.claude/skills', '.agents/skills', '.github/skills'])
        expect(existsSync(join(cwd, base, id)), `${base}/${id}`).toBe(false);
    }
    expect(readLock(join(cwd, LOCK_FILE))?.skills).toEqual([]);
    expect(readFileSync(join(cwd, '.mandao/config.yml'), 'utf8')).toContain('harnesses');
  }, 60_000);
});

```
