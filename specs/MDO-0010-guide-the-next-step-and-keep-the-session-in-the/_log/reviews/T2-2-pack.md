# Review pack — T2, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T2-2.md`.

## Brief

```json
{
  "spec": "MDO-0010-guide-the-next-step-and-keep-the-session-in-the",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/adapters/types.ts",
      "src/adapters/claude.ts",
      "src/adapters/codex.ts",
      "src/adapters/opencode.ts",
      "src/adapters/copilot.ts",
      "src/adapters/antigravity.ts",
      "src/cli/session-advice.ts",
      "src/cli/start.ts",
      "src/cli/approve.ts",
      "src/cli/run-leader.ts",
      "src/adapters/AGENTS.md",
      "test/unit/session-advice.test.ts",
      "test/integration/leader-scripts.test.ts"
    ],
    "exemplar": "src/adapters/types.ts",
    "ac": [
      "AC-3",
      "AC-3/C2"
    ],
    "scenarios": [
      "S-3.1",
      "S-3.2",
      "S-3.2/C2"
    ],
    "test_levels": {
      "S-3.1": "e2e",
      "S-3.2": "unit",
      "S-3.2/C2": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T1"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/session-advice.test.ts test/integration/leader-scripts.test.ts test/integration/start.test.ts test/integration/approve.test.ts",
    "tests": {
      "unit": [
        "S-3.2",
        "S-3.2/C2"
      ],
      "e2e": [
        "S-3.1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T2",
    "title": "Each harness's session facts drive the cut advice",
    "done": false,
    "line": 72
  },
  "acceptance": [
    {
      "ref": "AC-3",
      "text": "**GIVEN** the session-cut rule recommends a fresh session for a spec · **WHEN** the command reports it · **THEN** the advice is the active harness's own \"new conversation\" action (in Claude Code, `/clear`) followed by the next command, and that next command still runs inside the spec's worktree · **AND IT MUST**, if the fresh conversation would not be inside the worktree, give first the step back into it · **AND IT MUST** fall back to the command that opens a new session in the worktree when the harness has no in-place action"
    },
    {
      "ref": "AC-3/C2",
      "text": "**AND IT MUST** fall back to the command that opens a new session in the worktree when the harness has no in-place action"
    }
  ],
  "scenarios": [
    {
      "ref": "S-3.1",
      "text": "**Given** a cut recommended in a Claude Code session for spec MDO-0001, with `/mandao-implement` next · **When** `mandao approve` or `implement-summary` reports · **Then** the advice reads `/clear`, then `/mandao-implement MDO-0001`, with the worktree command as the fallback"
    },
    {
      "ref": "S-3.2",
      "text": "**Given** the active harness is `codex`, `opencode`, `copilot` or `antigravity` · **When** the advice is built · **Then** it names that harness's action from the table · **AND IT MUST** give the open-session command when a harness has no in-place action"
    },
    {
      "ref": "S-3.2/C2",
      "text": "**AND IT MUST** give the open-session command when a harness has no in-place action"
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
    "tier": "standard",
    "attempt": 2,
    "failsAtTier": 1,
    "tdd": {
      "required": true,
      "testsBy": "tester",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-sonnet-5-5"
    },
    "reviewer": {
      "role": "reviewer",
      "model": "claude-opus-5-5"
    },
    "notes": [],
    "action": "review",
    "reason": "implementation reported, awaiting review"
  },
  "impact": {
    "source": "runner",
    "runner": "vitest",
    "graphTests": [
      "test/adapters/adapters.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/init-skills.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/content.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/writer.test.ts"
    ],
    "files": [
      "src/adapters/types.ts",
      "src/adapters/claude.ts",
      "src/adapters/codex.ts",
      "src/adapters/opencode.ts",
      "src/adapters/copilot.ts",
      "src/adapters/antigravity.ts",
      "src/cli/session-advice.ts",
      "src/cli/start.ts",
      "src/cli/approve.ts",
      "src/cli/run-leader.ts",
      "src/adapters/AGENTS.md",
      "test/unit/session-advice.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/adapters/adapters.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/init-skills.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/content.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/writer.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/adapters/types.ts src/adapters/claude.ts src/adapters/codex.ts src/adapters/opencode.ts src/adapters/copilot.ts src/adapters/antigravity.ts src/cli/session-advice.ts src/cli/start.ts src/cli/approve.ts src/cli/run-leader.ts src/adapters/AGENTS.md test/unit/session-advice.test.ts test/integration/leader-scripts.test.ts test/adapters/adapters.test.ts test/integration/approve.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/engine.test.ts test/integration/init-skills.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/content.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/writer.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/adapters/agents-md.ts",
      "src/adapters/agents-skills.ts",
      "src/adapters/index.ts",
      "src/adapters/shared.ts",
      "src/cli/program.ts",
      "src/cli/run-spec.ts",
      "src/cli/run.ts",
      "src/engine/doctor-harness.ts",
      "src/engine/graph.ts",
      "src/engine/shadow.ts",
      "src/engine/sync.ts",
      "src/writer/plan.ts",
      "test/adapters/adapters.test.ts",
      "test/integration/start.test.ts",
      "test/unit/writer.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/session-advice.test.ts",
      "test/integration/leader-scripts.test.ts"
    ],
    "changed": [
      "test/unit/session-advice.test.ts"
    ]
  }
}
```

