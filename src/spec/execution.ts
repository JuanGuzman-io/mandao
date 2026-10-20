import { z } from 'zod';

export const VERDICTS = ['STARTED', 'REPORTED', 'PASS', 'FAIL', 'HALT', 'PIVOT', 'DEFERRED_TO_CI'] as const;
export const verdict = z.enum(VERDICTS);
export type Verdict = z.infer<typeof verdict>;

export const EXECUTION_COLUMNS = [
  'Date',
  'Task',
  'Attempt',
  'Tier',
  'Harness',
  'Implementer',
  'Reviewer',
  'Verdict',
  'Commit',
  'Notes',
] as const;

export interface ExecutionRow {
  date: string;
  task: string;
  attempt: number;
  tier: string;
  harness: string;
  implementer: string;
  reviewer: string;
  verdict: Verdict;
  commit: string;
  notes: string;
}

/** Notes flags recorded by the Leader; the loop and verify read them. */
export const NOTE_FLAGS = {
  reducedIndependence: 'reduced independence',
  providerIndependence: 'provider independence',
} as const;

const cell = (s: string) => s.trim().replace(/^`|`$/g, '').replace(/\\\|/g, '|');

/** Reads the `## Log` table of execution.md. Rows that do not parse come back as issues. */
export function parseExecution(markdown: string, file = 'execution.md'): { rows: ExecutionRow[]; issues: string[] } {
  const issues: string[] = [];
  const rows: ExecutionRow[] = [];
  const lines = markdown.split('\n');
  const header = lines.findIndex((l) => /^\|\s*Date\s*\|\s*Task\s*\|/.test(l));
  if (header < 0) return { rows, issues: [`${file}: no log table (| Date | Task | …)`] };
  for (let i = header + 2; i < lines.length && lines[i]!.trim().startsWith('|'); i++) {
    // Split on unescaped pipes only: notes may contain `\|`.
    const cells = lines[i]!.split(/(?<!\\)\|/)
      .slice(1, -1)
      .map(cell);
    if (cells.length < EXECUTION_COLUMNS.length) {
      issues.push(`${file}:${i + 1}: expected ${EXECUTION_COLUMNS.length} columns`);
      continue;
    }
    const v = verdict.safeParse(cells[7]);
    if (!v.success) {
      issues.push(`${file}:${i + 1}: unknown verdict "${cells[7]}"`);
      continue;
    }
    rows.push({
      date: cells[0]!,
      task: cells[1]!,
      attempt: Number(cells[2]) || 0,
      tier: cells[3]!,
      harness: cells[4]!,
      implementer: cells[5]!,
      reviewer: cells[6]!,
      verdict: v.data,
      commit: cells[8]!,
      notes: cells[9] ?? '',
    });
  }
  return { rows, issues };
}

/** One Markdown table row for the log, in column order. */
export function executionRow(row: ExecutionRow): string {
  const values = [
    row.date,
    row.task,
    String(row.attempt),
    row.tier,
    row.harness,
    row.implementer,
    row.reviewer,
    row.verdict,
    row.commit,
    row.notes,
  ];
  return `| ${values.map((v) => v.replace(/\|/g, '\\|')).join(' | ')} |`;
}
