import { existsSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { readConfig } from '../engine/files.js';
import { commitState } from '../scripts/commits.js';
import type { SpecFolder } from '../scripts/spec.js';
import { readApprovalLog, specLogInCache } from '../scripts/spec-log.js';
import {
  acceptedRisks,
  acStatus,
  type CloseLink,
  type CloseSummary,
  changelogLine,
  renderCloseDocument,
  upsertChangelog,
  verifyResults,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';

const readIf = (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : undefined);

/** Links to what the close produced, only for files that exist, relative to the spec folder. */
export function closeLinks(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder): CloseLink[] {
  const id = spec.story?.meta.id ?? spec.name;
  // A version 2 close is the summary itself: no per-spec release or Kaizen document to point to (MDO-0011 D5).
  const perSpec = specLogInCache(spec.dir)
    ? []
    : [
        { label: 'Release notes', file: join(root, config.paths.releases, id, 'release-notes.md') },
        { label: 'Technical notes', file: join(root, config.paths.releases, id, 'technical.md') },
        { label: 'Kaizen', file: join(root, 'docs', 'kaizen', `${id}.md`) },
      ];
  const candidates = [
    ...perSpec,
    { label: 'Verify report', file: join(spec.dir, 'verify-report.md') },
    { label: 'Quickstart', file: join(spec.dir, 'quickstart.md') },
  ];
  return candidates
    .filter((c) => existsSync(c.file))
    .map((c) => ({ label: c.label, href: relative(spec.dir, c.file).split(sep).join('/') }));
}

/** The Outcome section: each criterion as `release-status` reports it, never upgraded by hand. */
function outcomeOf(config: ReturnType<typeof readConfig>, spec: SpecFolder): string[] {
  if (!spec.story) return [];
  const committed = commitState(spec, config.commits.trailers).committed;
  const verify = verifyResults(readIf(join(spec.dir, 'verify-report.md')));
  return acStatus(spec.story, spec.tasks, spec.execution, committed, verify).map((c) => `- ${c.ref}: ${c.status} (${c.why})`);
}

/** A version 2 close writes the document and, once closed, the spec's one CHANGELOG line (MDO-0011 D5). */
export function writeCloseDocument(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder, summary: CloseSummary) {
  const file = join(spec.dir, 'close-summary.md');
  const record = { ...summary, accepted_risks: acceptedRisks(readApprovalLog(spec.dir)) };
  writeText(file, renderCloseDocument(record, readIf(file), outcomeOf(config, spec), closeLinks(root, config, spec)));
  if (!summary.closed_at || !spec.story) return;
  const log = join(root, 'docs', 'CHANGELOG.md');
  const href = `${relative(join(root, 'docs'), spec.dir).split(sep).join('/')}/`;
  const line = changelogLine(spec.story.meta.id, spec.story.title, spec.story.meta.type, summary.closed_at, href);
  writeText(log, upsertChangelog(readIf(log), spec.story.meta.id, line));
}
