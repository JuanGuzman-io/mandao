import { execFileSync } from 'node:child_process';
import { appendFileSync, chmodSync, cpSync, existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { checkReview } from '../../src/cli/checkpoint-guards.js';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { readSpec } from '../../src/scripts/spec.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { initTestRepo, makeTree, pkg, reviewFile } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  vi.spyOn(process.stderr, 'write').mockImplementation(() => true);
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

function repo(harnesses = ['claude']) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop'), 'src/cli/skills.ts': 'export {};\n' }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [
      {
        name: 'mandao',
        path: '.',
        gates: {
          lint: 'node -e "process.exit(0)"',
          typecheck: 'node -e "console.log(\'src/cli/skills.ts(1,1): error TS2304\'); process.exit(2)"',
          secrets: 'mandao-no-such-scanner detect',
        },
        tests: { impacted: 'node -e "process.exit(0)" {files}' },
      },
    ],
    harnesses,
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  writeFileSync(join(root, 'src/cli/skills.ts'), 'export const list = () => [];\n');
  return root;
}
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('Leader scripts', () => {
  test('script output is compact JSON unless MANDAO_JSON=pretty', async () => {
    const root = repo();
    await run(root, 'tasks', 'MDO-0001');
    expect(out.at(-1)).not.toContain('\n');
    vi.stubEnv('MANDAO_JSON', 'pretty');
    await run(root, 'tasks', 'MDO-0001');
    expect(out.at(-1)).toContain('\n  ');
  });

  test('gates: pass/fail per gate and the failure excerpt; a missing tool is NOT_INSTALLED; the full output stays in the log', async () => {
    const root = repo();
    const r = await run(root, 'gates', 'MDO-0001', 'T2');
    expect(process.exitCode).toBe(1);
    const by = Object.fromEntries(r.results.map((g: { gate: string }) => [g.gate, g]));
    expect(by.lint).toEqual({ gate: 'lint', status: 'PASS', exitCode: 0 });
    expect(by.typecheck).toMatchObject({ status: 'FAIL', exitCode: 2, excerpt: expect.stringContaining('error TS2304') });
    expect(by.test).toMatchObject({ status: 'PASS' });
    expect(by.secrets).toMatchObject({ status: 'NOT_INSTALLED' });
    expect(by.audit).toMatchObject({ status: 'SKIPPED', reason: 'no dependency change' });
    expect(r).toMatchObject({ passed: false, notConfigured: ['format', 'build', 'sast', 'metrics'] });
    expect(by.lint.excerpt).toBeUndefined();
    expect(by['scan-markers']).toBeUndefined(); // no test changed
    const log = readFileSync(join(logPath(join(root, SPEC), 'gates'), 'T2-1.md'), 'utf8');
    expect(log).toContain('| typecheck | FAIL | 2 |');
    expect(log).toContain('error TS2304');
  });

  test('step: the checkpoint, the next action and the brief in one call; the brief only when delegating', async () => {
    const root = repo();
    const first = await run(
      root,
      'step',
      'MDO-0001',
      'T2',
      '--harness',
      'claude',
      '--verdict',
      'STARTED',
      '--tier',
      'standard',
      '--phase',
      'implementing',
    );
    expect(first.checkpoint).toMatchObject({ written: true });
    expect(first.loop).toMatchObject({ task: 'T2', action: 'write-red-tests' });
    expect(first.brief).toMatchObject({ task: expect.objectContaining({ id: 'T2' }) });
    const lean = await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief');
    expect(lean.checkpoint).toBeUndefined();
    expect(lean.brief).toBeUndefined();
    const review = await run(
      root,
      'step',
      'MDO-0001',
      'T2',
      '--harness',
      'claude',
      '--verdict',
      'REPORTED',
      '--implementer',
      'mandao-implementer-standard',
    );
    expect(review.loop.action).toBe('review');
    expect(review.brief).toBeUndefined();
  });

  test('review-pack: brief, gate table and diff in one file for the Reviewer, without the full gate output', async () => {
    const root = repo();
    await run(root, 'gates', 'MDO-0001', 'T2');
    const r = await run(root, 'review-pack', 'MDO-0001', 'T2');
    expect(r).toMatchObject({ gatesRecorded: true });
    const pack = readFileSync(join(root, r.pack), 'utf8');
    expect(pack).toContain('## Brief');
    expect(pack).toContain('## Mandao change manifest');
    expect(pack).toContain('"path": "src/cli/skills.ts"');
    expect(pack).toContain('| typecheck | FAIL | 2 |');
    expect(pack).toContain('+export const list = () => [];');
    expect(pack).not.toContain('### typecheck — FAIL'); // the output blocks stay in the gates log
    writeFileSync(join(root, 'src/cli/skills.ts'), 'export const list = () => ["changed after pack"] as const;\n');
    expect(() => checkReview(readSpec(join(root, SPEC)), { task: 'T2', verdict: 'PASS', review: reviewFile('PASS') }, root)).toThrow(
      /working tree changed after the review pack was generated/,
    );
  });

  test('cross-harness review stores malformed output and records FAIL; open critical security findings override PASS', async () => {
    const root = repo(['claude', 'codex']);
    writeYaml(join(root, '.mandao/models.yml'), { schema_version: 1, mode: 'routed', harnesses: {} });
    const bin = realpathSync(makeTree({ codex: '#!/bin/sh\ncat >/dev/null\nprintf "%s\\n" "$MOCK_REVIEW"\n' }));
    chmodSync(join(bin, 'codex'), 0o755);
    vi.stubEnv('PATH', `${bin}:${process.env.PATH}`);
    vi.stubEnv('MOCK_REVIEW', 'VERDICT: PASS');
    const gates = join(root, '.mandao/gates.md');
    const brief = join(root, '.mandao/brief.json');
    writeFileSync(gates, 'All gates pass.');
    writeFileSync(brief, JSON.stringify({ task: 'T2' }));

    const malformed = await run(root, 'review', 'MDO-0001', 'T2', '--via', 'codex', '--gates', gates, '--brief', brief);
    expect(malformed).toMatchObject({ verdict: 'FAIL', recorded: true, reviewIssue: 'missing or invalid Findings (JSON) payload' });
    expect(readFileSync(join(root, malformed.review), 'utf8')).toContain('VERDICT: PASS');
    expect(readFileSync(join(root, SPEC, 'execution.md'), 'utf8')).toContain(
      'FAIL: review rejected: missing or invalid Findings (JSON) payload',
    );

    const payload = {
      version: 1,
      findings: [
        {
          id: 'F1',
          status: 'open',
          severity: 'critical',
          lens: 'security',
          title: 'Unsafe shell input',
          file: 'src/run.ts',
          line: 1,
          evidence: 'Input reaches exec.',
        },
      ],
    };
    vi.stubEnv('MOCK_REVIEW', `VERDICT: PASS\n\n## Findings (JSON)\n\n\`\`\`json\n${JSON.stringify(payload)}\n\`\`\``);
    const blocked = await run(root, 'review', 'MDO-0001', 'T2', '--via', 'codex', '--gates', gates, '--brief', brief);
    expect(blocked).toMatchObject({ verdict: 'FAIL', recorded: true, securityBlockers: ['F1: Unsafe shell input (src/run.ts:1)'] });
    expect(readFileSync(join(root, blocked.review), 'utf8')).toContain('Unsafe shell input');

    // Phase 11: an approving review records what the Reviewer was shown, for the commit brake.
    vi.stubEnv('MOCK_REVIEW', 'VERDICT: PASS\n\n## Findings (JSON)\n\n```json\n{"version":1,"findings":[]}\n```');
    const passed = await run(root, 'review', 'MDO-0001', 'T2', '--via', 'codex', '--gates', gates, '--brief', brief);
    expect(passed).toMatchObject({ verdict: 'PASS', recorded: true });
    const manifests = readSpec(join(root, SPEC)).progress!.approved_manifests;
    expect(manifests.at(-1)!.reviewed).toContain('src/cli/skills.ts');
    expect(manifests.at(-1)!.receipts).toEqual([]);
  });

  test('implement-summary: verdicts, FAIL reasons and identities from the log', async () => {
    const root = repo();
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      '--harness',
      'claude',
      '--verdict',
      'FAIL',
      '--reviewer',
      'mandao-reviewer',
      '--reason',
      'the hint is missing',
      '--review',
      reviewFile('FAIL', '- [core/high] src/cli/skills.ts:1 the hint is missing'),
    );
    const s = await run(root, 'implement-summary', 'MDO-0001');
    const t2 = s.tasks.find((t: { id: string }) => t.id === 'T2');
    expect(t2).toMatchObject({ verdict: 'FAIL', fails: ['the hint is missing'], committed: false });
    expect(s.totals).toMatchObject({ tasks: 2, fails: 1 });
  });
  test('MDO-0007: rows without --tier take the task tier, and advisories in row notes are counted', async () => {
    const root = repo();
    const reviewer = ['--harness', 'claude', '--reviewer', 'mandao-reviewer'];
    await run(root, 'checkpoint', 'MDO-0001', '--task', 'T2', '--harness', 'claude', '--verdict', 'REPORTED');
    await run(root, 'review-pack', 'MDO-0001', 'T2');
    await run(
      root,
      'checkpoint',
      'MDO-0001',
      '--task',
      'T2',
      ...reviewer,
      '--verdict',
      'PASS',
      '--review',
      reviewFile('PASS'),
      '--notes',
      'Advisories: (1) a. (2) b.',
    );
    const log = readFileSync(logPath(join(root, SPEC), 'execution.md'), 'utf8');
    const rows = log.split('\n').filter((l) => l.startsWith('| ') && l.includes('| T2 |'));
    expect(rows.slice(-2).map((l) => l.split('|')[4]!.trim())).toEqual(['standard', 'standard']);
    expect((await run(root, 'implement-summary', 'MDO-0001')).advisories).toBe(2);
  });

  test('MDO-0007: run tests refuses the full suite without --full, and --full without --reason', async () => {
    const root = repo();
    await expect(run(root, 'tests', 'mandao')).rejects.toThrow(/full suite runs in CI/);
    await expect(run(root, 'tests', 'mandao', '--full')).rejects.toThrow(/--full needs --reason/);
    await expect(run(root, 'tests', 'mandao', '--full', '--reason', '  ')).rejects.toThrow(/--full needs --reason/);
    expect(await run(root, 'tests', 'mandao', '--full', '--reason', 'CI is down')).toMatchObject({ impact: 'full suite' });
    expect(readFileSync(logPath(join(root, SPEC), 'full-runs.md'), 'utf8')).toMatch(/· mandao · \w+ · CI is down/);
  });
  test('S-3.1 (flow.chain off): approve in Claude Code advises /clear, then the next command, with the worktree command as the fallback', async () => {
    const root = repo();
    appendFileSync(join(root, '.mandao/config.yml'), 'flow:\n  chain: false\n');
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'approve-session');
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec']);
    // ASSUMPTION: the advice shape { action, then, fallback } (spec D4) replaces approve's `newSession` string.
    expect(JSON.parse(out.at(-1)!).newSession).toEqual({
      action: '/clear',
      then: '/mandao-implement MDO-0001',
      fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
    });
  });

  test('S-3.1 (flow.chain off): the active harness (--harness), not config.harnesses[0], picks the action', async () => {
    const root = repo();
    appendFileSync(join(root, '.mandao/config.yml'), 'flow:\n  chain: false\n');
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec', '--harness', 'codex']);
    expect(JSON.parse(out.at(-1)!).newSession).toMatchObject({ action: '/new' });
  });

  test('S-3.1: implement-summary in Claude Code carries the same advice with the verify command', async () => {
    const root = repo();
    const session = 'cut-session-2';
    const usage = (read: number, write: number) => ({
      input_tokens: 0,
      cache_read_input_tokens: read,
      cache_creation_input_tokens: write,
      cache_creation: { ephemeral_1h_input_tokens: write },
    });
    const turn = (id: string, read: number, write: number) =>
      JSON.stringify({ timestamp: new Date().toISOString(), message: { id, model: 'claude-opus-5-5', usage: usage(read, write) } });
    const home = makeTree({ [`projects/x/${session}.jsonl`]: `${turn('a', 0, 34_000)}\n${turn('b', 34_000, 126_000)}\n` });
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', session);
    const summary = await run(root, 'implement-summary', 'MDO-0001');
    expect(summary.session).toMatchObject({
      cut: true,
      advice: { action: '/clear', then: '/mandao-verify MDO-0001', fallback: expect.stringContaining('"/mandao-verify MDO-0001"') },
    });
  });

  test('FR-3/D4: step that stops to suggest a cut carries session.advice for the harness (/clear, then the next command)', async () => {
    const root = repo();
    // A lower threshold than the 0.65 the fixture saves, so the rule says stop.
    const cfg = join(root, '.mandao/config.yml');
    writeFileSync(cfg, `${readFileSync(cfg, 'utf8')}\nsession:\n  cut_min_savings: 0.5\n`);
    const session = 'cut-session-stop';
    const usage = (read: number, write: number) => ({
      input_tokens: 0,
      cache_read_input_tokens: read,
      cache_creation_input_tokens: write,
      cache_creation: { ephemeral_1h_input_tokens: write },
    });
    const turn = (id: string, read: number, write: number) =>
      JSON.stringify({ timestamp: new Date().toISOString(), message: { id, model: 'claude-opus-5-5', usage: usage(read, write) } });
    const home = makeTree({ [`projects/x/${session}.jsonl`]: `${turn('a', 0, 34_000)}\n${turn('b', 34_000, 126_000)}\n` });
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', session);
    const step = await run(root, 'step', 'MDO-0001', 'T2', '--harness', 'claude', '--no-brief');
    expect(step.session.stop).toBe(true);
    expect(step.session.advice).toEqual({
      action: '/clear',
      then: '/mandao-implement MDO-0001',
      fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
    });
  });

  test('one active-harness rule: approve --harness bogus is rejected like run --harness bogus, and approves nothing', async () => {
    const root = repo();
    await expect(
      buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec', '--harness', 'bogus']),
    ).rejects.toThrow(/Unknown harness/);
    expect(existsSync(logPath(join(root, SPEC), 'approvals.yml'))).toBe(false);
  });

  test('one active-harness rule: with no --harness and no session id the default is the run default (claude), not config.harnesses[0]', async () => {
    const root = repo();
    const cfg = join(root, '.mandao/config.yml');
    writeFileSync(cfg, readFileSync(cfg, 'utf8').replace(/harnesses:\n\s*- claude/, 'harnesses:\n  - codex\n  - claude'));
    appendFileSync(cfg, 'flow:\n  chain: false\n');
    expect(readFileSync(cfg, 'utf8')).toMatch(/- codex\n\s*- claude/);
    vi.stubEnv('CLAUDE_CODE_SESSION_ID', 'x');
    delete process.env.CLAUDE_CODE_SESSION_ID; // unstubAllEnvs restores the original value
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', 'MDO-0001', 'spec']);
    expect(JSON.parse(out.at(-1)!).newSession).toMatchObject({ action: '/clear' });
  });

  test('MDO-0007: the scan-markers gate fails a changed test that lists folders without saying what it scans', async () => {
    const root = repo();
    writeFileSync(join(root, 'src/cli/skills.test.ts'), "import { readdirSync } from 'node:fs';\nreaddirSync('src');\n");
    const r = await run(root, 'gates', 'MDO-0001', 'T2');
    const gate = r.results.find((g: { gate: string }) => g.gate === 'scan-markers');
    expect(gate).toMatchObject({ status: 'FAIL', excerpt: expect.stringContaining('src/cli/skills.test.ts:2 lists folders') });
    writeFileSync(
      join(root, 'src/cli/skills.test.ts'),
      "// mandao-scans: src/\nimport { readdirSync } from 'node:fs';\nreaddirSync('src');\n",
    );
    const again = await run(root, 'gates', 'MDO-0001', 'T2');
    expect(again.results.find((g: { gate: string }) => g.gate === 'scan-markers')).toEqual({ gate: 'scan-markers', status: 'PASS' });
  });
});
