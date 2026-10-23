import { frontmatterOf, type Section, sections, splitHeading } from './markdown.js';

/**
 * Reads an intake proposal (`docs/product/intake/<doc>-<date>.md`, template
 * `core/templates/shared/product/intake-proposal.md`) by its headings, pure. `intake-proposal.ts` checks it.
 */

export interface IntakeContextRow {
  id: string;
  kind: string;
  proposal: string;
  target: string;
  refs: string[];
  status: string;
}

export interface IntakeEpic {
  id: string;
  name: string;
  refs: string[];
}

export interface IntakeAc {
  id: string;
  name: string;
  text: string;
}

export interface IntakeStory {
  id: string;
  title: string;
  epic?: string;
  refs: string[];
  inferred: boolean;
  priority?: string;
  depends_on: string[];
  invest?: string;
  opened?: string;
  ac: IntakeAc[];
}

export interface IntakeOpenRow {
  id: string;
  type: string;
  text: string;
  refs: string[];
  status: string;
}

export interface IntakeCoverageRow {
  section: string;
  refs: string[];
  coveredBy: string[];
  status: string;
}

export interface IntakeProposal {
  data: Record<string, unknown>;
  context: IntakeContextRow[];
  epics: IntakeEpic[];
  stories: IntakeStory[];
  open: IntakeOpenRow[];
  coverage: IntakeCoverageRow[];
}

const EMPTY = new Set(['', '—', '-', '–']);

/** `[p. 3, § A > B]` → `['p. 3', '§ A > B']`. A comma splits only before another ref, so a heading may hold one. */
export function parseRefs(text: string): string[] {
  const inner = text.trim().replace(/^\[/, '').replace(/\]$/, '').trim();
  if (EMPTY.has(inner)) return [];
  return inner
    .split(/,\s*(?=p\.\s*\d|§)/)
    .map((r) => r.trim())
    .filter((r) => !EMPTY.has(r));
}

/** `I-1, E-2` or `[I-1]` → the IDs; `—` and empty mean none. */
export const parseIds = (text: string) =>
  text
    .replace(/[[\]]/g, '')
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter((s) => !EMPTY.has(s));

/** The data rows of the first Markdown table in a body: header and separator rows left out. */
function tableRows(body: string): string[][] {
  const rows = body
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) =>
      l
        .trim()
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim()),
    );
  return rows.slice(1).filter((cells) => !cells.every((c) => /^:?-+:?$/.test(c)));
}

/** The bullets `- key: value` before the first `####` heading of a story. */
function storyFields(body: string): Map<string, string> {
  const fields = new Map<string, string>();
  for (const line of body.split('\n')) {
    if (/^####\s/.test(line)) break;
    const m = /^\s*[-*]\s+([a-z_]+):\s*(.*?)\s*$/.exec(line);
    if (m && !fields.has(m[1]!)) fields.set(m[1]!, m[2]!);
  }
  return fields;
}

function readStory(s: Section): IntakeStory | undefined {
  const head = splitHeading(s.heading);
  if (!head) return undefined;
  const f = storyFields(s.body);
  const ac = sections(s.body, 4).flatMap((a) => {
    const h = splitHeading(a.heading);
    return h ? [{ id: h.id, name: h.title, text: a.body.trim() }] : [];
  });
  const optional = (key: string) => (f.get(key) ? { [key]: f.get(key)! } : {});
  return {
    id: head.id,
    title: head.title,
    ...optional('epic'),
    refs: parseRefs(f.get('refs') ?? ''),
    inferred: f.get('inferred') === 'true',
    ...optional('priority'),
    depends_on: parseIds(f.get('depends_on') ?? ''),
    ...optional('invest'),
    ...optional('opened'),
    ac,
  };
}

function readEpic(s: Section): IntakeEpic | undefined {
  const head = splitHeading(s.heading);
  if (!head) return undefined;
  const refs = /refs:\s*(\[[^\]]*\])/.exec(s.body)?.[1] ?? '';
  return { id: head.id, name: head.title, refs: parseRefs(refs) };
}

const level3 = <T>(body: string | undefined, read: (s: Section) => T | undefined): T[] =>
  sections(body ?? '', 3).flatMap((s) => {
    const item = read(s);
    return item === undefined ? [] : [item];
  });

/** The proposal's frontmatter and its five sections, found by heading (case-insensitive). */
export function parseIntakeProposal(markdown: string): IntakeProposal {
  const { data, content } = frontmatterOf(markdown);
  const top = sections(content, 2);
  const body = (name: string) => top.find((s) => s.heading.toLowerCase().startsWith(name))?.body;
  const context = tableRows(body('business context') ?? '').map(
    ([id = '', kind = '', proposal = '', target = '', ref = '', status = '']) => ({
      id,
      kind,
      proposal,
      target,
      refs: parseRefs(ref),
      status,
    }),
  );
  const open = tableRows(body('open and conflicts') ?? '').map(([id = '', type = '', text = '', ref = '', status = '']) => ({
    id,
    type,
    text,
    refs: parseRefs(ref),
    status,
  }));
  const coverage = tableRows(body('coverage') ?? '').map(([section = '', ref = '', by = '', status = '']) => ({
    section,
    refs: parseRefs(ref),
    coveredBy: parseIds(by),
    status,
  }));
  return { data, context, epics: level3(body('epics'), readEpic), stories: level3(body('stories'), readStory), open, coverage };
}
