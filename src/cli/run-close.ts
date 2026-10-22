import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import type { Command } from 'commander';
import { LOCK_FILE, readConfig, readLock, readModels } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import { resolveModels } from '../models/resolve.js';
import { branchingFor } from '../scripts/branching.js';
import { commitsSize, fixCommitsAfter, forcedRunCount, releaseBranchesContaining } from '../scripts/close.js';
import { commitState, repoRoot, taskCommits, taskCommitTimes } from '../scripts/commits.js';
import { publishPlan } from '../scripts/publish.js';
import { sizeLimits } from '../scripts/quick-check.js';
import { measureSessions } from '../scripts/session-turns.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import { docPath, dropLogCache, hasExecutionLog, logPath, specLogInCache } from '../scripts/spec-log.js';
import { specSpend } from '../scripts/spend.js';
import { readTelemetryEvents } from '../scripts/telemetry.js';
import {
  acStatus,
  type BugsAfterMerge,
  type CloseLink,
  type CloseSummary,
  changelogLine,
  compareTdd,
  correctHistoricalCosts,
  costKaizen,
  historicalDuplicateAmount,
  impactItems,
  type LeaderSwitch,
  parseCloseSummary,
  parseCosts,
  planTasks,
  prPlan,
  renderCloseDocument,
  renderCloseSummary,
  sessionCutKaizen,
  specMetrics,
  splitDeliveries,
  summarizeTelemetry,
  unresolvedPremises,
  upsertChangelog,
  verifyResults,
  withEnvironment,
  withPublication,
} from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { registerReleaseStatus } from './release-status.js';

const readIf = (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : undefined);
const summaryOf = (spec: SpecFolder) => parseCloseSummary(readIf(join(spec.dir, 'close-summary.md')), spec.name);

/** Collects unresolved uncertainty markers from the documents that define the spec before closure. */
function closePremiseFindings(spec: SpecFolder): string[] {
  const files = [join(spec.dir, 'story.md'), docPath(spec.dir, 'requirements'), docPath(spec.dir, 'design'), docPath(spec.dir, 'tasks')];
  return [...new Set(files)].flatMap((file) => {
    const text = readIf(file);
    return text === undefined ? [] : unresolvedPremises(text).map((line) => `${relative(spec.dir, file)}: ${line}`);
  });
}

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

const specCosts = (dir: string) => {
  const file = logPath(dir, 'costs.yml');
  return parseCosts(existsSync(file) ? readFileSync(file, 'utf8') : undefined);
};

/** What switching to the next cheaper profile would do to the Leader, priced with the official table. */
function leaderSwitch(root: string, config: ReturnType<typeof readConfig>): LeaderSwitch | undefined {
  const harness = config.harnesses[0];
  if (!harness) return undefined;
  const recs = readRecommendations();
  const prices = recs.harnesses[harness]?.prices?.per_mtok ?? {};
  const current = readModels(root).profile ?? 'peak';
  const next = current === 'peak' ? 'balanced' : current === 'balanced' ? 'economy' : undefined;
  if (!next) return undefined;
  const from = resolveWorkspaceModels(root, config, recs)[harness]?.leader?.model;
  const to = resolveModels(harness, 'routed', recs, [], next).leader?.model;
  if (!from || !to || from === to || !prices[from] || !prices[to]) return undefined;
  return { profile: next, model: to, priceRatio: prices[to]!.input / prices[from]!.input };
}

function metricsOf(config: ReturnType<typeof readConfig>, spec: SpecFolder, trackerBugs?: number) {
  const bugs = bugsAfterMerge(config, spec, trackerBugs);
  return specMetrics(spec.name, spec.tasks, spec.execution, forcedRunCount(readIf(logPath(spec.dir, 'execution.md'))), bugs);
}

/** The spec's measured sessions: pauses, turns per task, verify, close and after tasks, and the missing sessions. */
function sessionsOf(config: ReturnType<typeof readConfig>, spec: SpecFolder) {
  const commitTimes = spec.story
    ? taskCommitTimes(repoRoot(spec.dir), spec.story.meta.id, config.commits.trailers)
    : new Map<string, number[]>();
  return measureSessions({ specDir: spec.dir, commitTimes });
}

