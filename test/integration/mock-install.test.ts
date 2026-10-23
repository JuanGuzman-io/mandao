// mandao-scans: none — copies the MDO-0001 fixture and a local skill repository into temporary trees and lists only those.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type * as CatalogModule from '../../src/engine/catalog.js';
import type { Catalog } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';
import { captureOutput, cli, git, localDesignSkill, mockReadme, mockRepo as repo, writeSpecFile as write } from '../mock-fixture.js';

/** Trial 13 D3 and F4: the accepted mock's skills get their own commit before the first task, and the brief names them. */
const fixture = vi.hoisted(() => ({ catalog: undefined as Catalog | undefined }));
vi.mock('../../src/engine/catalog.js', async (importOriginal) => {
  const real = await importOriginal<typeof CatalogModule>();
  return { ...real, readCatalog: () => fixture.catalog ?? real.readCatalog() };
});

let out: string[];
beforeEach(async () => {
  process.env.MANDAO_HOME = makeTree({});
  out = captureOutput();
  const { readCatalog } = await vi.importActual<typeof CatalogModule>('../../src/engine/catalog.js');
  fixture.catalog = localDesignSkill(readCatalog());
});
afterEach(() => {
  fixture.catalog = undefined;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});
const lastJson = () => JSON.parse(out.at(-1)!);
const SKILL = '.claude/skills/ai-design-skills';

async function accepted() {
  const root = repo(2);
  await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'accepted', '--source', 'html');
  return root;
}

describe('run mock-install', () => {
  test('refuses unless the mock was accepted, and without --yes', async () => {
    const root = repo(2);
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/accepted/);
    await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'declined');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/declined/);
    const ok = await accepted();
    await expect(cli(ok, 'run', 'mock-install', 'MDO-0001')).rejects.toThrow(/--yes/);
    expect(existsSync(join(ok, SKILL))).toBe(false);
  });

  test('refuses when other changes are staged, before installing anything', async () => {
    const root = await accepted();
    writeFileSync(join(root, 'other.txt'), 'x');
    git(root, 'add', 'other.txt');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/other\.txt.*staged|staged.*other\.txt/);
    expect(existsSync(join(root, SKILL))).toBe(false);
  });

  test('refuses when the lock already has uncommitted changes, staged or not, before installing anything', async () => {
    const root = await accepted();
    const lock = join(root, '.mandao/mandao.lock');
    writeFileSync(lock, `${readFileSync(lock, 'utf8')}# edited\n`);
    const refusal = /the lock has uncommitted changes: commit or discard them first, so the skill commit carries only the install/;
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(refusal);
    git(root, 'add', '.mandao/mandao.lock');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(refusal);
    expect(existsSync(join(root, SKILL))).toBe(false);
  });

  test('installs the mock skills and commits only them and the lock, with the chore subject and the Refs trailer', async () => {
    const root = await accepted();
    writeFileSync(join(root, 'unrelated.txt'), 'left alone');
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(lastJson()).toMatchObject({ installed: [{ id: 'ai-design-skills', status: 'installed' }], commit: { committed: true } });
    expect(git(root, 'log', '-1', '--format=%s')).toBe('🔧 chore(mandao): install mock skills for MDO-0001');
    expect(git(root, 'log', '-1', '--format=%(trailers:key=Refs,valueonly)')).toBe('MDO-0001');
    const files = git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n');
    expect(files).toContain('.mandao/mandao.lock');
    expect(files.every((f) => f === '.mandao/mandao.lock' || f.startsWith(`${SKILL}/`))).toBe(true);
    expect(git(root, 'status', '--porcelain', '--', SKILL, '.mandao/mandao.lock')).toBe('');
    expect(readFileSync(join(root, 'unrelated.txt'), 'utf8')).toBe('left alone');
    expect(git(root, 'status', '--porcelain', '--', 'unrelated.txt')).toBe('?? unrelated.txt');

    // Idempotent: installed and committed is a no-op success.
    const head = git(root, 'rev-parse', 'HEAD');
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(lastJson()).toMatchObject({ installed: [], commit: { committed: false } });
    expect(git(root, 'rev-parse', 'HEAD')).toBe(head);
    expect(process.exitCode).toBeUndefined();
  });

  test('after mock-install, the first task review pack and manifest carry no skill file and no lock change', async () => {
    const root = await accepted();
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    write(root, 'mockups/form.html', '<p>');
    writeFileSync(join(root, 'src.ts'), 'export const a = 1;\n');
    await cli(root, 'run', 'review-pack', 'MDO-0001', 'T1');
    const pack = readFileSync(join(root, lastJson().pack), 'utf8');
    const manifest = pack.slice(pack.indexOf('## Mandao change manifest'), pack.indexOf('## Diff'));
    expect(manifest).toContain('src.ts');
    expect(pack).not.toContain('.claude/skills/ai-design-skills');
    expect(pack).not.toContain('mandao.lock');
  });
});

describe('F4: the brief of a UI task names the installed mock skill', () => {
  test('mockup.skills holds the name the skill is installed under, not the catalog id', async () => {
    const root = await accepted();
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    write(root, 'mockups/form.html', '<p>');
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup.skills).toBeUndefined();
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup.skills).toEqual(['brainstorming']);
  });
});
