// mandao-scans: none — lists only the temporary trees it creates.
import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { stringify as stringifyYaml } from 'yaml';
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
const parsed = (root: string) => parseApprovals(readFileSync(logPath(join(root, SPEC), 'approvals.yml'), 'utf8'));
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

  test('design approval blocks an uncovered research marker without changing document status', async () => {
    const root = repo();
    const file = join(root, SPEC, 'requirements.md');
    writeFileSync(file, `${readFileSync(file, 'utf8')}\n[NEEDS RESEARCH: api / Auth.js sessions] Which API is supported?\n`);
    const result = await approve(root, 'MDO-0001', 'design');
    expect(result).toMatchObject({ approved: false, problems: [expect.stringContaining('research question is not recorded')] });
    expect(status(root, 'requirements.md')).toBe('draft');
  });

  test('design approval records the research document hash when it exists', async () => {
    const root = repo();
    writeFileSync(join(root, SPEC, 'research.md'), '---\nschema_version: 1\nentries: []\n---\n# Research\n');
    const result = await approve(root, 'MDO-0001', 'design');
    expect(result.approved).toBe(true);
    expect(parsed(root).at(-1)?.sha256).toMatchObject({ 'research.md': expect.stringMatching(/^sha256-/) });
  });

  test('design approval discovers search MCP configuration from the workspace root', async () => {
    const root = repo();
    const marker = '[NEEDS RESEARCH: architecture / Auth boundary] Is the auth boundary adequate?';
    const requirements = join(root, SPEC, 'requirements.md');
    writeFileSync(requirements, `${readFileSync(requirements, 'utf8')}\n${marker}\n`);
    writeFileSync(join(root, '.mcp.json'), JSON.stringify({ mcpServers: { web_search: { url: 'https://search.example/mcp' } } }));
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'mandao', path: '.' }],
      harnesses: ['claude'],
      research: { web_search_servers: ['claude:.mcp.json:web_search'] },
    });
    const research = {
      schema_version: 1,
      entries: [
        {
          id: 'R1',
          topic: 'Auth boundary',
          topic_type: 'architecture',
          question: 'Is the auth boundary adequate?',
          status: 'resolved',
          decision: 'Keep authorization in the service layer.',
          rationale: 'The app uses service-owned authorization.',
          alternatives: ['Authorize in the route'],
          premise_ids: [],
          checked_on: '2026-10-22',
          expires: '2027-10-22',
          claims: [
            {
              id: 'C1',
              key: 'authorization-layer',
              kind: 'general',
              value: 'service',
              sources: [{ tier: 'official', value: 'service', url: 'https://docs.example/auth', checked_on: '2026-10-22' }],
            },
          ],
          contradictions: [],
        },
      ],
    };
    writeFileSync(join(root, SPEC, 'research.md'), `---\n${stringifyYaml(research)}---\n`);
    const result = await approve(root, 'MDO-0001', 'design');
    expect(result.approved, JSON.stringify(result)).toBe(true);
    const otherHarness = await approve(root, 'MDO-0001', 'design', '--harness', 'copilot');
    expect(otherHarness).toMatchObject({
      approved: false,
      problems: [expect.stringContaining('high-impact decisions cannot rely on model knowledge')],
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

const run = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};

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
