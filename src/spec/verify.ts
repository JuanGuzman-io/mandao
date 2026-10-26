import { isTestFile } from '../scripts/impact.js';
import { splitDeliveries } from './deliveries.js';
import type { ExecutionRow } from './execution.js';
import type { DesignFinding } from './principles.js';
import type { Progress } from './progress.js';
import type { Requirements } from './requirements.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';
import { type CommitState, trace } from './trace.js';

export interface VerifySuite {
  project: string;
  kind: 'unit' | 'e2e';
  /** Files the suite selects from: changed source and test files of the project. */
  files: string[];
  /** For e2e: the AC whose flows must run, with the e2e tests the tasks declared for them. */
  flows?: { ac: string; critical: boolean; tests: string[] }[];
}

export interface VerifyPlan {
  suites: VerifySuite[];
  /** Tasks with declared tests and no RED row, or no MUTANT row for a characterization task (ADR 0022). */
  missingRed: string[];
  deferred: Progress['deferred_to_ci'];
  findings: { type: string; ref: string; message: string }[];
  /** What keeps the spec from `verified`. Empty means verify may conclude. */
  blockers: string[];
  securityScans: { project: string; secrets: string; sast: string; pendingCi: boolean }[];
  /** Present on a partial plan (`--delivery n`): what it covers. `clear` is true when only the partial-plan blocker is left. */
  scope?: { delivery: number; ac: string[]; tasks: string[]; clear: boolean };
}

interface ProjectRef {
  name: string;
  path: string;
}

export interface ProjectSecurityCoverage {
  project: string;
  secrets: { local: boolean; ci: boolean; provider: boolean; declared: boolean; state: 'covered' | 'none' | 'unknown' };
  sast: { local: boolean; ci: boolean; provider: boolean; declared: boolean; state: 'covered' | 'none' | 'unknown' };
}

const BLOCKING = new Set(['GAP', 'BROKEN_REF', 'UNCOMMITTED', 'E2E_MISSING', 'PRINCIPLE_GATE', 'DATA_WRITE']);

const inProject = (file: string, p: ProjectRef) => p.path === '.' || file === p.path || file.startsWith(`${p.path}/`);

/** The suite per project for the spec's changed files, and the e2e flows its AC require. */
function suites(projects: ProjectRef[], tasks: Task[], changed: string[], story: Story): VerifySuite[] {
  const out: VerifySuite[] = [];
  for (const p of projects) {
    const own = tasks.filter((t) => t.project === p.name);
    if (!own.length) continue;
    const files = changed.filter((f) => inProject(f, p));
    out.push({ project: p.name, kind: 'unit', files });
    const flows = story.acs
      .filter((ac) => own.some((t) => t.ac.includes(ac.id)))
      .map((ac) => ({
        ac: ac.id,
        critical: ac.critical,
        tests: own.filter((t) => t.ac.includes(ac.id)).flatMap((t) => t.tests.e2e),
      }))
      .filter((f) => f.critical || f.tests.length);
    if (flows.length) out.push({ project: p.name, kind: 'e2e', files: files.filter((f) => isTestFile(f) && /e2e/.test(f)), flows });
  }
  return out;
}

/** Tasks with declared tests and no RED row (or no MUTANT row for a characterization task). */
function tasksMissingRed(tasks: Task[], execution: ExecutionRow[]): string[] {
  return tasks
    .filter((t) => t.tests.unit.length + t.tests.e2e.length > 0 && t.evidence !== 'none')
    .filter((t) => {
      const own = execution.filter((r) => r.task === t.id);
      return (
        !own.some((r) => r.verdict === (t.characterization ? 'MUTANT' : 'RED')) &&
        !(own.some((r) => r.verdict === 'TESTS_PASS') && own.some((r) => r.verdict === 'MUTANT')) &&
        !(own.some((r) => r.verdict === 'TESTS_PASS') && own.some((r) => r.verdict === 'TEST_REVIEWED'))
      );
    })
    .map((t) => t.id);
}

/**
 * The plan's scope (MDO-0013). With a delivery n: its tasks feed the suites and the not-done checks, but only what
 * belongs to LATER deliveries is dropped from findings and deferred runs; delivery n and the earlier ones stay.
 */
function scopeTo(all: Task[], delivery: number | undefined) {
  const none = { tasks: all, scope: undefined, later: (_ref: string) => false, laterAc: [] as string[] };
  if (delivery === undefined) return none;
  if (!all.some((t) => t.delivery !== undefined))
    throw new Error('a delivery-scoped plan needs a spec with deliveries: no task declares one');
  const deliveries = splitDeliveries(all);
  const own = deliveries.find((d) => d.number === delivery);
  if (!own) throw new Error(`delivery ${delivery} does not exist: the spec has ${deliveries.map((d) => d.number).join(', ')}`);
  const after = deliveries.filter((d) => d.number > own.number);
  const laterAc = after.flatMap((d) => d.ac);
  const laterTasks = new Set(after.flatMap((d) => d.tasks));
  return {
    tasks: all.filter((t) => own.tasks.includes(t.id)),
    scope: { delivery: own.number, ac: own.ac, tasks: own.tasks },
    later: (ref: string) => laterTasks.has(ref) || laterAc.includes(ref.split('/')[0]!),
    laterAc,
  };
}

