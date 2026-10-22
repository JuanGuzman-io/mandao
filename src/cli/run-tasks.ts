import { existsSync, readFileSync } from 'node:fs';
import type { Command } from 'commander';
import { sizeLimits } from '../scripts/quick-check.js';
import { docPath, LITE_DOC } from '../scripts/spec-log.js';
import { blockingMarkers, deliveryReport, planTasks, TASK_KINDS, taskIndex, taskLayoutIssues, withIndex } from '../spec/index.js';
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
        ],
      });
    });
}
