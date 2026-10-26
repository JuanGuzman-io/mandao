import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from 'vitest';
import { runInit } from '../../src/cli/init.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { LOCK_FILE, readLock } from '../../src/engine/files.js';
import { commandSkills } from '../../src/skills/command-skills.js';
import { initTestRepo, makeTree, makeTreeAt, pkg, stubTerminal } from '../helpers.js';

let restoreTerminal: () => void;
beforeEach(() => {
  restoreTerminal = stubTerminal();
});
afterEach(() => restoreTerminal());

// MDO-0009 T2: `init` offers the commands' skills and copies only what the person selects (FR-2, FR-3, FR-4).
// Prompts are mocked like the budget question; Git rewrites its HTTPS fixture URL to a local tagged repository.

const state = vi.hoisted(() => ({
  /** What the skills multiselect answers; the test sets it per case. */
  answer: [] as unknown,
  /** Everything init showed: notes, log lines and console output, in order. */
  shown: [] as string[],
  /** Snapshot taken the moment the skills question is asked. */
  atQuestion: undefined as
    | undefined
    | { shown: string; runnerCalls: string[]; options: unknown; initialValues: unknown; required: unknown },
  runnerCalls: [] as string[],
  root: '',
}));

vi.mock('@clack/prompts', () => {
  const noop = () => {};
  return {
    intro: noop,
    outro: (m: string) => state.shown.push(String(m)),
    cancel: noop,
    isCancel: (v: unknown) => typeof v === 'symbol',
    note: (message: string, title?: string) => state.shown.push(`${title ?? ''}\n${message}`),
    log: {
      info: (m: string) => state.shown.push(String(m)),
      warn: (m: string) => state.shown.push(String(m)),
      message: noop,
      step: noop,
      success: noop,
      error: noop,
    },
    spinner: () => ({ start: noop, stop: noop, message: noop }),
    confirm: async () => true,
    text: async () => '',
    select: async (o: { initialValue?: unknown; options: { value: unknown }[] }) => o.initialValue ?? o.options[0]?.value,
    multiselect: async (o: { message: string; options: { value: string }[]; initialValues?: unknown; required?: unknown }) => {
      if (!o.options.some((x) => x.value === 'brainstorming')) return o.initialValues ?? [];
      state.atQuestion = {
        shown: state.shown.join('\n'),
        runnerCalls: [...state.runnerCalls],
        options: o.options,
        initialValues: o.initialValues,
        required: o.required,
      };
      return state.answer;
    },
  };
});

vi.mock('../../src/cli/init-archify.js', () => ({ offerArchify: async () => {} }));

vi.mock('../../src/skills/install.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/skills/install.js')>();
  return {
    ...real,
    shellRunner: {
      run: (command: string, cwd: string) => {
        state.runnerCalls.push(command);
        return real.shellRunner.run(command, cwd);
      },
      has: (bin: string) => real.shellRunner.has(bin),
    },
  };
});

const SKILLS: Record<string, string> = {
  brainstorming: 'skills/brainstorming',
  'product-manager-toolkit': 'product-team/skills/product-manager-toolkit',
  'software-architect': '.claude/skills/software-architect',
};

const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', ['-c', 'user.name=t', '-c', 'user.email=t@example.com', '-c', 'commit.gpgsign=false', ...args], {
    cwd,
    encoding: 'utf8',
  }).trim();

/** A local repository holding the three git skills at their catalog paths, tagged `v1.0.0`. */
function skillRepo() {
  const dir = makeTree({});
  initTestRepo(dir, '--quiet', '--initial-branch=main');
  git(dir, 'config', 'uploadpack.allowFilter', 'true');
  for (const [id, path] of Object.entries(SKILLS)) {
    mkdirSync(join(dir, path, 'scripts'), { recursive: true });
    writeFileSync(join(dir, path, 'SKILL.md'), `---\nname: ${id}\n---\n`);
    writeFileSync(join(dir, path, 'guide.md'), 'a document');
    writeFileSync(join(dir, path, 'scripts', 'run.sh'), '#!/bin/sh\n');
  }
  git(dir, 'add', '-A');
  git(dir, 'commit', '--quiet', '-m', 'skills');
  git(dir, 'tag', 'v1.0.0');
  return { url: 'https://fixture.invalid/skills.git', localUrl: `file://${dir}`, commit: git(dir, 'rev-parse', 'HEAD') };
}

