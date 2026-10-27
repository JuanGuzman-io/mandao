import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { configSchema } from '../../src/schemas/index.js';
import { fixCommitsAfter, releaseBranchesContaining } from '../../src/scripts/close.js';
import { parseCloseSummary, renderCloseSummary, withEnvironment, withPublication } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';
import { repo, run, useLogEnv, SPEC as V2_SPEC } from '../log-v2-helpers.js';

const trailers = configSchema.parse({ schema_version: 1, workspace: 'single', projects: [{ name: 'p', path: '.' }], harnesses: ['claude'] })
  .commits.trailers;
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

beforeEach(() => {
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
});
afterEach(() => vi.unstubAllEnvs());

function commit(root: string, file: string, message: string, date: string) {
  writeFileSync(join(root, file), message);
  git(root, 'add', '.');
  execFileSync('git', ['commit', '-qm', message], { cwd: root, env: { ...process.env, GIT_AUTHOR_DATE: date, GIT_COMMITTER_DATE: date } });
  return git(root, 'rev-parse', '--short', 'HEAD');
}

describe('close in a real repository', () => {
  test('bugs after merge: fix commits that reference the spec, after it closed', () => {
    const root = realpathSync(makeTree({}));
    initTestRepo(root, '-q', '-b', 'main');
    commit(root, 'a', '✨ feat(cli): add x\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    commit(root, 'b', '🐛 fix(cli): before close\n\nRefs: MDO-0001', '2026-10-02T10:00:00Z');
    const after = commit(root, 'c', '🐛 fix(cli): after close\n\nRefs: MDO-0001', '2026-10-10T10:00:00Z');
    commit(root, 'd', '🐛 fix(cli): unreferenced', '2026-10-11T10:00:00Z');
    commit(root, 'e', '🐛 fix(cli): other spec\n\nRefs: MDO-0009', '2026-10-12T10:00:00Z');
    expect(fixCommitsAfter(root, 'MDO-0001', trailers, '2026-10-05T00:00:00Z')).toEqual([after]);
  });

  test('gitflow: the release branch that contains every commit of the spec', () => {
    const root = realpathSync(makeTree({}));
    initTestRepo(root, '-q', '-b', 'develop');
    const t1 = commit(root, 'a', 'T1', '2026-10-01T10:00:00Z');
    git(root, 'branch', 'release/1.1');
    const t2 = commit(root, 'b', 'T2', '2026-10-02T10:00:00Z');
    git(root, 'branch', 'release/1.2');
    expect(releaseBranchesContaining(root, [t1, t2], 'release/')).toEqual(['release/1.2']);
    expect(releaseBranchesContaining(root, [t1], 'release/')).toEqual(['release/1.1', 'release/1.2']);
    expect(releaseBranchesContaining(root, [t1], '')).toEqual([]);
  });

  test('close-summary keeps real ISO timestamps as text across a round trip', () => {
    const s = { ...parseCloseSummary(undefined, 'MDO-0002'), closed_at: '2026-10-20T16:02:26.756Z' };
    expect(parseCloseSummary(renderCloseSummary(s), 'MDO-0002').closed_at).toBe('2026-10-20T16:02:26.756Z');
  });

  test('close-summary is idempotent: an environment or a publication is recorded once and updated', () => {
    let s = parseCloseSummary(undefined, 'MDO-0001');
    s = withEnvironment(s, 'staging', 'ci', 't1');
    s = withEnvironment(s, 'staging', 'tracker', 't2');
    s = withPublication(s, { target: 'jira:PROJ-1', kind: 'comment', id: '100', hash: 'h1', at: 't1' });
    s = withPublication(s, { target: 'jira:PROJ-1', kind: 'comment', id: '100', hash: 'h2', at: 't2' });
    const round = parseCloseSummary(renderCloseSummary(s), 'MDO-0001');
    expect(round.environments).toEqual([{ name: 'staging', at: 't2', source: 'tracker' }]);
    expect(round.published.map((p) => p.hash)).toEqual(['h2']);
  });
});

describe('mandao run diagram-drift', () => {
  test('derives the implemented graph from the spec commits and compares it by identity', async () => {
    const { buildProgram } = await import('../../src/cli/program.js');
    const { writeYaml } = await import('../../src/engine/files.js');
    const { cpSync, mkdirSync, readFileSync } = await import('node:fs');
    const root = realpathSync(makeTree({ 'src/cli/run.ts': 'x', 'src/engine/sync.ts': 'y' }));
    initTestRepo(root, '-q', '-b', 'main');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'p', path: '.' }],
      harnesses: ['claude'],
      diagrams: { engine: 'mermaid' },
    });
    const spec = join(root, 'specs/MDO-0001-skills-list');
    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list'), spec, { recursive: true });
    // The fixture's requirements.md says lite; this spec is standard, so its depth is standard in both documents.
    const requirements = join(spec, 'requirements.md');
    writeFileSync(requirements, readFileSync(requirements, 'utf8').replace('depth: lite', 'depth: standard'));
    mkdirSync(join(spec, 'diagrams'));
    writeFileSync(
      join(spec, 'diagrams/proposed.graph.json'),
      JSON.stringify({
        schema_version: 1,
        nodes: [
          { id: 'src/cli', label: 'CLI' },
          { id: 'src/skills', label: 'Skills' },
        ],
        edges: [],
      }),
    );
    writeFileSync(join(spec, 'design.md'), '---\ndepth: standard\nprojects: [p]\n---\n\n# Design\n\n## Decisions\n\nx\n');
    git(root, 'add', '.');
    commit(root, 'src/cli/run.ts', '✨ feat(cli): list\n\nRefs: MDO-0001\nMandao-Task: T1', '2026-10-01T10:00:00Z');
    const out: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    const run = (...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
    writeFileSync(join(spec, 'flow.mmd'), 'flowchart LR\n  cli --> skills');
    await run(
      'diagram',
      'MDO-0001',
      '--stamp',
      '--tool',
      'mermaid',
      '--type',
      'workflow',
      '--mermaid',
      join(spec, 'flow.mmd'),
      '--graph',
      'diagrams/proposed.graph.json',
    );
    await run('diagram-drift', 'MDO-0001');
    expect(JSON.parse(out.at(-1)!)).toMatchObject({
      drift: true,
      missingNodes: ['src/skills'],
      addedNodes: ['src/engine'],
      implemented: 'diagrams/implemented.graph.json',
    });
    // The spec's commit touched src/cli and src/engine; the design proposed src/cli and src/skills.
    const built = JSON.parse(readFileSync(join(spec, 'diagrams/implemented.graph.json'), 'utf8'));
    expect(built.nodes.map((n: { id: string }) => n.id)).toEqual(['src/cli', 'src/engine']);
    vi.restoreAllMocks();
  });
});

