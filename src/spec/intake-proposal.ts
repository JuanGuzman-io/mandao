import {
  INTAKE_CONTEXT_STATUSES,
  INTAKE_COVERAGE,
  INTAKE_KINDS,
  INTAKE_OPEN_TYPES,
  INTAKE_TARGETS,
  type IntakeSection,
  intakeFrontmatterSchema,
} from '../schemas/index.js';
import { type IntakeAc, type IntakeOpenRow, type IntakeProposal, parseIntakeProposal } from './intake-parse.js';

export * from './intake-parse.js';

/**
 * `run intake-check`, `intake-open` and `intake-story` over an intake proposal, pure (phase 14). The
 * sections come from the cache's `sections.json`; without them references cannot be verified (warning).
 */

export interface IntakeProblem {
  code: string;
  message: string;
  at: string;
}

export interface IntakeCheck {
  ok: boolean;
  problems: IntakeProblem[];
  warnings: IntakeProblem[];
}

type Add = (code: string, at: string, message: string) => void;

function checkFrontmatter(p: IntakeProposal, add: Add) {
  const r = intakeFrontmatterSchema.safeParse(p.data);
  if (r.success) return;
  for (const issue of r.error.issues) add('frontmatter', 'frontmatter', `${issue.path.join('.') || 'frontmatter'}: ${issue.message}`);
}

/** Every ID of the proposal, in order: business context, epics, stories, open rows. */
const allIds = (p: IntakeProposal) => [...p.context, ...p.epics, ...p.stories, ...p.open].map((x) => x.id);

function checkIds(p: IntakeProposal, add: Add) {
  const seen = new Set<string>();
  for (const id of allIds(p)) {
    if (seen.has(id)) add('duplicate-id', id, `${id} is used more than once; IDs are never reused`);
    seen.add(id);
  }
  const allowed = (id: string, value: string, field: string, values: readonly string[]) => {
    if (!values.includes(value)) add('invalid-row', id, `${id}: ${field} "${value}" is not one of ${values.join(', ')}`);
  };
  for (const c of p.context) {
    allowed(c.id, c.kind, 'Kind', INTAKE_KINDS);
    allowed(c.id, c.target, 'Target', INTAKE_TARGETS);
    allowed(c.id, c.status, 'Status', INTAKE_CONTEXT_STATUSES);
  }
  for (const q of p.open) allowed(q.id, q.type, 'Type', INTAKE_OPEN_TYPES);
  checkIdPrefixes(p, add);
  for (const r of p.coverage) allowed(r.section, r.status, 'Status', INTAKE_COVERAGE);
}

const ID_PREFIX = { context: 'C', epics: 'E', stories: 'I', open: 'Q' } as const;

/** Each table's IDs carry its prefix: C-n business context, E-n epics, I-n stories, Q-n open rows. */
function checkIdPrefixes(p: IntakeProposal, add: Add) {
  for (const [table, prefix] of Object.entries(ID_PREFIX) as [keyof typeof ID_PREFIX, string][]) {
    for (const { id } of p[table])
      if (!new RegExp(`^${prefix}-\\d+$`).test(id)) add('invalid-id', id, `${id} is not an ${prefix}-n ID, which ${table} use`);
  }
}

/** The first story on a dependency cycle, if any (depth-first over known IDs). */
function cycleStart(deps: Map<string, string[]>): string | undefined {
  const state = new Map<string, 'open' | 'done'>();
  const visit = (id: string): boolean => {
    if (state.get(id) === 'done') return false;
    if (state.get(id) === 'open') return true;
    state.set(id, 'open');
    const cyclic = (deps.get(id) ?? []).some((d) => deps.has(d) && visit(d));
    state.set(id, 'done');
    return cyclic;
  };
  return [...deps.keys()].find((id) => visit(id));
}

