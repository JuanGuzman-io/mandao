import type { Task } from './tasks.js';

/**
 * Deliveries inside a spec (MDO-0013, ADR 0053): big specs split the execution, not the spec. Tasks carry
 * `delivery: n`; a spec without it is one delivery, exactly as before.
 */
export interface Delivery {
  number: number;
  tasks: string[];
  /** The AC met end to end here: those whose last task is in this delivery. */
  ac: string[];
  done: boolean;
}

/** `AC-1/C1` is part of `AC-1`: an AC is met in the delivery of its last task, across all its clauses. */
const acOf = (id: string) => id.split('/')[0]!;
const numberOf = (t: Task) => t.delivery ?? 1;

/** The deliveries in order, each with its tasks and the AC it completes. */
export function splitDeliveries(tasks: Task[]): Delivery[] {
  const lastDelivery = new Map<string, number>();
  for (const t of tasks) for (const ac of t.ac.map(acOf)) lastDelivery.set(ac, Math.max(lastDelivery.get(ac) ?? 0, numberOf(t)));
  const numbers = [...new Set(tasks.map(numberOf))].sort((a, b) => a - b);
  return numbers.map((number) => {
    const own = tasks.filter((t) => numberOf(t) === number);
    const ac = [...lastDelivery].filter(([, n]) => n === number).map(([id]) => id);
    return { number, tasks: own.map((t) => t.id), ac, done: own.every((t) => t.done) };
  });
}

/** What makes the split invalid; `mandao run tasks` reports it with the other task issues. */
export function deliveryIssues(tasks: Task[]): string[] {
  const declared = tasks.filter((t) => t.delivery !== undefined);
  if (!declared.length) return [];
  const issues = tasks.filter((t) => t.delivery === undefined).map((t) => `${t.id} declares no delivery while other tasks do`);
  const numbers = [...new Set(declared.map(numberOf))].sort((a, b) => a - b);
  if (numbers.some((n, i) => n !== i + 1))
    issues.push(`deliveries must be numbered 1 to ${numbers.length} without gaps: found ${numbers.join(', ')}`);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const t of declared) {
    for (const dep of t.depends_on) {
      const other = byId.get(dep);
      if (other && numberOf(other) > numberOf(t))
        issues.push(`${t.id} (delivery ${numberOf(t)}) depends on ${dep} of a later delivery ${numberOf(other)}`);
    }
  }
  for (const d of splitDeliveries(tasks))
    if (!d.ac.length) issues.push(`delivery ${d.number} meets no acceptance criterion end to end: group tasks by AC, never by layer`);
  return issues;
}

export interface DeliveryProgress {
  current: number;
  total: number;
  tasks: string[];
  ac: string[];
  /** At a boundary (the previous delivery done, none of this one's tasks done): the delivery to verify now. */
  checkpoint?: number;
}

/** "Delivery 2 of 3" for `next`, `status` and `resume`: absent with one delivery, an invalid split, or when all are done. */
export function deliveryProgress(tasks: Task[]): DeliveryProgress | undefined {
  const deliveries = splitDeliveries(tasks);
  const at = deliveries.findIndex((d) => !d.done);
  const current = deliveries[at];
  if (deliveries.length < 2 || !current || deliveryIssues(tasks).length) return undefined;
  const fresh = at > 0 && tasks.every((t) => !current.tasks.includes(t.id) || !t.done);
  return {
    current: current.number,
    total: deliveries.length,
    tasks: current.tasks,
    ac: current.ac,
    ...(fresh ? { checkpoint: deliveries[at - 1]!.number } : {}),
  };
}

/** When `/mandao-tasks` proposes deliveries: past `above` tasks, or declared files that foresee an oversized PR. */
export function proposeDeliveries(
  tasks: Task[],
  options: { above: number; limits: { max_files: number } },
): { propose: boolean; reasons: string[] } {
  if (tasks.some((t) => t.delivery !== undefined)) return { propose: false, reasons: [] };
  const files = new Set(tasks.flatMap((t) => t.files)).size;
  const reasons = [
    ...(tasks.length > options.above ? [`${tasks.length} tasks (more than ${options.above})`] : []),
    ...(files > options.limits.max_files
      ? [`${files} declared files foresee a PR over size_limits.pr (${options.limits.max_files} files)`]
      : []),
  ];
  return { propose: reasons.length > 0, reasons };
}

/** What `mandao run tasks` reports about deliveries: the split, the current one, the proposal and the issues. */
export function deliveryReport(tasks: Task[], options: { above: number; limits: { max_files: number } }) {
  return {
    deliveries: splitDeliveries(tasks),
    delivery: deliveryProgress(tasks),
    proposeDeliveries: proposeDeliveries(tasks, options),
    deliveryIssues: deliveryIssues(tasks),
  };
}
