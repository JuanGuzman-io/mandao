import { readConfig } from '../engine/files.js';
import { readRecommendations, resolveWorkspaceModels } from '../models/load.js';
import type { HarnessId } from '../schemas/index.js';
import { HARNESS_IDS } from '../schemas/index.js';
import { commitState } from '../scripts/commits.js';
import { detectRunner, findScanners, graphFile, projectDir, readGraph, selectImpact } from '../scripts/impact.js';
import { crossReviewers } from '../scripts/review.js';
import { findSpec, readSpec } from '../scripts/spec.js';
import type { LoopContext } from '../spec/index.js';
import { onPath } from '../util/which.js';
import type { CliContext } from './context.js';

/** What the spec scripts share: the spec, its project, models and loop context for a harness. */
export function harnessOption(value: string | undefined): HarnessId {
  const h = value ?? 'claude';
  if (!(HARNESS_IDS as readonly string[]).includes(h)) throw new Error(`Unknown harness "${h}"`);
  return h as HarnessId;
}

export function loadSpec(ctx: CliContext, ref: string) {
  const config = readConfig(ctx.root());
  return { config, spec: readSpec(findSpec(ctx.root(), config, ref)) };
}

export function modelsFor(ctx: CliContext, harness: HarnessId, project?: string) {
  const config = readConfig(ctx.root());
  const p = project ? config.projects.find((x) => x.name === project) : undefined;
  return resolveWorkspaceModels(ctx.root(), config, readRecommendations(), p ? { project: p } : {})[harness];
}

/** What the loop needs beyond the log: the commit found by trailers, and other harnesses' reviewers. */
export function loopContext(
  ctx: CliContext,
  spec: ReturnType<typeof loadSpec>['spec'],
  task: string,
  harness: HarnessId,
  project?: string,
): LoopContext {
  const config = readConfig(ctx.root());
  const p = project ? config.projects.find((x) => x.name === project) : undefined;
  const all = resolveWorkspaceModels(ctx.root(), config, readRecommendations(), p ? { project: p } : {});
  return {
    committed: commitState(spec, config.commits.trailers).committed.has(task),
    alternatives: crossReviewers(config.harnesses, harness, all, onPath),
  };
}

export function projectNamed(ctx: CliContext, name: string) {
  const project = readConfig(ctx.root()).projects.find((p) => p.name === name);
  if (!project) throw new Error(`Unknown project "${name}"`);
  return project;
}

/** Impacted unit tests for changed files in one project. */
export function impactFor(ctx: CliContext, project: ReturnType<typeof projectNamed>, files: string[]) {
  const runner = detectRunner(projectDir(ctx.root(), project.path));
  const graph = readGraph(graphFile(ctx.root()));
  return selectImpact({
    changed: files,
    projectPath: project.path,
    ...(project.tests.impacted ? { configured: project.tests.impacted } : {}),
    ...(runner ? { runner } : {}),
    ...(graph ? { graph } : {}),
    scanners: findScanners(ctx.root(), project.path),
  });
}
