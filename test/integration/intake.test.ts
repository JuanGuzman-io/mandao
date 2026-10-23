// mandao-scans: none — builds temporary workspaces with a requirements document and an intake proposal.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { cleanIntake, dropIntakeCache, extractIntake, type PdfText } from '../../src/scripts/intake.js';
import { makeTree } from '../helpers.js';

let out: string[];
let err: string[];
beforeEach(() => {
  out = [];
  err = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(console, 'error').mockImplementation((s: string) => void err.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

const MD = '# Access\n\nUsers sign in with email.\n\n## Sessions\n\nA session lasts 8 hours.\n';
const put = (root: string, file: string, text: string) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};
const read = (root: string, file: string) => readFileSync(join(root, file), 'utf8');
const cli = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
const lastJson = () => JSON.parse(out.at(-1)!);
const CACHE = '.mandao/cache/intake';

function workspace(files: Record<string, string> = {}) {
  const root = realpathSync(makeTree({ 'docs/req.md': MD, ...files }));
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'app', path: '.' }],
    harnesses: ['claude'],
  });
  return root;
}

/** A pdftotext stand-in: `undefined` text means the binary is not on PATH. */
const fakePdf = (text: string | undefined): PdfText & { calls: string[] } => {
  const calls: string[] = [];
  return {
    calls,
    extract: (file) => {
      calls.push(file);
      return text;
    },
  };
};

function proposalFor(doc: string, status: 'proposed' | 'closed', sha: string, context = 'approved') {
  return `---
schema_version: 1
source: { path: "docs/${doc}.md", sha256: "${sha}", extractor: markdown }
doc: ${doc}
date: 2026-10-22
status: ${status}
---

## Business context

| ID | Kind | Proposal | Target | Ref | Status |
|---|---|---|---|---|---|
| C-1 | rule | Sessions last 8 hours | business-rules.md | § Access > Sessions | ${context} |

## Epics

### E-1 — Access
Getting in; refs: [§ Access]

## Stories

### I-1 — Sign in
- epic: E-1
- refs: [§ Access]
- priority: Must
- depends_on: []
- invest: small
#### AC-1 — Signs in
- GIVEN a user / WHEN they sign in / THEN they are in

## Open and conflicts

| ID | Type | Question or contradiction | Ref | Status |
|---|---|---|---|---|
| Q-1 | OPEN | Which provider? | § Access | open |

## Coverage

| Section | Ref | Covered by | Status |
|---|---|---|---|
| S1 | § Access | I-1, E-1 | covered |
| S2 | § Access > Sessions | C-1 | covered |
`;
}

