import { describe, expect, test } from 'vitest';
import { parseStackChecks, recordedStackChecks, stackFindings, withStackRun } from '../../src/spec/index.js';

const ARCH = `# Architecture

## Stack
| Project | Language | Runtime (pinned) | Frameworks (versions) | Style-defining libraries | Check |
|---|---|---|---|---|---|
| app | Python | 3.12.7 (.python-version) | fastembed 0.4 | — | S1, S2 |

## Stack verification

### S1 — fastembed 0.4 installs and imports on Python 3.12.7

### S2 — Qdrant local mode runs without a server
UNVERIFIED: needs the native wheel not published for this platform yet.

## Chosen architecture
### S9 — not a check: outside the section
`;

describe('stack verification (phase 18)', () => {
  test('parses the checks of the section only, with their UNVERIFIED mark', () => {
    expect(parseStackChecks(ARCH)).toEqual([
      { id: 'S1', claim: 'fastembed 0.4 installs and imports on Python 3.12.7', unverified: false },
      { id: 'S2', claim: 'Qdrant local mode runs without a server', unverified: true },
    ]);
  });

  test('a check without a run and without a mark warns; an UNVERIFIED one informs; a recorded one says nothing', () => {
    const none = stackFindings(ARCH, new Set(), 'workspace');
    expect(none.map((f) => [f.ref, f.level])).toEqual([
      ['S1', 'warn'],
      ['S2', 'info'],
    ]);
    expect(none[0]?.message).toContain('mandao run stack-check S1 -- <command>');
    expect(stackFindings(ARCH, new Set(['S1']), 'workspace').map((f) => f.ref)).toEqual(['S2']);
    expect(stackFindings(undefined, new Set(), 'workspace')).toEqual([]);
  });

  test('the stack log keeps one section per check: a rerun replaces it, another check is appended', () => {
    const one = withStackRun(undefined, 'S1', '- Exit: 1');
    const two = withStackRun(one, 'S2', '- Exit: 0');
    const again = withStackRun(two, 'S1', '- Exit: 0');
    expect(recordedStackChecks(again)).toEqual(new Set(['S1', 'S2']));
    expect(again.match(/## S1 — run/g)).toHaveLength(1);
    expect(again).not.toContain('- Exit: 1');
    expect(again.indexOf('## S1')).toBeLessThan(again.indexOf('## S2'));
  });
});
