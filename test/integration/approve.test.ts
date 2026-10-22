// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { activeApprovals, parseApprovals, withStatus } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
let out: string[];

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  for (const k of ['GIT_AUTHOR_NAME', 'GIT_COMMITTER_NAME']) vi.stubEnv(k, 'test');
  for (const k of ['GIT_AUTHOR_EMAIL', 'GIT_COMMITTER_EMAIL']) vi.stubEnv(k, 'test@example.com');
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

/** The fixture with its documents back in draft, committed on the spec branch. */
function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'feat/MDO-0001-skills-list');
  git(root, 'config', 'user.name', 'Ana PO');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  for (const f of ['story.md', 'requirements.md', 'tasks.md']) {
    const file = join(root, SPEC, f);
    writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'draft'));
  }
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const approve = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'approve', ...args]);
  return JSON.parse(out.at(-1)!);
};
const status = (root: string, f: string) => /^status:\s*(\S+)/m.exec(readFileSync(join(root, SPEC, f), 'utf8'))?.[1];

describe('mandao approve: no model session', () => {
  test('design: statuses approved, who and when recorded, the specify commit made with its fixed subject', async () => {
    const root = repo();
    const r = await approve(root, 'MDO-0001', 'design');
    expect(r).toMatchObject({
      approved: true,
      step: 'design',
      by: 'Ana PO',
      commit: { committed: true },
      next: { recommended: { command: '/mandao-tasks' } },
    });
    expect(r.newSession).toBeUndefined();
    expect(status(root, 'story.md')).toBe('approved');
    expect(status(root, 'requirements.md')).toBe('approved');
    expect(git(root, 'log', '-1', '--format=%s')).toBe('📝 docs(mandao): approve the MDO-0001 requirements and design');
    const log = parseApprovals(readFileSync(logPath(join(root, SPEC), 'approvals.yml'), 'utf8'));
    expect(log).toEqual([expect.objectContaining({ step: 'design', by: 'Ana PO', at: expect.any(String) })]);
  });

  test('design approval re-records the hash of story.md even when the story was already approved', async () => {
    const root = repo();
    await approve(root, 'MDO-0001', 'story');
    const result = await approve(root, 'MDO-0001', 'design');
    expect(result.approved).toBe(true);
    expect(parsed(root).at(-1)).toMatchObject({
      step: 'design',
      sha256: {
        'story.md': expect.stringMatching(/^sha256-/),
        'requirements.md': expect.stringMatching(/^sha256-/),
      },
    });
  });

  test('revocation records an append-only event, resets status, and makes the approval inactive', async () => {
    const root = repo();
    await approve(root, 'MDO-0001', 'story');
    const result = await approve(root, 'MDO-0001', 'story', '--revoke', '--reason', 'the product scope changed');
    expect(result).toMatchObject({ revoked: true, step: 'story', reason: 'the product scope changed' });
    expect(status(root, 'story.md')).toBe('draft');
    const history = parsed(root);
    expect(history.map((row) => row.step)).toEqual(['story', 'revocation']);
    expect(activeApprovals(history).map((row) => row.step)).toEqual([]);
  });

  test('annulment appends a reasoned event rather than deleting the target row', async () => {
    const root = repo();
    await run(root, 'next', 'MDO-0001', '--shown');
    const shown = parsed(root).find((row) => row.step === 'shown')!;
    const result = await approve(root, 'MDO-0001', 'story', '--annul', shown.at, '--reason', 'the summary was incomplete');
    expect(result).toMatchObject({ annulled: true, target: shown.at });
    const history = parsed(root);
    expect(history).toHaveLength(2);
    expect(history[0]).toEqual(shown);
    expect(activeApprovals(history)).toEqual([]);
  });

  test('a lite spec is approved under its own subject (MDO-0007)', async () => {
    const root = repo();
    expect(await approve(root, 'MDO-0001', 'spec')).toMatchObject({
      approved: true,
      commit: { committed: true },
      next: { recommended: { command: '/mandao-implement' } },
      // ADR 0038: implement starts in a new session from the worktree, not in the specify one.
      newSession: {
        action: '/clear',
        then: '/mandao-implement MDO-0001',
        fallback: `cd ${JSON.stringify(root)} && claude "/mandao-implement MDO-0001"`,
      },
    });
    expect(git(root, 'log', '-1', '--format=%s')).toBe('📝 docs(mandao): approve the MDO-0001 spec');
  });

  test('a critical OPEN blocks the approval: nothing changes', async () => {
    const root = repo();
    const file = join(root, SPEC, 'requirements.md');
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n- OPEN(critical, PO): who approves refunds?\n`);
    const r = await approve(root, 'MDO-0001', 'design');
    expect(r).toMatchObject({ approved: false, problems: ['critical OPEN: who approves refunds?'] });
    expect(process.exitCode).toBe(1);
    expect(status(root, 'requirements.md')).toBe('draft');
  });

  test('close records the approved items for the close session to apply, and changes no status', async () => {
    const root = repo();
    const r = await approve(root, 'MDO-0001', 'close', '--items', '1', '3a', '--by', 'Lead');
    expect(r).toMatchObject({ approved: true, step: 'close', by: 'Lead', items: ['1', '3a'], statusChanged: [] });
    expect(r.commit).toBeUndefined();
    expect(status(root, 'story.md')).toBe('draft');
  });

  test('security-gaps approval requires and records its reason without changing spec documents', async () => {
    const root = repo();
    await expect(approve(root, 'MDO-0001', 'security-gaps')).rejects.toThrow(/needs --reason/);
    const result = await approve(
      root,
      'MDO-0001',
      'security-gaps',
      '--reason',
      'CI has no security scanners and release scope cannot wait',
    );
    expect(result).toMatchObject({
      approved: true,
      step: 'security-gaps',
      note: 'CI has no security scanners and release scope cannot wait',
      statusChanged: [],
    });
    expect(parsed(root).at(-1)).toMatchObject({ step: 'security-gaps', note: 'CI has no security scanners and release scope cannot wait' });
  });

  test('an unknown step is refused', async () => {
    await expect(approve(repo(), 'MDO-0001', 'deploy')).rejects.toThrow(
      /step must be one of story, design, spec, tasks, close, budget, security-gaps/,
    );
  });
});

describe('withStatus', () => {
  test('changes only the status value and keeps its comment', () => {
    expect(withStatus('---\nid: X\nstatus: draft           # draft | approved\n---\n# T\nstatus: draft\n', 'approved')).toBe(
      '---\nid: X\nstatus: approved           # draft | approved\n---\n# T\nstatus: draft\n',
    );
  });
});

/**
 * MDO-0010 T1. ASSUMPTIONS (the spec fixes behavior, not field names):
 * - `run next` prints `{ recommended: { command, reason }, options: string[] }`; `approve` returns the same as `next`.
 * - `approve --by-running` prints `result: 'go' | 'ask'`; `ask` carries a `reason` naming the item or document.
 * - the approvals row keeps the text in `note`-like fields: asserted on the row as a whole, plus `words` and `sha256`.
 * - a pending decision is a `**Decision:** pending` line.
 */
const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};
const specDir = (root: string) => join(root, SPEC);
const approvalsFile = (root: string) => logPath(specDir(root), 'approvals.yml');
const readApprovals = (root: string) => (existsSync(approvalsFile(root)) ? readFileSync(approvalsFile(root), 'utf8') : undefined);
const parsed = (root: string) => parseApprovals(readApprovals(root));
const text = (v: unknown) => JSON.stringify(v);

/** The fixture as a lite spec: story.md and spec.md in draft, committed on the spec branch. */
function liteRepo() {
  const root = repo();
  const req = join(specDir(root), 'requirements.md');
  writeFileSync(join(specDir(root), 'spec.md'), readFileSync(req, 'utf8'));
  rmSync(req);
  rmSync(join(specDir(root), 'tasks.md'));
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'lite');
  return root;
}
const append = (root: string, f: string, add: string) => {
  const file = join(specDir(root), f);
  writeFileSync(file, `${readFileSync(file, 'utf8')}\n${add}\n`);
};
/** Every file under the spec folder with its content, to prove a command wrote nothing. */
function snapshot(dir: string, rel = ''): Record<string, string> {
  const files: Record<string, string> = {};
  for (const e of readdirSync(join(dir, rel), { withFileTypes: true })) {
    const r = join(rel, e.name);
    if (e.isDirectory()) Object.assign(files, snapshot(dir, r));
    else files[r] = readFileSync(join(dir, r), 'utf8');
  }
  return files;
}
const approveByRunning = (root: string, ...more: string[]) =>
  approve(root, 'MDO-0001', 'spec', '--by-running', '/mandao-implement', ...more);

describe('mandao approve and run next report the state next step (AC-1)', () => {
  test('S-1.3/C1: approve lists no implement among its options for a draft spec', async () => {
    const root = repo();
    const r = await approve(root, 'MDO-0001', 'story');
    expect(r.approved).toBe(true);
    expect(Array.isArray(r.next.options)).toBe(true);
    expect(r.next.recommended.command).not.toBe('/mandao-implement');
    expect(text(r.next)).not.toContain('/mandao-implement');
  });

  test('S-1.3/C1: run next lists no implement for a spec with a critical OPEN', async () => {
    const root = repo();
    append(root, 'requirements.md', '- OPEN(critical, PO): who approves refunds?');
    const n = await run(root, 'next', 'MDO-0001');
    expect(text(n)).not.toContain('/mandao-implement');
    expect(n.recommended.command).toBeTypeOf('string');
  });

  test('S-1.4: after approve records a hash, a changed spec.md recommends approving again and names spec.md', async () => {
    const root = liteRepo();
    await approve(root, 'MDO-0001', 'spec');
    expect(parsed(root)[0]).toMatchObject({ step: 'spec', sha256: { 'spec.md': expect.stringMatching(/^sha256-/) } });
    expect((await run(root, 'next', 'MDO-0001')).recommended.command).toBe('/mandao-implement');
    append(root, 'spec.md', 'A line added after the approval.');
    const n = await run(root, 'next', 'MDO-0001');
    expect(n.recommended.command).toContain('mandao approve');
    expect(n.recommended.reason).toContain('spec.md');
  });

  test('S-1.6 and S-1.6/C1: plain run next writes nothing: the spec folder is byte-identical, still draft, no approval', async () => {
    const root = liteRepo();
    const before = snapshot(specDir(root));
    const n = await run(root, 'next', 'MDO-0001');
    expect(n.recommended.command).toBeTypeOf('string');
    expect(snapshot(specDir(root))).toEqual(before);
    expect(readApprovals(root)).toBeUndefined();
    expect(status(root, 'story.md')).toBe('draft');
    expect(status(root, 'spec.md')).toBe('draft');
    expect(git(root, 'status', '--porcelain')).toBe('');
  });
});

describe('mandao approve --by-running: running the next command is the approval (AC-5)', () => {
  test('S-5.1: nothing open and the summary shown: approves, records the command, date and person, says go', async () => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    const r = await approveByRunning(root);
    expect(r.result).toBe('go');
    expect(r.approved).toBe(true);
    expect(status(root, 'story.md')).toBe('approved');
    expect(status(root, 'spec.md')).toBe('approved');
    const row = parsed(root)
      .filter((a) => a.step === 'spec')
      .at(-1)!;
    expect(text(row)).toContain('approved by running /mandao-implement');
    expect(row).toMatchObject({ by: 'Ana PO', at: expect.any(String) });
  });

  test.each([
    ['a CONFLICT row', '- CONFLICT(a: the doc, b: the code, decides: tech lead): which one wins?', 'which one wins?'],
    ['a [NEEDS CLARIFICATION]', '- [NEEDS CLARIFICATION]: who may refund an order?', 'who may refund an order?'],
    ['a pending decision', '- **Decision:** pending', 'pending'],
    ['a critical Consistency Check row', '| CC-9 | PREMISE | The refund limit is unknown. | critical | PO | open |', 'refund limit'],
    ['a CONFLICT Consistency Check row', '| CC-9 | CONFLICT | Doc and code disagree. | normal | lead | open |', 'Doc and code disagree'],
    ['an inline CONFLICT', 'CONFLICT(a: the doc, b: the code, decides: tech lead): which one wins?', 'which one wins?'],
  ])('S-5.2 and S-5.2/C1: %s returns ask with the item, the documents stay draft, approvals.yml is unchanged', async (_n, line, item) => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    append(root, 'spec.md', line);
    await run(root, 'next', 'MDO-0001', '--shown');
    const before = readApprovals(root);
    const r = await approveByRunning(root);
    expect(r.result).toBe('ask');
    expect(r.approved).not.toBe(true);
    expect(text(r)).toContain(item);
    expect(status(root, 'story.md')).toBe('draft');
    expect(status(root, 'spec.md')).toBe('draft');
    expect(readApprovals(root)).toBe(before);
  });

  test('S-5.3 and S-5.3/C2: spec.md changed after --shown returns ask naming spec.md and records nothing', async () => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    append(root, 'spec.md', 'A line added after the summary was shown.');
    const before = readApprovals(root);
    const r = await approveByRunning(root);
    expect(r.result).toBe('ask');
    expect(text(r)).toContain('spec.md');
    expect(status(root, 'spec.md')).toBe('draft');
    expect(status(root, 'story.md')).toBe('draft');
    expect(readApprovals(root)).toBe(before);
  });

  test.each([[[]], [['--words', 'apruebo']]])('S-5.4 and S-5.4/C3: a critical OPEN is refused, whatever the answer (%j)', async (words) => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    append(root, 'spec.md', '- OPEN(critical, PO): who approves refunds?');
    const before = readApprovals(root);
    const r = await approveByRunning(root, ...words);
    expect(r).toMatchObject({ approved: false, problems: ['critical OPEN: who approves refunds?'] });
    expect(process.exitCode).toBe(1);
    expect(status(root, 'spec.md')).toBe('draft');
    expect(readApprovals(root)).toBe(before);
  });

  test('S-5.5: the words written next to the command are recorded verbatim, with the command, date and person', async () => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    const r = await approveByRunning(root, '--words', 'apruebo');
    expect(r.result).toBe('go');
    const row = parsed(root)
      .filter((a) => a.step === 'spec')
      .at(-1)!;
    expect(row).toMatchObject({ words: 'apruebo', by: 'Ana PO', at: expect.any(String) });
    expect(text(row)).toContain('/mandao-implement');
  });
});

describe('mandao approve --by-running: more refusals (AC-5)', () => {
  test('S-5.2: a resolved critical Consistency Check row does not ask', async () => {
    const root = liteRepo();
    await run(root, 'next', 'MDO-0001', '--shown');
    append(root, 'spec.md', '| CC-9 | PREMISE | The limit is unknown. | critical | PO | resolved 2026-10-21: PO chose 50 |');
    await run(root, 'next', 'MDO-0001', '--shown');
    expect((await approveByRunning(root)).result).toBe('go');
  });

  test('S-5.4/C3: on the tasks step a critical OPEN in requirements.md is refused and nothing is recorded', async () => {
    const root = repo();
    for (const f of ['story.md', 'requirements.md']) {
      const file = join(specDir(root), f);
      writeFileSync(file, withStatus(readFileSync(file, 'utf8'), 'approved'));
    }
    append(root, 'requirements.md', '- OPEN(critical, PO): who approves refunds?');
    await run(root, 'next', 'MDO-0001', '--shown');
    const before = readApprovals(root);
    const r = await approve(root, 'MDO-0001', 'tasks', '--by-running', '/mandao-implement');
    expect(r).toMatchObject({ approved: false, problems: ['critical OPEN: who approves refunds?'] });
    expect(process.exitCode).toBe(1);
    expect(status(root, 'tasks.md')).toBe('draft');
    expect(readApprovals(root)).toBe(before);
  });
});
