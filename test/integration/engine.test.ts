import { chmodSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { runDoctor } from '../../src/engine/doctor.js';
import { modelFindings } from '../../src/engine/doctor-models.js';
import { readConfig, readLock, writeYaml } from '../../src/engine/files.js';
import { syncGlobal, syncProject } from '../../src/engine/sync.js';
import { readRecommendations } from '../../src/models/load.js';
import { makeTree, pkg } from '../helpers.js';

function workspace() {
  const root = makeTree({ '.git/': '', 'package.json': pkg('shop'), 'AGENTS.md': '# House rules\n' });
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.', profile: 'app' }],
    harnesses: ['claude', 'copilot'],
  });
  writeYaml(join(root, '.mandao/models.yml'), { schema_version: 1, mode: 'routed', harnesses: { claude: { reviewer: 'opus' } } });
  return root;
}

/** Offline probe: the registry knows every mandao version; no external tools are installed. */
const probe = (cmd: string) => (cmd.startsWith('npm view mandao@') ? '0.1.0\n' : undefined);

const actions = (r: ReturnType<typeof syncProject>) => [...new Set(r.changes.map((c) => c.action))].sort();

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
});

describe('syncProject', () => {
  test('is idempotent and records every generated file in the lock', () => {
    const root = workspace();
    const first = syncProject(root);
    expect(actions(first)).toEqual(['create', 'update']); // AGENTS.md existed, so its block is an update
    expect(actions(syncProject(root))).toEqual(['unchanged']);
    const lock = readLock(join(root, '.mandao/mandao.lock'))!;
    expect(lock.files.map((f) => f.path)).toEqual(expect.arrayContaining(['AGENTS.md', 'CLAUDE.md', '.mandao/commitlint.config.mjs']));
    expect(readFileSync(join(root, 'AGENTS.md'), 'utf8')).toMatch(/^# House rules\n\n<!-- mandao:begin -->/);
  });

  test('removing a harness deletes its files', () => {
    const root = workspace();
    syncProject(root);
    expect(existsSync(join(root, '.github'))).toBe(true);
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.', profile: 'app' }],
      harnesses: ['claude'],
    });
    const r = syncProject(root);
    expect(r.changes.filter((c) => c.action === 'delete').every((c) => c.path.startsWith('.github/'))).toBe(true);
    expect(existsSync(join(root, '.github'))).toBe(false);
  });

  test('removing Codex keeps the skills Antigravity shares and drops the Codex-only files', () => {
    const root = workspace();
    const setHarnesses = (harnesses: string[]) =>
      writeYaml(join(root, '.mandao/config.yml'), {
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'shop', path: '.', profile: 'app' }],
        harnesses,
      });
    setHarnesses(['codex', 'antigravity']);
    syncProject(root);
    expect(existsSync(join(root, '.agents/skills/mandao-specify/agents/openai.yaml'))).toBe(true);
    setHarnesses(['antigravity']);
    const r = syncProject(root);
    expect(r.changes.find((c) => c.path === '.agents/skills/mandao-specify/SKILL.md')?.action).toBe('update');
    expect(existsSync(join(root, '.agents/skills/mandao-specify/SKILL.md'))).toBe(true);
    expect(existsSync(join(root, '.agents/skills/mandao-specify/agents/openai.yaml'))).toBe(false);
    expect(existsSync(join(root, '.codex/agents'))).toBe(false);
  });

  test('an override wins and survives the next sync', () => {
    const root = workspace();
    syncProject(root);
    const before = readFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'utf8');
    mkdirSync(join(root, '.mandao/overrides/commands'), { recursive: true });
    writeFileSync(join(root, '.mandao/overrides/commands/specify.patch.yml'), 'description: Our own specify.\n');
    syncProject(root);
    const after = readFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'utf8');
    expect(before).not.toContain('Our own specify.');
    expect(after).toContain('description: Our own specify.');
  });
});

