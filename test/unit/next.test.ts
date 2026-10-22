// mandao-scans: core/templates/shared/rules/ specs/ — reads the consistency-check rule and the MDO-0010 spec folder by path.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { readSpec } from '../../src/scripts/spec.js';
import { type Approval, nextStep, setTaskDone, withStatus } from '../../src/spec/index.js';
import { sha256 } from '../../src/util/hash.js';
import { makeTree } from '../helpers.js';

/**
 * ASSUMPTION (the spec fixes behavior, not the signature): `nextStep(spec, facts)` is pure. `spec` is what
 * `readSpec` returns; `facts` carries what needs IO: the pending commit tasks, the approvals rows and the
 * current sha256 of each approvable document by file name. It answers
 * `{ recommended: { command, reason }, options: string[] }`, with `options` listing every command offered.
 */
const fixture = join(import.meta.dirname, '../fixtures/spec/MDO-0001-skills-list');
const read = (f: string) => readFileSync(join(fixture, f), 'utf8');

interface Shape {
  depth: 'lite' | 'standard';
  story?: string;
  doc?: string;
  /** standard only: whether tasks.md exists yet */
  tasks?: 'none' | 'left' | 'done';
  extra?: string;
}

/** A synthetic spec folder read the way the CLI reads it. */
function spec(s: Shape) {
  const story = withStatus(read('story.md'), s.story ?? 'approved');
  const body = withStatus(read('requirements.md'), s.doc ?? 'approved').replace(/^depth: .*$/m, `depth: ${s.depth}`);
  const doc = s.extra ? body.replace('## Consistency Check', `${s.extra}\n\n## Consistency Check`) : body;
  const files: Record<string, string> = { 'story.md': story };
  files[s.depth === 'lite' ? 'spec.md' : 'requirements.md'] = doc;
  if (s.depth === 'standard' && s.tasks && s.tasks !== 'none') {
    const tasks = withStatus(read('tasks.md'), s.doc ?? 'approved');
    files['tasks.md'] = s.tasks === 'done' ? setTaskDone(tasks, 'T2', true) : tasks;
  }
  const dir = makeTree(files);
  return { spec: readSpec(dir), doc, file: s.depth === 'lite' ? 'spec.md' : 'requirements.md' };
}

const all = (n: ReturnType<typeof nextStep>) => [n.recommended.command, ...n.options].join('\n');

describe('nextStep: the next command comes from the spec state (AC-1)', () => {
  test('S-1.1: an open [NEEDS CLARIFICATION] leads to clarify, gives the item, offers neither tasks nor implement', () => {
    const { spec: s } = spec({ depth: 'standard', extra: '- [NEEDS CLARIFICATION]: who may refund an order?' });
    const n = nextStep(s, {});
    expect(n.recommended.command).toBe('/mandao-clarify');
    expect(n.recommended.reason).toContain('who may refund an order?');
    expect(all(n)).not.toContain('/mandao-tasks');
    expect(all(n)).not.toContain('/mandao-implement');
  });

  test('S-1.2: an approved lite spec leads to implement; an approved standard spec with nothing open leads to tasks', () => {
    expect(nextStep(spec({ depth: 'lite' }).spec, {}).recommended.command).toBe('/mandao-implement');
    expect(nextStep(spec({ depth: 'standard', tasks: 'none' }).spec, {}).recommended.command).toBe('/mandao-tasks');
  });

  test('S-1.3: a critical OPEN, or a draft spec, never recommends nor offers implement', () => {
    const open = spec({ depth: 'lite', extra: '- OPEN(critical, PO): who approves refunds?' }).spec;
    const draft = spec({ depth: 'lite', story: 'draft', doc: 'draft' }).spec;
    const draftStandard = spec({ depth: 'standard', story: 'draft', doc: 'draft', tasks: 'left' }).spec;
    for (const s of [open, draft, draftStandard]) {
      const n = nextStep(s, {});
      expect(n.recommended.command).not.toBe('/mandao-implement');
      expect(all(n)).not.toContain('/mandao-implement');
    }
  });
});

