import { describe, expect, test } from 'vitest';
import { configSchema } from '../../src/schemas/config.js';
import { composeBrief, LENSES } from '../../src/scripts/brief.js';
import type { SpecFolder } from '../../src/scripts/spec.js';
import { parseTasks } from '../../src/spec/tasks.js';

describe('task decision context in the Implementer brief', () => {
  test('the data risk tag selects the data lens', () => {
    expect(LENSES.data).toEqual(['data']);
  });

  test('includes only linked design decisions and emits an ID based coverage checklist', () => {
    const parsed = parseTasks(
      `### [ ] T1 — preserve behavior\n\n\`\`\`yaml\nproject: app\ntier: standard\nfiles: [src/a.ts]\nac: [AC-1/C1]\nscenarios: [S-1.1/C1]\ndecisions: [D2]\n\`\`\`\n`,
    );
    const spec: SpecFolder = {
      dir: '/tmp/specs/MDO-0001-example',
      name: 'MDO-0001-example',
      lite: false,
      story: { acs: [{ id: 'AC-1', clauses: [{ id: 'C1', text: 'Keep the public result stable.' }] }] } as never,
      requirements: { requirements: [{ scenarios: [{ id: 'S-1.1', clauses: [{ id: 'C1', text: 'Old inputs still work.' }] }] }] } as never,
      design:
        '# Design\n\n## Decisions\n\n### D1 — ignored option\n\nDo not include this.\n\n### D2 — keep parser pure\n\nDecision: pure parsing.\nRationale: deterministic tests.\nRejected: global cache, because it hides inputs.\n\n## Diagram\n\nGenerated diagram detail must not enter the decision.\n',
      tasks: parsed.tasks,
      execution: [],
      issues: [],
    };
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      harnesses: ['codex'],
      projects: [{ name: 'app', path: '.' }],
    });
    const brief = composeBrief('/tmp', config, spec, parsed.tasks[0]!, undefined, 'codex', 1);
    expect(brief.decisions).toEqual([{ ref: 'D2', text: expect.stringContaining('Rejected: global cache') }]);
    expect(brief.decisions[0]!.text).not.toContain('Generated diagram detail');
    expect(brief.coverageChecklist).toEqual([
      { ref: 'AC-1/C1', kind: 'acceptance' },
      { ref: 'S-1.1/C1', kind: 'scenario' },
    ]);
    expect(parsed.issues).toEqual([]);
  });
});
