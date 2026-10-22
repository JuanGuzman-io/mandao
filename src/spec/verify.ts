import { isTestFile } from '../scripts/impact.js';
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

/**
 * What verify must run and what blocks `verified` (design §16): every task done, every structural trace
 * finding that matters resolved, every passed task committed, deferred runs confirmed by CI.
 */
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
  designFindings?: DesignFinding[];
  securityCoverage?: ProjectSecurityCoverage[];
  securityGapsApproved?: boolean;
}): VerifyPlan {
  const { tasks, execution } = input;
  const findings = trace(input.story, input.requirements, tasks, input.commits, input.designFindings).findings;
  const missingRed = tasks
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
  const deferred = input.progress?.deferred_to_ci ?? [];
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
  const blockers = [
    ...tasks.filter((t) => !t.done).map((t) => `${t.id} is not done`),
    ...findings.filter((f) => BLOCKING.has(f.type)).map((f) => `${f.type} ${f.ref}: ${f.message}`),
    ...(deferred.length && !input.ciConfirmed
      ? [`${deferred.length} run(s) deferred to CI wait for CI (${deferred.map((d) => d.task).join(', ')})`]
      : []),
    ...findings
      .filter((f) => f.type === 'SECURITY_GAPS')
      .map((f) => `SECURITY_GAPS ${f.ref}: ${f.message}; record mandao approve <spec> security-gaps --reason <why> to accept the gap`),
    ...(!input.ciConfirmed
      ? findings.filter((f) => f.type === 'SECURITY_CI_PENDING').map((f) => `SECURITY_CI_PENDING ${f.ref}: ${f.message}`)
      : []),
  ];
  return { suites: suites(input.projects, tasks, input.changed, input.story), missingRed, deferred, findings, blockers, securityScans };
}
