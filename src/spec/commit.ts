import type { Config } from '../schemas/index.js';
import type { Story } from './story.js';
import type { Task } from './tasks.js';

export interface CommitMessage {
  header: string;
  trailers: string[];
  text: string;
  /** Problems the commitlint config would reject. */
  issues: string[];
}

const TYPE_BY_SPEC: Record<string, keyof Config['commits']['emoji']> = { bug: 'fix', performance: 'perf' };

/** Header and trailers for a task's commit, following rules/commits.md and the configured emoji map. */
export function commitMessage(config: Config, story: Story, task: Task, subject: string, breaking = false): CommitMessage {
  const type = TYPE_BY_SPEC[story.meta.type] ?? 'feat';
  const emoji = breaking ? config.commits.emoji.breaking : config.commits.emoji[type];
  const scope = config.projects.length > 1 ? task.project : (task.files[0]?.split('/').slice(-2, -1)[0] ?? task.project);
  const header = `${emoji} ${type}(${scope})${breaking ? '!' : ''}: ${subject}`;
  const t = config.commits.trailers;
  const trailers = [`${t.refs}: ${story.meta.id}`, `${t.task}: ${task.id}`, ...(task.ac.length ? [`${t.acs}: ${task.ac.join(', ')}`] : [])];
  const issues: string[] = [];
  const length = [...header.slice(emoji.length + 1)].length;
  if (length > config.commits.max_subject_length)
    issues.push(`header is ${length} characters without the emoji; the limit is ${config.commits.max_subject_length}`);
  if (/\.$/.test(subject)) issues.push('subject ends with a period');
  return { header, trailers, text: `${header}\n\n${trailers.join('\n')}\n`, issues };
}
