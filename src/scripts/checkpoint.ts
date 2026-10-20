import { join } from 'node:path';
import { stringify as stringifyYaml } from 'yaml';
import { type ExecutionRow, executionRow, type Progress, progressSchema, setTaskDone } from '../spec/index.js';
import { snapshot, writeFromSnapshot, writeText } from '../writer/files.js';

const EXECUTION_TEMPLATE = (spec: string) => `---
schema_version: 1
spec: ${spec}
---

# Execution — ${spec}

## Log

| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Commit | Notes |
|---|---|---|---|---|---|---|---|---|---|
`;

/** Appends a row to the execution log, creating the file from its template when missing. */
export function appendExecutionRow(dir: string, spec: string, row: ExecutionRow): void {
  const file = join(dir, 'execution.md');
  const snap = snapshot(file);
  const content = snap.content ?? EXECUTION_TEMPLATE(spec);
  const lines = content.split('\n');
  const header = lines.findIndex((l) => /^\|\s*Date\s*\|\s*Task\s*\|/.test(l));
  let end = header + 2;
  while (end < lines.length && lines[end]!.trim().startsWith('|')) end++;
  lines.splice(end, 0, executionRow(row));
  writeFromSnapshot(snap, lines.join('\n'));
}

/** Writes progress.yml (the checkpoint) after validating it. */
export function writeProgress(dir: string, progress: Progress): void {
  const valid = progressSchema.parse(progress);
  writeText(
    join(dir, 'progress.yml'),
    `# Written by mandao run checkpoint after every Leader step (ADR 0018).\n${stringifyYaml(valid, { lineWidth: 0 })}`,
  );
}

/** Flips a task's checkbox in tasks.md, leaving everything else as it was. */
export function markTask(dir: string, task: string, done: boolean): void {
  const file = join(dir, 'tasks.md');
  const snap = snapshot(file);
  if (snap.content === undefined) throw new Error(`${file} does not exist`);
  writeFromSnapshot(snap, setTaskDone(snap.content, task, done));
}
