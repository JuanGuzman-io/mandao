import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { researchToolCapabilities } from '../engine/research-tools.js';
import { branchingFor } from '../scripts/branching.js';
import { commitSpecDocs, commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { expectedPlace, findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { appendApprovalLog, docPath, LITE_DOC, readApprovalLog } from '../scripts/spec-log.js';
import {
  APPROVAL_STEPS,
  type Approval,
  type ApprovalStep,
  activeApprovals,
  changedSince,
  docHash,
  frontmatterOf,
  type NextFacts,
  nextStep,
  openItems,
  parseCloseSummary,
  parsePremises,
  planTasks,
  researchGateFindings,
  taskLayoutIssues,
  withStatus,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { SPEC_STEPS } from './run-ledger.js';
import { specPremiseFindings } from './run-premise.js';
import { newSessionAdvice } from './session-advice.js';
import { harnessOption } from './spec-context.js';

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

function researchIssuesFor(spec: SpecFolder, config: ReturnType<typeof readConfig>): string[] {
  const file = join(spec.dir, 'research.md');
  const document = existsSync(file) ? frontmatterOf(readFileSync(file, 'utf8')).data : { schema_version: 1, entries: [] };
  const design = spec.design ?? '';
  const options = {
    highPremiseIds: parsePremises(design)
      .filter((premise) => premise.impact === 'High')
      .map((premise) => premise.id),
    maxQuestions: config.research.max_questions,
    expiryMonths: config.research.expires_months,
    webSearchAvailable: researchToolCapabilities(spec.dir, config.harnesses).some((tool) => tool.capability !== 'none'),
  };
  return researchGateFindings(
    [spec.story?.raw, spec.requirements?.raw, design].filter((text): text is string => Boolean(text)),
    document,
    options,
  )
    .filter((finding) => finding.severity === 'error')
    .map((finding) => `${finding.ref}: ${finding.message}`);
}

/** What must be true before a step can be approved: the same gates the commands apply. */
function blockers(spec: SpecFolder, step: ApprovalStep, config: ReturnType<typeof readConfig>): string[] {
  const open = openItems(spec).criticalOpen.map((q) => `critical OPEN: ${q}`);
  if (step === 'story') return spec.story ? open : ['story.md is missing'];
  if (step === 'design' || step === 'spec') {
    if (!spec.requirements) return [`${step === 'spec' ? LITE_DOC : 'requirements.md'} is missing`];
    return [...open, ...specPremiseFindings(spec.dir).map((f) => f.message), ...researchIssuesFor(spec, config)];
  }
  if (step === 'tasks') {
    if (!spec.tasks.length) return [...open, 'no tasks to approve'];
    const file = docPath(spec.dir, 'tasks');
    const layout = taskLayoutIssues(readFileSync(file, 'utf8'), spec.tasks, spec.story, { inline: file.endsWith(LITE_DOC) });
    return [...open, ...planTasks(spec.tasks).cycles.map((c) => `dependency cycle: ${c.join(' → ')}`), ...layout, ...spec.issues];
  }
  return [];
}

/** The documents whose status the step approves. Close changes no status: the close session applies it. */
function documentsFor(spec: SpecFolder, step: ApprovalStep): string[] {
  return [...new Set(stepDocuments(spec, step))].filter((f) => existsSync(f));
}

function stepDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
  const own = (f: string) => join(spec.dir, f);
  // Design approval confirms the story too, even when a previous story approval already changed its status.
  const story = spec.story ? [own('story.md')] : [];
  if (step === 'story') return [own('story.md')];
  if (step === 'design') return [...story, docPath(spec.dir, 'requirements'), docPath(spec.dir, 'design'), own('research.md')];
  if (step === 'spec') return [...story, own(LITE_DOC), own('research.md'), ...(existsSync(own('tasks.md')) ? [own('tasks.md')] : [])];
  if (step === 'tasks') return [docPath(spec.dir, 'tasks')];
  return [];
}

const COMMIT_STEP: Partial<Record<ApprovalStep, keyof typeof SPEC_STEPS>> = { design: 'specify', spec: 'spec', tasks: 'tasks' };

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
  to?: string;
  items?: string[];
  by?: string;
  note?: string;
  byRunning?: string;
  words?: string;
  harness?: string;
  revoke?: boolean;
  annul?: string;
  reason?: string;
}

function budgetTo(to: string | undefined): number | 'none' {
  if (to === 'none') return 'none';
  const n = Number(to);
  if (!(n > 0)) throw new Error('budget needs --to <USD> (the total this spec may spend) or --to none (no cap)');
  return n;
}

const APPROVABLE = ['story.md', 'requirements.md', 'design.md', 'spec.md', 'research.md'];

/** The hash of each approvable document the spec has, by file name. tasks.md is left out: its checkboxes change as tasks pass. */
export function currentHashes(dir: string, only?: string[]): Record<string, string> {
  const files = APPROVABLE.filter((f) => (!only || only.includes(f)) && existsSync(join(dir, f)));
  return Object.fromEntries(files.map((f) => [f, docHash(readFileSync(join(dir, f), 'utf8'))]));
}

const readApprovals = (spec: SpecFolder) => readApprovalLog(spec.dir);

/** Appends a row to the approvals (state.yml in version 2, approvals.yml in version 1), never rewriting the earlier ones, and returns it. */
function appendApproval(spec: SpecFolder, row: Omit<Approval, 'by' | 'at'>, by?: string): Approval {
  const record = { ...row, by: approver(spec.dir, by), at: new Date().toISOString() };
  appendApprovalLog(spec.dir, record);
  return record;
}

/** Records the hashes of the summary just shown to the person, for `approve --by-running` to compare against. */
export function recordShown(spec: SpecFolder): Approval {
  return appendApproval(spec, { step: 'shown', sha256: currentHashes(spec.dir) });
}

const gitOk = (cwd: string, args: string[]) => {
  try {
    execFileSync('git', args, { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
};

/** Where the spec's own branch stands: merged into `origin/<base>` (a local-only merge is not delivered), pushed (its remote branch holds it), or neither. No fact when the branch or git is missing. Read only. */
function deliveryOf(spec: SpecFolder, config: ReturnType<typeof readConfig>): NextFacts['delivery'] {
  const repo = repoRoot(spec.dir);
  const summaryText = existsSync(join(spec.dir, 'close-summary.md')) ? readFileSync(join(spec.dir, 'close-summary.md'), 'utf8') : undefined;
  const base = parseCloseSummary(summaryText, spec.name).delivery?.target ?? branchingFor(config, spec.story?.meta.projects[0]).base;
  const { branch } = expectedPlace(repo, config, spec);
  const local = gitOk(repo, ['rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]);
  if (local && gitOk(repo, ['merge-base', '--is-ancestor', branch, `origin/${base}`])) return 'merged';
  if (!local && spec.story) {
    const shas = [...taskCommits(repo, spec.story.meta.id, config.commits.trailers).values()].flat();
    if (shas.length && shas.every((sha) => gitOk(repo, ['merge-base', '--is-ancestor', sha, `origin/${base}`]))) return 'merged';
  }
  if (!local) {
    if (!gitOk(repo, ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${branch}`])) return undefined;
    return gitOk(repo, ['merge-base', '--is-ancestor', `origin/${branch}`, `origin/${base}`]) ? 'merged' : 'pushed';
  }
  return gitOk(repo, ['merge-base', '--is-ancestor', branch, `origin/${branch}`]) ? 'pushed' : 'unpushed';
}

/** The next step from the spec's state and its facts: pending commits, approvals, the documents' hashes, the verify verdict and, once closed, the delivery. */
export function nextFor(spec: SpecFolder, config: ReturnType<typeof readConfig>) {
  const tasks = join(spec.dir, 'tasks.md');
  const tasksStatus = existsSync(tasks) ? frontmatterOf(readFileSync(tasks, 'utf8')).data.status : undefined;
  const report = join(spec.dir, 'verify-report.md');
  const verdict = existsSync(report) ? frontmatterOf(readFileSync(report, 'utf8')).data.verdict : undefined;
  const delivery = spec.story?.meta.status === 'closed' ? deliveryOf(spec, config) : undefined;
  const researchIssues = researchIssuesFor(spec, config);
  return nextStep(spec, {
    ...(typeof tasksStatus === 'string' ? { tasksStatus } : {}),
    ...(typeof verdict === 'string' ? { verifyVerdict: verdict } : {}),
    ...(delivery ? { delivery } : {}),
    pendingCommits: commitState(spec, config.commits.trailers).pending,
    approvals: readApprovals(spec),
    hashes: currentHashes(spec.dir),
    ...(researchIssues.length ? { researchIssues } : {}),
  });
}

/** Appends the approval to the spec's approvals and returns it. */
function recordApproval(spec: SpecFolder, step: ApprovalStep, o: ApproveOptions, docs: string[]) {
  const note = step === 'security-gaps' ? o.reason : o.byRunning ? `approved by running ${o.byRunning}` : o.note;
  const hashes = currentHashes(spec.dir, docs);
  return appendApproval(
    spec,
    {
      step,
      ...(o.items ? { items: o.items } : {}),
      ...(note ? { note } : {}),
      ...(o.words ? { words: o.words } : {}),
      ...(Object.keys(hashes).length ? { sha256: hashes } : {}),
      ...(step === 'budget' ? { to: budgetTo(o.to) } : {}),
    },
    o.by,
  );
}

/**
 * Approving by running the next command asks one question first when something is open, or a document
 * changed after the last summary shown (a critical OPEN never gets here: `blockers` refuses it on every step
 * that approves documents). Undefined
 * means go. A spec with no `shown` row makes no claim about changes.
 */
function questionBefore(spec: SpecFolder): string | undefined {
  const item = openItems(spec).ask[0];
  if (item) return `open item: ${item}`;
  const shown = activeApprovals(readApprovals(spec)).filter((a) => a.step === 'shown');
  const changed = changedSince(shown.slice(-1), currentHashes(spec.dir));
  return changed.length ? `${changed.join(', ')} changed after the summary was shown` : undefined;
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

/** A status-reverting revocation gets its own small docs commit; history rows themselves are never removed. */
function commitRevocation(config: ReturnType<typeof readConfig>, spec: SpecFolder, step: ApprovalStep) {
  const id = spec.story?.meta.id ?? spec.name;
  const scope = config.projects.length > 1 ? 'specs' : (spec.story?.meta.projects[0] ?? config.projects[0]!.name);
  return commitSpecDocs({
    repo: repoRoot(spec.dir),
    specDir: spec.dir,
    header: `${config.commits.emoji.docs} docs(${scope}): revoke ${id} ${step} approval`,
    specId: id,
    config,
    protectedBranches: branchingFor(config).protected,
  });
}

/** Applies a reasoned revoke/annul event without editing approval history. */
function revokeApproval(spec: SpecFolder, config: ReturnType<typeof readConfig>, step: ApprovalStep, options: ApproveOptions): void {
  const history = readApprovals(spec);
  const target = activeApprovals(history)
    .filter((row) => row.step === step)
    .at(-1);
  if (!target) throw new Error(`there is no active ${step} approval to revoke`);
  appendApproval(spec, { step: 'revocation', target_at: target.at, target_step: step, note: options.reason }, options.by);
  const statusChanged = resetApprovalDocuments(spec, step);
  const commit = statusChanged.length ? commitRevocation(config, spec, step) : undefined;
  json({ revoked: true, step, target: target.at, reason: options.reason, statusChanged, ...(commit ? { commit } : {}) });
}

function annulApproval(spec: SpecFolder, config: ReturnType<typeof readConfig>, options: ApproveOptions): void {
  const history = readApprovals(spec);
  const target = history.find((row) => row.at === options.annul && !['revocation', 'annulment'].includes(row.step));
  if (!target) throw new Error(`no approval-log row exists at ${options.annul}`);
  const record = appendApproval(spec, { step: 'annulment', target_at: target.at, note: options.reason }, options.by);
  const targetStep = (APPROVAL_STEPS as readonly string[]).includes(target.step) ? (target.step as ApprovalStep) : undefined;
  const statusChanged = targetStep ? resetApprovalDocuments(spec, targetStep) : [];
  const commit = targetStep && statusChanged.length ? commitRevocation(config, spec, targetStep) : undefined;
  json({ annulled: true, target: target.at, record, statusChanged, ...(commit ? { commit } : {}) });
}

function approvalEvent(spec: SpecFolder, config: ReturnType<typeof readConfig>, step: ApprovalStep, options: ApproveOptions): boolean {
  if (!options.revoke && !options.annul) return false;
  if (!options.reason?.trim()) throw new Error('revocation or annulment needs --reason');
  if (options.revoke) revokeApproval(spec, config, step, options);
  else annulApproval(spec, config, options);
  return true;
}

/** Returns approvable documents to draft after their approval has been revoked or annulled. */
function resetApprovalDocuments(spec: SpecFolder, step: ApprovalStep): string[] {
  return documentsFor(spec, step).flatMap((file) => {
    const text = readFileSync(file, 'utf8');
    const next = withStatus(text, 'draft');
    if (next === text) return [];
    writeText(file, next);
    return [file.slice(spec.dir.length + 1)];
  });
}

/** Executes a regular approval after all of its blockers and change prompts have passed. */
function approveStep(config: ReturnType<typeof readConfig>, spec: SpecFolder, step: ApprovalStep, options: ApproveOptions): void {
  const harness = harnessOption(options.harness);
  const problems = blockers(spec, step, config);
  if (problems.length) {
    json({ approved: false, step, problems });
    process.exitCode = 1;
    return;
  }
  const question = options.byRunning ? questionBefore(spec) : undefined;
  if (question) {
    json({ result: 'ask', approved: false, step, reason: question });
    return;
  }
  const docs = documentsFor(spec, step).map((f) => f.slice(spec.dir.length + 1));
  const statusChanged = approveDocuments(spec, step);
  const record = recordApproval(spec, step, options, docs);
  const commit = commitApproval(config, spec, step);
  const newSession = step === 'spec' || step === 'tasks' ? { newSession: newSessionAdvice(harness, spec, 'implement') } : {};
  const next = nextFor(readSpec(spec.dir), config);
  json({
    ...(options.byRunning ? { result: 'go' } : {}),
    approved: true,
    ...record,
    statusChanged,
    ...(commit ? { commit } : {}),
    next,
    ...newSession,
  });
}

export function registerApprove(program: Command, ctx: CliContext) {
  program
    .command('approve <spec> <step>')
    .description(`Approve a step without a model session (${APPROVAL_STEPS.join(' | ')}): status, who and when, and the spec commit`)
    .option('--items <ids...>', 'close: the proposals approved (impact and standardization ids), or "all"')
    .option('--to <usd|none>', 'budget: the total this spec may spend, or none to remove its cap')
    .option('--by <name>', 'who approves (default: git user.name)')
    .option('--note <text>', 'a note kept with the approval')
    .option('--revoke', 'revoke the latest active approval for <step>')
    .option('--annul <at>', 'append an event annulling the approval-log row with this timestamp')
    .option('--reason <text>', 'required reason for revoking or annulling an approval')
    .option('--by-running <command>', 'approve because the person ran this command; asks first when something is open or changed')
    .option('--words <text>', 'with --by-running: what the person wrote next to the command, recorded verbatim')
    .option('--harness <id>', 'the harness running this session (default: claude)')
    .action((ref: string, step: string, o: ApproveOptions) => {
      if (o.revoke && o.annul) throw new Error('--revoke and --annul are mutually exclusive');
      if (!o.annul && !(APPROVAL_STEPS as readonly string[]).includes(step))
        throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const s = step as ApprovalStep;
      if (s === 'security-gaps' && !o.reason?.trim()) throw new Error('security-gaps approval needs --reason <why>');
      if (approvalEvent(spec, config, s, o)) return;
      approveStep(config, spec, s, o);
    });
}