let source: { url: string; localUrl: string; commit: string } = { url: '', localUrl: '', commit: '' };

function rewriteGitFixture() {
  process.env.GIT_CONFIG_COUNT = '1';
  process.env.GIT_CONFIG_KEY_0 = `url.${source.localUrl}.insteadOf`;
  process.env.GIT_CONFIG_VALUE_0 = source.url;
}

let previousGitConfig: Record<string, string | undefined> = {};

vi.mock('../../src/engine/catalog.js', async (importOriginal) => {
  const real = await importOriginal<typeof import('../../src/engine/catalog.js')>();
  return {
    ...real,
    readCatalog: () => {
      const catalog = real.readCatalog();
      for (const [id, path] of Object.entries(SKILLS)) {
        const skill = catalog.skills[id]!;
        skill.source = { type: 'git', url: source.url, ref: 'v1.0.0', path, commit: source.commit };
      }
      return catalog;
    },
  };
});

let exit: MockInstance<typeof process.exit>;

beforeEach(() => {
  previousGitConfig = Object.fromEntries(
    ['GIT_CONFIG_COUNT', 'GIT_CONFIG_KEY_0', 'GIT_CONFIG_VALUE_0'].map((key) => [key, process.env[key]]),
  );
  process.env.MANDAO_HOME = makeTree({});
  state.shown = [];
  state.atQuestion = undefined;
  state.runnerCalls = [];
  state.answer = [];
  source = skillRepo();
  rewriteGitFixture();
  state.root = makeTree({ '.git/': '', 'package.json': pkg('shop') });
  vi.spyOn(console, 'log').mockImplementation((...args) => {
    state.shown.push(args.join(' '));
  });
  exit = vi.spyOn(process, 'exit');
  exit.mockImplementation(((code?: number) => {
    throw new Error(`process.exit(${code}) called`);
  }) as never);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const [key, value] of Object.entries(previousGitConfig)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const initOptions = {
  scope: 'project',
  defaultProfile: 'app',
  languageBusiness: 'en',
  languageTechnical: 'en',
  budget: 'none',
  modelsMode: 'simple',
  modelProfile: 'peak',
} as const;
const init = (harness: string[], extra: Record<string, unknown> = {}) => runInit(state.root, { ...initOptions, harness, ...extra });
const lockSkills = () => readLock(join(state.root, LOCK_FILE))?.skills ?? [];
const folder = (base: string, id: string) => join(state.root, base, id);

describe('init offers the skills (FR-2)', () => {
  test('S-2.1 and AC-1/C1: before the question, each skill shows what it does, source, version, vetted state and its commands', async () => {
    await init(['claude', 'codex']);
    const catalog = readCatalog();
    expect(state.atQuestion, 'the skills question was asked').toBeDefined();
    const shown = state.atQuestion!.shown;
    for (const { id, commands } of commandSkills(catalog)) {
      const skill = catalog.skills[id]!;
      expect(shown, id).toContain(id);
      expect(shown, `${id} version`).toContain(skill.version);
      expect(shown, `${id} description`).toContain(skill.description);
      for (const command of commands) expect(shown, `${id} command ${command}`).toContain(command);
    }
    expect(shown).toMatch(/vetted/i);
    expect(shown).toContain(source.url);
    expect(shown).toContain('v1.0.0');
  });

  test('S-2.1/C1: before the question, it shows how each is installed: the shell commands, or repository, tag and the folders', async () => {
    await init(['claude', 'codex']);
    const shown = state.atQuestion!.shown;
    expect(shown).toContain('.claude/skills');
    expect(shown).toContain('.agents/skills');
    expect(shown).toContain('skills/brainstorming');
    expect(shown).toContain('uv tool install graphifyy==0.9.92');
  });

  test('S-2.3/C1 and AC-1/C2: no skill starts selected and the question is not required', async () => {
    await init(['claude', 'codex']);
    const { initialValues, required, options } = state.atQuestion!;
    expect(initialValues === undefined || (Array.isArray(initialValues) && initialValues.length === 0)).toBe(true);
    expect(required).not.toBe(true);
    const offered = (options as { value: string }[]).map((o) => o.value);
    expect(offered.sort()).toEqual(
      commandSkills(readCatalog())
        .map((s) => s.id)
        .sort(),
    );
  });

  test('S-2.3/C1: nothing was run and no folder written when the question is asked', async () => {
    await init(['claude', 'codex']);
    expect(state.atQuestion!.runnerCalls).toEqual([]);
    for (const id of Object.keys(SKILLS)) {
      expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
      expect(existsSync(folder('.agents/skills', id)), id).toBe(false);
    }
  });
});

describe('init installs only the selection (AC-1, AC-3)', () => {
  test('S-2.2 and AC-1/C3: selecting product-manager-toolkit only copies it into both folders and pins it with its commit', async () => {
    state.answer = ['product-manager-toolkit'];
    await init(['claude', 'codex']);
    for (const base of ['.claude/skills', '.agents/skills']) {
      expect(existsSync(join(folder(base, 'product-manager-toolkit'), 'SKILL.md'))).toBe(true);
      expect(existsSync(folder(base, 'brainstorming'))).toBe(false);
      expect(existsSync(folder(base, 'software-architect'))).toBe(false);
    }
    const pinned = lockSkills();
    expect(pinned.map((s) => s.id)).toEqual(['product-manager-toolkit']);
    expect(pinned[0]).toMatchObject({ commit: source.commit });
  });

  test('S-2.3: selecting nothing finishes init and pins no skill', async () => {
    state.answer = [];
    await init(['claude', 'codex']);
    expect(lockSkills()).toEqual([]);
    for (const id of Object.keys(SKILLS)) expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
    expect(existsSync(join(state.root, '.mandao/config.yml'))).toBe(true);
  });

  test('S-2.3: cancelling the question finishes init without exiting and pins no skill', async () => {
    state.answer = Symbol('cancel');
    await init(['claude', 'codex']);
    expect(exit).not.toHaveBeenCalled();
    expect(lockSkills()).toEqual([]);
    for (const id of Object.keys(SKILLS)) expect(existsSync(folder('.claude/skills', id)), id).toBe(false);
    expect(readLock(join(state.root, LOCK_FILE))).toBeDefined();
  });

  test('AC-3: with only Codex chosen the same skills are offered and the accepted one lands where Codex reads', async () => {
    state.answer = ['brainstorming'];
    await init(['codex']);
    const offered = (state.atQuestion!.options as { value: string }[]).map((o) => o.value).sort();
    expect(offered).toEqual(
      commandSkills(readCatalog())
        .map((s) => s.id)
        .sort(),
    );
    expect(existsSync(join(folder('.agents/skills', 'brainstorming'), 'SKILL.md'))).toBe(true);
    expect(existsSync(folder('.claude/skills', 'brainstorming'))).toBe(false);
    expect(lockSkills().map((s) => s.id)).toEqual(['brainstorming']);
  });

  test('AC-1/C4: by default the accepted skill is copied without its scripts, which are named; --with-scripts copies them', async () => {
    state.answer = ['brainstorming'];
    await init(['claude']);
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'guide.md'))).toBe(true);
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'scripts', 'run.sh'))).toBe(false);
    expect(state.shown.join('\n')).toContain('--with-scripts');
    expect(lockSkills()[0]?.scripts).not.toBe(true);
  });

  test('AC-1/C4: --with-scripts on init copies the scripts, warns, and records it in the lock', async () => {
    state.answer = ['brainstorming'];
    await init(['claude'], { withScripts: true });
    expect(existsSync(join(folder('.claude/skills', 'brainstorming'), 'scripts', 'run.sh'))).toBe(true);
    expect(state.shown.join('\n')).toMatch(/third-party/i);
    expect(lockSkills()[0]).toMatchObject({ id: 'brainstorming', commit: source.commit, scripts: true });
  });

  test('S-3.3/C1 and AC-3/C1: an accepted skill whose fetch fails does not fail init; it is reported pending and not pinned', async () => {
    source = { ...source, localUrl: 'file:///nonexistent/mandao-no-such-repository' };
    rewriteGitFixture();
    state.answer = ['brainstorming'];
    await expect(init(['claude', 'codex'])).resolves.toBeUndefined();
    expect(exit).not.toHaveBeenCalled();
    expect(lockSkills()).toEqual([]);
    const shown = state.shown.join('\n');
    expect(shown).toMatch(/pending/i);
    expect(shown).toContain(source.commit);
    expect(existsSync(folder('.claude/skills', 'brainstorming'))).toBe(false);
  });
});