describe('Kaizen shows the sessions (MDO-0008 S-3.1)', () => {
  // Synthetic session: T1 committed at minute 2.5, implement recorded at 4.5, verify at 6.5, close at 9.5.
  const T0 = Date.parse('2026-01-05T10:00:00.000Z');
  const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();
  const usage = { input_tokens: 2, cache_read_input_tokens: 1000, cache_creation_input_tokens: 10, output_tokens: 5 };
  const reply = (id: string, minutes: number) =>
    JSON.stringify({ type: 'assistant', timestamp: at(minutes), message: { id, model: 'claude-opus-5-5', usage } });
  const prompt = (minutes: number) =>
    JSON.stringify({ type: 'user', timestamp: at(minutes), message: { role: 'user', content: 'synthetic prompt' } });
  const record = (command: string, minutes: number, session: string) =>
    `  - at: ${at(minutes)}\n    command: ${command}\n    harness: claude\n    session: ${session}\n    usd: 0.5\n    source: claude-code\n`;
  const transcript = [
    prompt(0),
    reply('a1', 0.5),
    reply('a2', 1.5),
    reply('a3', 2.0),
    reply('a4', 3.5),
    reply('a5', 4.0),
    prompt(5), // 1 minute after a5
    reply('b1', 5.5),
    reply('b2', 6.0),
    prompt(7), // 1 minute after b2
    reply('c1', 8.0),
    reply('c2', 9.0),
  ].join('\n');

  test('mandao run kaizen has sessions: pauses, turns per task, verify, close, after tasks and the missing sessions', async () => {
    const { buildProgram } = await import('../../src/cli/program.js');
    const { writeYaml } = await import('../../src/engine/files.js');
    vi.stubEnv('CLAUDE_CONFIG_DIR', makeTree({ 'projects/-synthetic-repo/sess-one.jsonl': transcript }));
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    initTestRepo(root, '-q', '-b', 'main');
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'p', path: '.' }],
      harnesses: ['claude'],
    });
    const spec = join(root, 'specs/MDO-0001-skills-list');
    cpSync(join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list'), spec, { recursive: true });
    mkdirSync(join(spec, '_log'), { recursive: true });
    writeFileSync(
      join(spec, '_log/costs.yml'),
      `costs:\n${record('specify', 0, 'sess-gone')}${record('implement', 4.5, 'sess-one')}${record('verify', 6.5, 'sess-one')}${record('close', 9.5, 'sess-one')}`,
    );
    git(root, 'add', '.');
    commit(root, 'src.ts', '✨ feat(cli): add x\n\nRefs: MDO-0001\nMandao-Task: T1', at(2.5));
    const out: string[] = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'kaizen', 'MDO-0001']);
    vi.restoreAllMocks();
    expect(JSON.parse(out.at(-1)!).sessions).toMatchObject({
      missing: ['sess-gone'],
      pauses: { count: 2, medianMinutes: 1, atMost5: 2, between5And60: 0, over60: 0 },
      tasks: { T1: 3 },
      verify: 2,
      close: 2,
      afterTasks: 6,
    });
  });

  test('after mandao sync the close command carries the step and the Kaizen template has a Sessions section', async () => {
    const { syncProject } = await import('../../src/engine/sync.js');
    const { writeYaml } = await import('../../src/engine/files.js');
    vi.stubEnv('MANDAO_HOME', makeTree({}));
    const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'shop', path: '.' }],
      harnesses: ['claude'],
    });
    syncProject(root);
    const closeCommand = readFileSync(join(root, '.claude/skills/mandao-close/SKILL.md'), 'utf8');
    expect(closeCommand).toContain('## Sessions');
    expect(closeCommand).toMatch(/sessions/);
    expect(readFileSync(join(root, '.mandao/templates/app/close/kaizen.md'), 'utf8')).toContain('## Sessions');
  });
});