describe('nextStep: a document changed after its approval (S-1.4)', () => {
  const approval = (sha?: Record<string, string>): Approval =>
    ({ step: 'spec', by: 'Ana PO', at: '2026-10-20T10:00:00Z', ...(sha ? { sha256: sha } : {}) }) as Approval;

  test('S-1.4: a spec.md that differs from the recorded hash recommends approving again and names spec.md', () => {
    const { spec: s, doc } = spec({ depth: 'lite' });
    const n = nextStep(s, { approvals: [approval({ 'spec.md': sha256('what was approved') })], hashes: { 'spec.md': sha256(doc) } });
    expect(n.recommended.command).toContain('mandao approve');
    expect(n.recommended.command).toContain('spec');
    expect(n.recommended.reason).toContain('spec.md');
    expect(n.recommended.command).not.toBe('/mandao-implement');
  });

  test('S-1.4/C1: an approval without a recorded hash makes no claim about changes', () => {
    const { spec: s, doc } = spec({ depth: 'lite' });
    const n = nextStep(s, { approvals: [approval()], hashes: { 'spec.md': sha256(doc) } });
    expect(n.recommended.command).toBe('/mandao-implement');
    expect(all(n)).not.toContain('mandao approve');
    expect(n.recommended.reason).not.toMatch(/changed/i);
  });
});

describe('nextStep: later stages (S-1.5)', () => {
  test('S-1.5: tasks left -> implement; pending commits -> run commit; every task done -> verify; verified -> close', () => {
    const left = spec({ depth: 'standard', story: 'in-progress', tasks: 'left' }).spec;
    expect(nextStep(left, {}).recommended.command).toBe('/mandao-implement');

    const done = spec({ depth: 'standard', story: 'in-progress', tasks: 'done' }).spec;
    const pending = nextStep(done, { pendingCommits: ['T2'] });
    expect(pending.recommended.command).toContain('mandao run commit');
    expect(pending.recommended.command).toContain('MDO-0001');

    expect(nextStep(done, {})).toMatchObject({ recommended: { command: '/mandao-verify' }, autoContinue: true });

    const verified = spec({ depth: 'standard', story: 'verified', tasks: 'done' }).spec;
    expect(nextStep(verified, {}).recommended.command).toBe('/mandao-close');
  });
});

describe('nextStep: research evidence gate', () => {
  test('unresolved or unverified research returns to specify before tasks or implementation', () => {
    const { spec: s } = spec({ depth: 'standard', tasks: 'none' });
    const next = nextStep(s, { researchIssues: ['R1: evidence expired'] });
    expect(next.recommended.command).toBe('/mandao-specify');
    expect(next.recommended.reason).toContain('evidence expired');
    expect(all(next)).not.toContain('/mandao-implement');
  });
});

/** MDO-0010 T1 rework (attempt 2): findings of the first review. */
const cc = (row: string) => `| ID | Type | Finding | Severity | Owner | Status |\n|---|---|---|---|---|---|\n${row}`;
const withCheck = (body: string) => {
  const { doc } = spec({ depth: 'lite' });
  const dir = makeTree({
    'story.md': withStatus(read('story.md'), 'approved'),
    'spec.md': doc.replace(/No findings\.\n?/, `${body}\n`),
  });
  return readSpec(dir);
};

