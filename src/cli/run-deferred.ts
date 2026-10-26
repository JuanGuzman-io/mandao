import { join, posix } from 'node:path';
import { readConfig } from '../engine/files.js';
import { writeProgress } from '../scripts/checkpoint.js';
import { recordFullRun } from '../scripts/forced.js';
import { fillCommand } from '../scripts/impact.js';
import { inProjectDir, runTests } from '../scripts/run-tests.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import { budgetFor } from './budget.js';
import type { CliContext } from './context.js';
import { projectNamed } from './spec-context.js';

/**
 * `run tests <project> --spec <ID> --deferred <task>`: the runs a task deferred to CI, run here (phase 17). The
 * project's e2e command (else its test gate) runs in its folder; on PASS the task's deferred entries are cleared
 * and the run is recorded with the full runs, so a repository without CI is never blocked by a deferral forever
 * (MDO-0002: the e2e had passed locally, 4/4, and verify still waited for a CI that did not exist).
 */
export async function runDeferred(ctx: CliContext, name: string, ref: string, task: string, opts: { queueWait: string; force?: boolean }) {
  const root = ctx.root();
  const config = readConfig(root);
  const project = projectNamed(ctx, name);
  const spec = readSpec(findSpec(root, config, ref));
  const entries = (spec.progress?.deferred_to_ci ?? []).filter((d) => d.task === task);
  if (!entries.length) throw new Error(`${spec.name} has no run deferred by ${task}`);
  const owner = spec.tasks.find((t) => t.id === task)?.project;
  if (owner && owner !== name) throw new Error(`${task} belongs to project ${owner}: run its deferred tests there`);
  // Only a command that runs the deferred tests may clear them (review F2): the project's e2e suite, or a test
  // gate that takes the files. A gate that ignores them would pass on other tests.
  const template = project.tests.e2e ?? (project.gates.test?.includes('{files}') ? project.gates.test : undefined);
  if (!template)
    throw new Error(
      `${name} cannot run exactly the deferred tests: set projects[].tests.e2e, or a test gate with {files}, in .mandao/config.yml`,
    );
  const budget = budgetFor(root, config, project, 'e2e', `${task} deferred`, opts.force, spec.dir);
  // Paths are relative to the project, which the command runs from (as red does; review F3).
  const inProject = (t: string) => (project.path !== '.' && t.startsWith(`${project.path}/`) ? posix.relative(project.path, t) : t);
  const tests = entries.flatMap((e) => e.tests).map(inProject);
  const command = template.includes('{files}') ? fillCommand(template, tests, budget.workers) : template;
  const result = await runTests(root, `${task} deferred`, inProjectDir(command, project.path), budget, Number(opts.queueWait) * 1000);
  const cleared = result.status === 'PASS' ? [task] : [];
  if (cleared.length && spec.progress)
    writeProgress(spec.dir, { ...spec.progress, deferred_to_ci: spec.progress.deferred_to_ci.filter((d) => d.task !== task) });
  const reason = `deferred runs of ${task} (${entries.flatMap((e) => e.tests).join(', ')}) run here: \`${command}\``;
  recordFullRun(root, { at: new Date().toISOString(), project: name, reason, status: result.status }, spec.dir);
  return { ...result, command, cleared, projectRoot: project.path === '.' ? root : join(root, project.path) };
}

/**
 * `run tests <project> --eval`: the project's eval gate (model or quality evaluations, phase 17), run by verify
 * and never among the task gates because it makes real model calls. With `--spec` the run is recorded with the
 * spec's full runs.
 */
export async function runEval(ctx: CliContext, name: string, opts: { spec?: string; queueWait: string; force?: boolean }) {
  const root = ctx.root();
  const config = readConfig(root);
  const project = projectNamed(ctx, name);
  const command = project.gates.eval;
  if (!command) throw new Error(`${name} has no eval gate: add projects[].gates.eval in .mandao/config.yml`);
  const specDir = opts.spec ? findSpec(root, config, opts.spec) : undefined;
  const budget = budgetFor(root, config, project, 'e2e', `${name} eval`, opts.force, specDir);
  const result = await runTests(root, `${name} eval`, inProjectDir(command, project.path), budget, Number(opts.queueWait) * 1000);
  recordFullRun(root, { at: new Date().toISOString(), project: name, reason: `eval gate: \`${command}\``, status: result.status }, specDir);
  return { ...result, command, gate: 'eval' };
}
