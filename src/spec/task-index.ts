import type { Story } from './story.js';
import { LEGACY_TASK_FIELDS, type Task } from './tasks.js';

/**
 * tasks.md in two layers (readability pass): `## Overview`, generated from the details and grouped by
 * acceptance criteria with a checkpoint per group, then `## Details`, one section per task.
 */
export const OVERVIEW = '## Overview';
export const DETAILS = '## Details';
const MAX_DONE_WHEN = 5;

const topAcs = (t: Task) => [...new Set(t.ac.map((a) => a.split('/')[0]!))];

function groupGoal(acs: string[], story?: Story): string {
  const titles = acs.map((id) => story?.acs.find((a) => a.id === id)?.title).filter(Boolean);
  return titles.length ? titles.join('; ') : acs.join(', ');
}

function checkpoint(group: Task[], acs: string[]): string {
  const runs = [...new Set(group.map((t) => t.verify).filter((v): v is string => Boolean(v)))];
  const ids = group.map((t) => t.id).join(', ');
  const confirm = acs.length ? acs.join(', ') : 'the group';
  return runs.length
    ? `**Checkpoint:** ${runs.map((r) => `\`${r}\``).join(' and ')} passes (${ids}); this confirms ${confirm} before the next group.`
    : `**Checkpoint:** review ${ids} against ${confirm} before the next group.`;
}

/** The Overview section's body, generated from the tasks: what `mandao run tasks --index` prints. */
export function taskIndex(tasks: Task[], story?: Story): string {
  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const key = topAcs(t).join(', ');
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const blocks = [...groups].map(([key, group]) => {
    const acs = key ? key.split(', ') : [];
    const lines = group.map((t) => {
      const tags = [acs.length ? `[${acs.join(', ')}]` : '', t.parallel_safe ? '[P]' : ''].filter(Boolean).join(' ');
      const file = t.files[0] ? ` — \`${t.files[0]}\`` : '';
      return `- [${t.done ? 'x' : ' '}] ${t.id} ${tags ? `${tags} ` : ''}${t.title}${file}`;
    });
    return [`### ${key || 'No acceptance criterion'} — ${groupGoal(acs, story)}`, '', ...lines, '', checkpoint(group, acs)].join('\n');
  });
  return blocks.join('\n\n');
}

/** The text of a `## ` section, without its heading, or undefined when the file has none. */
export function section(markdown: string, heading: string): string | undefined {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start < 0) return undefined;
  const end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n');
}

const squash = (s: string) => s.replace(/\s+/g, ' ').trim();

/** Lines of one task's section in Details, from its heading to the next task or section. */
function taskSection(lines: string[], task: Task): string[] {
  const start = lines.findIndex((l) => new RegExp(`^###\\s+\\[[ xX]\\]\\s+${task.id}\\s*[—–-]`).test(l));
  if (start < 0) return [];
  const end = lines.findIndex((l, i) => i > start && /^#{2,3}\s/.test(l));
  return lines.slice(start, end < 0 ? undefined : end);
}

/** Bullets under `- **Done when:**`, until the next top-level bullet or block. */
function doneWhenCount(lines: string[]): number {
  const at = lines.findIndex((l) => /^- \*\*Done when:?\*\*/.test(l));
  if (at < 0) return 0;
  let n = 0;
  for (const l of lines.slice(at + 1)) {
    if (/^\s{2,}[-*] /.test(l)) n++;
    else if (l.trim() && !/^\s{2,}/.test(l)) break;
  }
  return n;
}

const PATH_IN_TITLE = /`[^`]*[./][^`]*`|\b[\w-]+\/[\w./-]+|\b[\w-]+\.(?:[cm]?[jt]sx?|md|py|go|java|kt|rb|cs|ya?ml|json)\b/;

function taskIssues(lines: string[], task: Task): string[] {
  const out: string[] = [];
  if (PATH_IN_TITLE.test(task.title)) out.push(`${task.id}: the title names a file; say the result instead`);
  const legacy = LEGACY_TASK_FIELDS.filter((f) => new RegExp(`^${f}:`, 'm').test(taskSection(lines, task).join('\n')));
  if (legacy.length) out.push(`${task.id}: prose fields in YAML (${legacy.join(', ')}): use test_levels, evidence and Done when`);
  const done = doneWhenCount(taskSection(lines, task));
  if (done > MAX_DONE_WHEN) out.push(`${task.id}: Done when has ${done} bullets; at most ${MAX_DONE_WHEN}`);
  const levels = task.test_levels ?? {};
  const missing = task.scenarios.filter((s) => !(s in levels));
  if (missing.length) out.push(`${task.id}: no test level for ${missing.join(', ')}`);
  const extra = Object.keys(levels).filter((s) => !task.scenarios.includes(s));
  if (extra.length) out.push(`${task.id}: test_levels names scenarios the task does not cite: ${extra.join(', ')}`);
  return out;
}

/** Version 1 only: a lite `spec.md` carries its tasks inline, up to this many; more go to `tasks.md`. */
export const MAX_INLINE_TASKS = 3;

/**
 * Layout rules of the two-layer tasks.md, and of tasks inline in a lite `spec.md` (no Overview there).
 * Files in the older one-layer layout (no `## Details`) are not held to them: they predate it.
 */
export function taskLayoutIssues(markdown: string, tasks: Task[], story?: Story, opts: { inline?: boolean } = {}): string[] {
  if (opts.inline) {
    if (!tasks.length) return [];
    const lines = markdown.split('\n');
    const over =
      tasks.length > MAX_INLINE_TASKS ? [`spec.md: ${tasks.length} tasks inline; more than ${MAX_INLINE_TASKS} go to tasks.md`] : [];
    return [...over, ...tasks.flatMap((t) => taskIssues(lines, t))];
  }
  if (section(markdown, DETAILS) === undefined) return [];
  const issues: string[] = [];
  if (/<!--[\s\S]*?\S[\s\S]*?-->/.test(markdown)) issues.push('tasks.md: HTML comments are not allowed; write the text or drop it');
  const overview = section(markdown, OVERVIEW);
  if (overview === undefined) issues.push(`tasks.md: no ${OVERVIEW}; run \`mandao run tasks <spec> --index --write\``);
  else if (squash(overview) !== squash(taskIndex(tasks, story)))
    issues.push(`tasks.md: ${OVERVIEW} does not match the details; run \`mandao run tasks <spec> --index --write\``);
  const lines = markdown.split('\n');
  for (const t of tasks) issues.push(...taskIssues(lines, t));
  return issues;
}

/** tasks.md with its Overview replaced by the generated index (created before Details when missing). */
export function withIndex(markdown: string, tasks: Task[], story?: Story): string {
  const body = `\n${taskIndex(tasks, story)}\n\n`;
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => l.trim() === OVERVIEW);
  if (start >= 0) {
    const end = lines.findIndex((l, i) => i > start && /^##\s/.test(l));
    return [...lines.slice(0, start + 1), body.replace(/\n$/, ''), ...lines.slice(end < 0 ? lines.length : end)].join('\n');
  }
  const details = lines.findIndex((l) => l.trim() === DETAILS);
  if (details < 0) return markdown;
  return [...lines.slice(0, details), OVERVIEW, body.replace(/\n$/, ''), ...lines.slice(details)].join('\n');
}
