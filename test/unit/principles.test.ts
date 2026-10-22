import { describe, expect, test } from 'vitest';
import { declaredPrinciples, designFindings } from '../../src/spec/principles.js';
import { parseTasks } from '../../src/spec/tasks.js';

const noPrinciples = `---\nwrites_data: no\n---\n# Design\n\n## Principle check\n\n| ID | Applies? | Application or reason not applicable |\n|---|---|---|\n| none | n/a | No principles are declared. |\n`;
const task = (extra = '') =>
  parseTasks(`### [ ] T1 — Persist safely\n\n\`\`\`yaml\nproject: app\ntier: standard\nrisk_tags: []\n${extra}\n\`\`\`\n`).tasks;

describe('design principle gate', () => {
  test('reads only stable DP rows under Design principles', () => {
    expect(
      declaredPrinciples(
        `## Other\n| DP-X | ignored |\n\n## Design principles\n| ID | Rule |\n|---|---|\n| DP-SRP | Own one reason to change |\n| DP-SIMPLE | Prefer direct framework use |\n`,
      ),
    ).toEqual(['DP-SRP', 'DP-SIMPLE']);
  });

  test('requires one complete line for every declared principle', () => {
    const findings = designFindings({
      design: noPrinciples.replace('| none | n/a | No principles are declared. |', '| DP-SRP | yes | One responsibility per module. |'),
      principleIds: ['DP-SRP', 'DP-DIP'],
      tasks: task(),
      hasDataModel: false,
    });
    expect(findings).toContainEqual(expect.objectContaining({ type: 'PRINCIPLE_GATE', ref: 'DP-DIP' }));
  });

  test('requires writes_data and a Principle check even when the constitution declares no principles', () => {
    expect(designFindings({ design: '---\n---\n# Design', principleIds: [], tasks: task(), hasDataModel: false })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'DATA_WRITE', ref: 'writes_data' }),
        expect.objectContaining({ type: 'PRINCIPLE_GATE' }),
      ]),
    );
    expect(designFindings({ design: noPrinciples, principleIds: [], tasks: task(), hasDataModel: false })).toEqual([]);
  });
});

describe('data-write gate', () => {
  const acid = `\n## Data writes (ACID)\n\n| Operation | Writes committed together | Transaction/tool | Compensation across systems | Concurrency/isolation |\n|---|---|---|---|---|\n| Save order | order + inventory | SQL transaction | none (single system) | row lock |\n`;

  test('requires an ACID row and at least one task-declared partial-failure test', () => {
    const findings = designFindings({
      design: noPrinciples.replace('writes_data: no', 'writes_data: yes') + acid,
      principleIds: [],
      tasks: task(),
      hasDataModel: false,
    });
    expect(findings.map((f) => f.ref)).toContain('partial_failure_tests');
    expect(findings).not.toEqual(expect.arrayContaining([expect.objectContaining({ ref: 'Data writes (ACID)' })]));
  });

  test('infers writes from data-model.md and data/migration risk tags, and reports explicit no conflicts', () => {
    const design = noPrinciples.replace('writes_data: no', 'writes_data: no') + acid;
    const fromFile = designFindings({
      design,
      principleIds: [],
      tasks: task('partial_failure_tests: [save-order-partial-failure]'),
      hasDataModel: true,
    });
    const fromTag = designFindings({
      design,
      principleIds: [],
      tasks: parseTasks(
        `### [ ] T1 — Save\n\n\`\`\`yaml\nproject: app\ntier: standard\nrisk_tags: [migration]\npartial_failure_tests: [rollback-test]\n\`\`\`\n`,
      ).tasks,
      hasDataModel: false,
    });
    expect(fromFile).toContainEqual(expect.objectContaining({ type: 'DATA_WRITE', ref: 'writes_data' }));
    expect(fromTag).toContainEqual(expect.objectContaining({ type: 'DATA_WRITE', ref: 'writes_data' }));
  });

  test('accepts a declared data write with ACID details and a task test', () => {
    const findings = designFindings({
      design: noPrinciples.replace('writes_data: no', 'writes_data: yes') + acid,
      principleIds: [],
      tasks: task('partial_failure_tests: [save-order-partial-failure]'),
      hasDataModel: false,
    });
    expect(findings).toEqual([]);
  });
});
