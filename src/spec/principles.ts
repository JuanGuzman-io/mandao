import { frontmatterOf, sections } from './markdown.js';
import type { Task } from './tasks.js';

export { declaredPrinciples } from '../util/constitution.js';

export type DesignFindingType = 'PRINCIPLE_GATE' | 'DATA_WRITE';
export interface DesignFinding {
  type: DesignFindingType;
  ref: string;
  message: string;
}

function tableRows(markdown: string, heading: string): string[][] {
  const section = sections(markdown, 2).find((s) => s.heading.trim().toLowerCase() === heading.toLowerCase());
  if (!section) return [];
  return section.body
    .split('\n')
    .filter((line) => /^\s*\|/.test(line) && !/^\s*\|\s*:?-{3,}/.test(line) && !/^\s*\|\s*(?:ID|Operation)\s*\|/i.test(line))
    .map((line) =>
      line
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim()),
    );
}

function nonEmpty(value: string | undefined): boolean {
  return Boolean(value && !/^<.*>$/.test(value) && !['—', '-', 'n/a'].includes(value.toLowerCase()));
}

function inferredWrites(hasDataModel: boolean, tasks: Task[]): boolean {
  return hasDataModel || tasks.some((task) => task.risk_tags.some((tag) => tag === 'data' || tag === 'migration'));
}

function dataDeclarationFindings(declared: unknown, inferred: boolean): DesignFinding[] {
  if (declared !== 'yes' && declared !== 'no') {
    return [{ type: 'DATA_WRITE', ref: 'writes_data', message: 'design frontmatter must declare writes_data: yes | no' }];
  }
  if (declared === 'no' && inferred) {
    return [
      { type: 'DATA_WRITE', ref: 'writes_data', message: 'writes_data: no conflicts with data-model.md or a data/migration task risk tag' },
    ];
  }
  return [];
}

function declaredPrincipleFindings(rows: string[][], ids: string[]): DesignFinding[] {
  if (!rows.length) return [{ type: 'PRINCIPLE_GATE', ref: 'Principle check', message: 'design is missing the Principle check table' }];
  if (!ids.length) {
    const noneRows = rows.filter((row) => row[0]?.toLowerCase() === 'none');
    const findings: DesignFinding[] =
      noneRows.length === 1 && nonEmpty(noneRows[0]?.[2])
        ? []
        : [
            {
              type: 'PRINCIPLE_GATE',
              ref: 'Principle check',
              message: 'no principles are declared; add one `none` row stating that explicitly',
            },
          ];
    return [
      ...findings,
      ...rows
        .filter((row) => row[0]?.toLowerCase() !== 'none')
        .map((row) => ({
          type: 'PRINCIPLE_GATE' as const,
          ref: row[0] ?? 'Principle check',
          message: `${row[0] ?? 'This row'} is not declared in the applicable constitution`,
        })),
    ];
  }
  const findings = ids.flatMap((id) => {
    const matches = rows.filter((row) => row[0] === id);
    return matches.length === 1 && ['yes', 'no'].includes(matches[0]?.[1]?.toLowerCase() ?? '') && nonEmpty(matches[0]?.[2])
      ? []
      : [{ type: 'PRINCIPLE_GATE' as const, ref: id, message: `Principle check must have exactly one complete line for ${id}` }];
  });
  return [
    ...findings,
    ...rows
      .map((row) => row[0])
      .filter((id): id is string => Boolean(id && !ids.includes(id)))
      .map((id) => ({
        type: 'PRINCIPLE_GATE' as const,
        ref: id,
        message: `${id} is not declared in the applicable constitution`,
      })),
  ];
}

function dataWriteFindings(content: string, tasks: Task[], writesData: boolean): DesignFinding[] {
  if (!writesData) return [];
  const acidRows = tableRows(content, 'Data writes (ACID)');
  const findings: DesignFinding[] = acidRows.some((row) => row.length >= 5 && row.slice(0, 5).every(nonEmpty))
    ? []
    : [
        {
          type: 'DATA_WRITE',
          ref: 'Data writes (ACID)',
          message:
            'writes_data is yes but the ACID table needs an operation, grouped writes, transaction/tool, compensation and concurrency strategy',
        },
      ];
  if (!tasks.some((task) => task.partial_failure_tests.length > 0)) {
    findings.push({
      type: 'DATA_WRITE',
      ref: 'partial_failure_tests',
      message: 'writes_data is yes but no task declares a partial-failure test',
    });
  }
  return findings;
}

/** Deterministic design checks shared by layout, trace and verify. */
export function designFindings(input: { design?: string; principleIds: string[]; tasks: Task[]; hasDataModel: boolean }): DesignFinding[] {
  const { design, principleIds, tasks, hasDataModel } = input;
  if (!design) return [];
  const { data, content } = frontmatterOf(design);
  const inferred = inferredWrites(hasDataModel, tasks);
  return [
    ...dataDeclarationFindings(data.writes_data, inferred),
    ...declaredPrincipleFindings(tableRows(content, 'Principle check'), principleIds),
    ...dataWriteFindings(content, tasks, data.writes_data === 'yes' || inferred),
  ];
}
