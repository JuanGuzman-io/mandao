// mandao-scans: none — copies the MDO-0001 fixture and a local skill repository into temporary trees and lists only those.
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type * as CatalogModule from '../../src/engine/catalog.js';
import type { Catalog } from '../../src/schemas/index.js';
import { makeTree } from '../helpers.js';
import {
  captureOutput,
  cli,
  git,
  localDesignSkill,
  mockReadme,
  mockRepo as repo,
  setHarnesses,
  writeSpecFile as write,
} from '../mock-fixture.js';

/** Phase 13b review: mock-install adopts the trial's uncommitted install, every harness copy, protected branches, mock-offer F9. */
const fixture = vi.hoisted(() => ({ catalog: undefined as Catalog | undefined }));
vi.mock('../../src/engine/catalog.js', async (importOriginal) => {
  const real = await importOriginal<typeof CatalogModule>();
  return { ...real, readCatalog: () => fixture.catalog ?? real.readCatalog() };
});

let out: string[];
const useUpstream = async (extra: Record<string, string> = {}) => {
  const { readCatalog } = await vi.importActual<typeof CatalogModule>('../../src/engine/catalog.js');
  fixture.catalog = localDesignSkill(readCatalog(), extra);
};
beforeEach(async () => {
  process.env.MANDAO_HOME = makeTree({});
  out = captureOutput();
  await useUpstream();
});
afterEach(() => {
  fixture.catalog = undefined;
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});
const lastJson = () => JSON.parse(out.at(-1)!);
const CLAUDE = '.claude/skills/ai-design-skills';
const CODEX = '.agents/skills/ai-design-skills';
const committed = (root: string) => git(root, 'show', '--name-only', '--format=', 'HEAD').split('\n');

async function accepted(harnesses: ('claude' | 'codex')[] = ['claude']) {
  const root = repo(2);
  if (harnesses.join() !== 'claude') setHarnesses(root, harnesses);
  await cli(root, 'run', 'mock-offer', 'MDO-0001', '--record', 'accepted', '--source', 'html');
  return root;
}

describe('F3: the trial state, skills add then mock-install', () => {
  test('an uncommitted install that verifies against the pinned commit is adopted and committed', async () => {
    const root = await accepted(['claude', 'codex']);
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    expect(existsSync(join(root, CLAUDE, 'SKILL.md'))).toBe(true);
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(lastJson()).toMatchObject({ commit: { committed: true } });
    expect(process.exitCode).toBeUndefined();
    expect(committed(root)).toEqual(
      expect.arrayContaining(['.mandao/mandao.lock', `${CLAUDE}/SKILL.md`, `${CODEX}/SKILL.md`, `${CODEX}/agents/openai.yaml`]),
    );
    expect(git(root, 'status', '--porcelain', '--', CLAUDE, CODEX, '.mandao/mandao.lock')).toBe('');
  });

  test('an uncommitted folder that does not verify is refused, naming the folders to remove', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    writeFileSync(join(root, CLAUDE, 'SKILL.md'), '---\nname: brainstorming\n---\nedited by hand\n');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(
      /\.claude\/skills\/ai-design-skills.*remove|remove.*\.claude\/skills\/ai-design-skills/,
    );
    expect(git(root, 'log', '-1', '--format=%s')).not.toMatch(/install mock skills/);
  });

  test('a lock changed beyond the skill pin is still refused', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    const lock = join(root, '.mandao/mandao.lock');
    writeFileSync(lock, readFileSync(lock, 'utf8').replace(/^config_hash: .*$/m, 'config_hash: sha256-edited'));
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/the lock has uncommitted changes/);
  });
});

describe('F4: branches and harnesses', () => {
  test('refuses on a protected branch (main) before installing', async () => {
    const root = await accepted();
    git(root, 'checkout', '-q', '-b', 'main');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/main is a protected branch/);
    expect(existsSync(join(root, CLAUDE))).toBe(false);
  });

  test('with Codex enabled, the Codex copy and its agents/openai.yaml are in the commit', async () => {
    const root = await accepted(['claude', 'codex']);
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(committed(root)).toEqual(expect.arrayContaining([`${CLAUDE}/SKILL.md`, `${CODEX}/SKILL.md`, `${CODEX}/agents/openai.yaml`]));
  });

  test('F11: a harness enabled later gets its missing copy installed and committed', async () => {
    const root = await accepted();
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    const before = readFileSync(join(root, CLAUDE, 'SKILL.md'), 'utf8');
    setHarnesses(root, ['claude', 'codex']);
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(lastJson()).toMatchObject({ commit: { committed: true } });
    expect(committed(root)).toEqual(expect.arrayContaining([`${CODEX}/SKILL.md`, `${CODEX}/agents/openai.yaml`]));
    expect(readFileSync(join(root, CLAUDE, 'SKILL.md'), 'utf8')).toBe(before);
  });
});

describe('F9, F10, F12', () => {
  test('F9: mock-offer after acceptance names the skills until they are installed', async () => {
    const root = await accepted();
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson()).toMatchObject({ suggest: false, decided: 'accepted', skills: [{ id: 'ai-design-skills' }] });
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    await cli(root, 'run', 'mock-offer', 'MDO-0001');
    expect(lastJson().skills).toBeUndefined();
  });

  test('F10: a failed commit exits 1', async () => {
    const root = await accepted();
    const hook = join(root, '.git/hooks/pre-commit');
    writeFileSync(hook, '#!/bin/sh\nexit 1\n');
    chmodSync(hook, 0o755);
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    expect(lastJson()).toMatchObject({ commit: { committed: false } });
    expect(process.exitCode).toBe(1);
  });

  test('F12: a SKILL.md name that is not a skill name falls back to the id in the brief', async () => {
    await useUpstream({ 'SKILL.md': '---\nname: "../Bad Name"\n---\nbody\n' });
    const root = await accepted();
    write(root, 'mockups/README.md', mockReadme('source: html\nfiles: [form.html]'));
    write(root, 'mockups/form.html', '<p>');
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    await cli(root, 'run', 'brief', 'MDO-0001', 'T1');
    expect(lastJson().mockup.skills).toEqual(['ai-design-skills']);
  });
});

