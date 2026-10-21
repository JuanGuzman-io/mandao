# Review pack — T4, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T4-2.md`.

## Brief

```json
{
  "spec": "MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/spec/kaizen-sessions.ts",
      "src/spec/index.ts",
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "test/unit/kaizen-sessions.test.ts"
    ],
    "exemplar": "src/spec/kaizen-costs.ts",
    "ac": [
      "AC-4",
      "AC-4/C1",
      "AC-4/C2"
    ],
    "scenarios": [
      "S-4.1",
      "S-4.2",
      "S-4.3",
      "S-4.3/C1",
      "S-4.4",
      "S-4.4/C2"
    ],
    "test_levels": {
      "S-4.1": "unit",
      "S-4.2": "unit",
      "S-4.3": "unit",
      "S-4.3/C1": "unit",
      "S-4.4": "unit",
      "S-4.4/C2": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "public-api"
    ],
    "depends_on": [
      "T3"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/kaizen-sessions.test.ts test/unit/kaizen.test.ts test/integration/close.test.ts",
    "tests": {
      "unit": [
        "S-4.1",
        "S-4.2",
        "S-4.3",
        "S-4.3/C1",
        "S-4.4",
        "S-4.4/C2"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T4",
    "title": "Kaizen compares with the session-cut constants and proposes new values",
    "done": false,
    "line": 114
  },
  "acceptance": [
    {
      "ref": "AC-4",
      "text": "**GIVEN** specs with measured sessions · **WHEN** Kaizen compares across specs · **THEN** it shows each session-cut constant next to its measured value and each logged estimate of turns left next to the turns that followed, and proposes a new value for a constant whose measurement differs · **BUT it must NOT** propose a value from fewer specs than the minimum it states · **BUT it must NOT** change the constants itself"
    },
    {
      "ref": "AC-4/C1",
      "text": "**BUT it must NOT** propose a value from fewer specs than the minimum it states"
    },
    {
      "ref": "AC-4/C2",
      "text": "**BUT it must NOT** change the constants itself"
    }
  ],
  "scenarios": [
    {
      "ref": "S-4.1",
      "text": "**Given** 3 specs whose tasks average 22 main turns and whose verify plus close average 28 · **When** `mandao run kaizen-compare` runs · **Then** `TURNS_PER_TASK` shows 15 against 22 with the sample size and a proposal of 22; `TURNS_AFTER_TASKS` shows 28 against 28 and no proposal"
    },
    {
      "ref": "S-4.2",
      "text": "**Given** a `_log/session-cuts.md` row estimating 43 turns left at T2's boundary, and 51 main turns in the spec's sessions after that time up to the close record · **When** `mandao run kaizen-compare` runs · **Then** the row shows estimated 43 and actual 51, and the mean error over all rows is reported"
    },
    {
      "ref": "S-4.3",
      "text": "**Given** measurements from 2 specs · **When** `mandao run kaizen-compare` runs · **Then** the measured values and `n: 2` are shown, the result says `insufficient data (minimum 3)`, and no value is proposed"
    },
    {
      "ref": "S-4.3/C1",
      "text": "**Then** the measured values and `n: 2` are shown, the result says `insufficient data (minimum 3)`, and no value is proposed"
    },
    {
      "ref": "S-4.4",
      "text": "**Given** any comparison with proposals · **When** `mandao run kaizen-compare` runs · **Then** `src/scripts/session-cut.ts` and every config file are unchanged"
    },
    {
      "ref": "S-4.4/C2",
      "text": "**Then** `src/scripts/session-cut.ts` and every config file are unchanged"
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
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`, generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [
    "security"
  ],
  "loop": {
    "task": "T4",
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
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "files": [
      "src/spec/kaizen-sessions.ts",
      "src/spec/index.ts",
      "src/cli/run-close.ts",
      "core/commands/close.md",
      "test/unit/kaizen-sessions.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/review.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/commits-times.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/session-turns.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/spec/kaizen-sessions.ts src/spec/index.ts src/cli/run-close.ts core/commands/close.md test/unit/kaizen-sessions.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/ledger.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/review.test.ts test/integration/scripts.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/commits-times.test.ts test/unit/diagram.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts test/unit/kaizen.test.ts test/unit/pr-plan.test.ts test/unit/release.test.ts test/unit/render.test.ts test/unit/session-turns.test.ts test/unit/spec.test.ts test/unit/task-index.test.ts test/unit/verify.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/approve.ts",
      "src/cli/run-cost.ts",
      "src/cli/run-diagram.ts",
      "src/cli/run-leader.ts",
      "src/cli/run-ledger.ts",
      "src/cli/run-premise.ts",
      "src/cli/run-red.ts",
      "src/cli/run-spec.ts",
      "src/cli/run-verify.ts",
      "src/cli/spec-context.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-specs.ts",
      "src/scripts/brief.ts",
      "src/scripts/checkpoint.ts",
      "src/scripts/commits.ts",
      "src/scripts/forced.ts",
      "src/scripts/publish.ts",
      "src/scripts/red.ts",
      "src/scripts/review.ts",
      "src/scripts/session-turns.ts",
      "src/scripts/spec.ts",
      "test/integration/approve.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/ledger.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/scripts.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/diagram.test.ts",
      "test/unit/kaizen.test.ts",
      "test/unit/pr-plan.test.ts",
      "test/unit/release.test.ts",
      "test/unit/render.test.ts",
      "test/unit/spec.test.ts",
      "test/unit/task-index.test.ts",
      "test/unit/verify.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/kaizen-sessions.test.ts"
    ],
    "changed": [
      "test/unit/kaizen-sessions.test.ts"
    ]
  }
}
```

## Gates — T4, attempt 2

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
diff --git a/core/commands/close.md b/core/commands/close.md
index 76f79ee..99ae542 100644
--- a/core/commands/close.md
+++ b/core/commands/close.md
@@ -53,6 +53,10 @@ instructions.
 2. **Sessions:** show `sessions` from that JSON under `## Sessions` in the Kaizen document: the pauses, the turns per task, verify, close and after
    tasks, and the missing sessions. A missing session is never shown as zero; `'not recorded'` and
    `'not measured'` are shown as that text.
