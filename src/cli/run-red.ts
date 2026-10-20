import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { appendExecutionRow, writeProgress } from '../scripts/checkpoint.js';
import { repoRoot } from '../scripts/commits.js';
import { agentIdentity, identityCell } from '../scripts/identity.js';
import { detectRunner, fillCommand, projectDir, RUNNER_COMMANDS } from '../scripts/impact.js';
import { fileHash, redCheck } from '../scripts/red.js';
import { runTests } from '../scripts/run-tests.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));

interface RedOptions {
  agent: string;
  force?: boolean;
  harness?: string;
  attempt: string;
}

/** The command that runs exactly these test files for the project: configured, or the runner's. */
export function testCommand(root: string, project: { path: string; tests: { impacted?: string } }, files: string[], workers: number) {
  const runner = detectRunner(projectDir(root, project.path));
  const template = project.tests.impacted ?? (runner ? RUNNER_COMMANDS[runner].module : undefined);
  return template ? fillCommand(template, files, workers) : undefined;
}

/**
 * `mandao run red`: TDD red evidence (ADR 0022). Runs the given tests under the budget and queue, and
 * records a RED row only when they fail; their hashes go to progress.yml so a later change is flagged.
 */
export function registerRed(run: Command, ctx: CliContext) {
  run
    .command('red <spec> <task> <tests...>')
    .description('Record TDD red evidence: run the task tests, require them to fail, and remember them')
    .requiredOption('--agent <agent>', 'who wrote the tests: mandao-tester[@<harness>], mandao-implementer-<tier>[@<harness>] or self')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .option('--attempt <n>', 'attempt for the execution row', '1')
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
      const result = await runTests(root, `${id} red`, command, budget);
      const check = redCheck(result.status, result.exitCode);
      if (!check.red) {
        json({ red: false, problem: check.problem, run: result });
        process.exitCode = 1;
        return;
      }
      const writer = agentIdentity(root, o.agent, o.harness ?? 'claude');
      const repo = repoRoot(spec.dir);
      const files = tests.map((path) => ({ path, sha256: fileHash(repo, path) }));
      appendExecutionRow(spec.dir, spec.name, {
        date: new Date().toISOString().slice(0, 10),
        task: id,
        attempt: Number(o.attempt),
        tier: task.tier,
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
        red_tests: [...(spec.progress?.red_tests ?? []).filter((r) => r.task !== id), { task: id, files }],
      });
      json({ red: true, task: id, tests: files, run: result });
    });
}
