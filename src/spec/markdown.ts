import matter from 'gray-matter';

export interface Section {
  level: number;
  /** Heading text without the leading hashes. */
  heading: string;
  /** Lines between this heading and the next heading of the same or a higher level. */
  body: string;
  /** 1-based line of the heading, for messages. */
  line: number;
}

/** Splits Markdown into sections at headings of `level` (fenced code blocks are not headings). */
export function sections(markdown: string, level: number): Section[] {
  const lines = markdown.split('\n');
  const out: Section[] = [];
  let current: Section | undefined;
  let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = inFence ? null : line.match(/^(#{1,6})\s+(.*)$/);
    if (m && m[1]!.length <= level) {
      if (current) out.push(current);
      current = m[1]!.length === level ? { level, heading: m[2]!.trim(), body: '', line: i + 1 } : undefined;
      return;
    }
    if (current) current.body += `${line}\n`;
  });
  if (current) out.push(current);
  return out;
}

export function frontmatterOf(markdown: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(markdown);
  return { data: structuredClone(parsed.data) as Record<string, unknown>, content: parsed.content };
}

/** Clause keywords, matched at the start of a bullet. Kept in English: parsers rely on them. */
export const CLAUSE_KINDS = [
  ['given', /^\*\*GIVEN\*\*/i],
  ['when', /^\*\*WHEN\*\*/i],
  ['then', /^\*\*THEN\*\*/i],
  ['but-not', /^\*\*BUT it must NOT\*\*/i],
  ['and-must', /^\*\*AND IT MUST\*\*/i],
] as const;
export type ClauseKind = (typeof CLAUSE_KINDS)[number][0];

export interface Clause {
  kind: ClauseKind;
  text: string;
  /** `C1`… for edge clauses (`BUT it must NOT`, `AND IT MUST`); undefined for Given/When/Then. */
  id?: string;
}

const CLAUSE_ID = /\((C\d+)\)\s*(?:<!--.*-->)?\s*$/;

function nextFreeId(used: Set<string>): string {
  let n = 1;
  while (used.has(`C${n}`)) n++;
  return `C${n}`;
}

/** One bullet as a clause, or undefined when it is not a Given/When/Then line. */
function readClause(raw: string): { kind: ClauseKind; text: string; id?: string } | undefined {
  const line = raw.replace(/^\s*[-*]\s+/, '').trim();
  const kind = CLAUSE_KINDS.find(([, re]) => re.test(line))?.[0];
  if (!kind) return undefined;
  const id = line.match(CLAUSE_ID)?.[1];
  return { kind, text: line.replace(CLAUSE_ID, '').trim(), ...(id ? { id } : {}) };
}

/**
 * Reads Given/When/Then bullets. Edge clauses carry an explicit `(Cn)` id; an edge clause without one
 * gets the next free number and an issue, because coverage is tracked per clause.
 */
/** Bullets with their wrapped continuation lines joined, so an id on the second line is not lost. */
export function bulletLines(body: string): string[] {
  const out: string[] = [];
  let current: string | undefined;
  for (const line of body.split('\n')) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (current !== undefined) out.push(current);
      current = line;
    } else if (current !== undefined && /^\s+\S/.test(line)) {
      current = `${current} ${line.trim()}`;
    } else {
      if (current !== undefined) out.push(current);
      current = undefined;
      out.push(line);
    }
  }
  if (current !== undefined) out.push(current);
  return out;
}

export function readClauses(body: string, where: string, issues: string[]): Clause[] {
  const clauses: Clause[] = [];
  const used = new Set<string>();
  for (const raw of bulletLines(body)) {
    const clause = readClause(raw);
    if (!clause) continue;
    const edge = clause.kind === 'but-not' || clause.kind === 'and-must';
    if (edge && !clause.id) {
      clause.id = nextFreeId(used);
      issues.push(`${where}: edge clause without an id, read as (${clause.id}): "${clause.text.slice(0, 60)}"`);
    }
    if (clause.id && used.has(clause.id)) issues.push(`${where}: duplicate clause id ${clause.id}`);
    if (clause.id) used.add(clause.id);
    clauses.push(clause);
  }
  return clauses;
}

/** `ID — title` with an em dash, en dash or hyphen. */
export function splitHeading(heading: string): { id: string; title: string } | undefined {
  const m = heading.match(/^([A-Z]+-\d+(?:\.\d+)?|S-\d+\.\d+)\s*[—–-]\s*(.+)$/);
  return m ? { id: m[1]!, title: m[2]!.trim() } : undefined;
}

/** Comma-separated references on a `Key: a, b` line. */
export function listField(body: string, key: string): string[] {
  const m = body.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'mi'));
  return m
    ? m[1]!
        .split(/[,\s]+/)
        .map((s) => s.trim())
        .filter((s) => s && s !== '—' && s !== '-')
    : [];
}

/** Markers that block the next phase: a critical OPEN or a `[NEEDS CLARIFICATION]`. */
export function blockingMarkers(markdown: string): { criticalOpen: string[]; needsClarification: string[] } {
  const criticalOpen = [...markdown.matchAll(/OPEN\(critical[^)]*\):?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
  const needsClarification = [...markdown.matchAll(/\[NEEDS CLARIFICATION\]:?\s*([^\n]*)/g)].map((m) => m[1]!.trim());
  return { criticalOpen, needsClarification };
}
