import { z } from 'zod';

/**
 * `RED`: the task's tests failed for the expected reason before implementing (TDD, ADR 0022). `MUTANT`: a
 * characterization task's tests failed under a recorded, reverted mutation of the code they pin down.
 */
export const VERDICTS = ['STARTED', 'RED', 'MUTANT', 'REPORTED', 'PASS', 'FAIL', 'HALT', 'PIVOT', 'DEFERRED_TO_CI'] as const;
export const verdict = z.enum(VERDICTS);
export type Verdict = z.infer<typeof verdict>;

export const EXECUTION_COLUMNS = ['Date', 'Task', 'Attempt', 'Tier', 'Harness', 'Implementer', 'Reviewer', 'Verdict', 'Notes'] as const;

export interface ExecutionRow {
  date: string;
  task: string;
  attempt: number;
  tier: string;
  harness: string;
  implementer: string;
  reviewer: string;
  verdict: Verdict;
  notes: string;
}

/** Notes flags recorded by the Leader; the loop and verify read them. */
export const NOTE_FLAGS = {
  reducedIndependence: 'reduced independence',
  providerIndependence: 'provider independence',
  /** The model said it was someone other than the process the script invoked. */
  identityMismatch: 'identity mismatch',
  /** A test recorded red changed afterwards: a discrepancy the Reviewer judges (ADR 0022). */
  redTestChanged: 'red test changed',
  /** A task with mandatory tests reached review without red evidence: the Reviewer FAILs it. */
  noRedEvidence: 'no red evidence',
} as const;

const cell = (s: string) => s.trim().replace(/^`|`$/g, '').replace(/\\\|/g, '|');

/** Column positions from the header row; columns Mandao no longer writes (e.g. `Commit`) are ignored. */
function columnIndex(header: string): Map<string, number> {
  const names = header
    .split(/(?<!\\)\|/)
    .slice(1, -1)
    .map((c) => c.trim());
  return new Map(names.map((n, i) => [n, i]));
}

/**
 * Reads the `## Log` table of execution.md. Rows that do not parse come back as issues. Commits are not
 * recorded here: they are found by their trailers in git (ADR 0021), so a rebase never breaks the log.
 */
export function parseExecution(markdown: string, file = 'execution.md'): { rows: ExecutionRow[]; issues: string[] } {
  const issues: string[] = [];
  const rows: ExecutionRow[] = [];
  const lines = markdown.split('\n');
  const header = lines.findIndex((l) => /^\|\s*Date\s*\|\s*Task\s*\|/.test(l));
  if (header < 0) return { rows, issues: [`${file}: no log table (| Date | Task | …)`] };
  const index = columnIndex(lines[header]!);
  const missing = EXECUTION_COLUMNS.filter((c) => !index.has(c));
  if (missing.length) return { rows, issues: [`${file}:${header + 1}: missing columns ${missing.join(', ')}`] };
  for (let i = header + 2; i < lines.length && lines[i]!.trim().startsWith('|'); i++) {
    // Split on unescaped pipes only: notes may contain `\|`.
    const cells = lines[i]!.split(/(?<!\\)\|/)
      .slice(1, -1)
      .map(cell);
    if (cells.length < index.size) {
      issues.push(`${file}:${i + 1}: expected ${index.size} columns`);
      continue;
    }
    const at = (c: (typeof EXECUTION_COLUMNS)[number]) => cells[index.get(c)!] ?? '';
    const v = verdict.safeParse(at('Verdict'));
    if (!v.success) {
      issues.push(`${file}:${i + 1}: unknown verdict "${at('Verdict')}"`);
      continue;
    }
    rows.push({
      date: at('Date'),
      task: at('Task'),
      attempt: Number(at('Attempt')) || 0,
      tier: at('Tier'),
      harness: at('Harness'),
      implementer: at('Implementer'),
      reviewer: at('Reviewer'),
      verdict: v.data,
      notes: at('Notes'),
    });
  }
  return { rows, issues };
}

/** One Markdown table row for the log, in column order. */
export function executionRow(row: ExecutionRow): string {
  const values = [row.date, row.task, String(row.attempt), row.tier, row.harness, row.implementer, row.reviewer, row.verdict, row.notes];
  return `| ${values.map((v) => v.replace(/\|/g, '\\|')).join(' | ')} |`;
}