describe('run intake-extract', () => {
  test('Markdown: JSON on stdout, anchored source.md and sections.json in the cache', async () => {
    const root = workspace();
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    const r = lastJson();
    expect(r).toMatchObject({
      doc: 'req',
      source: { path: 'docs/req.md', type: 'markdown' },
      extractor: 'markdown',
      cache: '.mandao/cache/intake/req',
      status: 'ready',
      summary: { sections: 2, batches: 1, ocr_refs: [] },
    });
    expect(r.source.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(read(root, `${CACHE}/req/source.md`)).toContain('[§ Access > Sessions]\nA session lasts 8 hours.');
    expect(JSON.parse(read(root, `${CACHE}/req/sections.json`)).sections).toEqual(r.sections);
  });

  test('an absolute path inside the workspace is shown repo-relative', async () => {
    const root = workspace();
    await cli(root, 'run', 'intake-extract', join(root, 'docs/req.md'));
    expect(lastJson().source.path).toBe('docs/req.md');
  });

  test('a DOCX is refused with exit code 1 and the export hint; nothing is cached', async () => {
    const root = workspace({ 'docs/req.docx': 'PK' });
    await cli(root, 'run', 'intake-extract', 'docs/req.docx');
    expect(lastJson()).toMatchObject({ status: 'refused', hint: '.docx is not supported: export it to PDF or Markdown' });
    expect(lastJson().source.sha256).toMatch(/^[0-9a-f]{64}$/);
    expect(process.exitCode).toBe(1);
    expect(existsSync(join(root, CACHE))).toBe(false);
  });

  test('a missing file is an error', async () => {
    const root = workspace();
    await expect(cli(root, 'run', 'intake-extract', 'docs/nope.md')).rejects.toThrow(/nope\.md/);
  });

  test('--native-pages writes sections.json for p. 1…p. n and no source.md', async () => {
    const root = workspace({ 'docs/req.pdf': '%PDF-1.4' });
    put(root, `${CACHE}/req/source.md`, 'stale');
    await cli(root, 'run', 'intake-extract', 'docs/req.pdf', '--native-pages', '3');
    expect(lastJson()).toMatchObject({ extractor: 'native', status: 'ready', summary: { sections: 3, chars: null } });
    expect(existsSync(join(root, `${CACHE}/req/source.md`))).toBe(false);
    expect(JSON.parse(read(root, `${CACHE}/req/sections.json`)).sections).toHaveLength(3);
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.md', '--native-pages', '3')).rejects.toThrow(/PDF/);
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.pdf', '--native-pages', 'x')).rejects.toThrow(/native-pages/);
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.pdf', '--native-pages', '11')).rejects.toThrow(/at most 10 pages/);
  });

  test('a changed version of the same file is refused without --force and replaced with it', async () => {
    const root = workspace();
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    put(root, 'docs/req.md', `${MD}\n# Added\n\nA new rule.\n`);
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.md')).rejects.toThrow(/another version of docs\/req\.md.*--force/);
    expect(read(root, `${CACHE}/req/source.md`)).not.toContain('A new rule.');
    await cli(root, 'run', 'intake-extract', 'docs/req.md', '--force');
    expect(read(root, `${CACHE}/req/source.md`)).toContain('A new rule.');
  });

  test('an unreadable cache is refused with a clear message, and --force replaces it without reading it', async () => {
    const root = workspace();
    put(root, `${CACHE}/req/sections.json`, '{ not json');
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.md')).rejects.toThrow(
      'the cached extraction in .mandao/cache/intake/req is unreadable: rerun with --force to replace it',
    );
    put(root, `${CACHE}/req/sections.json`, '{"doc": 1}');
    await expect(cli(root, 'run', 'intake-extract', 'docs/req.md')).rejects.toThrow(/unreadable/);
    await cli(root, 'run', 'intake-extract', 'docs/req.md', '--force');
    expect(JSON.parse(read(root, `${CACHE}/req/sections.json`)).doc).toBe('req');
  });

  test('a cache of another file with the same slug is not overwritten without --force', async () => {
    const root = workspace({ 'other/req.md': '# Other\n\nAnother document.\n' });
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    const before = read(root, `${CACHE}/req/sections.json`);
    await expect(cli(root, 'run', 'intake-extract', 'other/req.md')).rejects.toThrow(/docs\/req\.md.*other\/req\.md.*--force/);
    expect(read(root, `${CACHE}/req/sections.json`)).toBe(before);
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    await cli(root, 'run', 'intake-extract', 'other/req.md', '--force');
    expect(lastJson().source.path).toBe('other/req.md');
    expect(read(root, `${CACHE}/req/source.md`)).toContain('Another document.');
  });
});

describe('extractIntake with an injected pdftotext', () => {
  test('a PDF goes through pdftotext, one section per page, OCR pages flagged', () => {
    const root = workspace({ 'docs/req.pdf': '%PDF-1.4' });
    const pdf = fakePdf(`${'Requirement text for page one.'}\f \f${'Page three has text, too.'}\f`);
    const r = extractIntake(root, 'docs/req.pdf', {}, pdf);
    expect(pdf.calls).toEqual([join(root, 'docs/req.pdf')]);
    expect(r).toMatchObject({ extractor: 'pdftotext', status: 'ready', summary: { sections: 3, ocr_refs: ['p. 2'] } });
    expect(read(root, `${CACHE}/req/source.md`)).toMatch(/^\[p\. 1\]\nRequirement text/);
  });

  test('without pdftotext: needs-tool, a hint naming poppler or Markdown, and no cache', () => {
    const root = workspace({ 'docs/req.pdf': '%PDF-1.4' });
    const r = extractIntake(root, 'docs/req.pdf', {}, fakePdf(undefined));
    expect(r.status).toBe('needs-tool');
    expect(r.hint).toMatch(/brew install poppler/);
    expect(r.hint).toMatch(/apt install poppler-utils/);
    expect(r.hint).toMatch(/Markdown/);
    expect(existsSync(join(root, CACHE))).toBe(false);
  });
});