describe('doctor', () => {
  test('clean after sync; reports drift and config changes', () => {
    const root = workspace();
    syncProject(root);
    expect(runDoctor(root, { probe }).filter((f) => f.level === 'error' || f.level === 'warn')).toEqual([]);

    writeFileSync(join(root, '.claude/skills/mandao-specify/SKILL.md'), 'hand edit');
    writeFileSync(join(root, '.mandao/models.yml'), 'schema_version: 1\nharnesses: { claude: { reviewer: sonnet } }\n');
    const warns = runDoctor(root, { probe })
      .filter((f) => f.level === 'warn')
      .map((f) => f.message);
    expect(warns).toEqual(
      expect.arrayContaining([
        '.claude/skills/mandao-specify/SKILL.md was edited by hand',
        'config.yml or models.yml changed since the last sync',
      ]),
    );
  });

  test('a task waiting for its commit is a warning with the command that commits it', () => {
    const root = workspace();
    syncProject(root);
    writeYaml(join(root, 'specs/MDO-0001-x/progress.yml'), {
      schema_version: 1,
      spec: 'MDO-0001-x',
      updated_at: 'now',
      pending_commits: [{ task: 'T3', subject: 'print pinned skills as JSON', files: ['src/a.ts'] }],
    });
    expect(runDoctor(root, { probe }).filter((f) => f.level === 'warn')).toEqual([
      {
        level: 'warn',
        message: 'MDO-0001-x: T3 passed review and wait for their commit',
        fix: 'run `mandao run commit MDO-0001-x` (local only, one commit per task)',
      },
    ]);
  });

  test('invalid config is an error with the field path', () => {
    const root = workspace();
    writeFileSync(join(root, '.mandao/config.yml'), 'schema_version: 1\nworkspace: galaxy\nprojects: []\nharnesses: [claude]\n');
    const errors = runDoctor(root, { probe })
      .filter((f) => f.level === 'error')
      .map((f) => f.message);
    expect(errors.some((m) => m.includes('workspace:'))).toBe(true);
    expect(errors.some((m) => m.includes('projects:'))).toBe(true);
  });
});

test('syncGlobal installs only /mandao-init under the user folders', () => {
  const r = syncGlobal(['claude']);
  expect(r.changes.map((c) => [c.path, c.action])).toEqual([['skills/mandao-init/SKILL.md', 'create']]);
  expect(existsSync(join(process.env.MANDAO_HOME!, '.claude/skills/mandao-init/SKILL.md'))).toBe(true);
});

describe('collectDiff', () => {
  test('works in a repository without commits and counts untracked files', async () => {
    const { execFileSync } = await import('node:child_process');
    const { collectDiff } = await import('../../src/scripts/quick-check.js');
    const root = makeTree({ 'src/a.ts': 'one\ntwo\n', 'package.json': pkg('x', { zod: '^4' }) });
    execFileSync('git', ['init', '-q'], { cwd: root });
    const diff = collectDiff(root, 'HEAD');
    expect(diff.files.map((f) => f.path).sort()).toEqual(['package.json', 'src/a.ts']);
    expect(diff.manifests).toEqual([{ path: 'package.json', before: undefined, after: pkg('x', { zod: '^4' }) }]);
  });
});

