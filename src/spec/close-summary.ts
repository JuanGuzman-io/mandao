import matter from 'gray-matter';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { z } from 'zod';

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
});
export type CloseSummary = z.infer<typeof closeSummarySchema>;

export function parseCloseSummary(text: string | undefined, spec: string): CloseSummary {
  if (!text) return closeSummarySchema.parse({ schema_version: 1, spec });
  // YAML 1.2 (`yaml`), not gray-matter's default: ISO timestamps stay strings instead of becoming Dates.
  return closeSummarySchema.parse(matter(text, { engines: { yaml: (s: string) => parseYaml(s) as object } }).data);
}

/** Frontmatter plus a readable body regenerated from it. */
export function renderCloseSummary(s: CloseSummary): string {
  const lines = [
    `# Close — ${s.spec}`,
    '',
    `- Closed: ${s.closed_at ?? 'not yet'}`,
    `- Release: ${s.release ? `${s.release.branch} (${s.release.how})` : '—'}`,
    `- Environments: ${s.environments.length ? s.environments.map((e) => `${e.name} (${e.source}, ${e.at})`).join(', ') : '—'}`,
    `- Published: ${s.published.length ? s.published.map((p) => `${p.target} ${p.kind} ${p.id}`).join(', ') : '—'}`,
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