function registerKaizen(run: Command, ctx: CliContext) {
  run
    .command('kaizen <spec>')
    .description("Kaizen's measure step for one spec: rework, FAILs, escalations, independence, forced runs, TDD, bugs after merge")
    .option('--tracker-bugs <n>', 'bugs the tracker links to the story after the close (from the tracker MCP)')
    .action((ref: string, o: { trackerBugs?: string }) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const folders = existsSync(join(ctx.root(), config.paths.specs))
        ? readdirSync(join(ctx.root(), config.paths.specs)).filter((d) => hasExecutionLog(join(ctx.root(), config.paths.specs, d)))
        : [];
      const historical = correctHistoricalCosts(
        folders.flatMap((name) => specCosts(join(ctx.root(), config.paths.specs, name)).map((entry) => ({ ...entry, spec: name }))),
      );
      json({
        ...metricsOf(config, spec, o.trackerBugs === undefined ? undefined : Number(o.trackerBugs)),
        costs: specSpend(spec.dir, config.budget.per_spec),
        sessions: sessionsOf(config, spec),
        timing: summarizeTelemetry(readTelemetryEvents(spec.dir)),
        correctedHistoricalCosts: Object.fromEntries(
          Object.entries(historical.byBasis)
            .filter(([, totals]) => totals.rawBySpec[spec.name] !== undefined)
            .map(([basis, totals]) => [
              basis,
              {
                rawUsd: totals.rawBySpec[spec.name],
                correctedUsd: totals.bySpec[spec.name] ?? 0,
                duplicateUsd: historicalDuplicateAmount(totals.rawBySpec[spec.name] ?? 0, totals.bySpec[spec.name] ?? 0),
                byCommand: Object.fromEntries(
                  Object.entries(totals.rawBySpecCommand[spec.name] ?? {}).map(([command, rawUsd]) => {
                    const correctedUsd = totals.bySpecCommand[spec.name]?.[command] ?? 0;
                    return [command, { rawUsd, correctedUsd, duplicateUsd: historicalDuplicateAmount(rawUsd, correctedUsd) }];
                  }),
                ),
              },
            ]),
        ),
      });
    });

  run
    .command('kaizen-compare')
    .description('Specs with and without TDD side by side; insufficient data below the minimum per group')
    .action(() => {
      const config = readConfig(ctx.root());
      const dir = join(ctx.root(), config.paths.specs);
      const specs = existsSync(dir) ? readdirSync(dir).filter((d) => hasExecutionLog(join(dir, d))) : [];
      const folders = specs.map((d) => readSpec(join(dir, d)));
      const metrics = folders.map((s) => metricsOf(config, s));
      const costs = costKaizen(
        folders.map((s) => ({ spec: s.name, costs: specCosts(s.dir), tasks: s.tasks, rows: s.execution })),
        leaderSwitch(ctx.root(), config),
      );
      const sessionCut = sessionCutKaizen(folders.map((s) => ({ spec: s.name, measure: sessionsOf(config, s) })));
      const correctedHistoricalCosts = correctHistoricalCosts(
        folders.flatMap((spec) => specCosts(spec.dir).map((entry) => ({ ...entry, spec: spec.name }))),
      );
      const timingBySpec = folders.map((spec) => ({ spec: spec.name, commands: summarizeTelemetry(readTelemetryEvents(spec.dir)) }));
      json({
        ...compareTdd(metrics, config.kaizen.min_specs_per_group),
        costs,
        correctedHistoricalCosts,
        timingBySpec,
        sessionCut,
        specs: metrics,
      });
    });
}

interface SummaryOptions {
  published?: string;
  closed?: boolean;
  release?: string;
  detectRelease?: boolean;
  env?: string;
  source?: 'ci' | 'tracker';
  applied?: string[];
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

/** `--applied <path>`: a file outside the spec folder, inside the repo, that close applied with approval; kept once each. */
function appliedPaths(spec: SpecFolder, known: string[], given: string[]): string[] {
  const repo = repoRoot(spec.dir);
  const added = given.map((p) => {
    const abs = resolve(repo, p);
    const inside = (dir: string) => abs === dir || abs.startsWith(`${dir}${sep}`);
    if (!inside(repo)) throw new Error(`--applied ${p} is outside the repository`);
    if (inside(spec.dir)) throw new Error(`--applied ${p} is inside the spec folder, which close commits anyway`);
    return relative(repo, abs).split(sep).join('/');
  });
  return [...new Set([...known, ...added])];
}

function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder, o: SummaryOptions): CloseSummary {
  let s = summaryOf(spec);
  const now = new Date().toISOString();
  if (o.closed && !s.closed_at) s = { ...s, closed_at: now };
  if (o.release) s = { ...s, release: { branch: o.release, how: 'given' } };
  const release = o.detectRelease ? detectedRelease(config, spec) : undefined;
  if (release) s = { ...s, release };
  if (o.applied?.length) s = { ...s, applied: appliedPaths(spec, s.applied, o.applied) };
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
  // A version 2 close is the summary itself: no per-spec release or Kaizen document to point to (MDO-0011 D5).
  const perSpec = specLogInCache(spec.dir)
    ? []
    : [
        { label: 'Release notes', file: join(root, config.paths.releases, id, 'release-notes.md') },
        { label: 'Technical notes', file: join(root, config.paths.releases, id, 'technical.md') },
        { label: 'Kaizen', file: join(root, 'docs', 'kaizen', `${id}.md`) },
      ];
  const candidates = [
    ...perSpec,
    { label: 'Verify report', file: join(spec.dir, 'verify-report.md') },
    { label: 'Quickstart', file: join(spec.dir, 'quickstart.md') },
  ];
  return candidates
    .filter((c) => existsSync(c.file))
    .map((c) => ({ label: c.label, href: relative(spec.dir, c.file).split(sep).join('/') }));
}

