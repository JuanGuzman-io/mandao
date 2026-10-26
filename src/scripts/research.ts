import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { researchToolCapabilities } from '../engine/research-tools.js';
import type { Config, HarnessId } from '../schemas/index.js';
import { type ResearchEntry, researchDocumentSchema } from '../schemas/research.js';
import { frontmatterOf } from '../spec/index.js';
import { researchQuestions, reusableResearch, verifiedReusedResearchReferences } from '../spec/research.js';
import { findSpec, readSpec } from './spec.js';

/** Collects open research, the configured question cap, and reusable current evidence before delegation. */
export function researchContext(root: string, config: Config, ref: string, selected?: string[], harness: HarnessId = 'claude') {
  const dir = findSpec(root, config, ref);
  const spec = readSpec(dir);
  const docs = [spec.story?.raw, spec.requirements?.raw, spec.design].filter((text): text is string => Boolean(text));
  const report = researchQuestions(docs, config.research.max_questions, selected);
  const candidates = workspaceResearchCandidates(root, config, dir);
  const questions = report.questions.map((question) => ({
    ...question,
    reusable: reusableResearch(
      candidates,
      question.topic,
      question.topic_type,
      new Date().toISOString().slice(0, 10),
      config.research.expires_months,
    ),
  }));
  const capabilities = researchToolCapabilities(root, [harness], config.research.web_search_servers);
  return {
    spec: spec.name,
    harness,
    max_questions: config.research.max_questions,
    capabilities,
    unverified_without_search: !capabilities[0]?.webSearchAvailable,
    needs_priority: report.needsPriority,
    selection_issues: report.selectionIssues,
    questions,
    dispatchable: report.dispatchable.map((item) => item.id),
  };
}

/** Loads validly shaped research entries from other specs as possible reuse sources. */
export function workspaceResearchCandidates(root: string, config: Config, excludeDir?: string): { source: string; entry: ResearchEntry }[] {
  const base = join(root, config.paths.specs);
  const candidates: { source: string; entry: ResearchEntry }[] = [];
  if (!existsSync(base)) return candidates;
  for (const folder of readdirSync(base, { withFileTypes: true }).filter((item) => item.isDirectory())) {
    const previous = join(base, folder.name);
    if (previous === excludeDir) continue;
    const file = join(previous, 'research.md');
    if (!existsSync(file)) continue;
    const parsed = researchDocumentSchema.safeParse(frontmatterOf(readFileSync(file, 'utf8')).data);
    if (!parsed.success) continue;
    for (const entry of parsed.data.entries) candidates.push({ source: `${relative(root, file)}#${entry.id}`, entry });
  }
  return candidates;
}

/** Independently validates reused evidence references against current entries in other specs. */
export function verifiedReuseReferences(root: string, config: Config, currentSpecDir: string, document: unknown): string[] {
  const parsed = researchDocumentSchema.safeParse(document);
  if (!parsed.success) return [];
  return verifiedReusedResearchReferences(
    parsed.data.entries,
    workspaceResearchCandidates(root, config, currentSpecDir),
    new Date().toISOString().slice(0, 10),
    config.research.expires_months,
  );
}