describe('nextStep: Consistency Check findings block implement (AC-1/C1, S-5.2)', () => {
  test('AC-1/C1: an unresolved critical row never recommends nor offers implement, and leads to clarify', () => {
    const n = nextStep(withCheck(cc('| CC-1 | PREMISE | The refund limit is unknown. | critical | PO | open |')), {});
    expect(n.recommended.command).toBe('/mandao-clarify');
    expect(all(n)).not.toContain('/mandao-implement');
  });

  test('AC-1/C1: a resolved critical row does not block implement', () => {
    const row = '| CC-1 | PREMISE | The refund limit is unknown. | critical | PO | resolved 2026-10-21: PO chose 50 |';
    expect(nextStep(withCheck(cc(row)), {}).recommended.command).toBe('/mandao-implement');
  });

  test('S-5.2: an unresolved CONFLICT table row leads to clarify', () => {
    const n = nextStep(withCheck(cc('| CC-1 | CONFLICT | The doc and the code disagree. | normal | tech lead | open |')), {});
    expect(n.recommended.command).toBe('/mandao-clarify');
    expect(all(n)).not.toContain('/mandao-implement');
  });

  test('S-5.2: the inline non-bullet CONFLICT(a: ..., b: ..., decides: ...) form leads to clarify', () => {
    const n = nextStep(withCheck('CONFLICT(a: the doc, b: the code, decides: tech lead): which one wins?'), {});
    expect(n.recommended.command).toBe('/mandao-clarify');
    expect(all(n)).not.toContain('/mandao-implement');
  });
});

describe('nextStep: approval hashes and depth (S-1.4, FR-1)', () => {
  test('S-1.4: a later shown row with the new hash does not replace the approval hash', () => {
    const { spec: s, doc } = spec({ depth: 'lite' });
    const rows = [
      { step: 'spec', by: 'Ana PO', at: '2026-10-20T10:00:00Z', sha256: { 'spec.md': sha256('what was approved') } },
      { step: 'shown', by: 'Ana PO', at: '2026-10-20T11:00:00Z', sha256: { 'spec.md': sha256(doc) } },
    ] as Approval[];
    const n = nextStep(s, { approvals: rows, hashes: { 'spec.md': sha256(doc) } });
    expect(n.recommended.command).toContain('mandao approve');
    expect(n.recommended.reason).toContain('spec.md');
    expect(n.recommended.command).not.toBe('/mandao-implement');
  });

  test('FR-1: a spec folder with spec.md and no depth line is lite: no /mandao-tasks', () => {
    const { doc } = spec({ depth: 'lite' });
    const dir = makeTree({
      'story.md': withStatus(read('story.md'), 'approved'),
      'spec.md': doc.replace(/^depth: .*\n/m, ''),
    });
    const n = nextStep(readSpec(dir), {});
    expect(n.recommended.command).toBe('/mandao-implement');
    expect(all(n)).not.toContain('/mandao-tasks');
  });
});

/** MDO-0010 T5 (D1, D6): only real markers count, a failed verify reworks, a closed spec is delivered. */
const ticks = '`';
const fence = '```';
describe('nextStep: markers inside code are not open items', () => {
  const markers = ['[NEEDS CLARIFICATION]: who pays?', 'OPEN(critical, PO): who pays?', 'CONFLICT(a: x, b: y, decides: PO): which?'];
  for (const marker of markers) {
    const name = marker.split(/[(:\]]/)[0]!.replace('[', '');
    test(`${name} in an inline code span or a fenced block is ignored, in prose it still counts`, () => {
      const inline = nextStep(spec({ depth: 'lite', extra: `The marker ${ticks}${marker}${ticks} is explained here.` }).spec, {});
      const fenced = nextStep(spec({ depth: 'lite', extra: `${fence}\n${marker}\n${fence}` }).spec, {});
      expect(inline.recommended.command).toBe('/mandao-implement');
      expect(fenced.recommended.command).toBe('/mandao-implement');
      const real = nextStep(spec({ depth: 'lite', extra: `- ${marker}` }).spec, {});
      expect(real.recommended.command).toBe('/mandao-clarify');
    });
  }

  test('a pending decision in a code span or block is ignored too', () => {
    const extra = `Write ${ticks}**Decision:** pending${ticks} for it.\n\n${fence}\n**Decision:** pending\n${fence}`;
    expect(nextStep(spec({ depth: 'lite', extra }).spec, {}).recommended.command).toBe('/mandao-implement');
    expect(nextStep(spec({ depth: 'lite', extra: '**Decision:** pending' }).spec, {}).recommended.command).toBe('/mandao-clarify');
  });

  test('MDO-0010 itself: a marker named in backticks in prose does not recommend clarify', () => {
    const specs = join(import.meta.dirname, '../../specs');
    const folder = readdirSync(specs).find((n) => n.startsWith('MDO-0010-'));
    expect(folder, 'the MDO-0010 spec folder is under specs/').toBeDefined();
    expect(nextStep(readSpec(join(specs, folder as string)), {}).recommended.command).not.toBe('/mandao-clarify');
  });
});

