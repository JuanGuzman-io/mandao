import { stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';
import { parseFrontmatter } from '../engine/frontmatter.js';

/**
 * `close-summary.md`: what close did, in its frontmatter, so re-running close updates instead of
 * duplicating (design §18.2). Written only through `mandao run close-summary`.
 */
export const closeSummarySchema = z.object({
  schema_version: z.literal(1),
  spec: z.string().min(1),
  closed_at: z.string().optional(),
  /** gitflow: the team-made `release/*` branch the spec ships in (ADR 0023). */
  release: z.object({ branch: z.string().min(1), how: z.enum(['detected', 'given']) }).optional(),
  /** Environments reached, as CI or the tracker reported them; never inferred, never automated. */
  environments: z.array(z.object({ name: z.string().min(1), at: z.string().min(1), source: z.enum(['ci', 'tracker']) })).default([]),
  /** Each publication: where, the id it got, and the hash of what was sent (same hash → nothing to update). */
  published: z
    .array(
      z.object({
        target: z.string().min(1),
        kind: z.enum(['comment', 'attachment', 'page', 'file']),
        id: z.string().min(1),
        url: z.string().optional(),
        hash: z.string().min(1),
        at: z.string().min(1),
      }),
    )
    .default([]),
  /** Files outside the spec folder that close applied with approval; the close commit stages them (MDO-0011 D6). */
  applied: z.array(z.string().min(1)).default([]),
});
export type CloseSummary = z.infer<typeof closeSummarySchema>;

export function parseCloseSummary(text: string | undefined, spec: string): CloseSummary {
  if (!text) return closeSummarySchema.parse({ schema_version: 1, spec });
  // YAML 1.2 through parseFrontmatter: ISO timestamps stay strings instead of becoming Dates.
  return closeSummarySchema.parse(parseFrontmatter(text).data);
}

/** Frontmatter plus a readable body regenerated from it. */
export interface CloseLink {
  label: string;
  /** Relative to the spec folder. */
  href: string;
}

/** The record lines, then one line per document the close produced: the summary only points to them. */
export function renderCloseSummary(s: CloseSummary, links: CloseLink[] = []): string {
  const lines = [
    `# Close — ${s.spec}`,
    '',
    `- Closed: ${s.closed_at ?? 'not yet'}`,
    `- Release: ${s.release ? `${s.release.branch} (${s.release.how})` : '—'}`,
    `- Environments: ${s.environments.length ? s.environments.map((e) => `${e.name} (${e.source}, ${e.at})`).join(', ') : '—'}`,
    `- Published: ${s.published.length ? s.published.map((p) => `${p.target} ${p.kind} ${p.id}`).join(', ') : '—'}`,
    ...links.map((l) => `- [${l.label}](${l.href})`),
  ];
  return `---\n${stringifyYaml(s, { lineWidth: 0 })}---\n\n${lines.join('\n')}\n`;
}

/** Records an environment once per name: a later report updates its time and source. */
export function withEnvironment(s: CloseSummary, name: string, source: 'ci' | 'tracker', at: string): CloseSummary {
  return { ...s, environments: [...s.environments.filter((e) => e.name !== name), { name, at, source }] };
}

/** Records a publication once per (target, kind): re-publishing replaces it. */
export function withPublication(s: CloseSummary, p: CloseSummary['published'][number]): CloseSummary {
  return { ...s, published: [...s.published.filter((x) => !(x.target === p.target && x.kind === p.kind)), p] };
}

/** The prose sections close writes by hand: `run close-summary` keeps them as written, edges trimmed. */
const PROSE = ['For the PO', 'For developers', 'Kaizen'] as const;

/** The body of a `## <heading>` section: from the line after it to the next `## ` heading; undefined when absent. */
export function sectionOf(text: string | undefined, heading: string): string | undefined {
  if (!text) return undefined;
  const start = text.split(/^---\n[\s\S]*?\n---\n/)[1] ?? text;
  const found = start
    .split(/^## /m)
    .slice(1)
    .find((s) => s.split('\n')[0]?.trim() === heading);
  return found?.slice(found.indexOf('\n') + 1);
}

/** The lead the agent wrote between the `# Close` title and the first `## ` heading; undefined when there is none. */
function leadOf(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const start = text.split(/^---\n[\s\S]*?\n---\n/)[1] ?? text;
  return (start.split(/^## /m)[0] ?? '').replace(/^\s*# .*\n/, '').trim() || undefined;
}

const joined = (items: string[]) => items.join(', ');

/** Delivery lines, only for what the record holds: no field is written empty (S-4.3). */
function deliveryLines(s: CloseSummary, links: CloseLink[]): string[] {
  return [
    ...(s.closed_at ? [`- Closed: ${s.closed_at}`] : []),
    ...(s.release ? [`- Release: ${s.release.branch} (${s.release.how})`] : []),
    ...(s.environments.length ? [`- Environments: ${joined(s.environments.map((e) => `${e.name} (${e.source}, ${e.at})`))}`] : []),
    ...(s.published.length ? [`- Published: ${joined(s.published.map((p) => `${p.target} ${p.kind} ${p.id}`))}`] : []),
    ...(s.applied.length ? [`- Applied: ${joined(s.applied.map((a) => `\`${a}\``))}`] : []),
    ...links.map((l) => `- [${l.label}](${l.href})`),
  ];
}

/**
 * A version 2 `close-summary.md`: the record as frontmatter, then `Outcome` and `Delivery` rewritten from it and from
 * `release-status`, and the prose sections (`For the PO`, `For developers`, `Kaizen`) kept as `existing` has them.
 * A section with nothing to say is left out, never written empty.
 */
export function renderCloseDocument(s: CloseSummary, existing: string | undefined, outcome: string[], links: CloseLink[] = []): string {
  const prose = PROSE.map((name): [string, string | undefined] => [name, sectionOf(existing, name)?.trim()]);
  const parts: [string, string | undefined][] = [
    ['Outcome', outcome.join('\n')],
    ...prose,
    ['Delivery', deliveryLines(s, links).join('\n')],
  ];
  const lead = leadOf(existing);
  const body = parts.filter(([, text]) => text).map(([name, text]) => `## ${name}\n\n${text}\n\n`);
  return `---\n${stringifyYaml(s, { lineWidth: 0 })}---\n\n# Close — ${s.spec}\n\n${lead ? `${lead}\n\n` : ''}${body.join('')}`.replace(
    /\n+$/,
    '\n',
  );
}

const CHANGELOG_HEAD =
  '# Changelog\n\nOne line per closed spec, newest last.\n\n| Spec | Title | Type | Closed | Folder |\n|---|---|---|---|---|\n';

/** The one CHANGELOG line of a spec: ID, title, type, closed date and a link to its folder. */
export function changelogLine(id: string, title: string, type: string, closedAt: string, href: string): string {
  return `| ${id} | ${title.replaceAll('|', '\\|')} | ${type} | ${closedAt.slice(0, 10)} | [spec](${href}) |`;
}

/** Puts `line` in the CHANGELOG once per ID: a second close replaces it, a new spec appends. */
export function upsertChangelog(text: string | undefined, id: string, line: string): string {
  const lines = (text ?? CHANGELOG_HEAD).replace(/\n*$/, '\n').split('\n');
  const at = lines.findIndex((l) => l.startsWith(`| ${id} |`));
  if (at >= 0) lines[at] = line;
  else lines.splice(lines.length - 1, 0, line);
  return lines.join('\n');
}
