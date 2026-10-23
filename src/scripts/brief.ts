import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ResolvedModels } from '../models/resolve.js';
import { buildCommand, type Config, type RiskTag } from '../schemas/index.js';
import { type LoopContext, type LoopState, loopState, type Task } from '../spec/index.js';
import {
  detectRunner,
  fillCommand,
  graphFile,
  type ImpactSelection,
  projectDir,
  readGraph,
  reverseDependents,
  selectImpact,
} from './impact.js';
import { changedRedTests } from './red.js';
import type { SpecFolder } from './spec.js';

/** Risk tags → review lenses (rules/review.md). */
export const LENSES: Record<RiskTag, string[]> = {
  auth: ['security'],
  security: ['security'],
  input: ['security'],
  pii: ['security', 'data'],
  payments: ['security'],
  data: ['data'],
  'public-api': ['security'],
  infra: ['security'],
  migration: ['data'],
  perf: ['performance'],
  ui: ['accessibility'],
  'ai-prompt': ['ai'],
};

export interface Brief {
  spec: string;
  task: Task;
  acceptance: { ref: string; text: string }[];
  scenarios: { ref: string; text: string }[];
  decisions: { ref: string; text: string }[];
  coverageChecklist: { ref: string; kind: 'acceptance' | 'scenario' }[];
  project: { name: string; path: string; gates: Record<string, string> };
  skillMap: string[];
  lenses: string[];
  loop: LoopState;
  impact: ImpactSelection & { commandForBudget?: string };
  /**
   * Code-graph context for roles without a shell (the Reviewer cannot run `graphify query`): files that
   * depend directly on the task's files. Absent when there is no graph (ADR 0021).
   */
  graph?: { source: 'graphify'; dependents: string[] };
  /** Tests recorded red for this task and those changed since (ADR 0022); the Reviewer judges changes. */
  redTests?: { files: string[]; changed: string[] };
}

function redTests(root: string, spec: SpecFolder, task: string): Pick<Brief, 'redTests'> {
  const entry = spec.progress?.red_tests.find((r) => r.task === task);
  return entry ? { redTests: { files: entry.files.map((f) => f.path), changed: changedRedTests(root, spec.progress, task) } } : {};
}

/** Rows of the `## Skill Map` table in the root AGENTS.md. */
export function skillMapRows(root: string): string[] {
  const file = join(root, 'AGENTS.md');
  if (!existsSync(file)) return [];
  const text = readFileSync(file, 'utf8');
  const section = text.split(/^## Skill Map\s*$/m)[1]?.split(/^## /m)[0] ?? '';
  return section.split('\n').filter((l) => /^\|/.test(l) && !/^\|\s*-/.test(l) && !/^\|\s*Skill\s*\|/.test(l));
}

function acceptance(spec: SpecFolder, task: Task) {
  return task.ac.map((ref) => {
    const [acId, clause] = ref.split('/');
    const ac = spec.story?.acs.find((a) => a.id === acId);
    const text = clause ? ac?.clauses.find((c) => c.id === clause)?.text : ac?.clauses.map((c) => c.text).join(' · ');
    return { ref, text: text ?? 'NOT FOUND in story.md' };
  });
}

function scenarios(spec: SpecFolder, task: Task) {
  const all = spec.requirements?.requirements.flatMap((r) => r.scenarios) ?? [];
  return task.scenarios.map((ref) => {
    const [sid, clause] = ref.split('/');
    const sc = all.find((s) => s.id === sid);
    const text = clause ? sc?.clauses.find((c) => c.id === clause)?.text : sc?.clauses.map((c) => c.text).join(' · ');
    return { ref, text: text ?? 'NOT FOUND in requirements.md' };
  });
}

function decisions(spec: SpecFolder, task: Task) {
  const design = spec.design ?? '';
  return task.decisions.map((ref) => {
    const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const match = new RegExp(`^###\\s+(${escaped})(?:\\s+[—–-]\\s+.*)?\\s*$`, 'm').exec(design);
    if (!match || match.index === undefined) return { ref, text: 'NOT FOUND in design document' };
    const start = match.index + match[0].length;
    const rest = design.slice(start).replace(/^\s*\n/, '');
    return { ref, text: rest.split(/^#{1,3}\s+/m)[0]!.trim() };
  });
}

/** The scoped brief the Leader hands to the Implementer, and the rules the Reviewer applies. */
export function composeBrief(
  root: string,
  config: Config,
  spec: SpecFolder,
  task: Task,
  models: ResolvedModels | undefined,
  harness: string,
  workers: number,
  loop: LoopContext = {},
): Brief {
  const project = config.projects.find((p) => p.name === task.project) ?? config.projects[0]!;
  const dir = projectDir(root, project.path);
  const graph = readGraph(graphFile(root));
  const runner = detectRunner(dir);
  const impact = selectImpact({
    changed: task.files,
    projectPath: project.path,
    ...(project.tests.impacted ? { configured: project.tests.impacted } : {}),
    ...(runner ? { runner } : {}),
    ...(graph ? { graph } : {}),
  });
  return {
    spec: spec.name,
    task,
    acceptance: acceptance(spec, task),
    scenarios: scenarios(spec, task),
    decisions: decisions(spec, task),
    coverageChecklist: [
      ...task.ac.map((ref) => ({ ref, kind: 'acceptance' as const })),
      ...task.scenarios.map((ref) => ({ ref, kind: 'scenario' as const })),
    ],
    project: {
      name: project.name,
      path: project.path,
      gates: { ...project.gates, ...(buildCommand(project) ? {} : { build: undefined }) } as Record<string, string>,
    },
    skillMap: skillMapRows(root),
    lenses: [...new Set(task.risk_tags.flatMap((t) => LENSES[t]))],
    loop: loopState(task, spec.execution, models, harness, loop),
    impact: { ...impact, ...(impact.command ? { commandForBudget: fillCommand(impact.command, impact.files, workers) } : {}) },
    ...(graph ? { graph: { source: 'graphify' as const, dependents: reverseDependents(graph, task.files, 1) } } : {}),
    ...redTests(root, spec, task.id),
  };
}
