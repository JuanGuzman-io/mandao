import { describe, expect, test } from 'vitest';
import { originSources, outOfScope, reconcileMessage } from '../../src/scripts/review-scope.js';
import { declaredCovers } from '../../src/spec/plan.js';

const scope = { reviewed: [], receipts: [] };

describe('declared task files cover paths like the planner normalizes them', () => {
  test.each([
    ['./src/a.ts', 'src/a.ts', true],
    ['src\\lib\\', 'src/lib/deep/a.ts', true],
    ['src/**/*.ts', 'src/x/y.ts', true],
    ['src/**/*.ts', 'src/x/y.js', false], // a glob matches its pattern, not its whole root folder
    ['*.md', 'README.md', true],
    ['*.md', 'src/a.ts', false],
    ['**/*.ts', 'src/a.ts', true],
    ['**/*.ts', '.mandao/mandao.lock', false],
    ['**/*.ts', '.claude/agents/x.md', false],
    ['src/*.ts', 'lib/a.ts', false],
    ['../outside/a.ts', 'outside/a.ts', false],
    ['src/@(a|b).ts', 'src/a.ts', false],
    ['', 'src/a.ts', false],
  ])('%s covers %s: %s', (declared, path, expected) => {
    expect(declaredCovers(declared, path)).toBe(expected);
  });
});

describe('outOfScope', () => {
  test('a file is in scope when declared, reviewed, or generated from a changed origin', () => {
    const generated = { reviewed: ['core/personas/leader.md'], receipts: [{ path: '.claude/agents/l.md', origin: 'persona:leader' }] };
    expect(outOfScope(['./a.ts', '.claude/agents/l.md', 'other.ts'], ['a.ts'], generated, '/r', '/r')).toEqual(['other.ts']);
  });

  test('the lock is judged against the workspace home, not the repo root', () => {
    const files = ['apps/w/.mandao/mandao.lock', 'apps/w/.claude/agents/l.md'];
    const receipts = [{ path: 'apps/w/.claude/agents/l.md', origin: 'persona:leader' }];
    const changed = { reviewed: ['apps/w/core/personas/leader.md'], receipts };
    expect(outOfScope(files, [], changed, '/r', '/r/apps/w')).toEqual([]);
    expect(outOfScope(files, [], { reviewed: [], receipts }, '/r', '/r/apps/w')).toEqual([...files].sort());
  });

  test('origins: command, persona and template map to core and overrides; blocks have no source', () => {
    expect(originSources('command:implement')).toContain('core/commands/implement.md');
    expect(originSources('persona:implementer:fast')).toContain('core/personas/implementer.md');
    expect(originSources('template:shared/close/kaizen.md')).toContain('core/templates/shared/close/kaizen.md');
    expect(originSources('block:mandao')).toEqual([]);
    expect(originSources('docs/diagrams/src/overview.json')).toEqual(['docs/diagrams/src/overview.json']);
    expect(outOfScope(['x'], [], scope, '/r', '/r')).toEqual(['x']);
  });

  test('a declared path of a workspace home is mapped like the origins are', () => {
    expect(outOfScope(['apps/w/src/a.ts', 'apps/w/other.ts'], ['src/a.ts'], scope, '/r', '/r/apps/w')).toEqual(['apps/w/other.ts']);
  });

  test('a change to any Mandao content source brings every receipt into scope; a version-only upgrade does not', () => {
    const receipts = [
      { path: '.claude/commands/implement.md', origin: 'command:implement' },
      { path: '.claude/agents/x.md', origin: 'persona:leader' },
    ];
    const files = ['.claude/commands/implement.md', '.claude/agents/x.md', '.mandao/mandao.lock'];
    const rules = { reviewed: ['core/templates/shared/rules/commit.md'], receipts };
    expect(outOfScope(['core/templates/shared/rules/commit.md', ...files], [], rules, '/r', '/r')).toEqual([]);
    const declaredRules = outOfScope(files, ['core/templates/shared/rules/*.md'], { reviewed: [], receipts }, '/r', '/r');
    expect(declaredRules).toEqual([]);
    const overrides = { reviewed: ['.mandao/overrides/templates/shared/rules/commit.md'], receipts };
    expect(outOfScope(files, [], overrides, '/r', '/r')).toEqual([]);
    const versionOnly = { reviewed: ['package.json'], receipts };
    expect(outOfScope(files, [], versionOnly, '/r', '/r')).toEqual([...files].sort());
  });
});

describe('reconcileMessage', () => {
  test('says the other tasks were committed only when some were', () => {
    const stray = { T1: ['.mandao/mandao.lock'] };
    expect(reconcileMessage(stray, true)).toContain('The other pending tasks were committed as usual');
    expect(reconcileMessage(stray, false)).not.toContain('were committed as usual');
    expect(reconcileMessage(stray, false)).toContain('T1: .mandao/mandao.lock');
  });
});
