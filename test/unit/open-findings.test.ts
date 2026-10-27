import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { taskReviews } from '../../src/scripts/spec-log.js';
import { closeSummarySchema, openFindings, renderCloseDocument } from '../../src/spec/index.js';
import { makeTree } from '../helpers.js';

/** Phase 20: every finding still open in a task's last review reaches the summary, low ones included (MDO-0002). */
const review = (verdict: string, findings: object[]) =>
  `VERDICT: ${verdict}\n\n## Findings (JSON)\n\n\`\`\`json\n${JSON.stringify({ version: 1, findings })}\n\`\`\`\n`;
const finding = (id: string, status: string, severity = 'low') => ({
  id,
  status,
  severity,
  lens: 'core',
  title: `${id} title`,
  file: 'src/a.ts',
  line: 3,
  evidence: 'e',
});

describe('open findings from the review records', () => {
  test('the last attempt of each task wins; open findings of any severity are kept, resolved ones dropped', () => {
    const open = openFindings([
      { task: 'T1', attempt: 1, text: review('FAIL', [finding('F1', 'open', 'high')]) },
      { task: 'T1', attempt: 2, text: review('PASS', [finding('F1', 'resolved', 'high'), finding('F2', 'open')]) },
      { task: 'T2', attempt: 1, text: review('PASS', [finding('F1', 'open', 'medium')]) },
      { task: 'T3', attempt: 1, text: 'no payload' },
    ]);
    expect(open.map((f) => `${f.task} ${f.id} ${f.severity}`)).toEqual(['T1 F2 low', 'T2 F1 medium']);
  });

  test('reads version 2 sections (including a process review) and version 1 files', () => {
    const v2 = makeTree({
      'story.md': '---\nschema_version: 2\nid: MDO-0001\n---\n# X\n',
      '_log/reviews.md': `# Reviews\n\n## T1 — attempt 1 (via codex)\n\n${review('PASS', [finding('F1', 'open')])}\n## T2 — attempt 1\n\n${review('PASS', [])}`,
    });
    expect(taskReviews(v2).map((r) => [r.task, r.attempt])).toEqual([
      ['T1', 1],
      ['T2', 1],
    ]);
    const v1 = makeTree({
      'story.md': '---\nschema_version: 1\nid: MDO-0001\n---\n# X\n',
      '_log/reviews/T4-2-review.md': review('PASS', []),
    });
    expect(taskReviews(v1)).toEqual([{ task: 'T4', attempt: 2, text: expect.stringContaining('VERDICT: PASS') }]);
    expect(taskReviews(join(v1, 'missing'))).toEqual([]);
  });

  test('the close document lists each open finding under Delivery', () => {
    const s = closeSummarySchema.parse({
      schema_version: 1,
      spec: 'MDO-1',
      open_findings: [{ task: 'T1', id: 'F2', severity: 'low', lens: 'core', title: 'naming', file: 'src/a.ts', line: 3 }],
    });
    expect(renderCloseDocument(s, undefined, [])).toContain('- Open finding: T1 F2 (low, core) — naming (`src/a.ts:3`)');
  });
});
