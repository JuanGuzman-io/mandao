import { type changeManifest, renderChangeManifest } from '../scripts/commits.js';
import type { deletedTests } from '../scripts/red.js';

/** The review pack the Reviewer reads: brief, change manifest, removed tests, gates, the approved mock and the diff. */
export function reviewPackContent(
  id: string,
  attempt: number,
  full: string,
  brief: unknown,
  manifest: ReturnType<typeof changeManifest>,
  removedTests: ReturnType<typeof deletedTests>,
  deletionReason: string | undefined,
  gates: string,
  diff: string,
  mock: string[],
): string {
  return [
    `# Review pack — ${id}, attempt ${attempt}`,
    '',
    'Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in',
    `\`${full}\`.`,
    '',
    '## Brief',
    '',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '',
    '## Mandao change manifest',
    '',
    'Exact changed paths, working-tree statuses, and SHA-256 content hashes reviewed below:',
    '',
    '```json',
    renderChangeManifest(manifest),
    '```',
    '',
    ...(removedTests.length
      ? [
          '## Removed test cases',
          '',
          `Reason recorded by the Leader: ${deletionReason ?? 'missing; block review and request one'}`,
          '',
          '```json',
          JSON.stringify(removedTests, null, 2),
          '```',
          '',
        ]
      : []),
    gates.replace(/^# /m, '## '),
    '',
    ...mock,
    '## Diff',
    '',
    '```diff',
    diff,
    '```',
    '',
  ].join('\n');
}
