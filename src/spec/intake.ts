import { extname } from 'node:path';
import type { IntakeReport, IntakeSection, IntakeSectionsFile, IntakeSource } from '../schemas/index.js';

/**
 * Requirements document intake (phase 14), pure: a Markdown or PDF text cut into anchored sections, the
 * OCR flag, the batches and the report `run intake-extract` prints. The IO is `src/scripts/intake.ts`.
 */

export const INTAKE_BATCH_CHARS = 40_000;
/** A PDF page with fewer non-whitespace characters than this has no usable text: it requires OCR. */
export const OCR_MIN_CHARS = 20;
/**
 * The native fallback: without poppler, Claude Code reads a PDF only whole, and only up to 10 pages (page-range
 * reads need `pdftoppm`, which ships with poppler). Native pages are therefore always one batch.
 */
export const NATIVE_MAX_PAGES = 10;
export const NATIVE_TOO_MANY =
  'the native fallback reads at most 10 pages without poppler: install poppler (brew install poppler / apt install poppler-utils) or export to Markdown';

/** One section of the source before numbering: its anchor ref (`p. 3`, `§ A > B`) and its text. */
export interface IntakePart {
  ref: string;
  text: string;
}

/** `markdown`, `pdf`, or undefined for any other type (DOCX included), which is refused. */
export function intakeSourceType(path: string): IntakeSource['type'] | undefined {
  const ext = extname(path).toLowerCase();
  if (ext === '.md' || ext === '.markdown') return 'markdown';
  return ext === '.pdf' ? 'pdf' : undefined;
}

export const unsupportedMessage = (path: string) =>
  `${extname(path).toLowerCase() || '(no extension)'} is not supported: export it to PDF or Markdown`;

/** The doc slug of a file: its base name without the extension, in lower-case words joined by `-`. */
export function intakeSlug(path: string): string {
  const base = path.split(/[\\/]/).at(-1) ?? '';
  const slug = base
    .slice(0, base.length - extname(base).length)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '');
  if (!slug) throw new Error(`${path}: the file name gives no slug to name its intake cache; rename it with letters or digits`);
  return slug;
}

/** Makes repeated refs unique in order: the second `§ A` becomes `§ A (2)`. */
function uniqueRefs(parts: IntakePart[]): IntakePart[] {
  const seen = new Map<string, number>();
  return parts.map((p) => {
    const n = (seen.get(p.ref) ?? 0) + 1;
    seen.set(p.ref, n);
    return n === 1 ? p : { ...p, ref: `${p.ref} (${n})` };
  });
}

/**
 * Markdown sections, one per heading (fenced code is never a heading), with the heading path as the ref:
 * `§ A > B`. Text before the first heading is `§ (preamble)`. A heading whose own body is empty adds no
 * section: its title still appears in its children's refs.
 */
export function markdownParts(markdown: string): IntakePart[] {
  const parts: IntakePart[] = [];
  const path: string[] = [];
  let current: { ref: string; lines: string[] } = { ref: '§ (preamble)', lines: [] };
  let inFence = false;
  const flush = () => {
    const text = current.lines.join('\n').trim();
    if (text) parts.push({ ref: current.ref, text });
  };
  for (const line of markdown.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const m = inFence ? null : /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (!m) {
      current.lines.push(line);
      continue;
    }
    flush();
    path.length = m[1]!.length - 1;
    path[m[1]!.length - 1] = m[2]!;
    current = { ref: `§ ${path.filter((t) => t !== undefined).join(' > ')}`, lines: [] };
  }
  flush();
  return uniqueRefs(parts);
}

/** PDF pages from `pdftotext` output: split on form feeds, ref `p. N`; the form feed after the last page adds none. */
export function pdfParts(text: string): IntakePart[] {
  const pages = text.split('\f');
  if (text.endsWith('\f')) pages.pop();
  return pages.map((page, i) => ({ ref: `p. ${i + 1}`, text: page.replace(/^(?:[ \t]*\r?\n)+/, '').trimEnd() }));
}

const needsOcr = (text: string) => text.replace(/\s/g, '').length < OCR_MIN_CHARS;

