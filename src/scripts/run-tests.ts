import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { acquireLock, readHolder, releaseLock } from '../writer/lock.js';
import type { Budget } from './resources.js';

export const RUN_LOCK = '.mandao/run.lock';

export interface TestRun {
  status: 'PASS' | 'FAIL' | 'TIMEOUT' | 'DEFERRED_TO_CI' | 'QUEUE_TIMEOUT';
  command?: string;
  workers: number;
  exitCode?: number;
  durationMs: number;
  reason: string;
}

/** Wraps a command so it runs at low priority where the OS allows it. */
export function withPriority(command: string, priority: Budget['priority']): string {
  return priority === 'low' && process.platform !== 'win32' ? `nice -n 10 ${command}` : command;
}

/**
 * Runs one heavy test command under the budget, one at a time per workspace: other runs wait in a
 * queue on `.mandao/run.lock` (ADR 0013). Deferred budgets never run and are not a PASS.
 */
export async function runTests(
  root: string,
  label: string,
  command: string | undefined,
  budget: Budget,
  queueWaitMs = 30 * 60_000,
): Promise<TestRun> {
  if (budget.decision === 'defer' || !command) {
    return { status: 'DEFERRED_TO_CI', workers: 0, durationMs: 0, reason: command ? budget.reason : 'no test command could be built' };
  }
  const lock = join(root, RUN_LOCK);
  const started = Date.now();
  if (!(await acquireLock(lock, label, queueWaitMs))) {
    const holder = readHolder(lock);
    return {
      status: 'QUEUE_TIMEOUT',
      command,
      workers: budget.workers,
      durationMs: Date.now() - started,
      reason: `still queued behind ${holder?.label ?? 'another run'}`,
    };
  }
  try {
    const result = spawnSync(withPriority(command, budget.priority), {
      cwd: root,
      shell: true,
      // stdout carries only the JSON result: the runner's own output goes to stderr.
      stdio: ['inherit', 'pipe', 'inherit'],
      maxBuffer: 64 * 1024 * 1024,
      timeout: budget.timeoutS * 1000,
      env: { ...process.env, MANDAO_TEST_WORKERS: String(budget.workers) },
    });
    if (result.stdout?.length) process.stderr.write(result.stdout);
    const durationMs = Date.now() - started;
    if (result.error && (result.error as NodeJS.ErrnoException).code === 'ETIMEDOUT') {
      return { status: 'TIMEOUT', command, workers: budget.workers, durationMs, reason: `exceeded ${budget.timeoutS}s` };
    }
    const exitCode = result.status ?? 1;
    return { status: exitCode === 0 ? 'PASS' : 'FAIL', command, workers: budget.workers, exitCode, durationMs, reason: budget.reason };
  } finally {
    releaseLock(lock);
  }
}
