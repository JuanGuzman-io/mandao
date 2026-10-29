/**
 * Spec facts both the spec domain and the writer need (the writer depends on schemas only): the story id
 * pattern, the layout versions, and which of them keep the spec's bulk in `.mandao/cache/<ID>/`.
 */

/** A story id: `PROJ-123`, `MDO-0001`. It names the spec's cache folder, so nothing else ever passes. */
export const STORY_ID = /^[A-Z][A-Z0-9_]*-\d+$/;

/**
 * A planning tool's own item id (ClickUp `86e3w5954`, Jira `VZ-12`): kept next to the local story id, never as a folder
 * name. It goes into branch names, so only letters, digits, `-` and `_`.
 */
export const TRACKER_ITEM_ID = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/;

/** How a tracker's integration recognizes its item in a branch, commit or PR: ClickUp wants `CU-<id>`, the rest the id as is. */
export function trackerRef(tracker: string, id: string | null | undefined): string | undefined {
  if (!id || tracker === 'none') return undefined;
  return tracker === 'clickup' ? `CU-${id}` : id;
}

/** The layout versions a story's `schema_version` may name: the one place the set is written. */
export const LAYOUT_VERSIONS = [1, 2] as const;
export type LayoutVersion = (typeof LAYOUT_VERSIONS)[number];

/**
 * The layout version of a spec: its story's `schema_version` when a story exists (as parsed, so unknown stays
 * unknown), else the current layout when `_log/state.yml` exists (`mandao start` writes it before the story),
 * else undefined. Both the spec domain and the writer route through this one rule.
 */
export function effectiveLayoutVersion(storyVersion: unknown, hasStory: boolean, hasStateFile: boolean): unknown {
  if (hasStory) return storyVersion;
  return hasStateFile ? LAYOUT_VERSIONS[LAYOUT_VERSIONS.length - 1] : undefined;
}

/** The first layout version with a six-file `_log/` and a local cache (MDO-0011 design D3). */
const FIRST_CACHE_VERSION = 2;

/**
 * True when a story's `schema_version` (as parsed: a quoted `'2'` is a string) is a known layout version
 * that keeps a six-file `_log/` and its bulk in the local cache. An unknown or malformed version is false,
 * so every caller routes such a spec the same, version 1, way.
 */
export function keepsLogCache(schemaVersion: unknown): boolean {
  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
  return version !== undefined && version >= FIRST_CACHE_VERSION;
}