+   Also report `sessionCut` from the `{{script:kaizen-compare}}` JSON: each session-cut constant next to its
+   measured value with its sample size `n`, and each logged estimate of turns left next to the turns that
+   followed, with the mean absolute error. Below the minimum (3 specs) write "insufficient data (minimum 3)" and
+   propose nothing. Proposals are recommendations only: Mandao never changes the constants.
 3. **Learn:** 0–3 root-cause lessons, each with evidence. **Standardize:** 1–3 one-line edits, each for
    approval. Write `docs/kaizen/<ID>.md` from `{{template:close/kaizen.md}}`.
 
diff --git a/src/cli/run-close.ts b/src/cli/run-close.ts
index cf0865c..f3f2b32 100644
--- a/src/cli/run-close.ts
+++ b/src/cli/run-close.ts
@@ -26,6 +26,7 @@ import {
   planTasks,
   prPlan,
   renderCloseSummary,
+  sessionCutKaizen,
   specMetrics,
   summarizeCosts,
   verifyResults,
@@ -116,7 +117,8 @@ function registerKaizen(run: Command, ctx: CliContext) {
         folders.map((s) => ({ spec: s.name, costs: specCosts(s.dir), tasks: s.tasks, rows: s.execution })),
         leaderSwitch(ctx.root(), config),
       );
-      json({ ...compareTdd(metrics, config.kaizen.min_specs_per_group), costs, specs: metrics });
+      const sessionCut = sessionCutKaizen(folders.map((s) => ({ spec: s.name, measure: sessionsOf(config, s) })));
+      json({ ...compareTdd(metrics, config.kaizen.min_specs_per_group), costs, sessionCut, specs: metrics });
     });
 }
 
diff --git a/src/spec/index.ts b/src/spec/index.ts
index 5a80b6a..1c5c7ad 100644
--- a/src/spec/index.ts
+++ b/src/spec/index.ts
@@ -7,6 +7,7 @@ export * from './diagram-graph.js';
 export * from './execution.js';
 export * from './kaizen.js';
 export * from './kaizen-costs.js';
+export * from './kaizen-sessions.js';
 export * from './loop.js';
 export * from './markdown.js';
 export * from './plan.js';

--- /dev/null
+++ b/src/spec/kaizen-sessions.ts (new file)
import { RELOAD_TOKENS, TURNS_AFTER_TASKS, TURNS_PER_TASK } from '../scripts/session-cut.js';
import type { SessionMeasure } from '../scripts/session-turns.js';

export interface SessionCutInput {
  spec: string;
  measure: SessionMeasure;
}

