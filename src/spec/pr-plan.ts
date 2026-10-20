import type { Task } from './tasks.js';

/** Real size of a task: the files and changed lines of its commits (found by trailers). */
export interface TaskSize {
  files: string[];
  changedLines: number;
}

export interface PullRequest {
  name: string;
  tasks: string[];
  projects: string[];
  files: number;
  changedLines: number;
}

export interface PrPlan {
  decision: 'single' | 'per-repo' | 'stacked';
  reasons: string[];
  prs: PullRequest[];
}

interface PrPlanInput {
  tasks: Task[];
  /** Dependency waves of the tasks (`planTasks`), earliest first. */
  waves: string[][];
  sizes: Map<string, TaskSize>;
  limits: { max_files: number; max_changed_lines: number };
  polyrepo: boolean;
}

function pr(name: string, ids: string[], tasks: Task[], sizes: Map<string, TaskSize>): PullRequest {
  const own = tasks.filter((t) => ids.includes(t.id));
  const files = new Set(ids.flatMap((id) => sizes.get(id)?.files ?? []));
  return {
    name,
    tasks: ids,
    projects: [...new Set(own.map((t) => t.project))].sort(),
    files: files.size,
    changedLines: ids.reduce((n, id) => n + (sizes.get(id)?.changedLines ?? 0), 0),
  };
}

/**
 * How to deliver a spec (design §14.1, ADR 0028): from the task dependency structure, the projects
 * touched and the real size of the commits — never from an estimate. One PR per repository in a
 * polyrepo; one PR within `size_limits.pr`; above it, stacked PRs along the dependency waves (or per
 * project), in order. Nothing here is written to the spec.
 */
export function prPlan(input: PrPlanInput): PrPlan {
  const { tasks, sizes, limits } = input;
  const all = tasks.map((t) => t.id);
  const whole = pr('all', all, tasks, sizes);
  const projects = whole.projects;
  if (input.polyrepo && projects.length > 1) {
    return {
      decision: 'per-repo',
      reasons: [`polyrepo: ${projects.length} repositories, one PR each`],
      prs: projects.map((p) =>
        pr(
          p,
          tasks.filter((t) => t.project === p).map((t) => t.id),
          tasks,
          sizes,
        ),
      ),
    };
  }
  const over = [
    ...(whole.files > limits.max_files ? [`${whole.files} files changed (limit ${limits.max_files})`] : []),
    ...(whole.changedLines > limits.max_changed_lines ? [`${whole.changedLines} lines changed (limit ${limits.max_changed_lines})`] : []),
  ];
  if (!over.length) return { decision: 'single', reasons: ['within size_limits.pr'], prs: [whole] };
  const waves = input.waves.filter((w) => w.length);
  if (waves.length > 1) {
    return {
      decision: 'stacked',
      reasons: [...over, `split along ${waves.length} dependency waves`],
      prs: waves.map((w, i) => pr(`wave ${i + 1}`, w, tasks, sizes)),
    };
  }
  if (projects.length > 1) {
    return {
      decision: 'stacked',
      reasons: [...over, `split per project (${projects.join(', ')})`],
      prs: projects.map((p) =>
        pr(
          p,
          tasks.filter((t) => t.project === p).map((t) => t.id),
          tasks,
          sizes,
        ),
      ),
    };
  }
  return {
    decision: 'single',
    reasons: [...over, 'no dependency or project structure to split along: one PR, and say so to the reviewers'],
    prs: [whole],
  };
}
