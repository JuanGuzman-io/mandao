import { spawn } from 'node:child_process';
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
 * Runs the command, streaming its stdout to our stderr as it comes: stdout carries only the JSON
 * result. Resolves with the exit code, or `timeout` after killing the process group.
 */
function streamRun(command: string, root: string, env: NodeJS.ProcessEnv, timeoutMs: number): Promise<number | 'timeout'> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      env,
      stdio: ['inherit', 'pipe', 'inherit'],
      detached: process.platform !== 'win32',
    });
    child.stdout.on('data', (chunk: Buffer) => process.stderr.write(chunk));
    const timer = setTimeout(() => {
      try {
        if (child.pid) process.kill(process.platform === 'win32' ? child.pid : -child.pid, 'SIGTERM');
      } catch {
        child.kill('SIGTERM');
      }
      resolve('timeout');
    }, timeoutMs);
    child.on('error', () => {
      clearTimeout(timer);
      resolve(1);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve(code ?? 1);
    });
  });
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
    const env = { ...process.env, MANDAO_TEST_WORKERS: String(budget.workers) };
    const exit = await streamRun(withPriority(command, budget.priority), root, env, budget.timeoutS * 1000);
    const durationMs = Date.now() - started;
    if (exit === 'timeout')
      return { status: 'TIMEOUT', command, workers: budget.workers, durationMs, reason: `exceeded ${budget.timeoutS}s` };
    return { status: exit === 0 ? 'PASS' : 'FAIL', command, workers: budget.workers, exitCode: exit, durationMs, reason: budget.reason };
  } finally {
    releaseLock(lock);
  }
}