export interface ConstantComparison {
  constant: number;
  /** Mean of the measurements; absent when nothing was measured. */
  measured?: number;
  /** Sample size: the specs with a measurement for this constant. */
  n: number;
  /** A new value, only when the difference is over `PROPOSAL_THRESHOLD` and `n` reaches the minimum. */
  proposal?: number;
  result?: string;
}

export interface EstimateRow {
  spec: string;
  at: string;
  task: string;
  estimated: number;
  actual?: number;
}

export interface SessionCutKaizen {
  turnsPerTask: ConstantComparison;
  turnsAfterTasks: ConstantComparison;
  reloadTokens: ConstantComparison;
  /** `meanError` is the mean absolute error over the rows with an actual. */
  estimates: { rows: EstimateRow[]; meanError?: number };
}

/** D4: propose only when the measurement differs by more than this share. */
const PROPOSAL_THRESHOLD = 0.2;

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;
const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;

function compare(constant: number, values: number[], specs: number, minSpecs: number): ConstantComparison {
  if (!values.length) return { constant, n: 0, result: `insufficient data (minimum ${minSpecs})` };
  const measured = mean(values);
  const base = { constant, measured: round(measured), n: specs };
  if (specs < minSpecs) return { ...base, result: `insufficient data (minimum ${minSpecs})` };
  if (Math.abs(measured - constant) / constant <= PROPOSAL_THRESHOLD) return base;
  return { ...base, proposal: Math.round(measured) };
}

/**
 * Kaizen's session-cut view across specs: each constant of the cut rule next to what was measured, and the
 * logged estimates of turns left next to the turns that followed. Advice only: Mandao never changes the
 * constants. Below `minSpecs` specs it shows the numbers and proposes nothing.
 */
export function sessionCutKaizen(inputs: SessionCutInput[], minSpecs = 3): SessionCutKaizen {
  const measures = inputs.map((i) => i.measure);
  const perSpecTasks = measures.map((m) => Object.values(m.tasks));
  const taskTurns = perSpecTasks.flat();
  // D4: only specs with verify and close recorded; close runs this before its own record exists.
  const afterTasks = measures.flatMap((m) =>
    m.verify !== undefined && typeof m.close === 'number' && m.afterTasks !== undefined ? [m.afterTasks] : [],
  );
  const reloads = measures.flatMap((m) => (m.reload === undefined ? [] : [m.reload]));
  const rows: EstimateRow[] = inputs.flatMap(({ spec, measure }) => measure.estimates.map((e) => ({ spec, ...e })));
  const errors = rows.flatMap((r) => (r.actual === undefined ? [] : [Math.abs(r.actual - r.estimated)]));
  return {
    turnsPerTask: compare(TURNS_PER_TASK, taskTurns, perSpecTasks.filter((t) => t.length).length, minSpecs),
    turnsAfterTasks: compare(TURNS_AFTER_TASKS, afterTasks, afterTasks.length, minSpecs),
    reloadTokens: compare(RELOAD_TOKENS, reloads, reloads.length, minSpecs),
    estimates: { rows, ...(errors.length ? { meanError: round(mean(errors)) } : {}) },
  };
}

--- /dev/null
+++ b/test/unit/kaizen-sessions.test.ts (new file)
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { RELOAD_TOKENS, TURNS_AFTER_TASKS, TURNS_PER_TASK } from '../../src/scripts/session-cut.js';
import type { SessionMeasure } from '../../src/scripts/session-turns.js';
import { sessionCutKaizen } from '../../src/spec/kaizen-sessions.js';
import { makeTree } from '../helpers.js';

const INSUFFICIENT = 'insufficient data (minimum 3)';

const measure = (over: Partial<SessionMeasure> = {}): SessionMeasure => ({
  missing: [],
  tasks: {},
  unmeasured: [],
  close: 'not recorded',
  estimates: [],
  ...over,
});
/** A spec whose verify and close are recorded, so its afterTasks counts (D4). */
const recorded = { verify: 10, close: 8 } as const;
const input = (spec: string, over: Partial<SessionMeasure> = {}) => ({ spec, measure: measure(over) });

