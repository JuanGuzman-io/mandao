import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { commitSpecDocs, repoRoot } from '../scripts/commits.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { docPath, LITE_DOC, logPath } from '../scripts/spec-log.js';
import {
  APPROVAL_STEPS,
  type ApprovalStep,
  blockingMarkers,
  parseApprovals,
  planTasks,
  renderApprovals,
  taskLayoutIssues,
  withStatus,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { SPEC_STEPS } from './run-ledger.js';
import { specPremiseFindings } from './run-premise.js';

/** Who approves: the person at the terminal, as git knows them; never a model. */
function approver(cwd: string, by?: string): string {
  if (by) return by;
  try {
    const name = execFileSync('git', ['config', 'user.name'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    if (name) return name;
  } catch {
    // no git identity: fall back to the OS user
  }
  return process.env.USER ?? process.env.USERNAME ?? 'unknown';
}

/** What must be true before a step can be approved: the same gates the commands apply. */
function blockers(spec: SpecFolder, step: ApprovalStep): string[] {
  const raw = [spec.story?.raw, spec.requirements?.raw].filter((t): t is string => Boolean(t));
  const open = raw.flatMap((t) => blockingMarkers(t).criticalOpen).map((q) => `critical OPEN: ${q}`);
  if (step === 'story') return spec.story ? open : ['story.md is missing'];
  if (step === 'design' || step === 'spec') {
    if (!spec.requirements) return [`${step === 'spec' ? LITE_DOC : 'requirements.md'} is missing`];
    return [...open, ...specPremiseFindings(spec.dir).map((f) => f.message)];
  }
  if (step === 'tasks') {
    if (!spec.tasks.length) return ['no tasks to approve'];
    const file = docPath(spec.dir, 'tasks');
    const layout = taskLayoutIssues(readFileSync(file, 'utf8'), spec.tasks, spec.story, { inline: file.endsWith(LITE_DOC) });
    return [...planTasks(spec.tasks).cycles.map((c) => `dependency cycle: ${c.join(' → ')}`), ...layout, ...spec.issues];
  }
  return [];
}

/** The documents whose status the step approves. Close changes no status: the close session applies it. */
function documentsFor(spec: SpecFolder, step: ApprovalStep): string[] {
  return [...new Set(stepDocuments(spec, step))].filter((f) => existsSync(f));
}

function stepDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
  const own = (f: string) => join(spec.dir, f);
  const story = spec.story?.meta.status === 'draft' ? [own('story.md')] : [];
  if (step === 'story') return [own('story.md')];
  if (step === 'design') return [...story, docPath(spec.dir, 'requirements'), docPath(spec.dir, 'design')];
  if (step === 'spec') return [...story, own(LITE_DOC), ...(existsSync(own('tasks.md')) ? [own('tasks.md')] : [])];
  if (step === 'tasks') return [docPath(spec.dir, 'tasks')];
  return [];
}

const COMMIT_STEP: Partial<Record<ApprovalStep, keyof typeof SPEC_STEPS>> = { design: 'specify', spec: 'specify', tasks: 'tasks' };

const NEXT: Record<ApprovalStep, string> = {
  story: '/mandao-specify',
  design: '/mandao-tasks',
  spec: '/mandao-implement',
  tasks: '/mandao-implement',
  close: '/mandao-close (it applies the approved items)',
};

/** The approved documents get `status: approved`; returns the ones that changed, relative to the spec. */
function approveDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
  const changed: string[] = [];
  for (const file of documentsFor(spec, step)) {
    const text = readFileSync(file, 'utf8');
    const next = withStatus(text, 'approved');
    if (next === text) continue;
    writeText(file, next);
    changed.push(file.slice(spec.dir.length + 1));
  }
  return changed;
}

interface ApproveOptions {
  items?: string[];
  by?: string;
  note?: string;
}

/** Appends the approval to `_log/approvals.yml` and returns it. */
function recordApproval(spec: SpecFolder, step: ApprovalStep, o: ApproveOptions) {
  const log = logPath(spec.dir, 'approvals.yml');
  const record = {
    step,
    by: approver(spec.dir, o.by),
    at: new Date().toISOString(),
    ...(o.items ? { items: o.items } : {}),
    ...(o.note ? { note: o.note } : {}),
  };
  writeText(log, renderApprovals([...parseApprovals(existsSync(log) ? readFileSync(log, 'utf8') : undefined), record]));
  return record;
}

/** The spec commit the step makes in the commands (specify, tasks), with the same fixed subject. */
function commitApproval(config: ReturnType<typeof readConfig>, spec: SpecFolder, step: ApprovalStep) {
  const commitStep = COMMIT_STEP[step];
  if (!commitStep) return undefined;
  const id = spec.story?.meta.id ?? spec.name;
  const scope = config.projects.length > 1 ? 'specs' : (spec.story?.meta.projects[0] ?? config.projects[0]!.name);
  return commitSpecDocs({
    repo: repoRoot(spec.dir),
    specDir: spec.dir,
    header: `${config.commits.emoji.docs} docs(${scope}): ${SPEC_STEPS[commitStep](id)}`,
    specId: id,
    config,
    protectedBranches: branchingFor(config).protected,
  });
}

export function registerApprove(program: Command, ctx: CliContext) {
  program
    .command('approve <spec> <step>')
    .description(`Approve a step without a model session (${APPROVAL_STEPS.join(' | ')}): status, who and when, and the spec commit`)
    .option('--items <ids...>', 'close: the proposals approved (impact and standardization ids), or "all"')
    .option('--by <name>', 'who approves (default: git user.name)')
    .option('--note <text>', 'a note kept with the approval')
    .action((ref: string, step: string, o: ApproveOptions) => {
      if (!(APPROVAL_STEPS as readonly string[]).includes(step)) throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
      const s = step as ApprovalStep;
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const problems = blockers(spec, s);
      if (problems.length) {
        json({ approved: false, step: s, problems });
        process.exitCode = 1;
        return;
      }
      const statusChanged = approveDocuments(spec, s);
      const record = recordApproval(spec, s, o);
      const commit = commitApproval(config, spec, s);
      json({ approved: true, ...record, statusChanged, ...(commit ? { commit } : {}), next: NEXT[s] });
    });
}
