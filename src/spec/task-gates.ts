import { isTestFile } from '../scripts/impact.js';
import { planTasks } from './plan.js';
import type { Task } from './tasks.js';

/** Kinds that change code, so their task runs the test gate; docs or chore tasks do not. */
const CODE_KINDS = new Set(['feat', 'fix', 'refactor', 'perf', 'test']);

const CONFIG = '.mandao/config.yml';

/** The gates that check what a task writes. */
const CHECK_GATES = ['format', 'lint', 'typecheck', 'test'];

/**
 * What `approve tasks` and `run tasks` refuse about gates (phase 17): a project with no gates and no task that
 * sets them (MDO-0001 planned every task "verified with its own pytest", so the first implementation ran with
 * no lint, format or typecheck), and a first code task that cannot pass its own test gate (MDO-0002: T1 had no
 * test file to collect). Pure over the tasks and each project's gates.
 */
export function taskGateIssues(tasks: Task[], projects: { name: string; gates: Partial<Record<string, string>> }[]): string[] {
  const issues: string[] = [];
  const setsGates = tasks.some((t) => t.files.some((f) => f.replace(/^\.\//, '') === CONFIG));
  const order = planTasks(tasks).waves.flat();
  const byOrder = [...tasks].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  for (const name of new Set(tasks.map((t) => t.project))) {
    const gates = projects.find((p) => p.name === name)?.gates ?? {};
    // `build: none`, `eval` or `metrics` alone check nothing a task writes (MDO-0001 ran with none of these).
    if (!CHECK_GATES.some((g) => gates[g])) {
      if (!setsGates)
        issues.push(
          `project ${name} has no gates in ${CONFIG}: the task that creates its manifest must declare ${CONFIG} and set the gates the constitution proposed`,
        );
      continue;
    }
    if (!gates.test) continue;
    const first = byOrder.find((t) => t.project === name && (!t.kind || CODE_KINDS.has(t.kind)));
    // Once the first code task is done it passed its gates: nothing to report, and the check never moves on (F10).
    if (first && !first.done && !first.files.some(isTestFile))
      issues.push(`${first.id} is the first task of ${name} and runs its test gate, but declares no test file: add one to its files`);
  }
  return issues;
}
