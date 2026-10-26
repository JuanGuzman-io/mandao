import { posix } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import type { HarnessId } from '../schemas/index.js';
import { appendExecutionRow, writeProgress } from '../scripts/checkpoint.js';
import { repoRoot } from '../scripts/commits.js';
import { agentIdentity, type Identity, identityCell } from '../scripts/identity.js';
import { detectRunner, fillCommand, projectDir, RUNNER_COMMANDS } from '../scripts/impact.js';
import { redCheck, redFile } from '../scripts/red.js';
import { inProjectDir, runTests, type TestRun } from '../scripts/run-tests.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { type Task, taskAttempt, testWriter } from '../spec/index.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { rowTier } from './run-ledger.js';

interface RedOptions {
  self?: boolean;
  force?: boolean;
  harness?: string;
}

/**
 * The command that runs exactly these test files for the project, run from its folder (as the gates are): the
 * configured `tests.impacted`, else the test gate when it runs the detected runner (`uv run pytest`), else the
 * runner's own command. `command` is what the log shows; `shell` is what runs (phase 17: MDO-0001 ran a bare
 * `pytest`, MDO-0002 ran vitest from the root, where the web project's config never loaded).
 */
export function testCommand(
  root: string,
  project: { path: string; gates?: Partial<Record<string, string>>; tests: { impacted?: string } },
  files: string[],
  workers: number,
): { command: string; shell: string } | undefined {
  const runner = detectRunner(projectDir(root, project.path));
  const gate = project.gates?.test;
  // The gate only when it takes the files, or ends with the runner itself (`uv run pytest`): options after it
  // (a coverage threshold, a fixed folder) would fail or widen a red run (review F8).
  const endsWithRunner = runner && gate && new RegExp(`(^|\\s)${runner}(\\s+run)?\\s*$`).test(gate);
  const viaGate = gate?.includes('{files}') ? gate : endsWithRunner ? `${gate} {files}` : undefined;
  const template = project.tests.impacted ?? viaGate ?? (runner ? RUNNER_COMMANDS[runner].module : undefined);
  if (!template) return undefined;
  const inProject = files.map((f) => (project.path === '.' ? f : posix.relative(project.path, f)));
  const command = fillCommand(template, inProject, workers);
  return { command, shell: inProjectDir(command, project.path) };
}

/**
 * Who wrote the tests: the agent Mandao routed the task to (`testWriter`), its model read from the agent
 * file the harness loads; `--self` only when the Leader wrote them in its own context. Never a name the
 * model types (MDO-0006: an Implementer recorded itself as `self`).
 */
export function routedWriter(
  root: string,
  config: ReturnType<typeof readConfig>,
  spec: SpecFolder,
  task: Task,
  harness: string,
  self?: boolean,
): Identity {
  if (self) return agentIdentity(root, 'self', harness);
  const mode = resolveWorkspaceModels(root, config, readRecommendations())[harness as HarnessId]?.mode;
  return agentIdentity(root, testWriter(task, spec.execution, mode === 'simple'), harness);
}

type RedTests = NonNullable<SpecFolder['progress']>['red_tests'];

function recordFirstPass(
  root: string,
  config: ReturnType<typeof readConfig>,
  spec: SpecFolder,
  task: Task,
  id: string,
  tests: string[],
  result: TestRun,
  options: RedOptions,
) {
  const writer = routedWriter(root, config, spec, task, options.harness ?? 'claude', options.self);
  const files = tests.map((path) => redFile(repoRoot(spec.dir), path));
  appendExecutionRow(spec.dir, spec.name, {
    date: new Date().toISOString().slice(0, 10),
    task: id,
    attempt: taskAttempt(spec.execution, id),
    tier: rowTier(spec, id),
    harness: writer.harness,
    implementer: identityCell(writer),
    reviewer: '—',
    verdict: 'TESTS_PASS',
    notes: `tests passed before implementation: ${tests.join(', ')}`,
  });
  const progress = spec.progress ?? { schema_version: 1 as const, spec: spec.name, updated_at: '', current: null };
  writeProgress(spec.dir, {
    ...progress,
    updated_at: new Date().toISOString(),
    red_tests: mergeRed(spec.progress?.red_tests ?? [], id, files),
  });
  json({ red: false, firstRunPassed: true, options: ['mutation', 'review-test'], run: result });
}

/** A new red run adds to the task's record: files keep the names of every red run that saw them. */
function mergeRed(all: RedTests, task: string, files: RedTests[number]['files']): RedTests {
  const before = all.find((r) => r.task === task)?.files ?? [];
  const merged = [...before.filter((f) => !files.some((n) => n.path === f.path))];
  for (const f of files) {
    const old = before.find((b) => b.path === f.path);
    merged.push({ ...f, tests: [...new Set([...(old?.tests ?? []), ...(f.tests ?? [])])] });
  }
  return [...all.filter((r) => r.task !== task), { task, files: merged }];
}

/**
 * `mandao run red`: TDD red evidence (ADR 0022). Runs the given tests under the budget and queue, and
 * records a RED row only when they fail; their hashes go to progress.yml so a later change is flagged.
 */
export function registerRed(run: Command, ctx: CliContext) {
  run
    .command('red <spec> <task> <tests...>')
    .description('Record TDD red evidence: run the task tests, require them to fail, and remember them')
    .option('--self', 'the Leader wrote the tests in its own context (no subagent): reduced independence')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (ref: string, id: string, tests: string[], o: RedOptions) => {
      const root = ctx.root();
      const config = readConfig(root);
      const spec = readSpec(findSpec(root, config, ref));
      const task = spec.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`No ${id} in ${spec.name}/tasks.md`);
      const project = config.projects.find((p) => p.name === task.project) ?? config.projects[0]!;
      const budget = budgetFor(root, config, project, 'unit', `${id} red`, o.force, spec.dir);
      const command = testCommand(root, project, tests, Math.max(1, budget.workers));
      const result = { ...(await runTests(root, `${id} red`, command?.shell, budget)), ...(command ? { command: command.command } : {}) };
      const runner = detectRunner(projectDir(root, project.path));
      const check = redCheck(result.status, result.exitCode, runner, result.outputTail);
      if (!check.red) {
        if (result.status === 'PASS') {
          recordFirstPass(root, config, spec, task, id, tests, result, o);
          return;
        }
        json({ red: false, problem: check.problem, run: result });
        process.exitCode = 1;
        return;
      }
      const writer = routedWriter(root, config, spec, task, o.harness ?? 'claude', o.self);
      const repo = repoRoot(spec.dir);
      const files = tests.map((path) => redFile(repo, path));
      appendExecutionRow(spec.dir, spec.name, {
        date: new Date().toISOString().slice(0, 10),
        task: id,
        attempt: taskAttempt(spec.execution, id),
        tier: rowTier(spec, id),
        harness: writer.harness,
        implementer: identityCell(writer),
        reviewer: '—',
        verdict: 'RED',
        notes: `red tests by ${writer.agent}: ${tests.join(', ')}; \`${result.command}\` failed (exit ${result.exitCode})`,
      });
      const progress = spec.progress ?? { schema_version: 1 as const, spec: spec.name, updated_at: '', current: null };
      writeProgress(spec.dir, {
        ...progress,
        updated_at: new Date().toISOString(),
        red_tests: mergeRed(spec.progress?.red_tests ?? [], id, files),
      });
      json({ red: true, task: id, tests: files, run: result });
    });
}
