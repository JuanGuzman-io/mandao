import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import type { Choice, ResolvedModels } from '../models/resolve.js';
import type { HarnessId } from '../schemas/index.js';
import type { CrossReviewer } from '../spec/index.js';
import { changedFiles } from './commits.js';
import type { Identity } from './identity.js';

/** Harnesses Mandao can launch as a read-only reviewer process (ADR 0021). */
export const REVIEW_PROCESSES = ['codex', 'claude'] as const;
export type ReviewProcess = (typeof REVIEW_PROCESSES)[number];
export const isReviewProcess = (h: string): h is ReviewProcess => (REVIEW_PROCESSES as readonly string[]).includes(h);

/** The command line, read-only by construction: the identity recorded is exactly what is passed here. */
export function reviewArgv(harness: ReviewProcess, root: string, choice: Choice): { bin: string; args: string[] } {
  const effort = choice.effort;
  if (harness === 'codex') {
    return {
      bin: 'codex',
      args: [
        'exec',
        '-C',
        root,
        '-s',
        'read-only',
        '-m',
        choice.model,
        ...(effort ? ['-c', `model_reasoning_effort=${effort}`] : []),
        '--skip-git-repo-check',
        '-',
      ],
    };
  }
  return {
    bin: 'claude',
    args: [
      '-p',
      '--model',
      choice.model,
      ...(effort ? ['--effort', effort] : []),
      '--tools',
      'Read,Grep,Glob',
      '--disallowedTools',
      'mcp__*',
      '--permission-mode',
      'plan',
    ],
  };
}

/** The reviewer persona as that harness renders it, so the separate process reviews like the agent would. */
export function reviewerInstructions(root: string, harness: ReviewProcess): string {
  const file = join(root, harness === 'codex' ? '.codex/agents/mandao-reviewer.toml' : '.claude/agents/mandao-reviewer.md');
  if (!existsSync(file)) throw new Error(`${file} does not exist: add the harness first (\`mandao harness add ${harness}\`)`);
  const text = readFileSync(file, 'utf8');
  if (harness === 'claude') return matter(text).content.trim();
  const body = text.match(/developer_instructions\s*=\s*'''\n?([\s\S]*?)'''/)?.[1];
  if (!body) throw new Error(`${file} has no developer_instructions`);
  return body.trim();
}

/** Tracked changes as a diff plus untracked files in full, outside the spec folder. */
export function taskDiff(repo: string, specDir: string): string {
  const files = changedFiles(repo, specDir);
  if (!files.length) return '(no changes)';
  const git = (args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const untracked = new Set(
    git(['ls-files', '--others', '--exclude-standard', '--', ...files])
      .split('\n')
      .filter(Boolean),
  );
  const tracked = files.filter((f) => !untracked.has(f));
  const diff = tracked.length ? git(['diff', 'HEAD', '--', ...tracked]) : '';
  const added = [...untracked].map((f) => `--- /dev/null\n+++ b/${f} (new file)\n${readFileSync(join(repo, f), 'utf8')}`);
  return [diff, ...added].filter(Boolean).join('\n');
}

export function reviewPrompt(instructions: string, brief: unknown, diff: string, gates: string): string {
  return [
    instructions,
    '---',
    'Review exactly one task. Everything you need is below; do not run tests (the Leader already did).',
    '## Brief',
    '```json',
    JSON.stringify(brief, null, 2),
    '```',
    '## Gate and impacted-test results (run by the Leader)',
    gates.trim(),
    '## Diff',
    '```diff',
    diff,
    '```',
    'Answer with a line `VERDICT: PASS` or `VERDICT: FAIL`, then blocking findings (file:line, evidence), then advisories.',
  ].join('\n\n');
}

/** The last `VERDICT: PASS|FAIL` line, tolerating Markdown emphasis. */
export function parseVerdict(output: string): 'PASS' | 'FAIL' | undefined {
  const all = [...output.matchAll(/^[\s*_#>-]*VERDICT\**\s*:\s*\**\s*(PASS|FAIL)\b/gim)];
  return all.at(-1)?.[1]?.toUpperCase() as 'PASS' | 'FAIL' | undefined;
}

export interface ReviewRun {
  identity: Identity;
  verdict?: 'PASS' | 'FAIL';
  output: string;
  exitCode: number;
}

/** Runs the reviewer process once. stdout is the review; stderr goes to ours so the user sees progress. */
export function runReview(harness: ReviewProcess, root: string, choice: Choice, prompt: string, timeoutMs = 30 * 60_000): ReviewRun {
  const { bin, args } = reviewArgv(harness, root, choice);
  const r = spawnSync(bin, args, {
    cwd: root,
    input: prompt,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    timeout: timeoutMs,
    stdio: ['pipe', 'pipe', 'inherit'],
  });
  const output = r.stdout ?? '';
  const identity: Identity = {
    harness: harness as HarnessId,
    agent: 'exec',
    model: choice.model,
    ...(choice.effort ? { effort: choice.effort } : {}),
    source: 'process',
  };
  const verdict = r.status === 0 ? parseVerdict(output) : undefined;
  return { identity, ...(verdict ? { verdict } : {}), output: r.error ? `${output}\n${r.error.message}` : output, exitCode: r.status ?? 1 };
}

/**
 * Reviewers other installed harnesses can provide as separate processes: in the workspace config and
 * with their CLI on PATH. Login is checked when the review runs, since checking costs a process.
 */
export function crossReviewers(
  harnesses: string[],
  current: string,
  models: Partial<Record<string, ResolvedModels>>,
  available: (bin: string) => boolean,
): CrossReviewer[] {
  return harnesses
    .filter((h): h is ReviewProcess => h !== current && isReviewProcess(h) && available(h))
    .flatMap((h) => {
      const m = models[h];
      const reviewer = m?.reviewer;
      return reviewer ? [{ harness: h, reviewer, ...(m.tiers[reviewer.model] ? { tier: m.tiers[reviewer.model] } : {}) }] : [];
    });
}
