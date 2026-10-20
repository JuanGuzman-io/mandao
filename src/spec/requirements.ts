import { type Clause, frontmatterOf, listField, readClauses, sections, splitHeading } from './markdown.js';

export interface Scenario {
  id: string;
  title: string;
  clauses: Clause[];
}

export interface Requirement {
  id: string;
  kind: 'FR' | 'NFR';
  title: string;
  /** `AC-1` or a clause reference `AC-1/C2`. */
  serves: string[];
  projects: string[];
  scenarios: Scenario[];
  line: number;
}

export interface Requirements {
  status?: string;
  requirements: Requirement[];
  raw: string;
}

/** Parses requirements.md: `### FR-n — title` with `Serves:` and `#### S-n.m — title` scenarios. */
export function parseRequirements(markdown: string, file = 'requirements.md'): { requirements: Requirements; issues: string[] } {
  const issues: string[] = [];
  const { data, content } = frontmatterOf(markdown);
  const requirements: Requirement[] = [];
  for (const s of sections(content, 3)) {
    const h = splitHeading(s.heading);
    if (!h || !/^N?FR-\d+$/.test(h.id)) continue;
    if (requirements.some((r) => r.id === h.id)) issues.push(`${file}:${s.line}: duplicate ${h.id}`);
    const n = h.id.split('-')[1];
    const scenarios = sections(s.body, 4).flatMap((sc) => {
      const sh = splitHeading(sc.heading);
      if (!sh?.id.startsWith('S-')) return [];
      if (!sh.id.startsWith(`S-${n}.`)) issues.push(`${file}: scenario ${sh.id} is under ${h.id}; expected S-${n}.m`);
      return [{ id: sh.id, title: sh.title, clauses: readClauses(sc.body, `${file} ${sh.id}`, issues) }];
    });
    const serves = listField(s.body, 'Serves');
    if (!serves.length) issues.push(`${file}:${s.line}: ${h.id} serves no AC (add "Serves: AC-n")`);
    requirements.push({
      id: h.id,
      kind: h.id.startsWith('NFR') ? 'NFR' : 'FR',
      title: h.title,
      serves,
      projects: listField(s.body, 'Projects'),
      scenarios,
      line: s.line,
    });
  }
  return { requirements: { status: typeof data.status === 'string' ? data.status : undefined, requirements, raw: markdown }, issues };
}
