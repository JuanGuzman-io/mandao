# Review pack — T2, attempt 1

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T2-1.md`.

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
    "attempt": 1,
    "failsAtTier": 0,
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
    "changed": []
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
index 3308c92..84d3798 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -55,8 +55,12 @@ approved and when in `_log/approvals.yml`, and makes the spec commit. No model r
 tokens.
 
 - `close` records which proposals you approved (`--items`); `/mandao-close` applies them.
-- After approving the spec or the tasks, `approve` prints the command (`newSession`) that starts
-  `/mandao-implement` in a new session from the worktree (ADR 0038).
+- After approving the spec or the tasks, `approve` prints `newSession: { action, then, fallback }`: the
+  active harness's own new-conversation action (`/clear` in Claude Code, `/new` in Codex and OpenCode,
+  "New chat" in Copilot, Ctrl+N in Antigravity), the command to run then (`/mandao-implement`), and the
+  command that opens a session in the worktree (ADR 0038). The harness is `--harness <id>`, else Claude
+  Code when `CLAUDE_CODE_SESSION_ID` is set, else the first configured one. `run implement-summary`
+  adds the same shape as `session.advice` (keeping `session.command`) when a cut is advised.
 - `budget --to <usd|none>` sets or removes this spec's spend cap (ADR 0036).
 - `approve` ends with `next`: `{ recommended: { command, reason }, options }`, the commands that can follow
   the spec's state. It only recommends; the person runs the command.
diff --git a/docs/diagrams/src/lifecycle.json b/docs/diagrams/src/lifecycle.json
index 5db105d..577b3f3 100644
--- a/docs/diagrams/src/lifecycle.json
+++ b/docs/diagrams/src/lifecycle.json
@@ -55,7 +55,7 @@
     },
     {
       "path": "src/cli/approve.ts",
-      "sha256": "c395417183c658c151fdbb40c903aaf2e3b4e23995c82062f0419698362639ff"
+      "sha256": "5d746697e4d3b40db2fbc5daa5d6364f24552d386f9d4f05bc6c7f379db6effe"
     },
     {
       "path": "src/schemas/common.ts",
diff --git a/src/adapters/AGENTS.md b/src/adapters/AGENTS.md
index d42df03..8f3345b 100644
--- a/src/adapters/AGENTS.md
+++ b/src/adapters/AGENTS.md
@@ -4,6 +4,8 @@ Purpose: pure functions `render(input) → { files, warnings }` (ADR 0007). No f
 
 - Contract: `types.ts` (`Adapter`, `AdapterInput`, `GeneratedFile`). Each adapter records `verified`
   (date + official docs) for its target format.
+- Session facts: each adapter declares `session: { enterWorktree, newConversation }` (spec MDO-0010 D2);
+  `src/cli/session-advice.ts` reads it for the cut advice. `newConversation` is absent when there is no in-place action.
 - Shared helpers in `shared.ts`: capability mapping, persona variants per role/tier, body rendering.
 - `agents-md.ts` writes managed blocks only (`<!-- mandao:begin/end -->`).
 
diff --git a/src/adapters/antigravity.ts b/src/adapters/antigravity.ts
index 9ee057e..388d08b 100644
--- a/src/adapters/antigravity.ts
+++ b/src/adapters/antigravity.ts
@@ -39,6 +39,7 @@ function renderAgents(input: AdapterInput): GeneratedFile[] {
 export const antigravityAdapter: Adapter = {
   id: 'antigravity',
   name: 'Antigravity',
+  session: { enterWorktree: false, newConversation: '⌘N / Ctrl+N' },
   experimental:
     'not live-tested: covered by snapshot tests only (no Antigravity account); its formats moved this month (workflows became skills on 2026-10-19) and skill arguments and agent tool names are not documented',
   verified: {
diff --git a/src/adapters/claude.ts b/src/adapters/claude.ts
index af5e0f5..93845ba 100644
--- a/src/adapters/claude.ts
+++ b/src/adapters/claude.ts
@@ -51,6 +51,7 @@ const syntax: TokenSyntax = {
 export const claudeAdapter: Adapter = {
   id: 'claude',
   name: 'Claude Code',
+  session: { enterWorktree: true, newConversation: '/clear' },
   verified: { date: '2026-10-19', docs: ['https://code.claude.com/docs/en/skills'] },
   render(input) {
     const ctx = renderContext(input, 'claude');
diff --git a/src/adapters/codex.ts b/src/adapters/codex.ts
index 087ac76..75bfdc8 100644
--- a/src/adapters/codex.ts
+++ b/src/adapters/codex.ts
@@ -68,6 +68,7 @@ function renderRules(input: AdapterInput): GeneratedFile {
 export const codexAdapter: Adapter = {
   id: 'codex',
   name: 'Codex',
+  session: { enterWorktree: false, newConversation: '/new' },
   verified: {
     date: '2026-10-20',
     docs: [
diff --git a/src/adapters/copilot.ts b/src/adapters/copilot.ts
index b0a5b0e..25b07fd 100644
--- a/src/adapters/copilot.ts
+++ b/src/adapters/copilot.ts
@@ -44,6 +44,7 @@ const syntax: TokenSyntax = {
 export const copilotAdapter: Adapter = {
   id: 'copilot',
   name: 'GitHub Copilot',
+  session: { enterWorktree: false, newConversation: 'New chat (⌘N / Ctrl+N)' },
   verified: {
     date: '2026-10-19',
     docs: [
diff --git a/src/adapters/opencode.ts b/src/adapters/opencode.ts
index a72bb94..a877096 100644
--- a/src/adapters/opencode.ts
+++ b/src/adapters/opencode.ts
@@ -90,6 +90,7 @@ function renderConfig(input: AdapterInput): GeneratedFile {
 export const opencodeAdapter: Adapter = {
   id: 'opencode',
   name: 'OpenCode',
+  session: { enterWorktree: false, newConversation: '/new' },
   testedNote:
     'live-tested in the TUI (2.1.1, acceptance 2026-10-20); invoking mandaos non-interactively needs OpenCode 2 server API (session.command): OPEN',
   verified: {
diff --git a/src/adapters/types.ts b/src/adapters/types.ts
index 19379ab..afd7bac 100644
--- a/src/adapters/types.ts
+++ b/src/adapters/types.ts
@@ -31,6 +31,12 @@ export interface AdapterOutput {
   warnings: string[];
 }
 
+/** Per-harness session facts; `newConversation` is the in-place action, absent when there is none. */
+export interface HarnessSession {
+  enterWorktree: boolean;
+  newConversation?: string;
+}
+
 /** A pure function from resolved canonical content to harness files. No I/O. */
 export interface Adapter {
   id: HarnessId;
@@ -41,5 +47,7 @@ export interface Adapter {
   experimental?: string;
   /** How far it was tested live, when that limits how it is used: `doctor` shows it. */
   testedNote?: string;
+  /** What the harness offers for a session: entering a worktree in place and its new-conversation action (spec D2). */
+  session: HarnessSession;
   render(input: AdapterInput): AdapterOutput;
 }
diff --git a/src/cli/approve.ts b/src/cli/approve.ts
index 43f48f3..a33cd8c 100644
--- a/src/cli/approve.ts
+++ b/src/cli/approve.ts
@@ -27,7 +27,7 @@ import type { CliContext } from './context.js';
 import { json } from './json.js';
 import { SPEC_STEPS } from './run-ledger.js';
 import { specPremiseFindings } from './run-premise.js';
-import { newSessionCommand } from './session-advice.js';
+import { activeHarness, newSessionAdvice } from './session-advice.js';
 
 /** Who approves: the person at the terminal, as git knows them; never a model. */
 function approver(cwd: string, by?: string): string {
@@ -95,6 +95,7 @@ interface ApproveOptions {
   note?: string;
   byRunning?: string;
   words?: string;
+  harness?: string;
 }
 
 function budgetTo(to: string | undefined): number | 'none' {
@@ -199,6 +200,10 @@ export function registerApprove(program: Command, ctx: CliContext) {
     .option('--note <text>', 'a note kept with the approval')
     .option('--by-running <command>', 'approve because the person ran this command; asks first when something is open or changed')
     .option('--words <text>', 'with --by-running: what the person wrote next to the command, recorded verbatim')
+    .option(
+      '--harness <id>',
+      'the harness running this session (default: Claude Code when its session id is set, else the first configured)',
+    )
     .action((ref: string, step: string, o: ApproveOptions) => {
       if (!(APPROVAL_STEPS as readonly string[]).includes(step)) throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
       const s = step as ApprovalStep;
@@ -221,7 +226,8 @@ export function registerApprove(program: Command, ctx: CliContext) {
       const commit = commitApproval(config, spec, s);
       // A natural boundary with a human pause, and the most turns still ahead: implement starts in a new
       // session from the checkpoint instead of re-reading the specify context (ADR 0038).
-      const newSession = s === 'spec' || s === 'tasks' ? { newSession: newSessionCommand(config, spec, 'implement') } : {};
+      const newSession =
+        s === 'spec' || s === 'tasks' ? { newSession: newSessionAdvice(activeHarness(config, o.harness), spec, 'implement') } : {};
       const next = nextFor(readSpec(spec.dir), config);
       json({
         ...(o.byRunning ? { result: 'go' } : {}),
diff --git a/src/cli/session-advice.ts b/src/cli/session-advice.ts
index e168bdb..e3aec8f 100644
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
@@ -26,9 +27,29 @@ function claudeSession(harness: string) {
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
+}
+
+/** The harness's own new-conversation action, then the next command, with the open-session command as the fallback. */
+export function sessionAdvice(harness: string, worktree: string, first: string): SessionAdvice {
+  const action = ADAPTERS[harness as HarnessId]?.session.newConversation;
+  return { ...(action ? { action } : {}), then: first, fallback: openCommand(harness, worktree, first).text };
+}
+
+/** The active harness: `--harness`, else Claude Code when its session id is set, else the first configured one. */
+export function activeHarness(config: Config, option?: string): string {
+  return option ?? (process.env.CLAUDE_CODE_SESSION_ID ? 'claude' : (config.harnesses[0] ?? 'claude'));
+}
+
+/** The advice to continue the spec in a new session, from its worktree. */
+export function newSessionAdvice(harness: string, spec: SpecFolder, command: string): SessionAdvice {
+  return sessionAdvice(harness, repoRoot(spec.dir), `/mandao-${command} ${specId(spec)}`);
 }
 
 export type StepCut = CutAdvice & { stop: boolean; minSavings: number };
@@ -51,12 +72,17 @@ export function stepCut(config: Config, spec: SpecFolder, id: string, harness: s
 }
 
 /** Between implement and verify (a human pause anyway): the rule alone decides, with the command to go on. */
-export function verifyCut(config: Config, spec: SpecFolder, harness: string, now = new Date()) {
+export function verifyCut(_config: Config, spec: SpecFolder, harness: string, now = new Date()) {
   const s = claudeSession(harness);
   if (!s) return undefined;
   const advice = cutAdvice(s.context, 0, s.price, now.getTime());
   recordCut(spec, 'verify', s.context, advice, now);
-  return { ...advice, ...(advice.cut ? { command: newSessionCommand(config, spec, 'verify') } : {}) };
+  return {
+    ...advice,
+    ...(advice.cut
+      ? { command: newSessionAdvice(harness, spec, 'verify').fallback, advice: newSessionAdvice(harness, spec, 'verify') }
+      : {}),
+  };
 }
 
 function recordCut(spec: SpecFolder, task: string, session: SessionContext, advice: CutAdvice, now: Date) {
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
index 59bbe31..f8dbec3 100644
--- a/test/integration/leader-scripts.test.ts
+++ b/test/integration/leader-scripts.test.ts
@@ -228,6 +228,45 @@ describe('Leader scripts', () => {
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
   test('MDO-0007: the scan-markers gate fails a changed test that lists folders without saying what it scans', async () => {
     const root = repo();
     writeFileSync(join(root, 'src/cli/skills.test.ts'), "import { readdirSync } from 'node:fs';\nreaddirSync('src');\n");

--- /dev/null
+++ b/test/unit/session-advice.test.ts (new file)
import { describe, expect, test } from 'vitest';
// ASSUMPTION (the spec fixes behavior, not names): `sessionAdvice(harness, worktree, first)` is exported from
// src/cli/session-advice.ts and returns `{ action, then, fallback }` (spec D4); `action` is undefined when the
// harness has no in-place new-conversation action.
import { sessionAdvice } from '../../src/cli/session-advice.js';

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

```
