import { execFileSync } from 'node:child_process';
import { cpus, freemem, loadavg, platform } from 'node:os';
import { DEFAULT_OPERATION_FLOOR, DEFAULT_RESOURCES, type Operation, type ResourcesConfig } from '../schemas/index.js';

export interface MachineProbe {
  cores: number;
  freeMemoryMb: number;
  /** One-minute load average (0 on Windows, where Node does not report it). */
  load1: number;
}

/** macOS counts reclaimable pages as used; vm_stat's free + inactive + speculative is what is available. */
function darwinAvailableMb(): number | undefined {
  try {
    const out = execFileSync('vm_stat', { encoding: 'utf8' });
    const pageSize = Number(out.match(/page size of (\d+) bytes/)?.[1] ?? 4096);
    const pages = (name: string) => Number(out.match(new RegExp(`${name}:\\s+(\\d+)`))?.[1] ?? 0);
    return Math.round(((pages('Pages free') + pages('Pages inactive') + pages('Pages speculative')) * pageSize) / 1024 / 1024);
  } catch {
    return undefined;
  }
}

export function probeMachine(): MachineProbe {
  const fallback = Math.round(freemem() / 1024 / 1024);
  return {
    cores: cpus().length,
    freeMemoryMb: platform() === 'darwin' ? (darwinAvailableMb() ?? fallback) : fallback,
    load1: loadavg()[0] ?? 0,
  };
}

export interface Budget {
  decision: 'run' | 'reduce' | 'defer';
  workers: number;
  priority: 'low' | 'normal';
  timeoutS: number;
  reason: string;
}

/** Merges workspace and project resources over the defaults; operations merge one by one. */
export function effectiveResources(workspace: ResourcesConfig, project: ResourcesConfig = {}) {
  const operations = Object.fromEntries(
    (['build', 'tests', 'e2e'] as const).map((op) => [op, { ...workspace.operations?.[op], ...project.operations?.[op] }]),
  ) as NonNullable<ResourcesConfig['operations']>;
  return { ...DEFAULT_RESOURCES, ...workspace, ...project, operations };
}

/** `unit` runs are the `tests` operation. */
export type BudgetKind = 'build' | 'unit' | 'e2e';
const operationOf = (kind: BudgetKind): Operation => (kind === 'unit' ? 'tests' : kind);

/** The memory floor of an operation: its own setting, else (tests) the legacy floor, else the default. */
export function memoryFloor(resources: ResourcesConfig, kind: BudgetKind): number {
  const op = operationOf(kind);
  const own = resources.operations?.[op]?.min_free_memory_mb;
  if (own !== undefined) return own;
  if (op === 'tests' && resources.min_free_memory_mb !== undefined) return resources.min_free_memory_mb;
  return DEFAULT_OPERATION_FLOOR[op];
}

/**
 * Workers for a run (ADR 0013): half the cores by default, never more than the idle cores; one worker when
 * memory is under the operation's floor (ADR 0024); deferred when even that would starve the machine.
 */
export function decideBudget(probe: MachineProbe, resources: ResourcesConfig, kind: BudgetKind): Budget {
  const r = { ...effectiveResources(resources), min_free_memory_mb: memoryFloor(resources, kind) };
  const max = kind === 'e2e' ? r.e2e_workers : r.max_workers === 'auto' ? Math.max(1, Math.floor(probe.cores / 2)) : r.max_workers;
  const idle = Math.max(1, probe.cores - Math.ceil(probe.load1));
  const wanted = Math.min(max, idle);
  const base = { priority: r.priority, timeoutS: r.timeout_s };
  if (probe.freeMemoryMb < r.min_free_memory_mb / 2) {
    return {
      ...base,
      decision: 'defer',
      workers: 0,
      reason: `${probe.freeMemoryMb} MB free is under half the ${r.min_free_memory_mb} MB floor`,
    };
  }
  if (probe.freeMemoryMb < r.min_free_memory_mb) {
    return {
      ...base,
      decision: 'reduce',
      workers: 1,
      reason: `${probe.freeMemoryMb} MB free is under the ${r.min_free_memory_mb} MB floor`,
    };
  }
  if (wanted < max)
    return { ...base, decision: 'reduce', workers: wanted, reason: `load ${probe.load1.toFixed(1)} leaves ${idle} idle core(s)` };
  return {
    ...base,
    decision: 'run',
    workers: wanted,
    reason: `${probe.cores} cores, ${probe.freeMemoryMb} MB free, load ${probe.load1.toFixed(1)}`,
  };
}
