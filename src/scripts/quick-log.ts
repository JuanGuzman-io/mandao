import { join } from 'node:path';
import { snapshot, writeFromSnapshot } from '../writer/files.js';
import { type Identity, identityCell, identityNotes } from './identity.js';
import type { FileStat } from './quick-check.js';

const QUICK_LOG_TEMPLATE = `---
schema_version: 1
---

# Quick log

| Date | Name | Project | Files | Lines changed (measured by quick-check) | Gates | Review (reviewer model; \`reduced independence\` if any) | Commit |
|---|---|---|---|---|---|---|---|
`;

export interface QuickLogEntry {
  date: string;
  name: string;
  project: string;
  /** The measured diff, without the log itself. */
  files: FileStat[];
  gates: string;
  verdict: 'PASS' | 'FAIL';
  /** Resolved by the script from the agent file, never typed by the model (ADR 0021, MDO-0005). */
  reviewer: Identity;
  claimedReviewer?: string;
  /** The reviewer ran on the author's model (no alternative available). */
  reducedIndependence?: boolean;
}

const cellText = (s: string) => s.replace(/\|/g, '\\|').replace(/\n+/g, ' ');

/** The review cell: verdict, agent and the model its agent file pins, plus independence and mismatch notes. */
export function reviewCell(e: Pick<QuickLogEntry, 'verdict' | 'reviewer' | 'claimedReviewer' | 'reducedIndependence'>): string {
  const who = e.reviewer.source === 'self' ? 'self' : `${e.reviewer.agent} on ${identityCell(e.reviewer)}`;
  const notes = identityNotes('reviewer', e.reviewer, e.claimedReviewer);
  if (e.reducedIndependence && e.reviewer.source !== 'self') notes.push('reduced independence (the reviewer shares the author model)');
  return [`${e.verdict}, ${who}`, ...notes].join('; ');
}

export function quickLogRow(e: QuickLogEntry): string {
  const added = e.files.reduce((n, f) => n + f.added, 0);
  const deleted = e.files.reduce((n, f) => n + f.deleted, 0);
  const cells = [
    e.date,
    e.name,
    e.project,
    e.files.map((f) => `\`${f.path}\``).join(', ') || '—',
    `${added + deleted} (+${added}/-${deleted})`,
    e.gates,
    reviewCell(e),
    'this commit',
  ];
  return `| ${cells.map(cellText).join(' | ')} |`;
}

/** Appends the row to `<specs>/quick/quick-log.md`, creating it when missing. Returns the file. */
export function appendQuickLog(specsDir: string, entry: QuickLogEntry): string {
  const file = join(specsDir, 'quick', 'quick-log.md');
  const snap = snapshot(file);
  const lines = (snap.content ?? QUICK_LOG_TEMPLATE).split('\n');
  const header = lines.findIndex((l) => /^\|\s*Date\s*\|\s*Name\s*\|/.test(l));
  if (header < 0) throw new Error(`${file} has no log table (| Date | Name | …)`);
  let end = header + 2;
  while (end < lines.length && lines[end]!.trim().startsWith('|')) end++;
  lines.splice(end, 0, quickLogRow(entry));
  writeFromSnapshot(snap, lines.join('\n'));
  return file;
}
