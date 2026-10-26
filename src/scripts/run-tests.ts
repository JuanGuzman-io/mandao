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
  /** The last part of the runner's stdout, kept as evidence (mutation runs record it). */
  outputTail?: string;
  /** The whole stdout (capped), only when asked: `mandao run gates` keeps it in `_log/`. */
  output?: string;
}

const FULL_CAP = 2 * 1024 * 1024;

const TAIL_CHARS = 4000;

/** Wraps a command so it runs at low priority where the OS allows it; `sh -c` keeps builtins such as `cd` working. */
export function withPriority(command: string, priority: Budget['priority']): string {
  if (priority !== 'low' || process.platform === 'win32') return command;
  return `nice -n 10 sh -c '${command.replace(/'/g, "'\\''")}'`;
}

/**
 * A gate command run from its project folder, with stderr in its output. On POSIX a group keeps the stderr of
 * every step; Windows has no group form here, so it keeps only the last step's stderr.
 */
export function inProjectDir(command: string, path: string): string {
  if (process.platform === 'win32') return path === '.' ? `${command} 2>&1` : `cd ${JSON.stringify(path)} && ${command} 2>&1`;
  // The newline closes the group even after a `#` comment or `&`. Single quotes: `$` and backticks in a path never expand.
  const group = `{ ${command}\n} 2>&1`;
  return path === '.' ? group : `cd '${path.replaceAll("'", "'\\''")}' && ${group}`;
}

/**
 * Runs the command, streaming its stdout to our stderr as it comes: stdout carries only the JSON
 * result. Resolves with the exit code, or `timeout` after killing the process group.
 */
function streamRun(
  command: string,
  root: string,
  env: NodeJS.ProcessEnv,
  timeoutMs: number,
  tail: { text: string; full?: string },
): Promise<number | 'timeout'> {
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd: root,
      shell: true,
      env,
      stdio: ['inherit', 'pipe', 'inherit'],
      detached: process.platform !== 'win32',
    });
    child.stdout.on('data', (chunk: Buffer) => {
      process.stderr.write(chunk);
      tail.text = (tail.text + chunk.toString('utf8')).slice(-TAIL_CHARS);
      if (tail.full !== undefined && tail.full.length < FULL_CAP) tail.full += chunk.toString('utf8');
    });
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
  opts: {
    keepOutput?: boolean;
    env?: Record<string, string>;
    /** stderr joins the kept output (red evidence reads it). */
    withStderr?: boolean;
  } = {},
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
    const env = { ...process.env, ...opts.env, MANDAO_TEST_WORKERS: String(budget.workers) };
    const tail: { text: string; full?: string } = { text: '', ...(opts.keepOutput ? { full: '' } : {}) };
    const spawned = opts.withStderr ? inProjectDir(command, '.') : command;
    const exit = await streamRun(withPriority(spawned, budget.priority), root, env, budget.timeoutS * 1000, tail);
    const durationMs = Date.now() - started;
    if (exit === 'timeout')
      return { status: 'TIMEOUT', command, workers: budget.workers, durationMs, reason: `exceeded ${budget.timeoutS}s` };
    return {
      status: exit === 0 ? 'PASS' : 'FAIL',
      command,
      workers: budget.workers,
      exitCode: exit,
      durationMs,
      reason: budget.reason,
      ...(tail.text ? { outputTail: tail.text } : {}),
      ...(tail.full !== undefined ? { output: tail.full } : {}),
    };
  } finally {
    releaseLock(lock);
  }
}
