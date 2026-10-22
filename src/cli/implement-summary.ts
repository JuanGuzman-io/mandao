import { existsSync, readFileSync } from 'node:fs';
import type { SpecFolder } from '../scripts/spec.js';
import { logPath } from '../scripts/spec-log.js';
import { type ExecutionRow, NOTE_FLAGS, securityMentions } from '../spec/index.js';

/** What `/mandao-implement` reports at the end, built from the log and git instead of the Leader's memory. */
export function implementSummary(spec: SpecFolder, committed: Set<string>, pending: string[]) {
  const tasks = spec.tasks.map((t) => {
    const rows = spec.execution.filter((r) => r.task === t.id);
    const last = rows.filter((r) => r.verdict !== 'STARTED').at(-1);
    const fails = rows.filter((r) => r.verdict === 'FAIL');
    const flags = [...new Set(rows.flatMap((r) => Object.values(NOTE_FLAGS).filter((f) => r.notes.includes(f))))];
    return {
      id: t.id,
      title: t.title,
      done: t.done,
      attempts: Math.max(0, ...rows.map((r) => r.attempt)),
      verdict: last?.verdict ?? 'not started',
      fails: fails.map((r) => r.notes.match(/FAIL: ([^;]+)/)?.[1] ?? 'reason not recorded'),
      tier: rows.at(-1)?.tier ?? t.tier,
      implementer: [...rows].reverse().find((r) => r.implementer !== '—')?.implementer ?? '—',
      reviewer: [...rows].reverse().find((r) => r.reviewer !== '—')?.reviewer ?? '—',
      committed: committed.has(t.id),
      flags,
    };
  });
  return {
    spec: spec.name,
    tasks,
    totals: {
      tasks: tasks.length,
      done: tasks.filter((t) => t.done).length,
      committed: tasks.filter((t) => t.committed).length,
      fails: tasks.reduce((n, t) => n + t.fails.length, 0),
    },
    pendingCommits: pending,
    deferredToCi: spec.progress?.deferred_to_ci ?? [],
    advisories: countAdvisories(readLog(spec), spec.execution),
    securityMentions: securityMentions(spec.execution),
  };
}

/** Counts advisories in the log section and Reviewer notes. */
export function countAdvisories(log: string, rows: ExecutionRow[]): number {
  const section = (/## Advisories\n([\s\S]*?)(\n## |$)/.exec(log)?.[1] ?? '').split('\n').filter((l) => /^\s*[-*] /.test(l)).length;
  const inNotes = rows.reduce((n, r) => {
    const text = /\badvisor(?:y|ies)\s*:\s*(.*)$/i.exec(r.notes)?.[1];
    if (text === undefined) return n;
    return n + Math.max(1, text.match(/\(\d+\)/g)?.length ?? 0);
  }, 0);
  return section + inNotes;
}

function readLog(spec: SpecFolder) {
  const file = logPath(spec.dir, 'execution.md');
  return existsSync(file) ? readFileSync(file, 'utf8') : '';
}
