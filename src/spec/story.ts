import { z } from 'zod';
import { formatIssues, schemaVersion, specStatus } from '../schemas/index.js';
import { type Clause, frontmatterOf, readClauses, sections, splitHeading } from './markdown.js';

export const SPEC_TYPES = ['epic', 'story', 'bug', 'enhancement', 'task', 'performance'] as const;

export const storyFrontmatterSchema = z.object({
  schema_version: schemaVersion,
  tracker: z.enum(['jira', 'linear', 'clickup', 'monday', 'none']).default('none'),
  type: z.enum(SPEC_TYPES).default('story'),
  id: z.string().regex(/^[A-Z][A-Z0-9_]*-\d+$/, 'must look like PROJ-123 or MDO-0001'),
  url: z.string().nullish(),
  parent: z.string().nullish(),
  projects: z.array(z.string()).default([]),
  status: specStatus.default('draft'),
  sources: z.array(z.unknown()).default([]),
  models: z.record(z.string(), z.unknown()).optional(),
});

export interface AcceptanceCriterion {
  id: string;
  title: string;
  critical: boolean;
  clauses: Clause[];
  line: number;
}

export interface Story {
  meta: z.infer<typeof storyFrontmatterSchema>;
  title: string;
  acs: AcceptanceCriterion[];
  raw: string;
}

/** Parses story.md. Never throws: problems come back as issues next to whatever could be read. */
export function parseStory(markdown: string, file = 'story.md'): { story?: Story; issues: string[] } {
  const issues: string[] = [];
  const { data, content } = frontmatterOf(markdown);
  const meta = storyFrontmatterSchema.safeParse(data);
  if (!meta.success) return { issues: formatIssues(meta.error, file) };
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? '';
  const acs: AcceptanceCriterion[] = [];
  for (const s of sections(content, 3)) {
    const h = splitHeading(s.heading);
    if (!h?.id.startsWith('AC-')) continue;
    if (acs.some((a) => a.id === h.id)) issues.push(`${file}:${s.line}: duplicate ${h.id}`);
    acs.push({
      id: h.id,
      title: h.title,
      critical: /^\s*critical:\s*true\s*$/im.test(s.body),
      clauses: readClauses(s.body, `${file}:${s.line} ${h.id}`, issues),
      line: s.line,
    });
  }
  if (!acs.length) issues.push(`${file}: no acceptance criteria (### AC-n — title)`);
  return { story: { meta: meta.data, title, acs, raw: markdown }, issues };
}