describe('sessionCutKaizen: constants against measurements (FR-4, D4)', () => {
  // S-4.1
  test('S-4.1: tasks averaging 22 turns propose 22 for TURNS_PER_TASK; 28 against 28 proposes nothing', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 20, T2: 24 }, afterTasks: 28, ...recorded }),
      input('B', { tasks: { T1: 22 }, afterTasks: 26, ...recorded }),
      input('C', { tasks: { T1: 21, T2: 23, T3: 22 }, afterTasks: 30, ...recorded }),
    ]);
    expect(k.turnsPerTask.constant).toBe(15);
    expect(k.turnsPerTask.constant).toBe(TURNS_PER_TASK);
    expect(k.turnsPerTask.measured).toBe(22);
    expect(k.turnsPerTask.n).toBe(3);
    expect(k.turnsPerTask.proposal).toBe(22);
    expect(k.turnsAfterTasks.constant).toBe(TURNS_AFTER_TASKS);
    expect(k.turnsAfterTasks.measured).toBe(28);
    expect(k.turnsAfterTasks.n).toBe(3);
    expect(k.turnsAfterTasks.proposal).toBeUndefined();
  });

  test('the proposal is the measured value rounded', () => {
    const k = sessionCutKaizen([input('A', { tasks: { T1: 22 } }), input('B', { tasks: { T1: 22 } }), input('C', { tasks: { T1: 23 } })]);
    expect(k.turnsPerTask.measured).toBeCloseTo(22.33, 1);
    expect(k.turnsPerTask.proposal).toBe(22);
  });

  test('a proposal needs a difference of more than 20%: exactly 20% proposes nothing, above it proposes', () => {
    const at = (v: number) => sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: v } })));
    expect(at(18).turnsPerTask.proposal).toBeUndefined(); // 15 -> 18 is exactly 20%
    expect(at(16).turnsPerTask.proposal).toBeUndefined();
    expect(at(19).turnsPerTask.proposal).toBe(19);
  });

  test('a spec without verify or without a recorded close is left out of the mean and n of TURNS_AFTER_TASKS', () => {
    const k = sessionCutKaizen([
      input('A', { afterTasks: 28, ...recorded }),
      input('B', { afterTasks: 100, verify: undefined, close: 8 }),
      input('C', { afterTasks: 100, verify: 10, close: 'not recorded' }),
    ]);
    expect(k.turnsAfterTasks.n).toBe(1);
    expect(k.turnsAfterTasks.measured).toBe(28);
  });

  test('RELOAD_TOKENS is compared with the mean of the measured reloads', () => {
    const k = sessionCutKaizen([input('A', { reload: 20_000 }), input('B', { reload: 24_000 }), input('C', { reload: 22_000 })]);
    expect(k.reloadTokens.constant).toBe(RELOAD_TOKENS);
    expect(k.reloadTokens.measured).toBe(22_000);
    expect(k.reloadTokens.n).toBe(3);
    expect(k.reloadTokens.proposal).toBe(22_000);
  });

  test('a spec without a measurement for a constant does not count towards its n', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 22 }, afterTasks: 40, ...recorded }),
      input('B', { tasks: { T1: 22 } }),
      input('C', { tasks: { T1: 22 } }),
    ]);
    expect(k.turnsPerTask.n).toBe(3);
    expect(k.turnsAfterTasks.n).toBe(1);
    expect(k.turnsAfterTasks.result).toBe(INSUFFICIENT);
    expect(k.turnsAfterTasks.proposal).toBeUndefined();
  });
});

describe('sessionCutKaizen: logged estimates against what followed (S-4.2)', () => {
  test('S-4.2: a row shows estimated 43 and actual 51, and the mean error is reported', () => {
    const k = sessionCutKaizen([
      input('A', { estimates: [{ at: '2026-10-01 10:00', task: 'T2', estimated: 43, actual: 51 }] }),
      input('B', { estimates: [{ at: '2026-10-02 10:00', task: 'T1', estimated: 30, actual: 40 }] }),
    ]);
    expect(k.estimates.rows).toContainEqual(
      expect.objectContaining({ spec: 'A', at: '2026-10-01 10:00', task: 'T2', estimated: 43, actual: 51 }),
    );
    expect(k.estimates.rows).toHaveLength(2);
    // errors 8 and 10: the mean is 9 whether signed (actual - estimated) or absolute
    expect(k.estimates.meanError).toBe(9);
  });

  test('the mean error is absolute: errors +8 and -10 give 9, not -1', () => {
    const k = sessionCutKaizen([
      input('A', {
        estimates: [
          { at: 'x', task: 'T1', estimated: 40, actual: 48 },
          { at: 'y', task: 'T2', estimated: 50, actual: 40 },
        ],
      }),
    ]);
    expect(k.estimates.meanError).toBe(9);
  });

  test('a row without an actual (close not recorded) is shown but left out of the mean error', () => {
    const k = sessionCutKaizen([
      input('A', {
        estimates: [
          { at: 'x', task: 'T2', estimated: 43, actual: 51 },
          { at: 'y', task: 'T3', estimated: 20 },
        ],
      }),
    ]);
    expect(k.estimates.rows).toHaveLength(2);
    expect(k.estimates.rows.find((r) => r.task === 'T3')?.actual).toBeUndefined();
    expect(k.estimates.meanError).toBe(8);
  });

  test('no row with an actual: no mean error, never 0', () => {
    const k = sessionCutKaizen([input('A', { estimates: [{ at: 'y', task: 'T3', estimated: 20 }] })]);
    expect(k.estimates.meanError).toBeUndefined();
  });
});