function checkStories(p: IntakeProposal, add: Add) {
  const epics = new Set(p.epics.map((e) => e.id));
  const stories = new Set(p.stories.map((s) => s.id));
  for (const s of p.stories) {
    if (s.refs.length === 0 && !s.inferred) add('story-unreferenced', s.id, `${s.id} has no refs and is not marked inferred: true`);
    if (s.epic !== undefined && !epics.has(s.epic)) add('unknown-epic', s.id, `${s.id} names epic ${s.epic}, which does not exist`);
    for (const d of s.depends_on) if (!stories.has(d)) add('unknown-dependency', s.id, `${s.id} depends on ${d}, which does not exist`);
  }
  for (const s of p.stories.filter((x) => x.group !== undefined && !/^G-\d+$/.test(x.group)))
    add('bad-group', s.id, `${s.id} names group ${s.group}: a group is G-<n>`);
  const start = cycleStart(new Map(p.stories.map((s) => [s.id, s.depends_on])));
  if (start) add('dependency-cycle', start, `the dependencies of ${start} form a cycle`);
}

function checkRefs(p: IntakeProposal, sections: IntakeSection[], add: Add) {
  const known = new Set(sections.map((s) => s.ref));
  for (const item of [...p.context, ...p.epics, ...p.stories, ...p.open]) {
    for (const ref of item.refs)
      if (!known.has(ref)) add('unknown-ref', item.id, `${item.id} cites ${ref}, which is not a section of the document`);
  }
}

function checkCoverageRows(p: IntakeProposal, add: Add) {
  const ids = new Set(allIds(p));
  for (const row of p.coverage) {
    if (row.status !== 'covered') {
      if (row.coveredBy.length > 0)
        add(
          'coverage-ids-not-allowed',
          row.section,
          `${row.section} is "${row.status}": Covered by must be —, not ${row.coveredBy.join(', ')}`,
        );
      continue;
    }
    const unknown = row.coveredBy.filter((id) => !ids.has(id));
    if (row.coveredBy.length === 0) add('coverage-unknown-id', row.section, `${row.section} is covered but lists no ID`);
    else if (unknown.length > 0)
      add('coverage-unknown-id', row.section, `${row.section} is covered by ${unknown.join(', ')}, which do not exist`);
  }
}

/** One section's coverage rows: exactly one, on its own ref, and `requires OCR` when it has no text. */
function checkSectionRows(s: IntakeSection, rows: IntakeProposal['coverage'], add: Add) {
  if (rows.length === 0) add('coverage-missing', s.id, `${s.id} (${s.ref}) has no coverage row`);
  if (rows.length > 1) add('coverage-duplicate', s.id, `${s.id} (${s.ref}) has ${rows.length} coverage rows; it needs exactly one`);
  for (const r of rows) {
    if (r.refs.length > 0 && (r.refs.length > 1 || r.refs[0] !== s.ref))
      add('coverage-ref-mismatch', s.id, `${s.id} is ${s.ref}, not ${r.refs.join(', ')}`);
    if (s.ocr && r.status !== 'requires OCR')
      add('ocr-not-flagged', s.id, `${s.id} (${s.ref}) has no extractable text: its status is "requires OCR", never "${r.status}"`);
  }
}

function checkCoverage(p: IntakeProposal, sections: IntakeSection[], add: Add) {
  const known = new Set(sections.map((s) => s.id));
  for (const row of p.coverage)
    if (!known.has(row.section)) add('coverage-unknown-section', row.section, `${row.section} is not a section of the document`);
  for (const s of sections)
    checkSectionRows(
      s,
      p.coverage.filter((r) => r.section === s.id),
      add,
    );
}

/** The deterministic checks of an intake proposal against the sections of its document and the sha256 they were cut from. */
export function intakeCheck(markdown: string, sections: IntakeSection[] | undefined, cachedSha256?: string): IntakeCheck {
  const p = parseIntakeProposal(markdown);
  const problems: IntakeProblem[] = [];
  const add: Add = (code, at, message) => void problems.push({ code, message, at });
  checkFrontmatter(p, add);
  const sha = (p.data.source as { sha256?: unknown } | undefined)?.sha256;
  if (cachedSha256 !== undefined && sha !== cachedSha256)
    add('source-changed', 'frontmatter', 'the cached extraction is from a different file or version: re-run intake-extract');
  checkIds(p, add);
  checkStories(p, add);
  checkCoverageRows(p, add);
  if (sections) {
    checkRefs(p, sections, add);
    checkCoverage(p, sections, add);
  }
  if (p.data.status === 'closed') {
    for (const c of p.context.filter((x) => x.status === 'proposed'))
      add('closed-with-proposed-context', c.id, `${c.id} is still proposed: apply or reject it before closing`);
  }
  const warnings = sections
    ? []
    : [
        {
          code: 'references-unverified',
          message:
            'no sections.json in the intake cache (cleaned after close, or never extracted): references and coverage were not verified',
          at: 'sections.json',
        },
      ];
  return { ok: problems.length === 0, problems, warnings };
}