describe('models in doctor', () => {
  test('reports reduced independence and models outside the recommendations', () => {
    const root = workspace();
    writeYaml(join(root, '.mandao/models.yml'), {
      schema_version: 1,
      mode: 'simple',
      harnesses: { claude: { implementer: 'my-model', reviewer: 'my-model', reviewer_alt: 'my-model' } },
    });
    syncProject(root);
    const warns = runDoctor(root, { probe })
      .filter((f) => f.level === 'warn')
      .map((f) => f.message);
    expect(warns).toEqual(
      expect.arrayContaining([
        expect.stringMatching(/^claude: implementer\.fast uses "my-model", which is not among Mandao's recommendations/),
        'claude: reduced independence for strong tasks (every reviewer uses the implementer model); my-model reviews in a clean context',
      ]),
    );
  });

  test('another harness reviews strong tasks only with a reviewer of the strong tier (ADR 0021)', () => {
    const root = workspace();
    const bin = makeTree({ codex: '#!/bin/sh\n' });
    chmodSync(join(bin, 'codex'), 0o755);
    vi.stubEnv('PATH', `${bin}:${process.env.PATH}`);
    try {
      writeYaml(join(root, '.mandao/config.yml'), {
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'shop', path: '.', profile: 'app' }],
        harnesses: ['claude', 'codex'],
      });
      writeYaml(join(root, '.mandao/models.yml'), { schema_version: 1, mode: 'routed', harnesses: {} });
      const claudeReview = () =>
        runDoctor(root, { probe }).filter((f) => f.message.startsWith('claude: ') && /strong tasks/.test(f.message));
      // Default Codex reviewer (gpt-6-sol) is standard: below an Opus implementer, so not offered.
      expect(claudeReview().map((f) => f.level)).toEqual(['warn']);
      // …so doctor offers Codex's optional strong model for that role.
      expect(claudeReview()[0]!.fix).toMatch(
        /^if your plan has gpt-6-astra, make it codex's reviewer: `mandao models set reviewer gpt-6-astra --harness codex`/,
      );
      expect(claudeReview()[0]!.fix).toContain('verified 2026-10-20 at https://learn.chatgpt.com/docs/models.md');
      // Without an official source and review date the same model is never suggested.
      const unverified = structuredClone(readRecommendations());
      for (const o of unverified.harnesses.codex!.optional) {
        delete o.source;
        delete o.reviewed;
      }
      const strongFix = modelFindings(root, readConfig(root), unverified).find(
        (f) => f.message.startsWith('claude: ') && /strong tasks/.test(f.message),
      )!.fix;
      expect(strongFix).not.toContain('gpt-6-astra');
      writeYaml(join(root, '.mandao/models.yml'), { schema_version: 1, mode: 'routed', harnesses: { codex: { reviewer: 'gpt-6-astra' } } });
      expect(claudeReview()).toEqual([
        {
          level: 'info',
          message:
            'claude: strong tasks are reviewed in codex (gpt-6-astra) as a read-only process, since every reviewer uses the implementer model (ADR 0021)',
        },
      ]);
    } finally {
      vi.unstubAllEnvs();
    }
  });

  test('models from an optional provider set are noted with its terms, not flagged as unknown (ADR 0027)', () => {
    const root = makeTree({ '.git/': '', 'package.json': pkg('shop') });
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.' }],
      harnesses: ['opencode'],
    });
    writeYaml(join(root, '.mandao/models.yml'), {
      schema_version: 1,
      mode: 'simple',
      harnesses: { opencode: { implementer: 'opencode/glm-5.3-flash-free', reviewer: 'opencode/beam-free' } },
    });
    const findings = modelFindings(root, readConfig(root), readRecommendations()).filter((f) => f.message.includes('-free'));
    expect(findings.every((f) => f.level === 'info')).toBe(true);
    expect(findings.some((f) => f.message.includes('not among'))).toBe(false);
    expect(findings[0]!.message).toContain(
      'from the optional set opencode-zen: free for a limited time; free models may use data for training',
    );
  });

  test('a project models.yml applies to that project only', () => {
    const root = makeTree({ '.git/': '', 'apps/a/package.json': pkg('a'), 'apps/b/package.json': pkg('b') });
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'monorepo',
      projects: [
        { name: 'a', path: 'apps/a' },
        { name: 'b', path: 'apps/b' },
      ],
      harnesses: ['claude'],
    });
    writeYaml(join(root, 'apps/b/.mandao/models.yml'), { schema_version: 1, harnesses: { claude: { reviewer: 'nonexistent' } } });
    syncProject(root);
    const messages = runDoctor(root, { probe }).map((f) => f.message);
    expect(messages.filter((m) => m.includes('nonexistent'))).toEqual([
      expect.stringMatching(/^claude \(project b\): reviewer uses "nonexistent"/),
    ]);
    // Generated agents follow the workspace; project choices apply at run time through `mandao run models`.
    expect(readFileSync(join(root, '.claude/agents/mandao-reviewer.md'), 'utf8')).toMatch(/^model: claude-opus-5-5$/m);
  });
});

describe('generated support files', () => {
  test('graph exclusions follow the adapters and module guides get CLAUDE.md pointers', () => {
    const root = workspace();
    writeFileSync(join(root, '.gitignore'), 'node_modules/\n');
    mkdirSync(join(root, 'src/billing'), { recursive: true });
    writeFileSync(join(root, 'src/billing/AGENTS.md'), '# Billing\n');
    syncProject(root);

    const graphignore = readFileSync(join(root, '.graphifyignore'), 'utf8');
    expect(graphignore).toContain('.mandao/templates/');
    expect(graphignore).toContain('.claude/skills/mandao-specify/');
    expect(graphignore).toContain('.github/prompts/mandao-specify.prompt.md');
    expect(graphignore).toContain('dist/');
    expect(graphignore).not.toContain('AGENTS.md');
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toMatch(
      /^node_modules\/\n\n# mandao:begin\n.*\ngraphify-out\/\n\.mandao\/run\.lock\n\.mandao\/cli\.log\n\.claude\/settings\.local\.json\n# mandao:end\n$/s,
    );
    expect(readFileSync(join(root, 'src/billing/CLAUDE.md'), 'utf8')).toBe('<!-- mandao:begin -->\n@AGENTS.md\n<!-- mandao:end -->\n');

    // Removing the module guide removes its pointer on the next sync.
    rmSync(join(root, 'src/billing/AGENTS.md'));
    syncProject(root);
    expect(existsSync(join(root, 'src/billing/CLAUDE.md'))).toBe(false);
  });
});

test('doctor sees exactly what sync writes, module pointers included', () => {
  const root = workspace();
  mkdirSync(join(root, 'src/billing'), { recursive: true });
  writeFileSync(join(root, 'src/billing/AGENTS.md'), '# Billing\n');
  syncProject(root);
  expect(runDoctor(root, { probe }).filter((f) => f.message.includes('out of date'))).toEqual([]);
});