describe('sessionCutKaizen: sample-size minimum (S-4.3, AC-4/C1)', () => {
  test('S-4.3/C1: measurements from 2 specs show the values and n: 2, say insufficient data, and propose nothing', () => {
    const k = sessionCutKaizen([
      input('A', { tasks: { T1: 30 }, afterTasks: 60, reload: 30_000, ...recorded }),
      input('B', { tasks: { T1: 34 }, afterTasks: 64, reload: 34_000, ...recorded }),
    ]);
    for (const c of [k.turnsPerTask, k.turnsAfterTasks, k.reloadTokens]) {
      expect(c.n).toBe(2);
      expect(c.result).toBe(INSUFFICIENT);
      expect(c.proposal).toBeUndefined();
    }
    expect(k.turnsPerTask.measured).toBe(32);
    expect(k.turnsAfterTasks.measured).toBe(62);
    expect(k.reloadTokens.measured).toBe(32_000);
  });

  test('the minimum is 3: three specs lift the result, and there is no insufficient-data text', () => {
    const k = sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 30 } })));
    expect(k.turnsPerTask.result).toBeUndefined();
    expect(k.turnsPerTask.proposal).toBe(30);
  });

  test('no measurements at all: n is 0, insufficient data, nothing proposed', () => {
    const k = sessionCutKaizen([input('A'), input('B'), input('C')]);
    expect(k.turnsPerTask.n).toBe(0);
    expect(k.turnsPerTask.measured).toBeUndefined();
    expect(k.turnsPerTask.result).toBe(INSUFFICIENT);
    expect(k.turnsPerTask.proposal).toBeUndefined();
  });

  test('the minimum can be changed by the caller, like the cost advice', () => {
    const two = [input('A', { tasks: { T1: 30 } }), input('B', { tasks: { T1: 30 } })];
    expect(sessionCutKaizen(two, 2).turnsPerTask.proposal).toBe(30);
  });
});

describe('sessionCutKaizen: advice only (S-4.4, AC-4/C2)', () => {
  test('S-4.4/C2: session-cut.ts and the config files are unchanged and the constants keep their values', () => {
    // purity check: the config files are never passed in, so nothing here could write them
    const root = makeTree({ '.mandao/config.yml': 'models: {}\n', 'mandao.config.json': '{"a":1}\n' });
    const files = [join(process.cwd(), 'src/scripts/session-cut.ts'), join(root, '.mandao/config.yml'), join(root, 'mandao.config.json')];
    const before = files.map((f) => readFileSync(f, 'utf8'));
    const k = sessionCutKaizen([1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 40 }, afterTasks: 90, reload: 50_000, ...recorded })));
    expect(k.turnsPerTask.proposal).toBe(40);
    expect(files.map((f) => readFileSync(f, 'utf8'))).toEqual(before);
    expect([TURNS_PER_TASK, TURNS_AFTER_TASKS, RELOAD_TOKENS]).toEqual([15, 28, 10_000]);
  });

  test('the inputs are not mutated and the result is plain JSON', () => {
    const inputs = [1, 2, 3].map((i) => input(`S${i}`, { tasks: { T1: 40 } }));
    const snapshot = JSON.stringify(inputs);
    const k = sessionCutKaizen(inputs);
    expect(JSON.stringify(inputs)).toBe(snapshot);
    expect(JSON.parse(JSON.stringify(k))).toEqual(k);
  });
});

```
