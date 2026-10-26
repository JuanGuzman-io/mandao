import { existsSync, readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { sizeLimits } from '../scripts/quick-check.js';
import { docPath, LITE_DOC } from '../scripts/spec-log.js';
import {
  blockingMarkers,
  deliveryReport,
  parseTasks,
  planTasks,
  TASK_KINDS,
  taskGateIssues,
  taskIndex,
  taskLayoutIssues,
  withIndex,
  withTaskFields,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

/** `mandao run tasks <spec>`: the task plan, its deliveries (MDO-0013) and every issue; `--index` the Overview. */
export function registerTasks(run: Command, ctx: CliContext) {
  run
    .command('tasks <spec>')
    .description('Validate tasks.md, compute waves and the next eligible task; --index prints the generated Overview')
    .option('--index', 'print the Overview generated from the task details')
    .option('--write', 'with --index: replace the Overview in tasks.md')
    .action((ref: string, o: { index?: boolean; write?: boolean }) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (o.index) {
        const file = docPath(spec.dir, 'tasks');
        if (o.write) writeText(file, withIndex(readFileSync(file, 'utf8'), spec.tasks, spec.story));
        return json({ overview: taskIndex(spec.tasks, spec.story), written: Boolean(o.write) });
      }
      const { deliveryIssues, ...report } = deliveryReport(spec.tasks, {
        above: config.deliveries.propose_above_tasks,
        limits: sizeLimits(config.size_limits).pr,
      });
      const markers = [spec.story?.raw, spec.requirements?.raw].filter(Boolean).map((t) => blockingMarkers(t!));
      const tasksFile = docPath(spec.dir, 'tasks');
      const raw = existsSync(tasksFile) ? readFileSync(tasksFile, 'utf8') : '';
      json({
        ...planTasks(
          spec.tasks,
          markers.flatMap((m) => m.criticalOpen),
        ),
        ...report,
        issues: [
          ...spec.issues,
          ...spec.tasks.filter((t) => !t.kind).map((t) => `${t.id} declares no kind (${TASK_KINDS.join(' | ')})`),
          ...taskLayoutIssues(raw, spec.tasks, spec.story, { inline: tasksFile.endsWith(LITE_DOC) }),
          ...deliveryIssues,
          ...taskGateIssues(spec.tasks, config.projects),
        ],
      });
    });

  run
    .command('task-files <spec> <task>')
    .description("Add files to a task's declared files and set its kind in tasks.md (rides with the task commit)")
    .option('--add <paths...>', 'files to add to the task')
    .option('--kind <kind>', `the task's kind (${TASK_KINDS.join(' | ')})`)
    .action((ref: string, id: string, o: { add?: string[]; kind?: string }) => {
      if (!o.add?.length && o.kind === undefined) throw new Error('give --add <paths...> or --kind <kind>');
      const { spec } = loadSpec(ctx, ref);
      const file = docPath(spec.dir, 'tasks');
      const next = withTaskFields(readFileSync(file, 'utf8'), id, {
        ...(o.add ? { add: o.add } : {}),
        ...(o.kind ? { kind: o.kind } : {}),
      });
      // Checked before anything is written (review F5): the task must still parse, with the change in it.
      const task = parseTasks(next).tasks.find((t) => t.id === id);
      if (!task || !(o.add ?? []).every((f) => task.files.includes(f)))
        throw new Error(`${id} would not parse after the edit: nothing written`);
      writeText(file, next);
      json({ task: id, files: task.files, kind: task.kind });
    });
}
