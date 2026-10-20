import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { Command } from 'commander';
import { LOCK_FILE, readConfig, readLock } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { commitsSize, fixCommitsAfter, forcedRunCount, releaseBranchesContaining } from '../scripts/close.js';
import { commitState, repoRoot, taskCommits } from '../scripts/commits.js';
import { publishPlan } from '../scripts/publish.js';
import { sizeLimits } from '../scripts/quick-check.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { hasExecutionLog, logPath } from '../scripts/spec-log.js';
import {
  acStatus,
  type BugsAfterMerge,
  type CloseLink,
  type CloseSummary,
  compareTdd,
  impactItems,
  parseCloseSummary,
  planTasks,
  prPlan,
  renderCloseSummary,
  specMetrics,
  verifyResults,
  withEnvironment,
  withPublication,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';

const json = (value: unknown) => console.log(JSON.stringify(value, null, 2));
const readIf = (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : undefined);
const summaryOf = (spec: SpecFolder) => parseCloseSummary(readIf(join(spec.dir, 'close-summary.md')), spec.name);

const BUGS_NOTE =
  'Counts fix commits whose Refs trailer names the spec and, with a tracker, bugs linked to the story; unreferenced fixes are invisible.';

/** Bugs after merge, once the spec is closed: fix commits by trailer, plus the tracker's count when given. */
function bugsAfterMerge(config: ReturnType<typeof readConfig>, spec: SpecFolder, trackerBugs?: number): BugsAfterMerge | undefined {
  const closedAt = summaryOf(spec).closed_at;
  if (!closedAt || !spec.story) return undefined;
  const fromCommits = fixCommitsAfter(repoRoot(spec.dir), spec.story.meta.id, config.commits.trailers, closedAt).length;
  return {
    fromCommits,
    ...(trackerBugs !== undefined ? { fromTracker: trackerBugs } : {}),
    total: fromCommits + (trackerBugs ?? 0),
    note: BUGS_NOTE,
  };
}

function metricsOf(config: ReturnType<typeof readConfig>, spec: SpecFolder, trackerBugs?: number) {
  const bugs = bugsAfterMerge(config, spec, trackerBugs);
  return specMetrics(spec.name, spec.tasks, spec.execution, forcedRunCount(readIf(logPath(spec.dir, 'execution.md'))), bugs);
}

function registerKaizen(run: Command, ctx: CliContext) {
  run
    .command('kaizen <spec>')
    .description("Kaizen's measure step for one spec: rework, FAILs, escalations, independence, forced runs, TDD, bugs after merge")
    .option('--tracker-bugs <n>', 'bugs the tracker links to the story after the close (from the tracker MCP)')
    .action((ref: string, o: { trackerBugs?: string }) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      json(metricsOf(config, spec, o.trackerBugs === undefined ? undefined : Number(o.trackerBugs)));
    });

  run
    .command('kaizen-compare')
    .description('Specs with and without TDD side by side; insufficient data below the minimum per group')
    .action(() => {
      const config = readConfig(ctx.root());
      const dir = join(ctx.root(), config.paths.specs);
      const specs = existsSync(dir) ? readdirSync(dir).filter((d) => hasExecutionLog(join(dir, d))) : [];
      const metrics = specs.map((d) => metricsOf(config, readSpec(join(dir, d))));
      json({ ...compareTdd(metrics, config.kaizen.min_specs_per_group), specs: metrics });
    });
}

interface SummaryOptions {
  published?: string;
  closed?: boolean;
  release?: string;
  detectRelease?: boolean;
  env?: string;
  source?: 'ci' | 'tracker';
}

/** gitflow: the one release branch that contains every commit of the spec (ADR 0023). */
function detectedRelease(config: ReturnType<typeof readConfig>, spec: SpecFolder): CloseSummary['release'] {
  if (!spec.story) return undefined;
  const repo = repoRoot(spec.dir);
  const shas = [...taskCommits(repo, spec.story.meta.id, config.commits.trailers).values()].flat();
  const found = releaseBranchesContaining(repo, shas, branchingFor(config).prefixes.release);
  if (found.length > 1) throw new Error(`several release branches contain the spec: ${found.join(', ')}; pick one with --release`);
  return found[0] ? { branch: found[0], how: 'detected' } : undefined;
}

/** `--published "<target>|<kind>|<id>|<hash>[|<url>]"` → a publication record. */
function publication(record: string, at: string): CloseSummary['published'][number] {
  const [target, kind, id, hash, url] = record.split('|');
  if (!target || !id || !hash || !['comment', 'attachment', 'page', 'file'].includes(kind ?? '')) {
    throw new Error('--published "<target>|<comment|attachment|page|file>|<id>|<hash>[|<url>]"');
  }
  return { target, kind: kind as 'comment', id, hash, at, ...(url ? { url } : {}) };
}

function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder, o: SummaryOptions): CloseSummary {
  let s = summaryOf(spec);
  const now = new Date().toISOString();
  if (o.closed && !s.closed_at) s = { ...s, closed_at: now };
  if (o.release) s = { ...s, release: { branch: o.release, how: 'given' } };
  const release = o.detectRelease ? detectedRelease(config, spec) : undefined;
  if (release) s = { ...s, release };
  if (o.published) s = withPublication(s, publication(o.published, now));
  if (o.env) {
    if (!o.source) throw new Error('--env needs --source ci|tracker: an environment is recorded only as CI or the tracker reported it');
    s = withEnvironment(s, o.env, o.source, now);
  }
  return s;
}

