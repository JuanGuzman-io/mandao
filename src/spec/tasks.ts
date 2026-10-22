import { parse as parseYaml } from 'yaml';
import { z } from 'zod';
import { COMMIT_TYPES, formatIssues, riskTag, tier } from '../schemas/index.js';

export const TASK_ID = /^T\d+$/;

/** What a task changes: its commit type (MDO-0005). `revert` is never planned. */
export const TASK_KINDS = COMMIT_TYPES.filter((t) => t !== 'revert');
export type TaskKind = (typeof TASK_KINDS)[number];

const SCENARIO_ID = /^S-\d+\.\d+(\/C\d+)?$/;

/** The test level a scenario is proven at (§16.1): what the Reviewer FAILs a missing test against. */
export const TEST_LEVELS = ['unit', 'e2e', 'eval', 'none'] as const;
export type TestLevel = (typeof TEST_LEVELS)[number];

/** How a task proves its tests (ADR 0022, 0033): a red run, recorded mutations, or nothing to prove. */
export const EVIDENCE = ['tdd', 'mutation', 'none'] as const;
export type Evidence = (typeof EVIDENCE)[number];

/** Fields of the older layout, prose in YAML: still read, reported by `mandao run tasks`. */
export const LEGACY_TASK_FIELDS = ['tests', 'dod', 'characterization'] as const;

export const taskFieldsSchema = z
  .object({
    project: z.string().min(1),
    // Optional for specs planned before it existed; `mandao run tasks` reports a task without one.
    kind: z.enum(TASK_KINDS).optional(),
    tier,
    files: z.array(z.string()).default([]),
    exemplar: z.string().optional(),
    ac: z.array(z.string().regex(/^AC-\d+(\/C\d+)?$/)).default([]),
    scenarios: z.array(z.string().regex(SCENARIO_ID)).default([]),
    /** Design decisions whose constraints or alternatives apply to this task. */
    decisions: z.array(z.string().regex(/^D\d+$/)).default([]),
    test_levels: z.record(z.string().regex(SCENARIO_ID), z.enum(TEST_LEVELS)).optional(),
    evidence: z.enum(EVIDENCE).optional(),
    risk_tags: z.array(riskTag).default([]),
    partial_failure_tests: z.array(z.string().trim().min(1)).default([]),
    depends_on: z.array(z.string().regex(TASK_ID)).default([]),
    parallel_safe: z.boolean().default(false),
    verify: z.string().optional(),
    tests: z.object({ unit: z.array(z.string()).default([]), e2e: z.array(z.string()).default([]) }).optional(),
    dod: z.array(z.string()).optional(),
    characterization: z.boolean().optional(),
  })
  .strict();

type TaskFields = z.infer<typeof taskFieldsSchema>;

export interface Task extends Omit<TaskFields, 'tests' | 'dod' | 'characterization'> {
  id: string;
  title: string;
  done: boolean;
  line: number;
  /** Declared tests: from `test_levels` (scenario ids by level), or the older `tests` lists. */
  tests: { unit: string[]; e2e: string[] };
  dod: string[];
  /** Mutation evidence instead of a red run (`evidence: mutation`, or the older `characterization`). */
  characterization: boolean;
}

/** One shape for both layouts, so loop, verify, trace and Kaizen read either. */
function normalize(f: TaskFields): Omit<Task, 'id' | 'title' | 'done' | 'line'> {
  const levels = Object.entries(f.test_levels ?? {});
  const at = (...wanted: TestLevel[]) => levels.filter(([, l]) => wanted.includes(l)).map(([s]) => s);
  const tests = f.test_levels ? { unit: at('unit', 'eval'), e2e: at('e2e') } : (f.tests ?? { unit: [], e2e: [] });
  const characterization = f.evidence ? f.evidence === 'mutation' : (f.characterization ?? false);
  const declared = tests.unit.length + tests.e2e.length > 0;
  const evidence = f.evidence ?? (characterization ? 'mutation' : declared ? 'tdd' : 'none');
  const { tests: _t, dod, characterization: _c, ...rest } = f;
  return { ...rest, tests, dod: dod ?? [], characterization, evidence };
}

const HEADING = /^###\s+\[([ xX])\]\s+(T\d+)\s*[—–-]\s*(.+)$/;

/** The YAML text of the fenced block that follows the heading at line `i`, or an issue. */
function yamlBlockAfter(lines: string[], i: number): { yaml?: string; issue?: string } {
  const start = lines.findIndex((l, j) => j > i && /^```ya?ml\s*$/.test(l));
  const nextHeading = lines.findIndex((l, j) => j > i && /^#{1,3}\s/.test(l));
  if (start < 0 || (nextHeading >= 0 && start > nextHeading)) return { issue: 'has no ```yaml block' };
  const end = lines.findIndex((l, j) => j > start && /^```\s*$/.test(l));
  return { yaml: lines.slice(start + 1, end < 0 ? undefined : end).join('\n') };
}

function readTask(lines: string[], i: number, h: RegExpMatchArray, file: string, issues: string[]): Task | undefined {
  const [, mark, id, title] = h;
  const block = yamlBlockAfter(lines, i);
  if (block.issue) {
    issues.push(`${file}:${i + 1}: ${id} ${block.issue}`);
    return undefined;
  }
  let raw: unknown;
  try {
    raw = parseYaml(block.yaml ?? '');
  } catch (e) {
    issues.push(`${file}:${i + 1}: ${id}: invalid YAML (${(e as Error).message.split('\n')[0]})`);
    return undefined;
  }
  const fields = taskFieldsSchema.safeParse(raw ?? {});
  if (!fields.success) {
    issues.push(...formatIssues(fields.error, `${file} ${id}`));
    return undefined;
  }
  return { ...normalize(fields.data), id: id!, title: title!.trim(), done: mark !== ' ', line: i + 1 };
}

/** Parses tasks.md: `### [ ] T2 — title` followed by a fenced YAML block with the task's fields. */
export function parseTasks(markdown: string, file = 'tasks.md'): { tasks: Task[]; issues: string[] } {
  const issues: string[] = [];
  const tasks: Task[] = [];
  const lines = markdown.split('\n');
  lines.forEach((line, i) => {
    const h = line.match(HEADING);
    if (!h) {
      if (/^###\s+(\[.\]\s+)?T-?\d+/.test(line)) issues.push(`${file}:${i + 1}: task heading must be "### [ ] Tn — title"`);
      return;
    }
    const task = readTask(lines, i, h, file, issues);
    if (!task) return;
    if (tasks.some((t) => t.id === task.id)) issues.push(`${file}:${i + 1}: duplicate ${task.id}`);
    tasks.push(task);
  });
  for (const t of tasks) {
    for (const dep of t.depends_on) if (!tasks.some((x) => x.id === dep)) issues.push(`${file}: ${t.id} depends on unknown ${dep}`);
  }
  return { tasks, issues };
}

/** Marks a task done or pending in tasks.md text; everything else is left byte for byte. */
export function setTaskDone(markdown: string, id: string, done: boolean): string {
  return markdown.replace(new RegExp(`^(###\\s+\\[)[ xX](\\]\\s+${id}\\s*[—–-])`, 'm'), `$1${done ? 'x' : ' '}$2`);
}
