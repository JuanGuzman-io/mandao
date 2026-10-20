import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { logPath } from '../../src/scripts/spec-log.js';
import { parsePremises, premiseFindings } from '../../src/spec/index.js';
import { makeTree, pkg } from '../helpers.js';

const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const SPEC = 'specs/MDO-0001-skills-list';
const git = (cwd: string, ...args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
let out: string[];

const ledger = `---
schema_version: 1
spec: MDO-0001-skills-list
status: draft
---

# Design — skills list

Reads the lock.

## Decisions

## Premise Ledger

<a id="p1"></a>
### P1 — The lock lists every pinned skill (High)

- **If false:** the command misses skills.

<a id="p2"></a>
### P2 — The catalog is not needed (High)

- **Evidence:** UNVERIFIED — confirm at source before relying on it.

### P3 — Output fits one screen (Low)

## Evidence
`;

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

function repo() {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  git(root, 'init', '-q', '-b', 'feat/MDO-0001-skills-list');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'mandao', path: '.' }],
    harnesses: ['claude'],
  });
  syncProject(root);
  cpSync(fixture, join(root, SPEC), { recursive: true });
  writeFileSync(join(root, SPEC, 'design.md'), ledger);
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}
const cli = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
  return JSON.parse(out.at(-1)!);
};

describe('premises are verified only by a recorded run', () => {
  test('both ledger layouts parse; only an unrecorded High premise without UNVERIFIED is a finding', () => {
    expect(parsePremises(ledger).map((p) => [p.id, p.impact, p.unverified])).toEqual([
      ['P1', 'High', false],
      ['P2', 'High', true],
      ['P3', 'Low', false],
    ]);
    const table =
      '## Premise Ledger\n\n| # | Claim | Evidence | If false | Impact |\n|---|---|---|---|---|\n| P1 | x | read at abc | y | High |\n| P2 | z | UNVERIFIED | w | High |\n';
    expect(premiseFindings(table, new Set()).map((f) => f.ref)).toEqual(['P1']);
    expect(premiseFindings(ledger, new Set(['P1']))).toEqual([]);
  });

  test('trace reports PREMISE_UNPROVEN and approve design refuses until the run is recorded', async () => {
    const root = repo();
    const premiseOnly = (f: { type: string }[]) => f.filter((x) => x.type === 'PREMISE_UNPROVEN');
    expect(premiseOnly((await cli(root, 'run', 'trace', 'MDO-0001')).findings)).toEqual([expect.objectContaining({ ref: 'P1' })]);
    expect(await cli(root, 'approve', 'MDO-0001', 'design')).toMatchObject({
      approved: false,
      problems: [expect.stringMatching(/^P1 is High impact/)],
    });
    process.exitCode = undefined;
    const run = await cli(root, 'run', 'premise', 'MDO-0001', 'P1', '--', 'node', '-e', '"console.log(\'pinned: 2\')"');
    expect(run).toMatchObject({ premise: 'P1', recorded: true, exitCode: 0, excerpt: 'pinned: 2' });
    const record = readFileSync(join(logPath(join(root, SPEC), 'premises'), 'P1.md'), 'utf8');
    expect(record).toMatch(/- Command: `node -e "console.log\('pinned: 2'\)"`/);
    expect(premiseOnly((await cli(root, 'run', 'trace', 'MDO-0001')).findings)).toEqual([]);
  });

  test('a premise that is not in the ledger is refused', async () => {
    await expect(cli(repo(), 'run', 'premise', 'MDO-0001', 'P9', 'true')).rejects.toThrow(/P9 is not in the Premise Ledger/);
  });
});