describe('run intake-check, intake-open, intake-story', () => {
  async function extracted() {
    const root = workspace();
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    const sha = lastJson().source.sha256 as string;
    put(root, 'docs/product/intake/req-2026-10-22.md', proposalFor('req', 'proposed', sha));
    return root;
  }

  test('check reads the cache: ok, then a problem with exit code 1', async () => {
    const root = await extracted();
    await cli(root, 'run', 'intake-check', 'docs/product/intake/req-2026-10-22.md');
    expect(lastJson()).toEqual({ ok: true, problems: [], warnings: [] });
    put(root, 'docs/product/intake/req-2026-10-22.md', read(root, 'docs/product/intake/req-2026-10-22.md').replace('| S2 |', '| S9 |'));
    await cli(root, 'run', 'intake-check', 'docs/product/intake/req-2026-10-22.md');
    expect(lastJson().ok).toBe(false);
    expect(process.exitCode).toBe(1);
  });

  test('check reports source-changed when the cache holds another version of the document', async () => {
    const root = await extracted();
    put(root, 'docs/req.md', `${MD}\n# Added\n\nA new rule.\n`);
    await cli(root, 'run', 'intake-extract', 'docs/req.md', '--force');
    await cli(root, 'run', 'intake-check', 'docs/product/intake/req-2026-10-22.md');
    expect(lastJson().problems.map((p: { code: string }) => p.code)).toContain('source-changed');
  });

  test('a corrupt cache is the problem cache-unreadable, never a raw error', async () => {
    const root = await extracted();
    put(root, `${CACHE}/req/sections.json`, '{ not json');
    await cli(root, 'run', 'intake-check', 'docs/product/intake/req-2026-10-22.md');
    const r = lastJson();
    expect(r.ok).toBe(false);
    expect(r.problems).toContainEqual({
      code: 'cache-unreadable',
      message: 'the cached extraction in .mandao/cache/intake/req is unreadable: rerun intake-extract --force',
      at: 'sections.json',
    });
    expect(process.exitCode).toBe(1);
  });

  test('open writes the spec id once; story prints the prefill', async () => {
    const root = await extracted();
    const file = 'docs/product/intake/req-2026-10-22.md';
    await cli(root, 'run', 'intake-story', file, 'I-1');
    expect(lastJson()).toMatchObject({ id: 'I-1', refs: ['§ Access'], open: [{ id: 'Q-1' }], source: { doc: 'req' } });
    await cli(root, 'run', 'intake-open', file, 'I-1', '--as', 'APP-12');
    expect(read(root, file)).toContain('- opened: APP-12');
    await expect(cli(root, 'run', 'intake-open', file, 'I-1', '--as', 'APP-13')).rejects.toThrow(/already opened/);
  });
});

describe('mandao intake close and clean', () => {
  test('close checks, sets status closed and deletes the cache', async () => {
    const root = workspace();
    await cli(root, 'run', 'intake-extract', 'docs/req.md');
    const sha = lastJson().source.sha256 as string;
    const file = 'docs/product/intake/req-2026-10-22.md';
    put(root, file, proposalFor('req', 'proposed', sha, 'proposed'));
    await expect(cli(root, 'intake', 'close', file)).rejects.toThrow(/closed-with-proposed-context/);
    expect(read(root, file)).toMatch(/^status: proposed$/m);
    put(root, file, proposalFor('req', 'proposed', sha));
    await cli(root, 'intake', 'close', file);
    expect(read(root, file)).toMatch(/^status: closed$/m);
    expect(existsSync(join(root, `${CACHE}/req`))).toBe(false);
  });

  test('clean without a doc drops only caches whose proposals are all closed', async () => {
    const root = workspace();
    for (const doc of ['done', 'open', 'orphan']) put(root, `${CACHE}/${doc}/sections.json`, '{}');
    put(root, 'docs/product/intake/done-2026-10-01.md', proposalFor('done', 'closed', 'a'.repeat(64)));
    put(root, 'docs/product/intake/open-2026-10-01.md', proposalFor('open', 'proposed', 'a'.repeat(64)));
    await cli(root, 'intake', 'clean');
    expect(lastJson()).toEqual({ removed: ['done'], kept: ['open', 'orphan'] });
    expect(existsSync(join(root, `${CACHE}/done`))).toBe(false);
    expect(existsSync(join(root, `${CACHE}/open`))).toBe(true);
    await cli(root, 'intake', 'clean', 'open');
    expect(existsSync(join(root, `${CACHE}/open`))).toBe(false);
  });

  test('a doc that is not a slug throws and deletes nothing', () => {
    const root = workspace();
    put(root, '.mandao/cache/keep.txt', 'x');
    for (const bad of ['..', '../cache', 'a/b', 'A B', '']) {
      expect(() => dropIntakeCache(root, bad)).toThrow(/slug/);
      expect(() => cleanIntake(root, bad)).toThrow(/slug/);
    }
    expect(existsSync(join(root, '.mandao/cache/keep.txt'))).toBe(true);
  });
});
