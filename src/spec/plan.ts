import { posix } from 'node:path';
import type { Task } from './tasks.js';

export interface TaskPlan {
  /** Groups of tasks that can run once the previous groups are done. */
  waves: string[][];
  /** Dependency cycles; a non-empty list makes the plan invalid. */
  cycles: string[][];
  /** The next task to run: the first one in tasks.md order of the first unfinished delivery whose dependencies are done. */
  next?: string;
  /** Tasks that could run beside `next`: eligible, `parallel_safe`, in its wave, with files disjoint from it and each other. */
  parallel: string[];
  /** Why nothing can start, when that is the case. */
  blocked: string[];
}

function findCycles(tasks: Task[]): string[][] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const cycles: string[][] = [];
  const state = new Map<string, 'visiting' | 'done'>();
  const visit = (id: string, path: string[]) => {
    if (state.get(id) === 'done') return;
    if (state.get(id) === 'visiting') {
      cycles.push([...path.slice(path.indexOf(id)), id]);
      return;
    }
    state.set(id, 'visiting');
    for (const dep of byId.get(id)?.depends_on ?? []) if (byId.has(dep)) visit(dep, [...path, id]);
    state.set(id, 'done');
  };
  for (const t of tasks) visit(t.id, []);
  return cycles;
}

/**
 * The folder or file a declared path surely stays inside: normalized, cut back to the last `/` before its
 * first glob character, without a trailing slash. `''` (overlaps everything) when it cannot be bounded.
 */
function pathRoot(file: string): string {
  const path = posix.normalize(file.replaceAll('\\', '/')).replace(/^\/+/, '');
  if (path === '..' || path.startsWith('../') || /[@+!]\(/.test(path)) return '';
  const glob = path.search(/[*?[{]/);
  const literal = glob < 0 ? path : path.slice(0, path.lastIndexOf('/', glob) + 1);
  const root = literal.replace(/\/+$/, '');
  return root === '.' ? '' : root;
}

/** Two declared paths overlap when one is the other or a folder (or glob root) that contains it. */
function pathsOverlap(a: string, b: string): boolean {
  const [x, y] = [pathRoot(a), pathRoot(b)];
  return x === y || !x || !y || x.startsWith(`${y}/`) || y.startsWith(`${x}/`);
}

/** Files that cannot be shared: undeclared files (empty list) overlap everything, since nothing proves them apart. */
function filesOverlap(a: Task, b: Task): boolean {
  if (!a.files.length || !b.files.length) return true;
  return a.files.some((f) => b.files.some((g) => pathsOverlap(f, g)));
}

/** Eligible `parallel_safe` tasks of `next`'s wave whose files overlap neither `next` nor one already chosen. */
function parallelWith(next: Task, eligible: Task[], waves: string[][]): string[] {
  if (!next.parallel_safe) return [];
  const wave = waves.find((w) => w.includes(next.id)) ?? [];
  const chosen: Task[] = [next];
  for (const t of eligible) {
    if (t === next || !t.parallel_safe || !wave.includes(t.id)) continue;
    if (chosen.some((c) => filesOverlap(c, t))) continue;
    chosen.push(t);
  }
  return chosen.slice(1).map((t) => t.id);
}

/** Waves, the next eligible task and what blocks the plan. `blockers` come from critical OPEN markers. */
export function planTasks(tasks: Task[], blockers: string[] = []): TaskPlan {
  const cycles = findCycles(tasks);
  const waves: string[][] = [];
  const placed = new Set<string>();
  while (!cycles.length && placed.size < tasks.length) {
    const wave = tasks.filter((t) => !placed.has(t.id) && t.depends_on.every((d) => placed.has(d))).map((t) => t.id);
    if (!wave.length) break;
    waves.push(wave);
    for (const id of wave) placed.add(id);
  }
  const done = new Set(tasks.filter((t) => t.done).map((t) => t.id));
  // Deliveries run in order (MDO-0013): only the first unfinished one offers work.
  const current = Math.min(...tasks.filter((t) => !t.done).map((t) => t.delivery ?? 1));
  const eligible = tasks.filter((t) => !t.done && (t.delivery ?? 1) === current && t.depends_on.every((d) => done.has(d)));
  const blocked = [...blockers.map((b) => `critical OPEN: ${b}`), ...cycles.map((c) => `dependency cycle: ${c.join(' → ')}`)];
  if (blocked.length) return { waves, cycles, parallel: [], blocked };
  const next = eligible[0];
  return {
    waves,
    cycles,
    ...(next ? { next: next.id } : {}),
    parallel: next ? parallelWith(next, eligible, waves) : [],
    blocked: next || done.size === tasks.length ? [] : ['no eligible task: pending tasks wait on unfinished dependencies'],
  };
}
