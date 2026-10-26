import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { researchToolCapabilities } from '../engine/research-tools.js';
import { branchingFor } from '../scripts/branching.js';
import { commitSpecDocs, commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { MOCKUPS_DIR, mockupBlockers, privateLinkBlockers } from '../scripts/mockups.js';
import { verifiedReuseReferences } from '../scripts/research.js';
import { expectedPlace, findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { appendApprovalLog, docPath, LITE_DOC, readApprovalLog } from '../scripts/spec-log.js';
import {
  APPROVAL_STEPS,
  type Approval,
  type ApprovalStep,
  activeApprovals,
  changedSince,
  emojiPrefix,
  frontmatterOf,
  type NextFacts,
  nextStep,
  openItems,
  parseCloseSummary,
  parsePremises,
  researchGateFindings,
  withStatus,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import { approver, budgetTo, currentHashes, withConstitution } from './approval-record.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { frontField, taskBlockers, withInvocations } from './next-invocations.js';
import { SPEC_STEPS } from './run-ledger.js';
import { specPremiseFindings } from './run-premise.js';
import { implementSession } from './session-advice.js';
import { harnessOption } from './spec-context.js';

function researchIssuesFor(
  root: string,
  spec: SpecFolder,
  config: ReturnType<typeof readConfig>,
  harness: ReturnType<typeof harnessOption>,
): string[] {
  const file = join(spec.dir, 'research.md');
  const document = existsSync(file) ? frontmatterOf(readFileSync(file, 'utf8')).data : { schema_version: 1, entries: [] };
  const design = spec.design ?? '';
  const options = {
    highPremiseIds: parsePremises(design)
      .filter((premise) => premise.impact === 'High')
      .map((premise) => premise.id),
    maxQuestions: config.research.max_questions,
    expiryMonths: config.research.expires_months,
    webSearchAvailable: researchToolCapabilities(root, [harness], config.research.web_search_servers)[0]?.webSearchAvailable,
    verifiedReuseReferences: verifiedReuseReferences(root, config, spec.dir, document),
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
function blockers(
  root: string,
  spec: SpecFolder,
  step: ApprovalStep,
  config: ReturnType<typeof readConfig>,
  harness: ReturnType<typeof harnessOption>,
): string[] {
  const open = openItems(spec).criticalOpen.map((q) => `critical OPEN: ${q}`);
  if (step === 'story') return spec.story ? [...open, ...privateLinkBlockers(spec.dir)] : ['story.md is missing'];
  if (step === 'design' || step === 'spec') {
    if (!spec.requirements) return [`${step === 'spec' ? LITE_DOC : 'requirements.md'} is missing`];
    const mock = [...mockupBlockers(spec.dir), ...privateLinkBlockers(spec.dir)];
    const documents = [...specPremiseFindings(spec.dir).map((f) => f.message), ...mock];
    return [...open, ...documents, ...researchIssuesFor(root, spec, config, harness)];
  }
  if (step === 'tasks')
    return spec.tasks.length
      ? [...open, ...taskBlockers(spec, config), ...privateLinkBlockers(spec.dir)]
      : [...open, 'no tasks to approve'];
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
  if (step === 'design')
    return [...story, docPath(spec.dir, 'requirements'), docPath(spec.dir, 'design'), own('data-model.md'), own('research.md')];
  if (step === 'spec')
    return [...story, own(LITE_DOC), own('data-model.md'), own('research.md'), ...(existsSync(own('tasks.md')) ? [own('tasks.md')] : [])];
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
  package?: string;
  id?: string;
  review?: string;
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
export function nextFor(
  root: string,
  spec: SpecFolder,
  config: ReturnType<typeof readConfig>,
  harness: ReturnType<typeof harnessOption> = 'claude',
) {
  const tasksStatus = frontField(spec.dir, 'tasks.md', 'status');
  const verdict = frontField(spec.dir, 'verify-report.md', 'verdict');
  const delivery = spec.story?.meta.status === 'closed' ? deliveryOf(spec, config) : undefined;
  // The same design gates `approve design|spec` applies, so `next` never points past what approval refuses.
  const researchIssues = [...specPremiseFindings(spec.dir).map((f) => f.message), ...researchIssuesFor(root, spec, config, harness)];
  const next = nextStep(spec, {
    chain: config.flow.chain,
    ...(typeof tasksStatus === 'string' ? { tasksStatus } : {}),
    ...(typeof verdict === 'string' ? { verifyVerdict: verdict } : {}),
    ...(delivery ? { delivery } : {}),
    pendingCommits: commitState(spec, config.commits.trailers).pending,
    approvals: readApprovals(spec),
    hashes: withConstitution(root, config, spec, currentHashes(spec.dir)),
    ...(researchIssues.length ? { researchIssues } : {}),
  });
  return withInvocations(next, spec.story?.meta.id ?? spec.name, harness);
}

/** Appends the approval to the spec's approvals and returns it. */
function recordApproval(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder, step: ApprovalStep, o: ApproveOptions) {
  const docs = documentsFor(spec, step).map((f) => f.slice(spec.dir.length + 1));
  const note =
    step === 'security-gaps' || step === 'vulnerability' ? o.reason : o.byRunning ? `approved by running ${o.byRunning}` : o.note;
  const design = step === 'design' || step === 'spec';
  const own = currentHashes(spec.dir, design ? [...docs, MOCKUPS_DIR] : docs);
  const hashes = design ? withConstitution(root, config, spec, own) : own;
  return appendApproval(
    spec,
    {
      step,
      ...(o.items ? { items: o.items } : {}),
      ...(note ? { note } : {}),
      ...(o.words ? { words: o.words } : {}),
      ...(Object.keys(hashes).length ? { sha256: hashes } : {}),
      ...(step === 'budget' ? { to: budgetTo(o.to) } : {}),
      ...(step === 'vulnerability' ? { vulnerability: { package: o.package!, id: o.id!, review: o.review! } } : {}),
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
    header: `${emojiPrefix(config, 'docs')}docs(${scope}): ${SPEC_STEPS[commitStep](id)}`,
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
    header: `${emojiPrefix(config, 'docs')}docs(${scope}): revoke ${id} ${step} approval`,
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
function approveStep(
  root: string,
  config: ReturnType<typeof readConfig>,
  spec: SpecFolder,
  step: ApprovalStep,
  options: ApproveOptions,
): void {
  const harness = harnessOption(options.harness);
  const problems = blockers(root, spec, step, config, harness);
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
  const statusChanged = approveDocuments(spec, step);
  const record = recordApproval(root, config, spec, step, options);
  const commit = commitApproval(config, spec, step);
  const newSession = implementSession(config, harness, spec, step);
  const next = nextFor(root, readSpec(spec.dir), config, harness);
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
    .option('--package <name>', 'vulnerability: the affected package and version')
    .option('--id <id>', 'vulnerability: the advisory id (CVE, GHSA, PYSEC)')
    .option('--review <trigger>', 'vulnerability: when to review the acceptance again')
    .action((ref: string, step: string, o: ApproveOptions) => {
      if (o.revoke && o.annul) throw new Error('--revoke and --annul are mutually exclusive');
      if (!o.annul && !(APPROVAL_STEPS as readonly string[]).includes(step))
        throw new Error(`step must be one of ${APPROVAL_STEPS.join(', ')}`);
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const s = step as ApprovalStep;
      if (s === 'security-gaps' && !o.reason?.trim()) throw new Error('security-gaps approval needs --reason <why>');
      if (s === 'vulnerability' && !o.revoke && ![o.package, o.id, o.reason, o.review].every((v) => v?.trim()))
        throw new Error('vulnerability approval needs --package, --id, --reason and --review');
      if (approvalEvent(spec, config, s, o)) return;
      approveStep(ctx.root(), config, spec, s, o);
    });
}
