import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { INTAKE_DOC, type IntakeReport, type IntakeSectionsFile, intakeSectionsFileSchema } from '../schemas/index.js';
import {
  type IntakeCheck,
  intakeCacheRel,
  intakeCheck,
  intakeReport,
  intakeSlug,
  intakeSourceType,
  intakeStopped,
  markdownParts,
  markQuestionAnswered,
  markStoryOpened,
  NEEDS_PDFTOTEXT,
  pdfParts,
  storyPrefill,
  unsupportedMessage,
  withStatus,
} from '../spec/index.js';
import { frontmatterOf } from '../spec/markdown.js';
import { sha256Hex } from '../util/hash.js';
import { removeFile, removeScratchDir, writeText } from '../writer/files.js';

/**
 * The IO of requirements document intake (phase 14): `pdftotext`, the sha256 of the source, the local cache
 * `.mandao/cache/intake/<doc>/` (`source.md`, `sections.json`) and the proposal file. Decisions are in
 * `src/spec/intake.ts` and `src/spec/intake-proposal.ts`.
 */

/** Text of a PDF, one form feed after each page; undefined when `pdftotext` is not on PATH. Injected in tests. */
export interface PdfText {
  extract(file: string): string | undefined;
}

/** Poppler's `pdftotext -layout` (keeps tables in columns), UTF-8, to stdout; argument array, no shell. */
export const pdftotext: PdfText = {
  extract(file) {
    const r = spawnSync('pdftotext', ['-layout', '-enc', 'UTF-8', file, '-'], { encoding: 'utf8', maxBuffer: 512 * 1024 * 1024 });
    if ((r.error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT') return undefined;
    if (r.error) throw r.error;
    if (r.status !== 0) throw new Error(`pdftotext could not read ${file}: ${r.stderr.trim() || `exit code ${r.status}`}`);
    return r.stdout;
  },
};

const intakeCacheRoot = (root: string) => join(root, '.mandao', 'cache', 'intake');

/** `.mandao/cache/intake/<doc>/`. A doc that is not a slug (`..`, a path) throws, so no write or removal leaves the folder. */
export function intakeCacheDir(root: string, doc: string): string {
  if (!INTAKE_DOC.test(doc)) throw new Error(`${JSON.stringify(doc)} is not an intake doc slug (lower-case words joined by -)`);
  return join(intakeCacheRoot(root), doc);
}

/** The path as given, or repo-relative (with `/`) when it is inside the workspace. */
function shownPath(root: string, file: string, abs: string): string {
  const rel = relative(root, abs);
  return rel && !rel.startsWith('..') && !isAbsolute(rel) ? rel.split(sep).join('/') : file;
}

export interface ExtractOptions {
  nativePages?: number;
  batchChars?: number;
  /** Replace a cache cut from another file or version of the document. */
  force?: boolean;
}

/** Refuses to replace a doc's cache cut from a different file or version, unless forced. */
function guardCache(root: string, doc: string, source: { path: string; sha256: string }, force: boolean | undefined) {
  if (force) return;
  let cached: IntakeSectionsFile['source'] | undefined;
  try {
    cached = readIntakeSections(root, doc)?.source;
  } catch {
    throw new Error(`the cached extraction in ${intakeCacheRel(doc)} is unreadable: rerun with --force to replace it`);
  }
  if (!cached || cached.sha256 === source.sha256) return;
  const other = cached.path === source.path ? `another version of ${source.path}` : `${cached.path}, not ${source.path}`;
  throw new Error(`${intakeCacheRel(doc)} holds the extraction of ${other}: rerun with --force to replace it`);
}

/** `run intake-extract`: reads the document, writes the cache (unless it stopped) and returns the report. */
export function extractIntake(root: string, file: string, opts: ExtractOptions = {}, pdf: PdfText = pdftotext): IntakeReport {
  const abs = resolve(root, file);
  if (!existsSync(abs) || !statSync(abs).isFile()) throw new Error(`${file}: no such file`);
  const sha256 = sha256Hex(readFileSync(abs));
  const path = shownPath(root, file, abs);
  const doc = intakeSlug(abs);
  const type = intakeSourceType(abs);
  if (!type) return intakeStopped(doc, { path, sha256, type: extname(abs).slice(1).toLowerCase() }, 'refused', unsupportedMessage(abs));
  if (opts.nativePages !== undefined && type !== 'pdf') throw new Error('--native-pages is only for a PDF the agent read natively');
  const source = { path, sha256, type };
  let parts: ReturnType<typeof pdfParts> | undefined;
  if (opts.nativePages === undefined) {
    const text = type === 'pdf' ? pdf.extract(abs) : readFileSync(abs, 'utf8');
    if (text === undefined) return intakeStopped(doc, source, 'needs-tool', NEEDS_PDFTOTEXT, opts.batchChars);
    parts = type === 'pdf' ? pdfParts(text) : markdownParts(text);
  }
  const { force, ...counts } = opts;
  const { report, sourceMd } = intakeReport({ doc, source, ...(parts ? { parts } : {}), ...counts });
  guardCache(root, doc, source, force);
  const dir = intakeCacheDir(root, doc);
  if (sourceMd !== undefined) writeText(join(dir, 'source.md'), sourceMd);
  else if (existsSync(join(dir, 'source.md'))) removeFile(join(dir, 'source.md'), [dir]);
  const { cache: _cache, status: _status, hint: _hint, ...sectionsFile } = report;
  writeText(join(dir, 'sections.json'), `${JSON.stringify(sectionsFile satisfies IntakeSectionsFile, null, 2)}\n`);
  return report;
}

/** The cached `sections.json` of a doc, or undefined when there is none (never extracted, or cleaned after close). */
export function readIntakeSections(root: string, doc: string): IntakeSectionsFile | undefined {
  const file = join(intakeCacheDir(root, doc), 'sections.json');
  if (!existsSync(file)) return undefined;
  return intakeSectionsFileSchema.parse(JSON.parse(readFileSync(file, 'utf8')));
}

/** Deletes a doc's cache; false when there was none. Throws on a doc that is not a slug, before touching anything. */
export function dropIntakeCache(root: string, doc: string): boolean {
  const dir = intakeCacheDir(root, doc);
  if (!existsSync(dir)) return false;
  removeScratchDir(dir, intakeCacheRoot(root));
  return true;
}

function readProposal(root: string, proposal: string): { abs: string; text: string } {
  const abs = resolve(root, proposal);
  if (!existsSync(abs)) throw new Error(`${proposal}: no such proposal`);
  return { abs, text: readFileSync(abs, 'utf8') };
}

/** The doc a proposal names, when it is a slug; anything else is left to the frontmatter check. */
function docOf(text: string): string | undefined {
  const doc = frontmatterOf(text).data.doc;
  return typeof doc === 'string' && INTAKE_DOC.test(doc) ? doc : undefined;
}

const checkText = (root: string, text: string): IntakeCheck => {
  const doc = docOf(text);
  let cached: IntakeSectionsFile | undefined;
  try {
    cached = doc ? readIntakeSections(root, doc) : undefined;
  } catch {
    // A corrupt cache is a problem to report, not a crash: the check runs as if there were no cache.
    const result = intakeCheck(text, undefined);
    const message = `the cached extraction in ${intakeCacheRel(doc!)} is unreadable: rerun intake-extract --force`;
    return { ...result, ok: false, problems: [...result.problems, { code: 'cache-unreadable', message, at: 'sections.json' }] };
  }
  return intakeCheck(text, cached?.sections, cached?.source.sha256);
};

/** `run intake-check`: the proposal against its doc's cached sections. */
export const checkIntake = (root: string, proposal: string) => checkText(root, readProposal(root, proposal).text);

/** `run intake-open`: records the spec ID or tracker URL a story was opened as. */
export function openIntakeStory(root: string, proposal: string, id: string, as: string) {
  const { abs, text } = readProposal(root, proposal);
  writeText(abs, markStoryOpened(text, id, as));
  return { proposal, id, opened: as.trim() };
}

/** `run intake-answer`: records the PE's answer to an OPEN or CONFLICT row of the proposal (phase 16). */
export function answerIntakeQuestion(root: string, proposal: string, id: string, answer: string) {
  const { abs, text } = readProposal(root, proposal);
  writeText(abs, markQuestionAnswered(text, id, answer));
  return { proposal, id, status: `resolved: ${answer.trim()}` };
}

/** `run intake-story`: the prefill of one story. */
export const intakeStory = (root: string, proposal: string, id: string) => storyPrefill(readProposal(root, proposal).text, id);

/** `mandao intake close`: checks the proposal as closed, refuses on any problem, then writes it and drops the cache. */
export function closeIntake(root: string, proposal: string) {
  const { abs, text } = readProposal(root, proposal);
  const closed = withStatus(text, 'closed');
  const check = checkText(root, closed);
  if (!check.ok) {
    const list = check.problems.map((p) => `${p.code} (${p.at}): ${p.message}`).join('; ');
    throw new Error(`${proposal} cannot be closed: ${list}`);
  }
  writeText(abs, closed);
  const doc = docOf(closed);
  return { proposal, status: 'closed', cacheRemoved: doc ? dropIntakeCache(root, doc) : false, warnings: check.warnings };
}

/** True when the doc has at least one proposal in `proposalsDir` and every one of them is closed. */
function allClosed(proposalsDir: string, doc: string): boolean {
  if (!existsSync(proposalsDir)) return false;
  const name = new RegExp(`^${doc}-\\d{4}-\\d{2}-\\d{2}\\.md$`);
  const files = readdirSync(proposalsDir).filter((f) => name.test(f));
  return files.length > 0 && files.every((f) => frontmatterOf(readFileSync(join(proposalsDir, f), 'utf8')).data.status === 'closed');
}

/**
 * `mandao intake clean [<doc>]`: with a doc, drops its cache; without, drops each cache whose proposals are all
 * closed, and keeps one whose proposal is proposed or missing (or whose folder is not a slug).
 */
export function cleanIntake(root: string, doc?: string, proposalsDir = join(root, 'docs', 'product', 'intake')) {
  if (doc !== undefined) return { removed: dropIntakeCache(root, doc) ? [doc] : [], kept: [] };
  const cacheRoot = intakeCacheRoot(root);
  const docs = existsSync(cacheRoot) ? readdirSync(cacheRoot, { withFileTypes: true }).filter((d) => d.isDirectory()) : [];
  const removed: string[] = [];
  const kept: string[] = [];
  for (const d of docs.map((x) => x.name).sort()) {
    if (INTAKE_DOC.test(d) && allClosed(proposalsDir, d) && dropIntakeCache(root, d)) removed.push(d);
    else kept.push(d);
  }
  return { removed, kept };
}
