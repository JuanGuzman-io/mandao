import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { principlesForProjects } from '../engine/constitution-principles.js';
import { checkTransition, readLayout } from '../scripts/spec.js';
import { readApprovalLog } from '../scripts/spec-log.js';
import { layoutProblems, timeline, withStatus } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

/** Close refuses a folder that does not match its layout; an unreadable version is a problem too. */
function closeLayoutProblems(dir: string, principleIds: string[]): string[] {
  try {
    return layoutProblems(readLayout(dir, principleIds));
  } catch (e) {
    return [`layout: ${(e as Error).message}`];
  }
}

/** Writes an allowed status into story.md (hotfix beta.2: implement no longer edits it by hand); false when it could not. */
function applyStatus(specDir: string, to: string): boolean {
  const file = join(specDir, 'story.md');
  const text = readFileSync(file, 'utf8');
  const next = withStatus(text, to);
  if (next === text) return false;
  writeText(file, next);
  return true;
}

/** `mandao run status`: check a status change, or with --apply write it into story.md. */
export function registerStatus(run: Command, ctx: CliContext) {
  run
    .command('status <spec> [to]')
    .description(
      'Check a spec status change (verified needs CI confirmation of deferred runs); without <to>, the status and the timeline (approvals among the execution rows, by date)',
    )
    .option('--ci-confirmed', 'CI passed every DEFERRED_TO_CI run')
    .option('--apply', 'write <to> into story.md when the change is allowed (implement: in-progress)')
    .action((ref: string, to: string | undefined, opts: { ciConfirmed?: boolean; apply?: boolean }) => {
      const { config, spec } = loadSpec(ctx, ref);
      const from = spec.story?.meta.status ?? 'draft';
      // Read only: the approvals stay in their log and are merged here, never written into execution.md (C-1).
      if (to === undefined) return json({ status: from, timeline: timeline(spec.execution, readApprovalLog(spec.dir)) });
      const problems = checkTransition(from, to, spec.progress, Boolean(opts.ciConfirmed));
      if (to === 'closed')
        problems.push(
          ...closeLayoutProblems(
            spec.dir,
            principlesForProjects(
              ctx.root(),
              config,
              spec.tasks.map((task) => task.project),
            ),
          ),
        );
      // The status it already has is nothing to write (review F7); a write that changes nothing is a problem.
      const applied = Boolean(opts.apply) && problems.length === 0 && from !== to && applyStatus(spec.dir, to);
      if (opts.apply && !problems.length && from !== to && !applied)
        problems.push('story.md frontmatter not recognized (expected LF line endings): status not written');
      json({ from, to, allowed: problems.length === 0, problems, ...(opts.apply ? { applied } : {}) });
      if (problems.length) process.exitCode = 1;
    });
}
