import type { Task } from './tasks.js';

export interface TaskPlan {
  /** Groups of tasks that can run once the previous groups are done. */
  waves: string[][];
  /** Dependency cycles; a non-empty list makes the plan invalid. */
  cycles: string[][];
  /** The next task to run: dependencies done, itself not done, lowest wave first. */
  next?: string;
  /** Tasks that could run in parallel with `next` (parallel_safe and eligible). */
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
  const eligible = tasks.filter((t) => !t.done && t.depends_on.every((d) => done.has(d)));
  const blocked = [...blockers.map((b) => `critical OPEN: ${b}`), ...cycles.map((c) => `dependency cycle: ${c.join(' → ')}`)];
  if (blocked.length) return { waves, cycles, parallel: [], blocked };
  const next = eligible[0];
  return {
    waves,
    cycles,
    ...(next ? { next: next.id } : {}),
    parallel: next?.parallel_safe
      ? eligible
          .slice(1)
          .filter((t) => t.parallel_safe)
          .map((t) => t.id)
      : [],
    blocked: next || done.size === tasks.length ? [] : ['no eligible task: pending tasks wait on unfinished dependencies'],
  };
}