describe('init --yes as a process (FR-4)', () => {
  const root = fileURLToPath(new URL('../..', import.meta.url));
  const cache = join(root, 'node_modules', '.cache');
  let outDir = '';

  beforeEach(async () => {
    outDir = makeTreeAt(cache, 'mandao-init-skills-', {});
    // Same entry, format, target and platform as tsup.config.ts; the bundle sits in the repository so core/ is found.
    await build({
      entry: { cli: join(root, 'src/cli/index.ts') },
      format: ['esm'],
      target: 'node22',
      platform: 'node',
      outDir,
      config: false,
      silent: true,
    });
  }, 60_000);

  afterEach(() => {
    outDir = '';
  });

  /** Fake installers on PATH: each leaves a marker if anything runs it. */
  function shims() {
    const dir = makeTree({});
    const marker = join(dir, 'RAN');
    for (const bin of ['uv', 'npx', 'npm', 'graphify', 'pip', 'pipx']) {
      const file = join(dir, bin);
      writeFileSync(file, `#!/bin/sh\necho "${bin} $@" >> "${marker}"\nexit 0\n`);
      chmodSync(file, 0o755);
    }
    return { dir, marker };
  }

  function runYes() {
    const cwd = makeTree({ '.git/': '', 'package.json': pkg('shop') });
    const { dir, marker } = shims();
    const result = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'init', '--yes'], {
      cwd,
      encoding: 'utf8',
      timeout: 60_000,
      env: { ...process.env, MANDAO_HOME: makeTree({}), PATH: `${dir}:${process.env.PATH}` },
    });
    return { cwd, marker, status: result.status, out: `${result.stdout}\n${result.stderr}` };
  }

  /** The catalog the built CLI reads: this file mocks `readCatalog` to local repositories. */
  const realCatalog = async () =>
    (await vi.importActual<typeof import('../../src/engine/catalog.js')>('../../src/engine/catalog.js')).readCatalog();

  test('S-4.1: init --yes lists each skill with its version and source and the line `mandao skills add <ids>`', async () => {
    const { status, out } = runYes();
    expect(status, out).toBe(0);
    const catalog = await realCatalog();
    const skills = commandSkills(catalog);
    expect(skills.length).toBeGreaterThan(0);
    const line = out.split('\n').find((l) => /mandao skills add\s+\S/.test(l));
    expect(line, 'a `mandao skills add <ids>` line').toBeDefined();
    for (const { id } of skills) {
      const s = catalog.skills[id]!;
      const src = s.source as { url?: string; repo?: string };
      expect(out, id).toContain(id);
      expect(out, `${id} version`).toContain(s.version);
      expect(out, `${id} source`).toContain((src.url ?? src.repo)!.replace(/^https?:\/\//, ''));
      expect(line, `${id} in the add line`).toContain(id);
    }
  }, 60_000);

  test('S-4.1/C1 and AC-2/C1: init --yes runs no installer, copies no folder and pins no skill', async () => {
    const { cwd, marker, status, out } = runYes();
    expect(status, out).toBe(0);
    expect(existsSync(marker), 'an installer ran').toBe(false);
    for (const { id } of commandSkills(await realCatalog())) {
      for (const base of ['.claude/skills', '.agents/skills', '.github/skills'])
        expect(existsSync(join(cwd, base, id)), `${base}/${id}`).toBe(false);
    }
    expect(readLock(join(cwd, LOCK_FILE))?.skills).toEqual([]);
    expect(readFileSync(join(cwd, '.mandao/config.yml'), 'utf8')).toContain('harnesses');
  }, 60_000);
});
