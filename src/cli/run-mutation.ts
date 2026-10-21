import { readFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { appendExecutionRow } from '../scripts/checkpoint.js';
import { repoRoot } from '../scripts/commits.js';
import { identityCell } from '../scripts/identity.js';
import { applyPatch, checkPatch, mutationIssues, patchFiles, treeState } from '../scripts/mutation.js';
import { runTests, type TestRun } from '../scripts/run-tests.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { taskAttempt } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { routedWriter, testCommand } from './run-red.js';

interface MutationOptions {
  patch: string;
  self?: boolean;
  harness: string;
  force?: boolean;
}

function evidence(task: string, n: number, tests: string[], patch: string, run: TestRun, state: string): string {
  return [
    `# Mutation ${n} — ${task}`,
    '',
    `- Tests: ${tests.map((t) => `\`${t}\``).join(', ')}`,
    `- Command: \`${run.command ?? '—'}\` → ${run.status} (exit ${run.exitCode ?? '—'})`,
    `- Reverted: the mutated files match their state before the mutation (sha256 ${state.slice(0, 12)})`,
    '',
    '## Mutation',
    '',
    '```diff',
    patch.trimEnd(),
    '```',
    '',
    '## Failing output (tail)',
    '',
    '```',
    (run.outputTail ?? '(no output captured)').trimEnd(),
    '```',
    '',
  ].join('\n');
}

/**
 * `mandao run mutation`: characterization evidence (ADR 0022). Applies a mutation to the code the tests
 * pin down, runs them, always reverts it and checks the tree is back as it was. Only a failing run with a
 * clean revert is recorded: a `MUTANT` row plus the diff and the failing output in `mutations/`.
 */
export function registerMutation(run: Command, ctx: CliContext) {
  run
    .command('mutation <spec> <task> <tests...>')
    .description('Record characterization evidence: apply a mutation, require the tests to fail, revert it cleanly')
    .requiredOption('--patch <file>', 'unified diff of the mutation (applied, then reverted)')
    .option('--self', 'the Leader wrote the tests in its own context (no subagent): reduced independence')
    .option('--harness <id>', 'harness running the Leader', 'claude')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (ref: string, id: string, tests: string[], o: MutationOptions) => {
      const root = ctx.root();
      const config = readConfig(root);
      const spec = readSpec(findSpec(root, config, ref));
      const task = spec.tasks.find((t) => t.id === id);
      if (!task) throw new Error(`No ${id} in ${spec.name}/tasks.md`);
      if (!task.characterization)
        throw new Error(`${id} is not a characterization task: new behavior needs a red test (\`mandao run red\`)`);
      const repo = repoRoot(spec.dir);
      const patchFile = resolve(o.patch);
      const patch = readFileSync(patchFile, 'utf8');
      const files = patchFiles(patch);
      const issues = mutationIssues(files, task.files);
      if (issues.length) throw new Error(issues.join('; '));
      const before = treeState(repo, files);
      checkPatch(repo, patchFile);
      const project = config.projects.find((p) => p.name === task.project) ?? config.projects[0]!;
      const budget = budgetFor(root, config, project, 'unit', `${id} mutation`, o.force, spec.dir);
      applyPatch(repo, patchFile);
      let result: TestRun;
      try {
        result = await runTests(root, `${id} mutation`, testCommand(root, project, tests, Math.max(1, budget.workers)), budget);
      } finally {
        applyPatch(repo, patchFile, true);
      }
      const after = treeState(repo, files);
      if (after !== before) {
        json({ recorded: false, problem: `the revert left ${files.join(', ')} different from before: restore them by hand`, files });
        process.exitCode = 1;
        return;
      }
      if (result.status !== 'FAIL') {
        const problem =
          result.status === 'PASS'
            ? 'the mutation survived: the tests do not protect what it changed'
            : `the tests did not run to a verdict (${result.status})`;
        json({ recorded: false, problem, run: result });
        process.exitCode = 1;
        return;
      }
      const n = spec.execution.filter((r) => r.task === id && r.verdict === 'MUTANT').length + 1;
      const file = join(logPath(spec.dir, 'mutations'), `${id}-${n}.md`);
      writeText(file, evidence(id, n, tests, patch, result, after));
      const writer = routedWriter(root, config, spec, task, o.harness, o.self);
      appendExecutionRow(spec.dir, spec.name, {
        date: new Date().toISOString().slice(0, 10),
        task: id,
        attempt: taskAttempt(spec.execution, id),
        tier: task.tier,
        harness: writer.harness,
        implementer: identityCell(writer),
        reviewer: '—',
        verdict: 'MUTANT',
        notes: `mutation ${n} on ${files.join(', ')}: \`${result.command}\` failed (exit ${result.exitCode}); reverted clean; evidence ${relative(spec.dir, file)}`,
      });
      json({ recorded: true, task: id, mutation: n, files, evidence: relative(root, file), run: { ...result, outputTail: undefined } });
    });
}