## Gates — T2, attempt 2

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | PASS | 0 |
| lint | PASS | 0 |
| typecheck | PASS | 0 |
| test | PASS | 0 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/biome.json b/biome.json
index 563613b..ea0318f 100644
--- a/biome.json
+++ b/biome.json
@@ -249,6 +249,21 @@
           }
         }
       }
+    },
+    {
+      "includes": [
+        "src/cli/session-advice.ts",
+        "test/unit/session-advice.test.ts",
+        "test/integration/approve.test.ts",
+        "test/integration/leader-scripts.test.ts"
+      ],
+      "linter": {
+        "rules": {
+          "suspicious": {
+            "noThenProperty": "off"
+          }
+        }
+      }
     }
   ]
 }
diff --git a/docs/cli.md b/docs/cli.md
index 3308c92..ad14550 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -55,8 +55,13 @@ approved and when in `_log/approvals.yml`, and makes the spec commit. No model r
 tokens.
 
 - `close` records which proposals you approved (`--items`); `/mandao-close` applies them.
-- After approving the spec or the tasks, `approve` prints the command (`newSession`) that starts
-  `/mandao-implement` in a new session from the worktree (ADR 0038).
+- After approving the spec or the tasks, `approve` prints `newSession: { action, then, fallback }`: the
+  active harness's own new-conversation action (`/clear` in Claude Code, `/new` in Codex and OpenCode,
+  "New chat" in Copilot, Ctrl+N in Antigravity), the command to run then (`/mandao-implement`), and the
+  command that opens a session in the worktree (ADR 0038). The harness is `--harness <id>` (an unknown id
+  is an error and nothing is approved), else `claude`, the same rule as the `run` commands; never the first
+  configured one. `run step` (when it stops to suggest a cut) and `run implement-summary` (when a cut is
+  advised) add the same shape as `session.advice`; the latter keeps `session.command`.
 - `budget --to <usd|none>` sets or removes this spec's spend cap (ADR 0036).
 - `approve` ends with `next`: `{ recommended: { command, reason }, options }`, the commands that can follow
   the spec's state. It only recommends; the person runs the command.
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 5db105d..eeec79f 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/approve.ts",
-      "sha256": "c395417183c658c151fdbb40c903aaf2e3b4e23995c82062f0419698362639ff"
+      "sha256": "5fc400f849d24c13507bfb2f2044e4a1bcd9485893a6e52ceb1ca39023ae0d97"
     },
     {
       "path": "src/schemas/common.ts",
diff --git a/docs/diagrams/src/overview.json b/docs/diagrams/src/overview.json
index ac536bb..8c5dfae 100644
--- a/docs/diagrams/src/overview.json
+++ b/docs/diagrams/src/overview.json
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/start.ts",
-      "sha256": "80482928c81185875d58ce7da1db5e5baaa062109dc3666f21b989a768aa50e8"
+      "sha256": "a6564bf466d35966eec048d5281de23ffab3a168690fb35d86823ca2cafe6877"
     },
     {
       "path": "src/spec/next.ts",
diff --git a/src/adapters/AGENTS.md b/src/adapters/AGENTS.md
index d42df03..cc01858 100644
--- a/src/adapters/AGENTS.md
+++ b/src/adapters/AGENTS.md
@@ -4,6 +4,14 @@ Purpose: pure functions `render(input) → { files, warnings }` (ADR 0007). No f
 
 - Contract: `types.ts` (`Adapter`, `AdapterInput`, `GeneratedFile`). Each adapter records `verified`
   (date + official docs) for its target format.
+- Session facts: each adapter declares `session: { enterWorktree, newConversation, resume }` (spec MDO-0010 D2);
+  `src/cli/session-advice.ts` reads them for the cut advice and `openCommand` in `src/cli/start.ts` delegates
+  to `resume(worktree, first)` (pure; same `{ text, launch? }` as before). `newConversation` is absent when
+  there is no in-place action. Facts come from each harness's docs, recorded in its `verified.docs`:
+  Claude Code `/clear` and `claude "<prompt>"` (code.claude.com/docs/en/cli-reference), Codex `/new` and
+  `codex "<prompt>"` with `$` skills, Copilot Chat "New chat", OpenCode `/new`, Antigravity new conversation
+  (⌘N / Ctrl+N); Copilot, OpenCode and Antigravity cannot be launched with a prompt, so `resume` has no `launch`.
+  An unknown harness id falls back to `openByHand` in `shared.ts`.
 - Shared helpers in `shared.ts`: capability mapping, persona variants per role/tier, body rendering.
 - `agents-md.ts` writes managed blocks only (`<!-- mandao:begin/end -->`).
 
diff --git a/src/adapters/antigravity.ts b/src/adapters/antigravity.ts
index 9ee057e..aea9f91 100644
--- a/src/adapters/antigravity.ts
+++ b/src/adapters/antigravity.ts
@@ -1,6 +1,6 @@
 import type { TokenSyntax } from '../render/render.js';
 import { renderAgentsSkills } from './agents-skills.js';
-import { commandName, frontmatter, generatedNotice, personaVariants, renderContext, renderPersonaBody } from './shared.js';
+import { commandName, frontmatter, generatedNotice, openByHand, personaVariants, renderContext, renderPersonaBody } from './shared.js';
 import type { Adapter, AdapterInput, GeneratedFile } from './types.js';
 
 const syntax: TokenSyntax = {
@@ -39,6 +39,11 @@ function renderAgents(input: AdapterInput): GeneratedFile[] {
 export const antigravityAdapter: Adapter = {
   id: 'antigravity',
   name: 'Antigravity',
+  session: {
+    enterWorktree: false,
+    newConversation: '⌘N / Ctrl+N',
+    resume: (worktree, first) => openByHand('antigravity', worktree, first),
+  },
   experimental:
     'not live-tested: covered by snapshot tests only (no Antigravity account); its formats moved this month (workflows became skills on 2026-10-19) and skill arguments and agent tool names are not documented',
   verified: {
diff --git a/src/adapters/claude.ts b/src/adapters/claude.ts
index af5e0f5..2c19b2b 100644
--- a/src/adapters/claude.ts
+++ b/src/adapters/claude.ts
@@ -51,6 +51,11 @@ const syntax: TokenSyntax = {
 export const claudeAdapter: Adapter = {
   id: 'claude',
   name: 'Claude Code',
+  session: {
+    enterWorktree: true,
+    newConversation: '/clear',
+    resume: (worktree, first) => ({ text: `cd ${JSON.stringify(worktree)} && claude ${JSON.stringify(first)}`, launch: ['claude', first] }),
+  },
   verified: { date: '2026-10-19', docs: ['https://code.claude.com/docs/en/skills'] },
   render(input) {
     const ctx = renderContext(input, 'claude');
diff --git a/src/adapters/codex.ts b/src/adapters/codex.ts
index 087ac76..a6b4cf5 100644
--- a/src/adapters/codex.ts
+++ b/src/adapters/codex.ts
@@ -68,6 +68,14 @@ function renderRules(input: AdapterInput): GeneratedFile {
 export const codexAdapter: Adapter = {
   id: 'codex',
   name: 'Codex',
+  session: {
+    enterWorktree: false,
+    newConversation: '/new',
+    resume: (worktree, first) => {
+      const skill = first.replace(/^\//, '$');
+      return { text: `cd ${JSON.stringify(worktree)} && codex ${JSON.stringify(skill)}`, launch: ['codex', skill] };
+    },
+  },
   verified: {
     date: '2026-10-20',
     docs: [
diff --git a/src/adapters/copilot.ts b/src/adapters/copilot.ts
index b0a5b0e..c97c14b 100644
--- a/src/adapters/copilot.ts
+++ b/src/adapters/copilot.ts
@@ -44,6 +44,11 @@ const syntax: TokenSyntax = {
 export const copilotAdapter: Adapter = {
   id: 'copilot',
   name: 'GitHub Copilot',
+  session: {
+    enterWorktree: false,
+    newConversation: 'New chat (⌘N / Ctrl+N)',
+    resume: (worktree, first) => ({ text: `code ${JSON.stringify(worktree)}   # then run ${first} in Copilot Chat` }),
+  },
   verified: {
     date: '2026-10-19',
     docs: [
diff --git a/src/adapters/opencode.ts b/src/adapters/opencode.ts
index a72bb94..e24762d 100644
--- a/src/adapters/opencode.ts
+++ b/src/adapters/opencode.ts
@@ -4,6 +4,7 @@ import {
   commandName,
   frontmatter,
   generatedNotice,
+  openByHand,
   personaVariants,
   renderCommandBody,
   renderContext,
@@ -90,6 +91,11 @@ function renderConfig(input: AdapterInput): GeneratedFile {
 export const opencodeAdapter: Adapter = {
   id: 'opencode',
   name: 'OpenCode',
+  session: {
+    enterWorktree: false,
+    newConversation: '/new',
+    resume: (worktree, first) => openByHand('opencode', worktree, first),
+  },
   testedNote:
     'live-tested in the TUI (2.1.1, acceptance 2026-10-20); invoking mandaos non-interactively needs OpenCode 2 server API (session.command): OPEN',
   verified: {
diff --git a/src/adapters/shared.ts b/src/adapters/shared.ts
index 71d1d15..8c1357f 100644
--- a/src/adapters/shared.ts
+++ b/src/adapters/shared.ts
@@ -5,6 +5,11 @@ import type { ResolvedCommand, ResolvedPersona } from '../resolver/resolve.js';
 import { type Capability, type Effort, type HarnessId, TIERS } from '../schemas/index.js';
 import type { AdapterInput } from './types.js';
 
+/** The resume text of a harness that is opened by hand from the worktree. */
+export const openByHand = (harness: string, worktree: string, first: string) => ({
+  text: `cd ${JSON.stringify(worktree)}   # open ${harness} there and run ${first}`,
+});
+
 export const commandName = (id: string) => `mandao-${id}`;
 
 export const generatedNotice = (version: string, from: string) =>
diff --git a/src/adapters/types.ts b/src/adapters/types.ts
index 19379ab..a8e2008 100644
--- a/src/adapters/types.ts
+++ b/src/adapters/types.ts
@@ -31,6 +31,14 @@ export interface AdapterOutput {
   warnings: string[];
 }
 
+/** Per-harness session facts; `newConversation` is the in-place action, absent when there is none; `resume` opens it in a worktree. */
+export interface HarnessSession {
+  enterWorktree: boolean;
+  newConversation?: string;
+  /** Pure: the exact command that opens the harness in the worktree with the first mandao; `launch` when `--open` can run it. */
+  resume(worktree: string, first: string): { text: string; launch?: string[] };
+}
+
 /** A pure function from resolved canonical content to harness files. No I/O. */
 export interface Adapter {
   id: HarnessId;
@@ -41,5 +49,7 @@ export interface Adapter {
   experimental?: string;
   /** How far it was tested live, when that limits how it is used: `doctor` shows it. */
   testedNote?: string;
+  /** What the harness offers for a session: entering a worktree in place and its new-conversation action (spec D2). */
+  session: HarnessSession;
   render(input: AdapterInput): AdapterOutput;
 }
diff --git a/src/cli/approve.ts b/src/cli/approve.ts
index 43f48f3..6e2d722 100644
--- a/src/cli/approve.ts
+++ b/src/cli/approve.ts
@@ -27,7 +27,8 @@ import type { CliContext } from './context.js';
 import { json } from './json.js';
 import { SPEC_STEPS } from './run-ledger.js';
 import { specPremiseFindings } from './run-premise.js';
-import { newSessionCommand } from './session-advice.js';
+import { newSessionAdvice } from './session-advice.js';
+import { harnessOption } from './spec-context.js';
 
 /** Who approves: the person at the terminal, as git knows them; never a model. */
 function approver(cwd: string, by?: string): string {
@@ -95,6 +96,7 @@ interface ApproveOptions {
   note?: string;
   byRunning?: string;
   words?: string;
+  harness?: string;
 }
 
 function budgetTo(to: string | undefined): number | 'none' {
@@ -199,9 +201,11 @@ export function registerApprove(program: Command, ctx: CliContext) {
     .option('--note <text>', 'a note kept with the approval')
     .option('--by-running <command>', 'approve because the person ran this command; asks first when something is open or changed')
     .option('--words <text>', 'with --by-running: what the person wrote next to the command, recorded verbatim')
+    .option('--harness <id>', 'the harness running this session (default: claude)')
     .action((ref: string, step: string, o: ApproveOptions) => {
       if (!(APPROVAL_STEPS as readonly string[]).includes(step)) throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
       const s = step as ApprovalStep;
+      const harness = harnessOption(o.harness); // before anything is approved
       const config = readConfig(ctx.root());
       const spec = readSpec(findSpec(ctx.root(), config, ref));
       const problems = blockers(spec, s);
@@ -221,7 +225,7 @@ export function registerApprove(program: Command, ctx: CliContext) {
       const commit = commitApproval(config, spec, s);
       // A natural boundary with a human pause, and the most turns still ahead: implement starts in a new
       // session from the checkpoint instead of re-reading the specify context (ADR 0038).
-      const newSession = s === 'spec' || s === 'tasks' ? { newSession: newSessionCommand(config, spec, 'implement') } : {};
+      const newSession = s === 'spec' || s === 'tasks' ? { newSession: newSessionAdvice(harness, spec, 'implement') } : {};
       const next = nextFor(readSpec(spec.dir), config);
       json({
         ...(o.byRunning ? { result: 'go' } : {}),
diff --git a/src/cli/run-leader.ts b/src/cli/run-leader.ts
index 7b403e6..69f9373 100644
--- a/src/cli/run-leader.ts
+++ b/src/cli/run-leader.ts
@@ -276,7 +276,7 @@ function registerImplementSummary(run: Command, ctx: CliContext) {
     .action((ref: string, o: { harness?: string }) => {
       const { config, spec } = loadSpec(ctx, ref);
       const state = commitState(spec, config.commits.trailers);
-      const cut = verifyCut(config, spec, harnessOption(o.harness));
+      const cut = verifyCut(spec, harnessOption(o.harness));
       json({ ...implementSummary(spec, state.committed, state.pending), ...(cut ? { session: cut } : {}) });
     });
 }
diff --git a/src/cli/session-advice.ts b/src/cli/session-advice.ts
index e168bdb..f64d861 100644
--- a/src/cli/session-advice.ts
+++ b/src/cli/session-advice.ts
@@ -1,5 +1,6 @@
+import { ADAPTERS } from '../adapters/index.js';
 import { readRecommendations } from '../models/load.js';
-import type { Config } from '../schemas/index.js';
+import type { Config, HarnessId } from '../schemas/index.js';
 import { repoRoot } from '../scripts/commits.js';
 import { findClaudeTranscript } from '../scripts/session-cost.js';
 import {
@@ -26,12 +27,27 @@ function claudeSession(harness: string) {
 const tasksLeft = (spec: SpecFolder) => spec.tasks.filter((t) => !t.done).length;
 const specId = (spec: SpecFolder) => spec.story?.meta.id ?? spec.name;
 
-/** The command that continues the spec in a new session, from its worktree. */
-export function newSessionCommand(config: Config, spec: SpecFolder, command: string): string {
-  return openCommand(config.harnesses[0] ?? 'claude', repoRoot(spec.dir), `/mandao-${command} ${specId(spec)}`).text;
+export interface SessionAdvice {
+  /** The harness's in-place new-conversation action; absent when it has none. */
+  action?: string;
+  /** The command to run once the new conversation is open. */
+  then: string;
+  /** The command that opens a session in the worktree. */
+  fallback: string;
 }
 
-export type StepCut = CutAdvice & { stop: boolean; minSavings: number };
+/** The harness's own new-conversation action, then the next command, with the open-session command as the fallback. */
+export function sessionAdvice(harness: string, worktree: string, first: string): SessionAdvice {
+  const action = ADAPTERS[harness as HarnessId]?.session.newConversation;
+  return { ...(action ? { action } : {}), then: first, fallback: openCommand(harness, worktree, first).text };
+}
+
+/** The advice to continue the spec in a new session, from its worktree. */
+export function newSessionAdvice(harness: string, spec: SpecFolder, command: string): SessionAdvice {
+  return sessionAdvice(harness, repoRoot(spec.dir), `/mandao-${command} ${specId(spec)}`);
+}
+
+export type StepCut = CutAdvice & { stop: boolean; minSavings: number; advice?: SessionAdvice };
 
 /**
  * At a task boundary inside implement (no row past STARTED): stop to suggest a cut only when it saves at
@@ -47,16 +63,18 @@ export function stepCut(config: Config, spec: SpecFolder, id: string, harness: s
   const stop = advice.cut && advice.savings >= minSavings;
   const decision = stop ? 'stop: suggest a new session' : advice.cut ? `go on: below ${minSavings}` : 'stay';
   recordCutEstimate(spec.dir, { at: now.toISOString(), task: id, session: s.context, tasksLeft: left, advice, decision });
-  return { ...advice, stop, minSavings };
+  return { ...advice, stop, minSavings, ...(stop ? { advice: newSessionAdvice(harness, spec, 'implement') } : {}) };
 }
 
 /** Between implement and verify (a human pause anyway): the rule alone decides, with the command to go on. */
-export function verifyCut(config: Config, spec: SpecFolder, harness: string, now = new Date()) {
+export function verifyCut(spec: SpecFolder, harness: string, now = new Date()) {
   const s = claudeSession(harness);
   if (!s) return undefined;
   const advice = cutAdvice(s.context, 0, s.price, now.getTime());
   recordCut(spec, 'verify', s.context, advice, now);
-  return { ...advice, ...(advice.cut ? { command: newSessionCommand(config, spec, 'verify') } : {}) };
+  if (!advice.cut) return advice;
+  const next = newSessionAdvice(harness, spec, 'verify');
+  return { ...advice, command: next.fallback, advice: next };
 }
 
 function recordCut(spec: SpecFolder, task: string, session: SessionContext, advice: CutAdvice, now: Date) {
diff --git a/src/cli/spec-context.ts b/src/cli/spec-context.ts
index f66acce..150ba24 100644
--- a/src/cli/spec-context.ts
+++ b/src/cli/spec-context.ts
@@ -10,7 +10,10 @@ import type { LoopContext } from '../spec/index.js';
 import { onPath } from '../util/which.js';
 import type { CliContext } from './context.js';
 
-/** What the spec scripts share: the spec, its project, models and loop context for a harness. */
+/**
+ * The active harness, one rule for `approve` and the `run` commands: `--harness` (validated), else `claude`.
+ * Claude Code (`CLAUDE_CODE_SESSION_ID` set) and the unset case both give `claude`; never `config.harnesses[0]`.
+ */
 export function harnessOption(value: string | undefined): HarnessId {
   const h = value ?? 'claude';
   if (!(HARNESS_IDS as readonly string[]).includes(h)) throw new Error(`Unknown harness "${h}"`);
diff --git a/src/cli/start.ts b/src/cli/start.ts
index bc7bf7e..a821f94 100644
--- a/src/cli/start.ts
+++ b/src/cli/start.ts
@@ -2,8 +2,10 @@ import { execFileSync, spawnSync } from 'node:child_process';
 import { existsSync } from 'node:fs';
 import { join, relative } from 'node:path';
 import type { Command } from 'commander';
+import { ADAPTERS } from '../adapters/index.js';
+import { openByHand } from '../adapters/shared.js';
 import { readConfig } from '../engine/files.js';
-import type { Config } from '../schemas/index.js';
+import type { Config, HarnessId } from '../schemas/index.js';
 import { excerpt } from '../scripts/gates.js';
 import { runTests, type TestRun } from '../scripts/run-tests.js';
 import { proposeSpec, type SpecProposal } from '../scripts/spec.js';
@@ -42,17 +44,8 @@ export function parseRequest(words: string[]): { id?: string; title: string } {
 
 /** The exact command that opens each harness in the worktree with the first mandao; `launch` when `--open` can run it. */
 export function openCommand(harness: string, worktree: string, first: string): { text: string; launch?: string[] } {
-  const cd = `cd ${JSON.stringify(worktree)}`;
-  switch (harness) {
-    case 'claude':
-      return { text: `${cd} && claude ${JSON.stringify(first)}`, launch: ['claude', first] };
-    case 'codex':
-      return { text: `${cd} && codex ${JSON.stringify(first.replace(/^\//, '$'))}`, launch: ['codex', first.replace(/^\//, '$')] };
-    case 'copilot':
-      return { text: `code ${JSON.stringify(worktree)}   # then run ${first} in Copilot Chat` };
-    default:
-      return { text: `${cd}   # open ${harness} there and run ${first}` };
-  }
+  const known = ADAPTERS[harness as HarnessId];
+  return known ? known.session.resume(worktree, first) : openByHand(harness, worktree, first);
 }
 
 const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
diff --git a/test/integration/approve.test.ts b/test/integration/approve.test.ts
index 5de6809..d85de34 100644
--- a/test/integration/approve.test.ts
+++ b/test/integration/approve.test.ts
@@ -82,7 +82,11 @@ describe('mandao approve: no model session', () => {
       commit: { committed: true },
       next: { recommended: { command: '/mandao-implement' } },
       // ADR 0038: implement starts in a new session from the worktree, not in the specify one.
-      newSession: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
+      newSession: {
+        action: '/clear',
+        then: '/mandao-implement MDO-0001',
+        fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
+      },
     });
     expect(git(root, 'log', '-1', '--format=%s')).toBe('📝 docs(mandao): approve the MDO-0001 spec');
   });
diff --git a/test/integration/leader-scripts.test.ts b/test/integration/leader-scripts.test.ts
index 59bbe31..b0d0417 100644
--- a/test/integration/leader-scripts.test.ts
+++ b/test/integration/leader-scripts.test.ts
@@ -1,5 +1,5 @@
 import { execFileSync } from 'node:child_process';
-import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
+import { cpSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
 import { join } from 'node:path';
 import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
 import { buildProgram } from '../../src/cli/program.js';
@@ -228,6 +228,90 @@ describe('Leader scripts', () => {
     expect(mid.session).toBeUndefined();
   });
 
+  test('S-3.1: approve in Claude Code advises /clear, then the next command, with the worktree command as the fallback', async () => {
+    const root = repo();
+    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'approve-session');
+    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec']);
+    // ASSUMPTION: the advice shape { action, then, fallback } (spec D4) replaces approve's `newSession` string.
+    expect(JSON.parse(out.at(-1)!).newSession).toEqual({
+      action: '/clear',
+      then: '/mandao-implement MDO-0001',
+      fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
+    });
+  });
+
+  test('S-3.1: the active harness (--harness), not config.harnesses[0], picks the action', async () => {
+    const root = repo();
+    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec', '--harness', 'codex']);
+    expect(JSON.parse(out.at(-1)!).newSession).toMatchObject({ action: '/new' });
+  });
+
+  test('S-3.1: implement-summary in Claude Code carries the same advice with the verify command', async () => {
+    const root = repo();
+    const session = 'cut-session-2';
+    const usage = (read: number, write: number) => ({
+      input_tokens: 0,
+      cache_read_input_tokens: read,
+      cache_creation_input_tokens: write,
+      cache_creation: { ephemeral_1h_input_tokens: write },
+    });
+    const turn = (id: string, read: number, write: number) =>
+      JSON.stringify({ timestamp: new Date().toISOString(), message: { id, model: 'claude-opus-5-5', usage: usage(read, write) } });
+    const home = makeTree({ [`projects/x/${session}.jsonl`]: `${turn('a', 0, 34_000)}\n${turn('b', 34_000, 126_000)}\n` });
+    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
+    vi.stubEnv('CLAUDE_CODE_SESSION_ID', session);
+    const summary = await run(root, 'implement-summary', 'MDO-0001');
+    expect(summary.session).toMatchObject({
+      cut: true,
+      advice: { action: '/clear', then: '/mandao-verify MDO-0001', fallback: expect.stringContaining('"/mandao-verify MDO-0001"') },
+    });
+  });
+
+  test('FR-3/D4: step that stops to suggest a cut carries session.advice for the harness (/clear, then the next command)', async () => {
+    const root = repo();
+    // A lower threshold than the 0.65 the fixture saves, so the rule says stop.
+    const cfg = join(root, '.mandao/config.yml');
+    writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nsession:\n  cut_min_savings: 0.5\n`);
+    const session = 'cut-session-stop';
+    const usage = (read: number, write: number) => ({
+      input_tokens: 0,
+      cache_read_input_tokens: read,
+      cache_creation_input_tokens: write,
+      cache_creation: { ephemeral_1h_input_tokens: write },
+    });
+    const turn = (id: string, read: number, write: number) =>
+      JSON.stringify({ timestamp: new Date().toISOString(), message: { id, model: 'claude-opus-5-5', usage: usage(read, write) } });
+    const home = makeTree({ [`projects/x/${session}.jsonl`]: `${turn('a', 0, 34_000)}\n${turn('b', 34_000, 126_000)}\n` });
+    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
+    vi.stubEnv('CLAUDE_CODE_SESSION_ID', session);
+    const step = await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief');
+    expect(step.session.stop).toBe(true);
+    expect(step.session.advice).toEqual({
+      action: '/clear',
+      then: '/mandao-implement MDO-0001',
+      fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
+    });
+  });
+
+  test('one active-harness rule: approve --harness bogus is rejected like run --harness bogus, and approves nothing', async () => {
+    const root = repo();
+    await expect(
+      buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec', '--harness', 'bogus']),
+    ).rejects.toThrow(/Unknown harness/);
+    expect(existsSync(logPath(join(root, SPEC), 'approvals.yml'))).toBe(false);
+  });
+
+  test('one active-harness rule: with no --harness and no session id the default is the run default (claude), not config.harnesses[0]', async () => {
+    const root = repo();
+    const cfg = join(root, '.mandao/config.yml');
+    writeFileSync(cfg, readFileSync(cfg, 'utf8').replace(/harnesses:\n\s*- claude/, 'harnesses:\n  - codex\n  - claude'));
+    expect(readFileSync(cfg, 'utf8')).toMatch(/- codex\n\s*- claude/);
+    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'x');
+    delete process.env.CLAUDE_CODE_SESSION_ID; // unstubAllEnvs restores the original value
+    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec']);
+    expect(JSON.parse(out.at(-1)!).newSession).toMatchObject({ action: '/clear' });
+  });
+
   test('MDO-0007: the scan-markers gate fails a changed test that lists folders without saying what it scans', async () => {
     const root = repo();
     writeFileSync(join(root, 'src/cli/skills.test.ts'), "import { readdirSync } from 'node:fs';\nreaddirSync('src');\n");

--- /dev/null
+++ b/test/unit/session-advice.test.ts (new file)
import { describe, expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
// ASSUMPTION (the spec fixes behavior, not names): `sessionAdvice(harness, worktree, first)` is exported from
// src/cli/session-advice.ts and returns `{ action, then, fallback }` (spec D4); `action` is undefined when the
// harness has no in-place new-conversation action.
import { sessionAdvice } from '../../src/cli/session-advice.js';
import { openCommand } from '../../src/cli/start.js';

const WORKTREE = '/work/MDO-0001-wt';
const FIRST = '/mandao-implement MDO-0001';

describe('session advice: the active harness own new-conversation action (FR-3)', () => {
  test('S-3.1: Claude Code reads /clear, then the next command, with the worktree command as the fallback', () => {
    expect(sessionAdvice('claude', WORKTREE, FIRST)).toEqual({
      action: '/clear',
      then: '/mandao-implement MDO-0001',
      fallback: `cd ${JSON.stringify(WORKTREE)} && claude "/mandao-implement MDO-0001"`,
    });
  });

  test.each([
    ['codex', '/new', 'codex'],
    ['opencode', '/new', 'opencode'],
  ])('S-3.2: %s names %s, then the next command, with its open command as the fallback', (harness, action, binary) => {
    const advice = sessionAdvice(harness, WORKTREE, FIRST);
    expect(advice.action).toBe(action);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
    expect(advice.fallback).toContain(binary);
    expect(advice.fallback).toContain('mandao-implement MDO-0001');
  });

  test('S-3.2: Copilot names "New chat" with its shortcuts', () => {
    const advice = sessionAdvice('copilot', WORKTREE, FIRST);
    expect(advice.action).toMatch(/New chat/);
    expect(advice.action).toMatch(/Ctrl\+N/);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
  });

  test('S-3.2: Antigravity names its shortcuts', () => {
    const advice = sessionAdvice('antigravity', WORKTREE, FIRST);
    expect(advice.action).toMatch(/Ctrl\+N/);
    expect(advice.action).not.toMatch(/\/clear|\/new/);
    expect(advice.then).toContain('mandao-implement MDO-0001');
    expect(advice.fallback).toContain(WORKTREE);
  });

  test('S-3.2/C2: a harness with no in-place action gets the open-session command and no action', () => {
    const advice = sessionAdvice('no-such-harness', WORKTREE, FIRST);
    expect(advice.action).toBeUndefined();
    expect(advice.fallback).toContain(WORKTREE);
    expect(advice.fallback).toContain('mandao-implement MDO-0001');
  });
});

describe('D2: resume is part of each adapter session facts', () => {
  const expected: Record<string, string> = {
    claude: `cd "/work/wt" && claude "/mandao-implement MDO-0001"`,
    codex: `cd "/work/wt" && codex "$mandao-implement MDO-0001"`,
    copilot: `code "/work/wt"   # then run /mandao-implement MDO-0001 in Copilot Chat`,
    opencode: `cd "/work/wt"   # open opencode there and run /mandao-implement MDO-0001`,
    antigravity: `cd "/work/wt"   # open antigravity there and run /mandao-implement MDO-0001`,
  };
  test.each(Object.keys(expected))('%s: session.resume equals today openCommand, and is the advice fallback', (id) => {
    const facts = ADAPTERS[id as keyof typeof ADAPTERS].session as unknown as {
      resume: (worktree: string, first: string) => { text: string; launch?: string[] };
    };
    expect(typeof facts.resume).toBe('function');
    const resumed = facts.resume('/work/wt', '/mandao-implement MDO-0001');
    expect(resumed.text).toBe(expected[id]);
    expect(resumed).toEqual(openCommand(id, '/work/wt', '/mandao-implement MDO-0001'));
    expect(sessionAdvice(id, '/work/wt', '/mandao-implement MDO-0001').fallback).toBe(expected[id]);
  });
});

```