describe('review round 2: nothing is pinned or committed without verification', () => {
  const lockClean = (root: string) => git(root, 'status', '--porcelain', '--', '.mandao/mandao.lock');

  test('F1: a committed, unpinned folder with hand-made content is verified and refused; the lock stays clean', async () => {
    const root = await accepted();
    mkdirSync(join(root, CLAUDE), { recursive: true });
    writeFileSync(join(root, CLAUDE, 'SKILL.md'), '---\nname: brainstorming\n---\nnot the upstream body\n');
    git(root, 'add', CLAUDE);
    git(root, 'commit', '-qm', 'hand-made skill');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(
      /\.claude\/skills\/ai-design-skills.*could not be verified/,
    );
    expect(lockClean(root)).toBe('');
  });

  test('F1: a gitignored skills folder is refused before anything is written', async () => {
    const root = await accepted();
    writeFileSync(join(root, '.gitignore'), '.claude/skills/\n');
    git(root, 'add', '.gitignore');
    git(root, 'commit', '-qm', 'ignore skills');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(
      /\.claude\/skills\/ai-design-skills is ignored by git/,
    );
    expect(existsSync(join(root, CLAUDE))).toBe(false);
    expect(lockClean(root)).toBe('');
  });

  test('F3: a skill folder that is a symlink is refused without reading it', async () => {
    const root = await accepted();
    await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes');
    const outside = makeTree({});
    cpSync(join(root, CLAUDE), join(outside, 'copy'), { recursive: true });
    git(root, 'rm', '-rq', CLAUDE);
    git(root, 'commit', '-qm', 'drop the copy');
    symlinkSync(join(outside, 'copy'), join(root, CLAUDE));
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/\.claude\/skills\/ai-design-skills is a symlink/);
    expect(lockClean(root)).toBe('');
  });

  test('F4: a verification whose fetch cannot run says so, with the fetch detail, and does not ask to remove the folders', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    vi.stubEnv('GIT_CONFIG_COUNT', '0');
    const error = await cli(root, 'run', 'mock-install', 'MDO-0001', '--yes').then(
      () => undefined,
      (e: Error) => e.message,
    );
    expect(error).toMatch(/could not fetch .*ai-design-skills.*to verify/);
    expect(error).toMatch(/fetch failed/);
    expect(error).not.toMatch(/remove/);
  });

  test('F6: a hand-edited pin of the mock skill in the uncommitted lock is refused', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    const lock = join(root, '.mandao/mandao.lock');
    const text = readFileSync(lock, 'utf8');
    expect(text).toMatch(/vetted: false/);
    writeFileSync(lock, text.replace(/vetted: false/, 'vetted: true'));
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(
      /lock pin of ai-design-skills differs from the catalog/,
    );
  });
});

describe('review round 3', () => {
  const lockClean = (root: string) => git(root, 'status', '--porcelain', '--', '.mandao/mandao.lock');
  const LOCK = '.mandao/mandao.lock';

  test('F1: a pin added by hand to the uncommitted lock, for a committed folder never pinned in HEAD, is still verified', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    const pinnedLock = readFileSync(join(root, LOCK), 'utf8');
    git(root, 'checkout', '-q', '--', LOCK);
    writeFileSync(join(root, CLAUDE, 'SKILL.md'), '---\nname: brainstorming\n---\nhand-made, never pinned\n');
    git(root, 'add', CLAUDE);
    git(root, 'commit', '-qm', 'hand-made skill');
    writeFileSync(join(root, LOCK), pinnedLock);
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/ai-design-skills could not be verified/);
    expect(git(root, 'log', '-1', '--format=%s')).toBe('hand-made skill');
  });

  test('F2: a foreign lock change is refused before any third-party fetch runs', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes');
    const lock = join(root, LOCK);
    writeFileSync(lock, readFileSync(lock, 'utf8').replace(/^config_hash: .*$/m, 'config_hash: sha256-edited'));
    vi.stubEnv('GIT_CONFIG_COUNT', '0');
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/the lock has uncommitted changes/);
  });

  test('F3: a pin with scripts (skills add --with-scripts) is refused with that reason', async () => {
    const root = await accepted();
    await cli(root, 'skills', 'add', 'ai-design-skills', '--yes', '--with-scripts');
    expect(readFileSync(join(root, LOCK), 'utf8')).toMatch(/scripts: true/);
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(
      /mock skills are installed without scripts; reinstall without --with-scripts/,
    );
  });

  test('F4: a harness skills folder that is a symlink is refused before anything is written', async () => {
    const root = await accepted();
    const outside = join(makeTree({}), 'skills');
    cpSync(join(root, '.claude/skills'), outside, { recursive: true });
    rmSync(join(root, '.claude/skills'), { recursive: true });
    symlinkSync(outside, join(root, '.claude/skills'));
    await expect(cli(root, 'run', 'mock-install', 'MDO-0001', '--yes')).rejects.toThrow(/\.claude\/skills is a symlink/);
    expect(existsSync(join(outside, 'ai-design-skills'))).toBe(false);
    expect(lockClean(root)).toBe('');
  });
});