/** Links to what the close produced, only for files that exist, relative to the spec folder. */
function closeLinks(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder): CloseLink[] {
  const id = spec.story?.meta.id ?? spec.name;
  const candidates = [
    { label: 'Release notes', file: join(root, config.paths.releases, id, 'release-notes.md') },
    { label: 'Technical notes', file: join(root, config.paths.releases, id, 'technical.md') },
    { label: 'Kaizen', file: join(root, 'docs', 'kaizen', `${id}.md`) },
    { label: 'Verify report', file: join(spec.dir, 'verify-report.md') },
    { label: 'Quickstart', file: join(spec.dir, 'quickstart.md') },
  ];
  return candidates
    .filter((c) => existsSync(c.file))
    .map((c) => ({ label: c.label, href: relative(spec.dir, c.file).split(sep).join('/') }));
}

function registerSummary(run: Command, ctx: CliContext) {
  run
    .command('close-summary <spec>')
    .description('close-summary.md: when the spec closed, its release branch, environments reached (idempotent)')
    .option('--closed', 'record the close time (kept on re-runs)')
    .option('--release <branch>', 'gitflow: the release branch the spec ships in')
    .option('--detect-release', 'gitflow: find the release branch that contains every commit of the spec')
    .option('--env <name>', 'an environment the spec reached')
    .option('--source <source>', 'who reported the environment: ci | tracker')
    .option('--published <record>', 'after a publication: "<target>|<kind>|<id>|<hash>[|<url>]"')
    .action((ref: string, o: SummaryOptions) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const summary = updatedSummary(config, spec, o);
      writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary, closeLinks(ctx.root(), config, spec)));
      json(summary);
    });
}

function registerReleaseStatus(run: Command, ctx: CliContext) {
  run
    .command('release-status <spec>')
    .description('Each AC as met, partial or pending, from tasks, commits by trailer and verify-report.md')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story) throw new Error(`${spec.name} needs story.md`);
      const committed = commitState(spec, config.commits.trailers).committed;
      const verify = verifyResults(readIf(join(spec.dir, 'verify-report.md')));
      json({ criteria: acStatus(spec.story, spec.tasks, spec.execution, committed, verify), language: config.language });
    });

  run
    .command('impacts <spec>')
    .description('Constitution and product changes design.md proposed, for close to apply with approval')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const design = readIf(join(spec.dir, 'design.md')) ?? '';
      json({ constitution: impactItems(design, 'Constitution Impact'), product: impactItems(design, 'Product Impact') });
    });
}

/** Close scripts (design §18): Kaizen, the close summary, release status and impacts. */
export function registerClose(run: Command, ctx: CliContext) {
  registerKaizen(run, ctx);
  registerSummary(run, ctx);
  registerReleaseStatus(run, ctx);
  registerPublish(run, ctx);
  registerPrPlan(run, ctx);
}

/**
 * Paths that do not count toward a PR's size (ADR 0028, MDO-0004): the spec folders, release docs, Kaizen,
 * diagrams, and every file Mandao generates (from the lock).
 */
function notCode(root: string, config: ReturnType<typeof readConfig>): (path: string) => boolean {
  const generated = new Set(readLock(join(root, LOCK_FILE))?.files.map((f) => f.path) ?? []);
  const folders = [config.paths.specs, config.paths.releases, 'docs/kaizen', 'docs/diagrams'].map((d) => `${d.replace(/\/$/, '')}/`);
  return (path) => generated.has(path) || folders.some((d) => path.startsWith(d));
}

function registerPrPlan(run: Command, ctx: CliContext) {
  run
    .command('pr-plan <spec>')
    .description('One PR, one per repo, or stacked: from task dependencies, projects and the real diff (ADR 0028)')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (!spec.story) throw new Error(`${spec.name} needs story.md`);
      const repo = repoRoot(spec.dir);
      const byTask = taskCommits(repo, spec.story.meta.id, config.commits.trailers);
      const skip = notCode(ctx.root(), config);
      const sizes = new Map(spec.tasks.map((t) => [t.id, commitsSize(repo, byTask.get(t.id) ?? [], skip)]));
      const limits = sizeLimits(config.size_limits).pr;
      json(prPlan({ tasks: spec.tasks, waves: planTasks(spec.tasks).waves, sizes, limits, polyrepo: config.workspace === 'polyrepo' }));
    });
}

function registerPublish(run: Command, ctx: CliContext) {
  run
    .command('publish-plan <spec>')
    .description('The exact payload for a tracker target and whether it is new, changed or unchanged (idempotent)')
    .requiredOption('--target <target>', 'where it goes, e.g. jira:PROJ-123')
    .action((ref: string, o: { target: string }) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const id = spec.story?.meta.id ?? spec.name;
      json(publishPlan(ctx.root(), join(ctx.root(), config.paths.releases, id), spec.dir, o.target, summaryOf(spec)));
    });
}
