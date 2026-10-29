import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readSources, SOURCES_FILE } from '../engine/files.js';
import { STORY_ID, TRACKER_ITEM_ID } from '../schemas/index.js';

/** The tracker kind sources.yml names, `none` when there is no sources file. */
export function trackerKind(root: string): string {
  return existsSync(join(root, SOURCES_FILE)) ? readSources(root).tracker.kind : 'none';
}

/**
 * Why a new spec's ids are refused (ADR 0067). The spec id names the folder and the cache, so it must be a story id;
 * a tracker's own id that is not one (ClickUp `86e3w5954`) goes in `--tracker-id`, which needs a tracker in
 * sources.yml to become a reference. `quick` is the quick lane's id.
 */
export function idIssues(id: string, trackerId: string | undefined, kind: string): string[] {
  const issues: string[] = [];
  if (id !== 'quick' && !STORY_ID.test(id))
    issues.push(
      `"${id}" is not a story id (PROJ-123, MDO-0001): pass a tracker's own id with --tracker-id and the spec takes the next local id`,
    );
  if (trackerId !== undefined && !TRACKER_ITEM_ID.test(trackerId))
    issues.push(`"${trackerId}" is not a tracker id: letters, digits, - and _ only`);
  else if (trackerId !== undefined && kind === 'none')
    issues.push(`--tracker-id needs the tracker named in ${SOURCES_FILE} (clickup, jira, linear, monday); it has none`);
  return issues;
}