const storyOf = (p: IntakeProposal, id: string) => {
  const story = p.stories.find((s) => s.id === id);
  if (!story) throw new Error(`${id} is not a story of this proposal`);
  return story;
};

/** Writes `- opened: <value>` after the story's fields. Refuses a story that does not exist or is already opened. */
export function markStoryOpened(markdown: string, id: string, value: string): string {
  const p = parseIntakeProposal(markdown);
  const story = storyOf(p, id);
  if (story.opened) throw new Error(`${id} is already opened as ${story.opened}`);
  const as = value.trim();
  if (!as || /[\r\n]/.test(as)) throw new Error('--as needs one spec ID or tracker URL on one line');
  // A group opens as one spec: every story of it records the same spec.
  const members = story.group ? p.stories.filter((s) => s.group === story.group && !s.opened && s.id !== id).map((s) => s.id) : [];
  return [id, ...members].reduce((text, member) => insertOpened(text, member, as), markdown);
}

function insertOpened(markdown: string, id: string, as: string): string {
  const lines = markdown.split('\n');
  const head = lines.findIndex((l) => new RegExp(`^###\\s+${id}\\s*[—–-]`).test(l));
  let at = head + 1;
  for (let i = head + 1; i < lines.length && !/^#{1,4}\s/.test(lines[i]!); i++) if (/^\s*[-*]\s+[a-z_]+:/.test(lines[i]!)) at = i + 1;
  lines.splice(at, 0, `- opened: ${as}`);
  return lines.join('\n');
}

export interface IntakeStoryPrefill {
  id: string;
  title: string;
  epic?: string;
  refs: string[];
  inferred: boolean;
  priority?: string;
  depends_on: string[];
  ac: IntakeAc[];
  open: IntakeOpenRow[];
  source: { path?: unknown; sha256?: unknown; doc?: unknown };
  group?: { id: string; stories: { id: string; title: string; refs: string[]; ac: IntakeAc[] }[] };
}

/** What `/mandao-story --intake <proposal>#I-n` prefills: the story, its AC, the open rows on its refs and the source. */
export function storyPrefill(markdown: string, id: string): IntakeStoryPrefill {
  const p = parseIntakeProposal(markdown);
  const s = storyOf(p, id);
  const source = (p.data.source ?? {}) as Record<string, unknown>;
  return {
    id: s.id,
    title: s.title,
    ...(s.epic ? { epic: s.epic } : {}),
    refs: s.refs,
    inferred: s.inferred,
    ...(s.priority ? { priority: s.priority } : {}),
    depends_on: s.depends_on,
    ac: s.ac,
    open: p.open.filter((q) => q.refs.some((r) => s.refs.includes(r))),
    source: { path: source.path, sha256: source.sha256, doc: p.data.doc },
    ...groupOf(p, s),
  };
}

/** The other stories of the story's group, which the same spec opens with their AC. */
function groupOf(p: ReturnType<typeof parseIntakeProposal>, s: { id: string; group?: string }) {
  if (!s.group) return {};
  const stories = p.stories
    .filter((x) => x.group === s.group && x.id !== s.id)
    .map((x) => ({ id: x.id, title: x.title, refs: x.refs, ac: x.ac }));
  return { group: { id: s.group, stories } };
}

/** Records the PE's answer to an `OPEN`/`CONFLICT` row: its Status becomes `resolved: <answer>` (phase 16). */
export function markQuestionAnswered(markdown: string, id: string, answer: string): string {
  const text = answer.trim();
  if (!text || /[\r\n|]/.test(text)) throw new Error('--answer needs the answer on one line, without |');
  const lines = markdown.split('\n');
  const at = lines.findIndex((l) => new RegExp(`^\\|\\s*${id}\\s*\\|`).test(l));
  if (at < 0) throw new Error(`${id} is not a row of Open and conflicts`);
  const cells = lines[at]!.split('|');
  cells[cells.length - 2] = ` resolved: ${text} `;
  lines[at] = cells.join('|');
  return lines.join('\n');
}