describe('nextStep: a failed verify and a closed spec', () => {
  test('a spec whose verify was blocked recommends the rework, even with every task done', () => {
    const s = spec({ depth: 'standard', tasks: 'done' }).spec;
    expect(nextStep(s, {}).recommended.command).toBe('/mandao-verify');
    const n = nextStep(s, { verifyVerdict: 'blocked' });
    expect(n.recommended.command).toBe('/mandao-implement');
    expect(n.recommended.reason).toContain('verify');
  });

  const closed = (extra?: string) => spec({ depth: 'lite', story: 'closed', ...(extra ? { extra } : {}) }).spec;
  const marker = '- [NEEDS CLARIFICATION]: who pays?\n- OPEN(critical, PO): who?';

  test('a closed spec not pushed recommends the push, never story or clarify, whatever markers remain', () => {
    const n = nextStep(closed(marker), { delivery: 'unpushed' });
    expect(n.recommended.command).toMatch(/push/);
    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
  });

  test('a closed spec pushed and not merged recommends the PR and merge', () => {
    const n = nextStep(closed(), { delivery: 'pushed' });
    expect(n.recommended.command).toMatch(/PR|pull request/i);
    expect(n.recommended.command).toMatch(/merge/);
    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
  });

  test('a closed spec whose branch is merged recommends nothing', () => {
    const n = nextStep(closed(marker), { delivery: 'merged' });
    expect(n.options).toEqual([]);
    expect(n.recommended.command).toBe('none');
    expect(all(n)).not.toMatch(/mandao-story|mandao-clarify/);
  });

  test('a closed spec without a delivery fact still never recommends story or clarify', () => {
    expect(all(nextStep(closed(marker), {}))).not.toMatch(/mandao-story|mandao-clarify/);
  });
});

describe('consistency-check.md and the code agree on when a row is resolved', () => {
  const rule = readFileSync(join(import.meta.dirname, '../../core/templates/shared/rules/consistency-check.md'), 'utf8');

  test('the rule states the row shape and the statuses it names', () => {
    expect(rule).toContain('| ID | Type | Finding | Severity | Owner | Status |');
    expect(rule).toMatch(/^Status values: `open`.*`resolved/m);
  });

  test('a row with each status the rule names is read as it says: open blocks, resolved does not', () => {
    const line = rule.match(/^Status values:(.*)$/m)![1]!;
    const names = [...line.matchAll(/`([^`]+)`/g)].map((m) => m[1]!);
    expect(names.length).toBeGreaterThanOrEqual(2);
    for (const status of names) {
      const resolved = status.startsWith('resolved');
      const row = `| CC-1 | PREMISE | The limit is unknown. | critical | PO | ${status} |`;
      const n = nextStep(withCheck(cc(row)), {});
      expect(n.recommended.command, status).toBe(resolved ? '/mandao-implement' : '/mandao-clarify');
    }
    const open = nextStep(withCheck(cc('| CC-1 | PREMISE | x | critical | PO | unresolved |')), {});
    expect(open.recommended.command).toBe('/mandao-clarify');
  });

  test('leading formatting is not a resolution, and the rule says a status must start with resolved', () => {
    const row = '| CC-1 | PREMISE | x | critical | PO | **resolved** |';
    expect(nextStep(withCheck(cc(row)), {}).recommended.command).toBe('/mandao-clarify');
    expect(rule).toMatch(/starts with `resolved`/);
  });

  test('a backticked Type still counts, and the rule scopes the backtick exemption to prose', () => {
    const row = '| CC-1 | `CONFLICT` | x | normal | PO | open |';
    expect(nextStep(withCheck(cc(row)), {}).recommended.command).toBe('/mandao-clarify');
    expect(rule).toMatch(/Table rows are read by their cells; a backticked Type still counts/);
  });
});
