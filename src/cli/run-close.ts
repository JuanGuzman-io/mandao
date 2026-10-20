import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { branchingFor } from '../scripts/branching.js';
import { fixCommitsAfter, forcedRunCount, releaseBranchesContaining } from '../scripts/close.js';
import { repoRoot, taskCommits } from '../scripts/commits.js';
import { findSpec, readSpec, type SpecFolder } from '../scripts/spec.js';
import {
  type BugsAfterMerge,
  type CloseSummary,
  compareTdd,
  parseCloseSummary,
  renderCloseSummary,
  specMetrics,
  withEnvironment,
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
  return specMetrics(spec.name, spec.tasks, spec.execution, forcedRunCount(readIf(join(spec.dir, 'execution.md'))), bugs);
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
      const specs = existsSync(dir) ? readdirSync(dir).filter((d) => existsSync(join(dir, d, 'execution.md'))) : [];
      const metrics = specs.map((d) => metricsOf(config, readSpec(join(dir, d))));
      json({ ...compareTdd(metrics, config.kaizen.min_specs_per_group), specs: metrics });
    });
}

interface SummaryOptions {
  closed?: boolean;
  release?: string;
  detectRelease?: boolean;
  env?: string;
  source?: 'ci' | 'tracker';
}

function updatedSummary(config: ReturnType<typeof readConfig>, spec: SpecFolder, o: SummaryOptions): CloseSummary {
  let s = summaryOf(spec);
  const now = new Date().toISOString();
  if (o.closed && !s.closed_at) s = { ...s, closed_at: now };
  if (o.release) s = { ...s, release: { branch: o.release, how: 'given' } };
  if (o.detectRelease && spec.story) {
    const shas = [...taskCommits(repoRoot(spec.dir), spec.story.meta.id, config.commits.trailers).values()].flat();
    const found = releaseBranchesContaining(repoRoot(spec.dir), shas, branchingFor(config).prefixes.release);
    if (found.length === 1) s = { ...s, release: { branch: found[0]!, how: 'detected' } };
    else if (found.length > 1) throw new Error(`several release branches contain the spec: ${found.join(', ')}; pick one with --release`);
  }
  if (o.env) {
    if (!o.source) throw new Error('--env needs --source ci|tracker: an environment is recorded only as CI or the tracker reported it');
    s = withEnvironment(s, o.env, o.source, now);
  }
  return s;
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
    .action((ref: string, o: SummaryOptions) => {
      const config = readConfig(ctx.root());
      const spec = readSpec(findSpec(ctx.root(), config, ref));
      const summary = updatedSummary(config, spec, o);
      writeText(join(spec.dir, 'close-summary.md'), renderCloseSummary(summary));
      json(summary);
    });
}

/** Close scripts (design §18): Kaizen measures and the close summary. */
export function registerClose(run: Command, ctx: CliContext) {
  registerKaizen(run, ctx);
  registerSummary(run, ctx);
}
