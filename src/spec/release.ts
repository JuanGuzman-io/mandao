import type { ExecutionRow } from './execution.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

export type AcStatus = 'met' | 'partial' | 'pending';

export interface AcRelease {
  ref: string;
  critical: boolean;
  status: AcStatus;
  /** Why, in terms a reader can check: tasks, commits, verify result. */
  why: string;
}

/** `## Acceptance criteria → tests` rows of verify-report.md: reference and result, as written by verify. */
export function verifyResults(reportMd: string | undefined): Map<string, string> {
  const out = new Map<string, string>();
  const section = reportMd?.split(/^## Acceptance criteria → tests\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  for (const line of section.split('\n')) {
    const cells = line.split('|').map((c) => c.trim());
    // The first cell starts with the id; anything after it (`AC-1 main`) is description.
    const ref = (cells[1] ?? '').match(/^(AC-\d+(?:\/C\d+)?)\b/)?.[1];
    if (cells.length < 6 || !ref) continue;
    out.set(ref, (cells[5] ?? '').toUpperCase());
  }
  return out;
}

const finished = (t: Task, rows: ExecutionRow[], committed: Set<string>) => {
  const last = rows.filter((r) => r.task === t.id).at(-1)?.verdict;
  return t.done && (last === 'PASS' || last === 'DEFERRED_TO_CI') && committed.has(t.id);
};

/**
 * Release notes criterion by criterion (design §18.1): met when every task covering the AC is done, passed
 * review and is committed, and verify passed it; pending when nothing was built for it; partial otherwise.
 */
export function acStatus(
  story: Story,
  tasks: Task[],
  rows: ExecutionRow[],
  committed: Set<string>,
  verify: Map<string, string>,
): AcRelease[] {
  return story.acs
    .filter((ac) => !ac.removed)
    .map((ac) => {
      const covering = tasks.filter((t) => t.ac.some((a) => a === ac.id || a.startsWith(`${ac.id}/`)));
      const done = covering.filter((t) => finished(t, rows, committed));
      const verified = verify.get(ac.id);
      const base = { ref: ac.id, critical: ac.critical };
      if (!covering.length) return { ...base, status: 'pending' as const, why: 'no task covers it' };
      if (!done.length) return { ...base, status: 'pending' as const, why: `${covering.map((t) => t.id).join(', ')} not finished` };
      if (done.length < covering.length) {
        const open = covering.filter((t) => !done.includes(t)).map((t) => t.id);
        return { ...base, status: 'partial' as const, why: `${open.join(', ')} not finished` };
      }
      if (verified !== 'PASS')
        return { ...base, status: 'partial' as const, why: verified ? `verify: ${verified}` : 'not in verify-report.md' };
      return { ...base, status: 'met' as const, why: `${done.map((t) => t.id).join(', ')} committed; verify PASS` };
    });
}

/** Items proposed under a design.md section (`## Constitution Impact`, `## Product Impact`), comments removed. */
export function impactItems(designMd: string, section: 'Constitution Impact' | 'Product Impact'): string[] {
  const body = designMd.split(new RegExp(`^## ${section}\\s*$`, 'm'))[1]?.split(/^## /m)[0] ?? '';
  const items: string[] = [];
  let current: string[] | undefined;
  const flush = () => {
    if (current?.length) items.push(current.join(' '));
    current = undefined;
  };
  for (const raw of body.replace(/<!--[\s\S]*?-->/g, '').split('\n')) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (/^[-*] /.test(line)) {
      flush();
      current = [line.slice(2).trim()];
    } else {
      // A wrapped bullet line, or a plain paragraph: both belong to the current item.
      current = [...(current ?? []), line];
    }
  }
  flush();
  return items.filter((l) => !/^none\.?$/i.test(l));
}
