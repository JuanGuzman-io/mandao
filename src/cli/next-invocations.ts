import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADAPTERS } from '../adapters/index.js';
import type { Config, HarnessId } from '../schemas/index.js';
import type { SpecFolder } from '../scripts/spec.js';
import { docPath, LITE_DOC } from '../scripts/spec-log.js';
import type { NextStep } from '../spec/index.js';
import { deliveryIssues, planTasks, taskGateIssues, taskLayoutIssues } from '../spec/index.js';
import { frontmatterOf } from '../spec/markdown.js';

/**
 * The recommended step and every option as the person types them in this harness, with the spec id: copy-ready
 * (phase 16; before it, `next` named a bare `/mandao-specify`). Steps that are not a mandao stay as they are.
 */
export function withInvocations(next: NextStep, id: string, harness: HarnessId) {
  const full = (command: string) =>
    command.startsWith('/mandao-') ? ADAPTERS[harness].session.invoke(`${command.slice(1)} ${id}`) : command;
  return { ...next, recommended: { ...next.recommended, invocation: full(next.recommended.command) }, invocations: next.options.map(full) };
}

/** One frontmatter field of a spec document, when the document exists. */
export function frontField(dir: string, file: string, key: string): unknown {
  const path = join(dir, file);
  return existsSync(path) ? frontmatterOf(readFileSync(path, 'utf8')).data[key] : undefined;
}

/** What `approve tasks` refuses in the plan itself: cycles, gates (phase 17), the task layout, deliveries. */
export function taskBlockers(spec: SpecFolder, config: Config): string[] {
  const file = docPath(spec.dir, 'tasks');
  return [
    ...planTasks(spec.tasks).cycles.map((c) => `dependency cycle: ${c.join(' → ')}`),
    ...taskGateIssues(spec.tasks, config.projects),
    ...taskLayoutIssues(readFileSync(file, 'utf8'), spec.tasks, spec.story, { inline: file.endsWith(LITE_DOC) }),
    ...spec.issues,
    ...deliveryIssues(spec.tasks),
  ];
}
