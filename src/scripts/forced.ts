import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Config } from '../schemas/index.js';
import { progressSchema } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { Budget, BudgetKind } from './resources.js';
import { logPath } from './spec-log.js';

/** The CLI's own log: one JSON line per event worth keeping. Machine-specific, git-ignored. */
export const CLI_LOG = '.mandao/cli.log';

export interface ForcedRun {
  at: string;
  operation: BudgetKind;
  label: string;
  /** Why the budget said no. */
  reason: string;
  /** What forced it: the `--force` flag, `MANDAO_FORCE=1` or `RG_FORCE=1`. */
  by: 'flag' | 'MANDAO_FORCE' | 'RG_FORCE';
  spec?: string;
}

/** Who asked to force a run past the budget, if anyone. */
export function forceSource(flag: boolean | undefined, env: Record<string, string | undefined> = process.env): ForcedRun['by'] | undefined {
  if (flag) return 'flag';
  if (env.MANDAO_FORCE === '1') return 'MANDAO_FORCE';
  if (env.RG_FORCE === '1') return 'RG_FORCE';
  return undefined;
}

/** A deferred budget turned into a one-worker run. Only `defer` needs forcing. */
export const forcedBudget = (b: Budget): Budget => ({
  ...b,
  decision: 'run',
  workers: Math.max(1, b.workers),
  reason: `forced: ${b.reason}`,
});

/** The spec being worked on here: the only one whose progress.yml has a task in progress. */
export function activeSpecDir(root: string, config: Config): string | undefined {
  const specs = join(root, config.paths.specs);
  if (!existsSync(specs)) return undefined;
  const active = readdirSync(specs).filter((d) => {
    const file = logPath(join(specs, d), 'progress.yml');
    if (!existsSync(file)) return false;
    const p = progressSchema.safeParse(parseYaml(readFileSync(file, 'utf8')));
    return p.success && p.data.current !== null;
  });
  return active.length === 1 ? join(specs, active[0]!) : undefined;
}

const SECTION = '## Forced runs';

/** Always in the CLI log; also in the active spec's execution.md, outside the verdict table (ADR 0024). */
export function recordForced(root: string, run: ForcedRun, specDir?: string): void {
  const log = join(root, CLI_LOG);
  const before = existsSync(log) ? readFileSync(log, 'utf8') : '';
  writeText(log, `${before}${JSON.stringify({ event: 'forced-run', ...run })}\n`);
  if (!specDir || !existsSync(logPath(specDir, 'execution.md'))) return;
  const file = logPath(specDir, 'execution.md');
  const text = readFileSync(file, 'utf8');
  const line = `- ${run.at} · ${run.operation} · ${run.label} · forced by ${run.by} · ${run.reason}`;
  writeText(file, appendToSection(text, line));
}

/** Adds a line at the end of the `## Forced runs` section, creating it at the end of the file. */
function appendToSection(text: string, line: string): string {
  const start = text.indexOf(SECTION);
  if (start < 0)
    return `${text.trimEnd()}\n\n${SECTION}\n<!-- Runs a resource budget deferred and someone forced (ADR 0024). -->\n\n${line}\n`;
  const next = text.indexOf('\n## ', start + SECTION.length);
  const end = next < 0 ? text.length : next;
  return `${text.slice(0, end).trimEnd()}\n${line}\n${next < 0 ? '' : `\n${text.slice(next + 1)}`}`;
}

/**
 * A full-suite run outside CI (`mandao run tests --full --reason …`): always in the CLI log, and in the
 * active spec's `_log/full-runs.md` with its reason, so Kaizen and the Reviewer see it (MDO-0007).
 */
export function recordFullRun(root: string, run: { at: string; project: string; reason: string; status: string }, specDir?: string): void {
  const log = join(root, CLI_LOG);
  const before = existsSync(log) ? readFileSync(log, 'utf8') : '';
  writeText(log, `${before}${JSON.stringify({ event: 'full-run', ...run })}\n`);
  if (!specDir) return;
  const file = logPath(specDir, 'full-runs.md');
  const text = existsSync(file) ? readFileSync(file, 'utf8') : '# Full-suite runs outside CI\n\n';
  writeText(file, `${text}- ${run.at} · ${run.project} · ${run.status} · ${run.reason}\n`);
}
