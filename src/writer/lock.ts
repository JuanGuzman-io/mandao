import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeSync } from 'node:fs';
import { dirname } from 'node:path';

/** True when a process with this pid is alive on this machine. */
function alive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch (e) {
    return (e as NodeJS.ErrnoException).code === 'EPERM';
  }
}

/** Takes the lock if it is free or held by a dead process. Returns false when someone alive holds it. */
export function tryLock(file: string, label: string): boolean {
  mkdirSync(dirname(file), { recursive: true });
  for (let i = 0; i < 2; i++) {
    try {
      const fd = openSync(file, 'wx');
      writeSync(fd, JSON.stringify({ pid: process.pid, label, since: new Date().toISOString() }));
      closeSync(fd);
      return true;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
      const holder = readHolder(file);
      if (holder && alive(holder.pid)) return false;
      rmSync(file, { force: true }); // stale: its process is gone
    }
  }
  return false;
}

export function readHolder(file: string): { pid: number; label: string; since: string } | undefined {
  try {
    return existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as { pid: number; label: string; since: string }) : undefined;
  } catch {
    return undefined; // half-written by a crashed process: treat as stale
  }
}

export function releaseLock(file: string): void {
  const holder = readHolder(file);
  if (holder?.pid === process.pid) rmSync(file, { force: true });
}

/** Waits in a queue (polling) until the lock is free, up to `waitMs`. */
export async function acquireLock(file: string, label: string, waitMs: number, pollMs = 2000): Promise<boolean> {
  const deadline = Date.now() + waitMs;
  while (!tryLock(file, label)) {
    if (Date.now() >= deadline) return false;
    await new Promise((r) => setTimeout(r, pollMs));
  }
  return true;
}