/** Consecutive sections up to `batchChars`; a larger section is its own batch. Native pages (chars unknown) are one batch. */
export function intakeBatches(sections: IntakeSection[], batchChars: number): string[][] {
  const out: string[][] = [];
  let current: string[] = [];
  let size = 0;
  for (const s of sections) {
    const weight = s.chars ?? 0;
    const full = s.chars !== null && size + weight > batchChars;
    if (current.length > 0 && full) {
      out.push(current);
      current = [];
      size = 0;
    }
    current.push(s.id);
    size += weight;
  }
  if (current.length > 0) out.push(current);
  return out;
}

const positive = (n: number, what: string) => {
  if (!Number.isInteger(n) || n < 1) throw new Error(`${what} must be a positive whole number, not ${n}`);
  return n;
};

export const intakeCacheRel = (doc: string) => `.mandao/cache/intake/${doc}`;

export interface IntakeInput {
  doc: string;
  source: IntakeSource;
  /** The extracted sections; omitted with `nativePages`. */
  parts?: IntakePart[];
  /** The Claude Code fallback: the agent read the PDF natively, Mandao records `p. 1`…`p. n`. */
  nativePages?: number;
  batchChars?: number;
}

const ALL_OCR = 'no page has extractable text: the whole document requires OCR. OCR it or export it to Markdown, then extract again';

/** The report and the anchored text (`source.md`; none for native pages) of one extraction. */
export function intakeReport(input: IntakeInput): { report: IntakeReport & IntakeSectionsFile; sourceMd?: string } {
  const batchChars = positive(input.batchChars ?? INTAKE_BATCH_CHARS, 'batch chars');
  const native = input.nativePages !== undefined;
  if (native && positive(input.nativePages!, 'native pages') > NATIVE_MAX_PAGES) throw new Error(NATIVE_TOO_MANY);
  const parts = native ? [] : (input.parts ?? []);
  const sections: IntakeSection[] = native
    ? Array.from({ length: positive(input.nativePages!, 'native pages') }, (_, i) => ({
        id: `S${i + 1}`,
        ref: `p. ${i + 1}`,
        chars: null,
        ocr: false,
      }))
    : parts.map((p, i) => ({ id: `S${i + 1}`, ref: p.ref, chars: p.text.length, ocr: input.source.type === 'pdf' && needsOcr(p.text) }));
  const batches = intakeBatches(sections, batchChars);
  const ocrRefs = sections.filter((s) => s.ocr).map((s) => s.ref);
  const allOcr = sections.length > 0 && ocrRefs.length === sections.length;
  const extractor = native ? 'native' : input.source.type === 'pdf' ? 'pdftotext' : 'markdown';
  const report = {
    doc: input.doc,
    source: input.source,
    extractor,
    cache: intakeCacheRel(input.doc),
    sections,
    summary: {
      sections: sections.length,
      chars: native ? null : sections.reduce((sum, s) => sum + (s.chars ?? 0), 0),
      batches: batches.length,
      batch_chars: batchChars,
      ocr_refs: ocrRefs,
    },
    batches,
    status: 'ready',
    ...(allOcr ? { hint: ALL_OCR } : {}),
  } satisfies IntakeReport & IntakeSectionsFile;
  const sourceMd = native ? undefined : parts.map((p) => `[${p.ref}]\n${p.text}\n`).join('\n');
  return { report, ...(sourceMd === undefined ? {} : { sourceMd }) };
}

/** The report of an extraction that stopped before reading: a refused type or a missing `pdftotext`. */
export function intakeStopped(
  doc: string,
  source: IntakeReport['source'],
  status: 'needs-tool' | 'refused',
  hint: string,
  batchChars = INTAKE_BATCH_CHARS,
): IntakeReport {
  return {
    doc,
    source,
    ...(status === 'needs-tool' ? { extractor: 'pdftotext' as const } : {}),
    cache: intakeCacheRel(doc),
    sections: [],
    summary: { sections: 0, chars: 0, batches: 0, batch_chars: batchChars, ocr_refs: [] },
    batches: [],
    status,
    hint,
  };
}

export const NEEDS_PDFTOTEXT =
  'pdftotext (poppler) is not on PATH: install it (brew install poppler / apt install poppler-utils) or export the document to Markdown, then run intake-extract again';