/**
 * What verify must run and what blocks `verified` (design §16): every task done, every structural trace
 * finding that matters resolved, every passed task committed, deferred runs confirmed by CI.
 */
/** A deferred run waits for CI, or, where there is none, for the local run that clears it (phase 17). */
function deferredBlocker(deferred: { task: string }[], ciAvailable: boolean | undefined): string {
  const tasks = deferred.map((d) => d.task).join(', ');
  if (ciAvailable === false)
    return `${deferred.length} run(s) deferred to CI (${tasks}), and this repository has no CI: run them here with \`mandao run tests <project> --spec <ID> --deferred <task>\``;
  return `${deferred.length} run(s) deferred to CI wait for CI (${tasks})`;
}

export function verifyPlan(input: {
  story: Story;
  requirements: Requirements;
  tasks: Task[];
  execution: ExecutionRow[];
  progress?: Progress;
  projects: ProjectRef[];
  changed: string[];
  commits: CommitState;
  ciConfirmed?: boolean;
  /** False when the repository has no CI configuration: a deferred run then names its local run (phase 17). */
  ciAvailable?: boolean;
  designFindings?: DesignFinding[];
  securityCoverage?: ProjectSecurityCoverage[];
  securityGapsApproved?: boolean;
  /** Scope the plan to one delivery (MDO-0013): a partial check that can never verify the spec. */
  delivery?: number;
}): VerifyPlan {
  const { execution } = input;
  const all = input.tasks;
  const { tasks, scope, later, laterAc } = scopeTo(all, input.delivery);
  const findings = trace(input.story, input.requirements, all, input.commits, input.designFindings).findings.filter((f) => !later(f.ref));
  const missingRed = tasksMissingRed(tasks, execution);
  const deferred = (input.progress?.deferred_to_ci ?? []).filter((d) => !later(d.task));
  const securityTasks = tasks.filter((task) => task.risk_tags.includes('security'));
  const coverageRows = [...(input.securityCoverage ?? [])];
  for (const project of new Set(securityTasks.map((task) => task.project))) {
    if (!coverageRows.some((row) => row.project === project)) {
      const unknown = { local: false, ci: false, provider: false, declared: false, state: 'unknown' as const };
      coverageRows.push({ project, secrets: unknown, sast: { ...unknown } });
    }
  }
  const securityScans = coverageRows.map((coverage) => {
    const ownTasks = securityTasks.filter((task) => task.project === coverage.project);
    const locallyRun = coverage.secrets.local || coverage.sast.local;
    const remoteConfigured = coverage.secrets.ci || coverage.secrets.provider || coverage.sast.ci || coverage.sast.provider;
    const hasCoverage = [coverage.secrets, coverage.sast].some((scan) => scan.local || scan.ci || scan.provider || scan.declared);
    const pendingCi = Boolean(ownTasks.length && !locallyRun && remoteConfigured);
    if (ownTasks.length && !hasCoverage && !input.securityGapsApproved)
      findings.push({
        type: 'SECURITY_GAPS',
        ref: ownTasks.map((task) => task.id).join(', '),
        message: 'security-tagged task has no verified secret-scanning or SAST coverage',
      });
    if (pendingCi && !input.securityGapsApproved && !input.ciConfirmed)
      findings.push({
        type: 'SECURITY_CI_PENDING',
        ref: ownTasks.map((task) => task.id).join(', '),
        message: 'security scan is configured remotely and is pending PR CI confirmation',
      });
    return {
      project: coverage.project,
      secrets: coverage.secrets.state,
      sast: coverage.sast.state,
      pendingCi: pendingCi && !input.securityGapsApproved && !input.ciConfirmed,
    };
  });
  const checks = [
    ...tasks.filter((t) => !t.done).map((t) => `${t.id} is not done`),
    ...findings.filter((f) => BLOCKING.has(f.type)).map((f) => `${f.type} ${f.ref}: ${f.message}`),
    ...(deferred.length && !input.ciConfirmed ? [deferredBlocker(deferred, input.ciAvailable)] : []),
    ...findings
      .filter((f) => f.type === 'SECURITY_GAPS')
      .map((f) => `SECURITY_GAPS ${f.ref}: ${f.message}; record mandao approve <spec> security-gaps --reason <why> to accept the gap`),
    ...(!input.ciConfirmed
      ? findings.filter((f) => f.type === 'SECURITY_CI_PENDING').map((f) => `SECURITY_CI_PENDING ${f.ref}: ${f.message}`)
      : []),
  ];
  const partial = scope
    ? [
        `partial plan: delivery ${scope.delivery} only; a partial plan cannot verify the spec (AC of later deliveries: ${laterAc.join(', ') || 'none'})`,
      ]
    : [];
  const blockers = [...partial, ...checks];
  return {
    suites: suites(input.projects, tasks, input.changed, input.story),
    missingRed,
    deferred,
    findings,
    blockers,
    securityScans,
    ...(scope ? { scope: { ...scope, clear: checks.length === 0 } } : {}),
  };
}
