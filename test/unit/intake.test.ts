// mandao-scans: none — pure intake extraction over strings, no folder is listed.
import { describe, expect, test } from 'vitest';
import {
  INTAKE_BATCH_CHARS,
  intakeBatches,
  intakeReport,
  intakeSlug,
  intakeSourceType,
  markdownParts,
  pdfParts,
  unsupportedMessage,
} from '../../src/spec/intake.js';

const SOURCE = { path: 'docs/req.md', sha256: 'a'.repeat(64), type: 'markdown' as const };
const PDF = { path: 'req.pdf', sha256: 'b'.repeat(64), type: 'pdf' as const };
const page = (text: string) => `${text}\f`;
const words = (n: number) => 'x'.repeat(n);

describe('intake inputs', () => {
  test('Markdown and PDF are read; anything else, DOCX included, is refused with the export hint', () => {
    expect(intakeSourceType('a/b/Req.MD')).toBe('markdown');
    expect(intakeSourceType('x.markdown')).toBe('markdown');
    expect(intakeSourceType('x.pdf')).toBe('pdf');
    expect(intakeSourceType('x.docx')).toBeUndefined();
    expect(unsupportedMessage('spec.docx')).toBe('.docx is not supported: export it to PDF or Markdown');
  });

  test('the doc slug comes from the base name without its extension', () => {
    expect(intakeSlug('/x/Requisitos Versión 2.pdf')).toBe('requisitos-version-2');
    expect(intakeSlug('docs/req.md')).toBe('req');
    expect(() => intakeSlug('docs/___.md')).toThrow(/slug/);
  });
});

describe('Markdown sections', () => {
  test('one section per heading with its heading path; text before the first heading is the preamble', () => {
    const parts = markdownParts('intro text\n\n# A\n\nrule a\n\n## B\n\nrule b\n\n# C\n\nrule c\n');
    expect(parts.map((p) => p.ref)).toEqual(['§ (preamble)', '§ A', '§ A > B', '§ C']);
    expect(parts[2]!.text).toBe('rule b');
  });

  test('a heading inside a code fence is not a heading; an empty heading body is no section; repeated paths stay unique', () => {
    const parts = markdownParts('# A\n\n```\n# not a heading\n```\n\n# B\n## C\n\nc\n\n# A\n\nagain\n');
    expect(parts.map((p) => p.ref)).toEqual(['§ A', '§ B > C', '§ A (2)']);
    expect(parts[0]!.text).toContain('# not a heading');
  });
});

describe('PDF pages', () => {
  test('pages split on form feed, refs p. N, the trailing form feed adds no page', () => {
    const parts = pdfParts(page('one') + page('') + page('three'));
    expect(parts.map((p) => p.ref)).toEqual(['p. 1', 'p. 2', 'p. 3']);
    expect(parts[2]!.text).toBe('three');
  });
});

describe('batches', () => {
  const s = (id: string, chars: number | null) => ({ id, ref: id, chars, ocr: false });
  test('consecutive sections up to the limit; a section larger than the limit is its own batch', () => {
    expect(intakeBatches([s('S1', 10), s('S2', 20), s('S3', 15), s('S4', 100), s('S5', 1)], 40)).toEqual([
      ['S1', 'S2'],
      ['S3'],
      ['S4'],
      ['S5'],
    ]);
  });
  test('native pages (chars unknown) are one batch: the native fallback reads at most 10 pages whole', () => {
    const native = Array.from({ length: 10 }, (_, i) => s(`S${i + 1}`, null));
    expect(intakeBatches(native, INTAKE_BATCH_CHARS).map((b) => b.length)).toEqual([10]);
  });
});

describe('intakeReport', () => {
  test('Markdown: sections, anchored text, summary and one batch at the default limit', () => {
    const { report, sourceMd } = intakeReport({ doc: 'req', source: SOURCE, parts: markdownParts('# A\n\nrule a\n## B\n\nrule b\n') });
    expect(report).toMatchObject({
      doc: 'req',
      extractor: 'markdown',
      cache: '.mandao/cache/intake/req',
      status: 'ready',
      sections: [
        { id: 'S1', ref: '§ A', chars: 6, ocr: false },
        { id: 'S2', ref: '§ A > B', chars: 6, ocr: false },
      ],
      summary: { sections: 2, chars: 12, batches: 1, batch_chars: 40000, ocr_refs: [] },
      batches: [['S1', 'S2']],
    });
    expect(sourceMd).toBe('[§ A]\nrule a\n\n[§ A > B]\nrule b\n');
  });

  test('PDF: a page with fewer than 20 non-whitespace characters needs OCR and is listed', () => {
    const text = page(words(30)) + page(' a b c \n d ') + page(words(19)) + page(words(20));
    const { report } = intakeReport({ doc: 'req', source: PDF, parts: pdfParts(text) });
    expect(report.extractor).toBe('pdftotext');
    expect(report.sections.map((x) => x.ocr)).toEqual([false, true, true, false]);
    expect(report.summary.ocr_refs).toEqual(['p. 2', 'p. 3']);
    expect(report.status).toBe('ready');
    expect(report.hint).toBeUndefined();
  });

  test('a document where every page needs OCR is ready, and the hint says the whole document requires OCR', () => {
    const { report } = intakeReport({ doc: 'scan', source: PDF, parts: pdfParts(page('') + page('  12 ')) });
    expect(report.status).toBe('ready');
    expect(report.hint).toMatch(/whole document requires OCR/);
  });

  test('Markdown sections never need OCR, however short', () => {
    const { report } = intakeReport({ doc: 'req', source: SOURCE, parts: markdownParts('# A\n\nok\n') });
    expect(report.sections[0]!.ocr).toBe(false);
  });

  test('native pages: p. 1…p. n, chars null, ocr false, no anchored text', () => {
    const { report, sourceMd } = intakeReport({ doc: 'req', source: PDF, nativePages: 3 });
    expect(report.extractor).toBe('native');
    expect(report.sections).toEqual([
      { id: 'S1', ref: 'p. 1', chars: null, ocr: false },
      { id: 'S2', ref: 'p. 2', chars: null, ocr: false },
      { id: 'S3', ref: 'p. 3', chars: null, ocr: false },
    ]);
    expect(report.summary.chars).toBeNull();
    expect(sourceMd).toBeUndefined();
    expect(report.batches).toEqual([['S1', 'S2', 'S3']]);
  });

  test('native pages above 10 are refused: without poppler Claude Code reads a PDF only whole, up to 10 pages', () => {
    expect(intakeReport({ doc: 'req', source: PDF, nativePages: 10 }).report.sections).toHaveLength(10);
    expect(() => intakeReport({ doc: 'req', source: PDF, nativePages: 11 })).toThrow(
      'the native fallback reads at most 10 pages without poppler: install poppler (brew install poppler / apt install poppler-utils) or export to Markdown',
    );
  });

  test('batch_chars is honored and must be a positive integer', () => {
    const { report } = intakeReport({ doc: 'req', source: SOURCE, parts: markdownParts('# A\n\naaaa\n# B\n\nbbbb\n'), batchChars: 5 });
    expect(report.batches).toEqual([['S1'], ['S2']]);
    expect(report.summary.batch_chars).toBe(5);
    expect(() => intakeReport({ doc: 'req', source: SOURCE, parts: [], batchChars: 0 })).toThrow(/batch/);
  });
});