describe('a version 2 close is one document inside the spec (MDO-0011 AC-4)', () => {
  useLogEnv();
  const PO = 'Ya puedes ver tus habilidades fijadas.\n';
  const DEV = 'The `skills list` command reads the lock.\n';
  const seed = (root: string) => {
    const file = join(root, V2_SPEC, 'close-summary.md');
    writeFileSync(
      file,
      `---\nschema_version: 1\nspec: MDO-0001-skills-list\napplied: []\n---\n\n# Close — MDO-0001-skills-list\n\n## Outcome\n\nstale\n\n## For the PO\n\n${PO}\n## For developers\n\n${DEV}\n## Kaizen\n\nOne lesson.\n\n## Delivery\n\nstale\n`,
    );
    return file;
  };
  const sections = (text: string): Record<string, string> =>
    Object.fromEntries(
      text
        .split(/^## /m)
        .slice(1)
        .map((s) => [s.split('\n')[0], s.split('\n').slice(1).join('\n')]),
    );
  const changelogLines = (root: string) =>
    readFileSync(join(root, 'docs/CHANGELOG.md'), 'utf8')
      .split('\n')
      .filter((l) => l.includes('MDO-0001'));

  test('S-4.1: the summary has the five sections, CHANGELOG has one line, and no per-spec release or kaizen document exists', async () => {
    const root = repo(2);
    const file = seed(root);
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    const text = readFileSync(file, 'utf8');
    expect([...text.matchAll(/^## (.+)$/gm)].map((m) => m[1])).toEqual(['Outcome', 'For the PO', 'For developers', 'Kaizen', 'Delivery']);
    expect(sections(text).Outcome).toContain('AC-1');
    const lines = changelogLines(root);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain('List the skills pinned in a workspace');
    expect(lines[0]).toContain('story');
    expect(lines[0]).toContain('[spec](../specs/MDO-0001-skills-list/)');
    expect(existsSync(join(root, 'docs/releases/MDO-0001'))).toBe(false);
    expect(existsSync(join(root, 'docs/kaizen/MDO-0001.md'))).toBe(false);
  });

  test('S-4.1/C2: the summary points to no docs/releases or docs/kaizen file', async () => {
    const root = repo(2);
    const file = seed(root);
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    expect(readFileSync(file, 'utf8')).not.toMatch(/docs\/releases|docs\/kaizen\/MDO-0001/);
    expect(changelogLines(root)).toHaveLength(1);
  });

  test('S-4.3: with no environment and no publication, no `—` field and no empty section is written', async () => {
    const root = repo(2);
    const file = seed(root);
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    const text = readFileSync(file, 'utf8');
    expect(text).not.toMatch(/:\s*—/);
    expect(text).not.toMatch(/^- Release:|^- Environments:|^- Published:/m);
    for (const [name, body] of Object.entries(sections(text))) expect(body.trim(), name).not.toBe('');
  });

  test('S-4.4: the lead written between the title and Outcome survives a first and a second --closed', async () => {
    const root = repo(2);
    const file = seed(root);
    const LEAD = 'Two lines of lead\nwritten by the agent.\n';
    writeFileSync(file, readFileSync(file, 'utf8').replace('## Outcome', `${LEAD}\n## Outcome`));
    for (const _ of [1, 2]) {
      await run(root, 'close-summary', 'MDO-0001', '--closed');
      const text = readFileSync(file, 'utf8');
      expect(text.slice(text.indexOf('# Close'), text.indexOf('## Outcome'))).toContain(LEAD);
    }
  });

  test('S-4.4: a second --closed keeps For the PO byte-identical and CHANGELOG with a single line', async () => {
    const root = repo(2);
    const file = seed(root);
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    const first = readFileSync(file, 'utf8');
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    const second = readFileSync(file, 'utf8');
    expect(sections(second)['For the PO']).toBe(`\n${PO}\n`);
    expect(sections(second)['For the PO']).toBe(sections(first)['For the PO']);
    expect(sections(second)['For developers']).toBe(sections(first)['For developers']);
    expect(changelogLines(root)).toHaveLength(1);
  });

  test('phase 18: an accepted vulnerability is carried to Delivery and to the record; a revoked one is not', async () => {
    const root = repo(2);
    const file = seed(root);
    const accept = (pkgName: string, id: string) =>
      buildProgram(() => root).parseAsync([
        'node',
        'mandao',
        'approve',
        'MDO-0001',
        'vulnerability',
        '--package',
        pkgName,
        '--id',
        id,
        '--reason',
        'fastembed never decodes images',
        '--review',
        'when fastembed is upgraded',
      ]);
    await accept('pillow 12.3.0', 'PYSEC-2026-1');
    await accept('tqdm 4.66', 'GHSA-xxxx');
    await buildProgram(() => root).parseAsync([
      'node',
      'mandao',
      'approve',
      'MDO-0001',
      'vulnerability',
      '--revoke',
      '--reason',
      'upgraded',
    ]);
    await run(root, 'close-summary', 'MDO-0001', '--closed');
    const text = readFileSync(file, 'utf8');
    expect(sections(text).Delivery).toContain(
      '- Accepted risk: pillow 12.3.0 PYSEC-2026-1 — fastembed never decodes images (review: when fastembed is upgraded)',
    );
    expect(sections(text).Delivery).not.toContain('GHSA-xxxx');
    expect(parseCloseSummary(text, 'MDO-0001-skills-list').accepted_risks).toEqual([
      { package: 'pillow 12.3.0', id: 'PYSEC-2026-1', reason: 'fastembed never decodes images', review: 'when fastembed is upgraded' },
    ]);
  });

  test('AC-4: publish-plan for a version 2 spec posts For the PO from close-summary.md, with no docs/releases', async () => {
    const root = repo(2);
    seed(root);
    const plan = await run(root, 'publish-plan', 'MDO-0001', '--target', 'jira:PROJ-1');
    expect(plan.payload.text).toContain('Ya puedes ver tus habilidades fijadas.');
    expect(plan.payload.text).not.toContain('reads the lock');
    expect(existsSync(join(root, 'docs/releases/MDO-0001'))).toBe(false);
  });
});
