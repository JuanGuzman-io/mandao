import semver from 'semver';
import { z } from 'zod';
import { parseFrontmatter } from '../engine/frontmatter.js';

/**
 * Release notes for one version (phase 10): the `For the PO` text of every spec closed in a git range, copied verbatim,
 * grouped by type under headings from a per-language template. Pure: the git range and the files are read by
 * `src/scripts/version-notes.ts`.
 */
export const versionNotesTemplateSchema = z.object({
  schema_version: z.literal(1),
  language: z.string().min(2),
  /** `{type}`: the type's label from `types`, or the type itself when the template has no label for it. */
  group_heading: z.string().min(1),
  /** `{id}`, `{title}`. */
  spec_heading: z.string().min(1),
  /** The `{specs}` text when no spec has notes. */
  empty: z.string().min(1),
  /** Type → label; the key order is the group order. */
  types: z.record(z.string(), z.string()).default({}),
});

export interface VersionNotesTemplate {
  meta: z.infer<typeof versionNotesTemplateSchema>;
  /** The document, with `{version}` and `{specs}`. */
  body: string;
}

export function parseVersionNotesTemplate(text: string): VersionNotesTemplate {
  const { data, content } = parseFrontmatter(text);
  const meta = versionNotesTemplateSchema.safeParse(data);
  if (!meta.success) {
    const issues = meta.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`);
    throw new Error(`version notes template: ${issues.join('; ')}`);
  }
  return { meta: meta.data, body: content.replace(/^\n+/, '') };
}

/** The version as semver without a leading `v`; anything else throws, so `v<version>.md` never looks like a spec folder. */
export function releaseVersion(input: string): string {
  const version = semver.valid(input.trim());
  if (!version || !/^v?\d/.test(input.trim())) throw new Error(`"${input}" is not a semver version (e.g. 0.1.0 or 0.1.0-beta.0)`);
  return version;
}

/** The template language for `business`: itself, then its primary subtag (`es-CO` → `es`), then `en` (a fallback). */
export function chooseTemplateLanguage(business: string, available: readonly string[]): { language: string; fallback: boolean } {
  const primary = business.split(/[-_]/)[0] ?? business;
  const found = [business, primary].find((l) => available.includes(l));
  if (found) return { language: found, fallback: false };
  return { language: 'en', fallback: primary !== 'en' };
}

/** The spec IDs to report: closed and referenced in the range, sorted; `straddling` were also referenced before it. */
export function splitRefs(inRange: readonly string[], before: readonly string[], closed: ReadonlySet<string>) {
  const earlier = new Set(before);
  const ids = [...new Set(inRange)].filter((id) => closed.has(id)).sort(byId);
  return { ids, straddling: ids.filter((id) => earlier.has(id)) };
}

/** `docs/CHANGELOG.md` lines (`changelogLine`) by spec ID: title (escaped pipes restored) and type. */
export function changelogEntries(text: string | undefined): Map<string, { title: string; type: string }> {
  const out = new Map<string, { title: string; type: string }>();
  for (const line of (text ?? '').split('\n')) {
    const m = /^\| (\S+) \| (.*) \| (\S+) \| \S+ \| \[spec\]\(.*\) \|$/.exec(line);
    if (m) out.set(m[1]!, { title: m[2]!.replaceAll('\\|', '|'), type: m[3]! });
  }
  return out;
}

export interface VersionNoteEntry {
  id: string;
  title: string;
  type: string;
  /** The `For the PO` text; absent or blank → the spec is missing, never invented. */
  text?: string;
  /** Why there is no text, for `missing`. */
  reason?: string;
}

export interface VersionNotes {
  markdown: string;
  specs: { id: string; title: string; type: string }[];
  missing: { id: string; reason: string }[];
}

const byId = (a: string, b: string) => a.localeCompare(b, 'en', { numeric: true });
const TOKEN = /\{([a-z]+)\}/g;

/** Replaces `{name}` tokens in one pass, so inserted text is never scanned again; an unknown token throws. */
function fill(text: string, values: Record<string, string>): string {
  return text.replace(TOKEN, (whole, name: string) => {
    const value = values[name];
    if (value === undefined) throw new Error(`version notes template: unknown token ${whole}`);
    return value;
  });
}

/** Renders the notes: groups by type in template order (unknown types after, by name), specs by ID, texts verbatim. */
export function versionNotes(template: VersionNotesTemplate, version: string, entries: readonly VersionNoteEntry[]): VersionNotes {
  const { meta } = template;
  const withText = entries.filter((e) => e.text?.trim());
  const missing = entries.filter((e) => !e.text?.trim()).map((e) => ({ id: e.id, reason: e.reason ?? 'no "For the PO" text' }));
  const order = Object.keys(meta.types);
  const rank = (type: string) => (order.includes(type) ? order.indexOf(type) : order.length);
  const sorted = [...withText].sort((a, b) => rank(a.type) - rank(b.type) || a.type.localeCompare(b.type) || byId(a.id, b.id));
  const blocks: string[] = [];
  let group: string | undefined;
  for (const e of sorted) {
    if (e.type !== group) blocks.push(`${fill(meta.group_heading, { type: meta.types[e.type] ?? e.type })}\n`);
    group = e.type;
    const text = e.text!.endsWith('\n') ? e.text! : `${e.text}\n`;
    blocks.push(`${fill(meta.spec_heading, { id: e.id, title: e.title })}\n\n${text}`);
  }
  const specs = blocks.length ? blocks.join('\n') : `${meta.empty}\n`;
  const markdown = fill(template.body, { version, specs }).replace(/\n*$/, '\n');
  return { markdown, specs: sorted.map(({ id, title, type }) => ({ id, title, type })), missing };
}

const linesOf = (text: string) => (text === '' ? [] : text.replace(/\n$/, '').split('\n'));

/** `lcs[i][j]`: length of the longest common subsequence of `a[i..]` and `b[j..]`. */
function lcsTable(a: string[], b: string[]): number[][] {
  const lcs = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--)
    for (let j = b.length - 1; j >= 0; j--)
      lcs[i]![j] = a[i] === b[j] ? lcs[i + 1]![j + 1]! + 1 : Math.max(lcs[i + 1]![j]!, lcs[i]![j + 1]!);
  return lcs;
}

/** One-hunk unified diff of `before` → `after` with full context (LCS by line); '' when they are equal. */
export function unifiedDiff(before: string, after: string, path: string): string {
  if (before === after) return '';
  const a = linesOf(before);
  const b = linesOf(after);
  const lcs = lcsTable(a, b);
  const lines: string[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) {
      lines.push(` ${a[i]}`);
      i++;
      j++;
    } else if (i < a.length && (j >= b.length || lcs[i + 1]![j]! >= lcs[i]![j + 1]!)) lines.push(`-${a[i++]}`);
    else lines.push(`+${b[j++]}`);
  }
  return [`--- a/${path}`, `+++ b/${path}`, `@@ -1,${a.length} +1,${b.length} @@`, ...lines, ''].join('\n');
}
