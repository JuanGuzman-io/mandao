import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { blameCommits } from '../../src/cli/run-quick.js';
import { appendQuickLog, type QuickLogEntry } from '../../src/scripts/quick-log.js';
import { initTestRepo, makeTree } from '../helpers.js';

/** Phase 20: a quick-log row cannot hold its own commit; the next row fills it from git. */
const entry = (name: string): QuickLogEntry => ({
  date: '2026-10-27',
  name,
  project: 'app',
  files: [{ path: 'a.ts', added: 1, deleted: 0 }],
  gates: 'lint pass',
  verdict: 'PASS',
  reviewer: { harness: 'claude', agent: 'self', model: 'self', source: 'self' },
});

test('a row says pending until the next quick-log, which fills it with the commit that added it', () => {
  const root = makeTree({ 'README.md': 'x\n' });
  initTestRepo(root);
  const specs = join(root, 'specs');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();

  const file = appendQuickLog(specs, entry('first'), blameCommits);
  expect(readFileSync(file, 'utf8')).toMatch(/\| first \|.*\| pending \|$/m);
  git('add', '-A');
  git('commit', '-qm', 'first quick');
  const first = git('rev-parse', '--short=7', 'HEAD');

  appendQuickLog(specs, entry('second'), blameCommits);
  const text = readFileSync(file, 'utf8');
  expect(text).toMatch(new RegExp(`\\| first \\|.*\\| ${first} \\|$`, 'm'));
  expect(text).toMatch(/\| second \|.*\| pending \|$/m);
});

test('a row written before phase 20 ("this commit") is filled the same way; an uncommitted one stays', () => {
  const root = makeTree({});
  initTestRepo(root);
  const file = join(root, 'specs/quick/quick-log.md');
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim();
  appendQuickLog(join(root, 'specs'), entry('old'));
  writeFileSync(file, readFileSync(file, 'utf8').replace('| pending |', '| this commit |'));
  git('add', '-A');
  git('commit', '-qm', 'old');
  const old = git('rev-parse', '--short=7', 'HEAD');
  appendQuickLog(join(root, 'specs'), entry('new'), blameCommits);
  appendQuickLog(join(root, 'specs'), entry('newer'), blameCommits);
  const text = readFileSync(file, 'utf8');
  expect(text).toMatch(new RegExp(`\\| old \\|.*\\| ${old} \\|$`, 'm'));
  expect(text).toMatch(/\| new \|.*\| pending \|$/m);
});
