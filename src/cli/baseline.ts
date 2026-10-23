import { join } from 'node:path';
import { type Config, declaresNoBuild, projectGate } from '../schemas/index.js';
import { excerpt } from '../scripts/gates.js';
import { inProjectDir, runTests, type TestRun } from '../scripts/run-tests.js';
import { STATE_FILE, updateState } from '../scripts/spec-log.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';

const BASELINE_GATES = ['lint', 'typecheck', 'build'] as const;

interface GateRun {
  project: string;
  gate: string;
  run: TestRun | { status: 'NOT_RUN_BY_CHOICE'; reason?: undefined; output?: undefined };
}

/** Where a baseline is recorded: the spec folder, its `_log`, the version 1 file suffix and whether `state.yml` holds it. */
export interface BaselineLog {
  specDir: string;
  dir: string;
  suffix: string;
  state: boolean;
}

/** Each project's lint, typecheck and build gate, run from the project folder with stderr kept (`inProjectDir`). */
async function baselineRuns(root: string, config: Config, worktree: string): Promise<GateRun[]> {
  const out: GateRun[] = [];
  for (const project of config.projects)
    for (const gate of BASELINE_GATES) {
      if (gate === 'build' && declaresNoBuild(project)) {
        out.push({ project: project.name, gate, run: { status: 'NOT_RUN_BY_CHOICE' } });
        continue;
      }
      const command = projectGate(project, gate);
      if (!command) continue;
      const budget = budgetFor(root, config, project, gate === 'build' ? 'build' : 'unit', `baseline ${gate}`);
      const run = await runTests(worktree, `baseline ${gate}`, inProjectDir(command, project.path), budget, undefined, {
        keepOutput: true,
      });
      out.push({ project: project.name, gate, run });
    }
  return out;
}

export interface BaselineResult {
  /** `red` (a gate failed), `incomplete` (a gate did not run and none failed), `green`, or `skipped` (no gate to run). */
  outcome: 'red' | 'incomplete' | 'green' | 'skipped';
  file: string;
  /** Gates that did not run, with why. */
  notRun: string[];
}

const SKIPPED_TEXT = 'Skipped: no lint, typecheck or build gate configured, so there is no baseline.';

/**
 * Runs the baseline gates in `worktree` and writes the result to `state.yml` (version 2) or the baseline file
 * (version 1). With no gate to run, `rewriteSkipped` replaces the record (a re-run must not leave a stale one).
 */
export async function recordBaseline(
  root: string,
  config: Config,
  worktree: string,
  log: BaselineLog,
  rewriteSkipped = false,
): Promise<BaselineResult> {
  const all = await baselineRuns(root, config, worktree);
  const runs = all.filter((r) => r.run.status !== 'NOT_RUN_BY_CHOICE');
  const file = log.state ? join(log.dir, STATE_FILE) : join(log.dir, `baseline${log.suffix}.md`);
  const red = runs.filter((r) => r.run.status === 'FAIL' || r.run.status === 'TIMEOUT');
  const notRun = runs
    .filter((r) => r.run.status === 'DEFERRED_TO_CI' || r.run.status === 'QUEUE_TIMEOUT')
    .map((r) => `${r.project} ${r.gate}: ${r.run.status}${r.run.reason ? ` (${r.run.reason})` : ''}`);
  const outcome: BaselineResult['outcome'] = !runs.length ? 'skipped' : red.length ? 'red' : notRun.length ? 'incomplete' : 'green';
  if (outcome === 'skipped' && !rewriteSkipped) return { outcome, file, notRun };
  writeRecord(log, file, outcome, all, red, notRun);
  return { outcome, file, notRun };
}

function verdictText(outcome: BaselineResult['outcome'], notRun: string[]): string {
  if (outcome === 'skipped') return SKIPPED_TEXT;
  const head =
    outcome === 'red'
      ? "Red before any change: these failures are not the spec's."
      : outcome === 'incomplete'
        ? 'Incomplete: this is not a green baseline.'
        : 'Green before any change.';
  return `${head}${notRun.length ? ` Gates that did not run: ${notRun.join('; ')}.` : ''} The test baseline is the base branch's last CI result.`;
}

function writeRecord(log: BaselineLog, file: string, outcome: BaselineResult['outcome'], all: GateRun[], red: GateRun[], notRun: string[]) {
  const verdict = verdictText(outcome, notRun);
  const result = (r: GateRun) => r.run.status;
  if (log.state) {
    const value = {
      text: verdict,
      at: new Date().toISOString(),
      gates: all.map((r) => ({ project: r.project, gate: r.gate, result: result(r) })),
      failures: red.map((r) => ({ project: r.project, gate: r.gate, output: excerpt(r.run.output, 30) })),
    };
    updateState(log.specDir, (s) => ({ ...s, baseline: value }));
  } else
    writeText(
      file,
      [
        '# Baseline',
        '',
        verdict,
        '',
        '| Project | Gate | Result |',
        '|---|---|---|',
        ...all.map((r) => `| ${r.project} | ${r.gate} | ${result(r)} |`),
        '',
        ...red.map((r) => `### ${r.project} — ${r.gate}\n\n\`\`\`\n${excerpt(r.run.output, 30)}\n\`\`\``),
        '',
      ].join('\n'),
    );
}