/** The Outcome section: each criterion as `release-status` reports it, never upgraded by hand. */
function outcomeOf(config: ReturnType<typeof readConfig>, spec: SpecFolder): string[] {
  if (!spec.story) return [];
  const committed = commitState(spec, config.commits.trailers).committed;
  const verify = verifyResults(readIf(join(spec.dir, 'verify-report.md')));
  return acStatus(spec.story, spec.tasks, spec.execution, committed, verify).map((c) => `- ${c.ref}: ${c.status} (${c.why})`);
}

/** A version 2 close writes the document and, once closed, the spec's one CHANGELOG line (MDO-0011 D5). */
function writeCloseDocument(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder, summary: CloseSummary) {
  const file = join(spec.dir, 'close-summary.md');
  writeText(file, renderCloseDocument(summary, readIf(file), outcomeOf(config, spec), closeLinks(root, config, spec)));
  if (!summary.closed_at || !spec.story) return;
  const log = join(root, 'docs', 'CHANGELOG.md');
  const href = `${relative(join(root, 'docs'), spec.dir).split(sep).join('/')}/`;
  const line = changelogLine(spec.story.meta.id, spec.story.title, spec.story.meta.type, summary.closed_at, href);
  writeText(log, upsertChangelog(readIf(log), spec.story.meta.id, line));
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
    .option(
      '--applied <path>',
      'an approved edit outside the spec folder; the close commit stages it (repeatable)',
      (v, all: string[] = []) => [...all, v],
    )
    .option('--published <record>', 'after a publication: "<target>|<kind>|<id>|<hash>[|<url>]"')
    .action((ref: string, o: SummaryOptions) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      if (o.closed) {
        const open = closePremiseFindings(spec);
        if (open.length) throw new Error(`cannot close with unresolved ASSUMPTION or CONFLICT: ${open.join(' | ')}`);
      }
      const summary = updatedSummary(config, spec, o);
      if (specLogInCache(spec.dir)) writeCloseDocument(ctx.root(), config, spec, summary);
      else writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary, closeLinks(ctx.root(), config, spec)));
      // A version 2 spec's local cache goes at close, unless `logs.level: full` keeps it (MDO-0011 D3).
      if (o.closed) dropLogCache(spec.dir, config.logs.level);
      json(summary);
    });
}

function registerImpacts(run: Command, ctx: CliContext) {
  run
    .command('impacts <spec>')
    .description('Constitution and product changes design.md proposed, for close to apply with approval')
    .action((ref: string) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const design = readIf(docPath(spec.dir, 'design')) ?? '';
      json({ constitution: impactItems(design, 'Constitution Impact'), product: impactItems(design, 'Product Impact') });
    });
}

/** Close scripts (design §18): Kaizen, the close summary, release status and impacts. */
export function registerClose(run: Command, ctx: CliContext) {
  registerKaizen(run, ctx);
  registerSummary(run, ctx);
  registerReleaseStatus(run, ctx);
  registerImpacts(run, ctx);
  registerPublish(run, ctx);
  registerPrPlan(run, ctx);
}

/**
 * Paths that do not count toward a PR's size (ADR 0028, MDO-0004): the spec folders, release docs, Kaizen,
 * diagrams, and every file Mandao generates (from the lock).
 */
function notCode(root: string, config: ReturnType<typeof readConfig>, spec: SpecFolder): (path: string) => boolean {
  const generated = new Set(readLock(join(root, LOCK_FILE))?.files.map((f) => f.path) ?? []);
  // A version 2 close writes the changelog and lessons, not per-spec release or Kaizen documents (MDO-0011 D5).
  const v2 = specLogInCache(spec.dir);
  const folders = [config.paths.specs, ...(v2 ? [] : [config.paths.releases, 'docs/kaizen']), 'docs/diagrams'].map(
    (d) => `${d.replace(/\/$/, '')}/`,
  );
  const files = new Set(v2 ? ['docs/CHANGELOG.md', 'docs/kaizen/lessons.md'] : []);
  return (path) => generated.has(path) || files.has(path) || folders.some((d) => path.startsWith(d));
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
      const skip = notCode(ctx.root(), config, spec);
      const sizes = new Map(spec.tasks.map((t) => [t.id, commitsSize(repo, byTask.get(t.id) ?? [], skip)]));
      const limits = sizeLimits(config.size_limits).pr;
      json(
        prPlan({
          tasks: spec.tasks,
          waves: planTasks(spec.tasks).waves,
          sizes,
          limits,
          polyrepo: config.workspace === 'polyrepo',
          deliveries: splitDeliveries(spec.tasks),
        }),
      );
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
      json(
        publishPlan(
          ctx.root(),
          join(ctx.root(), config.paths.releases, id),
          spec.dir,
          o.target,
          summaryOf(spec),
          specLogInCache(spec.dir) ? 2 : 1,
        ),
      );
    });
}
