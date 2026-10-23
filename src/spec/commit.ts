import type { Config } from '../schemas/index.js';
import { isTestFile } from '../scripts/impact.js';
import type { Story } from './story.js';
import type { Task, TaskKind } from './tasks.js';

export interface CommitMessage {
  header: string;
  trailers: string[];
  text: string;
  /** Problems the commitlint config would reject. */
  issues: string[];
}

const TYPE_BY_SPEC: Record<string, TaskKind> = { bug: 'fix', performance: 'perf' };

const isDocsFile = (path: string) => /(^|\/)docs\//.test(path) || /\.(md|mdx|rst|txt)$/i.test(path);

/** The kind the diff itself proves: only tests → `test`, only documentation → `docs`, otherwise none. */
export function kindFromFiles(files: string[]): TaskKind | undefined {
  if (!files.length) return undefined;
  if (files.every(isTestFile)) return 'test';
  if (files.every(isDocsFile)) return 'docs';
  return undefined;
}

/** A declared kind the real diff contradicts (MDO-0005: a test-only task committed as `feat`). */
export function kindIssues(kind: TaskKind, files: string[]): string[] {
  if (!files.length) return [];
  const proven = kindFromFiles(files);
  if (proven && proven !== kind)
    return [`kind is ${kind} but every changed file is ${proven === 'test' ? 'a test' : 'documentation'}: use ${proven}`];
  if (kind === 'test' && !proven) return [`kind is test but non-test files changed: ${files.filter((f) => !isTestFile(f)).join(', ')}`];
  if (kind === 'docs' && !proven)
    return [`kind is docs but non-documentation files changed: ${files.filter((f) => !isDocsFile(f)).join(', ')}`];
  return [];
}

/** The commit type: the task's declared kind, else what the diff proves, else the spec type's default. */
export function commitType(story: Story, task: Task, files: string[] = []): TaskKind {
  return task.kind ?? kindFromFiles(files) ?? TYPE_BY_SPEC[story.meta.type] ?? 'feat';
}

/** Why an extra trailer line cannot join the block: one line, `Token: value`, and not a key Mandao writes itself. */
function trailerProblem(line: string, own: Set<string>): string | undefined {
  if (/[\r\n]/.test(line)) return `trailer ${JSON.stringify(line)} has a newline: pass one --trailer per line`;
  const key = /^([A-Za-z][A-Za-z0-9-]*):[ \t]+\S/.exec(line)?.[1];
  if (!key) return `trailer ${JSON.stringify(line)} is not shaped "Token: value"`;
  if (own.has(key.toLowerCase())) return `trailer key ${key} is one Mandao writes itself; it cannot be added or overridden`;
  return undefined;
}

/** Header and trailers for a task's commit, following rules/commits.md and the configured emoji map. */
export function commitMessage(
  config: Config,
  story: Story,
  task: Task,
  subject: string,
  breaking = false,
  files: string[] = [],
  extra: string[] = [],
): CommitMessage {
  const type = commitType(story, task, files);
  const emoji = breaking ? config.commits.emoji.breaking : config.commits.emoji[type];
  const scope = config.projects.length > 1 ? task.project : (task.files[0]?.split('/').slice(-2, -1)[0] ?? task.project);
  const header = `${emoji} ${type}(${scope})${breaking ? '!' : ''}: ${subject}`;
  const t = config.commits.trailers;
  const trailers = [`${t.refs}: ${story.meta.id}`, `${t.task}: ${task.id}`, ...(task.ac.length ? [`${t.acs}: ${task.ac.join(', ')}`] : [])];
  const issues: string[] = task.kind ? kindIssues(task.kind, files) : [];
  const own = new Set([t.refs, t.task, t.acs, t.quick].map((k) => k.toLowerCase()));
  for (const line of extra) {
    const problem = trailerProblem(line, own);
    if (problem) issues.push(problem);
    else trailers.push(line);
  }
  const length = [...header.slice(emoji.length + 1)].length;
  if (length > config.commits.max_subject_length)
    issues.push(`header is ${length} characters without the emoji; the limit is ${config.commits.max_subject_length}`);
  if (/\.$/.test(subject)) issues.push('subject ends with a period');
  return { header, trailers, text: `${header}\n\n${trailers.join('\n')}\n`, issues };
}
