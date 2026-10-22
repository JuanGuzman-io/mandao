import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCK_FILE, readLock } from '../engine/files.js';
import { parseFrontmatter } from '../engine/frontmatter.js';
import type { Choice, ResolvedModels } from '../models/resolve.js';
import type { HarnessId } from '../schemas/index.js';
import type { CrossReviewer } from '../spec/index.js';
import { changedFiles } from './commits.js';
import type { Identity } from './identity.js';

/** Harnesses Mandao can launch as a read-only reviewer process (ADR 0021). */
export const REVIEW_PROCESSES = ['codex', 'claude', 'opencode'] as const;
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
  if (harness === 'opencode') {
    // OpenCode 2 (ADR 0025): the effort is the model's variant (`provider/model#variant`) and the folder is
    // the process's cwd. The agent's permissions deny edit and shell: read-only by its definition.
    return { bin: 'opencode', args: ['run', '--agent', 'mandao-reviewer', '-m', effort ? `${choice.model}#${effort}` : choice.model] };
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

const REVIEWER_FILES: Record<ReviewProcess, string> = {
  codex: '.codex/agents/mandao-reviewer.toml',
  claude: '.claude/agents/mandao-reviewer.md',
  opencode: '.opencode/agents/mandao-reviewer.md',
};

/** The reviewer persona as that harness renders it, so the separate process reviews like the agent would. */
export function reviewerInstructions(root: string, harness: ReviewProcess): string {
  const file = join(root, REVIEWER_FILES[harness]);
  if (!existsSync(file)) throw new Error(`${file} does not exist: add the harness first (\`mandao harness add ${harness}\`)`);
  const text = readFileSync(file, 'utf8');
  if (harness !== 'codex') return parseFrontmatter(text).content.trim();
  const body = text.match(/developer_instructions\s*=\s*'''\n?([\s\S]*?)'''/)?.[1];
  if (!body) throw new Error(`${file} has no developer_instructions`);
  return body.trim();
}

type Receipt = { path: string; hash: string; origin: string };
const digest = (text: string) => createHash('sha256').update(text).digest('hex');

function diagramReceipt(repo: string, file: string, content: string): Receipt | undefined {
  const match = /^docs\/diagrams\/(.+?)(?:-(?:light|dark))?\.svg$/.exec(file);
  if (!match) return undefined;
  const name = match[1]!.replace(/-(?:light|dark)$/, '');
  try {
    const sourcePath = join(repo, 'docs', 'diagrams', 'src', `${name}.json`);
    const record = JSON.parse(readFileSync(sourcePath, 'utf8')) as {
      spec?: unknown;
      specSha256?: string;
      derivedFrom?: { path: string; sha256: string }[];
      svgSha256?: { light?: string; dark?: string };
    };
    const sources = record.derivedFrom ?? [];
    const sourcesMatch =
      sources.length > 0 &&
      sources.every((source) => {
        const path = join(repo, source.path);
        return existsSync(path) && digest(readFileSync(path, 'utf8')) === source.sha256;
      });
    const specMatches = Boolean(record.spec) && digest(JSON.stringify(record.spec)) === record.specSha256;
    const markerMatches = content.includes(`mandao:diagram ${name} spec-sha256 ${record.specSha256}`);
    const theme = file.endsWith('-dark.svg') ? 'dark' : 'light';
    const outputMatches = record.svgSha256?.[theme] === digest(content);
    return sourcesMatch && specMatches && markerMatches && outputMatches
      ? { path: file, hash: digest(content), origin: `docs/diagrams/src/${name}.json` }
      : undefined;
  } catch {
    return undefined;
  }
}

/** Source diff plus verifiable receipts for generated harness copies and source-derived diagrams. */
export function reviewDiff(repo: string, specDir: string): string {
  const files = changedFiles(repo, specDir);
  if (!files.length) return '(no changes)';
  const git = (args: string[]) => execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const untracked = new Set(
    git(['ls-files', '--others', '--exclude-standard', '--', ...files])
      .split('\n')
      .filter(Boolean),
  );
  const lock = (() => {
    try {
      return readLock(join(repo, LOCK_FILE));
    } catch {
      return undefined;
    }
  })();
  const receipts: { path: string; hash: string; origin: string }[] = [];
  const included: string[] = [];
  const generatedByLock = new Map((lock?.files ?? []).filter((f) => f.ownership === 'owned').map((f) => [f.path, f]));
  for (const file of files) {
    const full = join(repo, file);
    if (!existsSync(full)) {
      included.push(file);
      continue;
    }
    const content = readFileSync(full, 'utf8');
    const lockEntry = generatedByLock.get(file);
    if (lockEntry && `sha256-${createHash('sha256').update(content).digest('base64')}` === lockEntry.hash) {
      receipts.push({ path: file, hash: digest(content), origin: lockEntry.from });
      continue;
    }
    const diagram = diagramReceipt(repo, file, content);
    if (diagram) {
      receipts.push(diagram);
      continue;
    }
    included.push(file);
  }
  const untrackedIncluded = included.filter((f) => untracked.has(f));
  const trackedIncluded = included.filter((f) => !untracked.has(f));
  const diff = trackedIncluded.length ? git(['diff', 'HEAD', '--', ...trackedIncluded]) : '';
  const added = untrackedIncluded.map((f) => `--- /dev/null\n+++ b/${f} (new file)\n${readFileSync(join(repo, f), 'utf8')}`);
  return [
    diff,
    ...added,
    ...(receipts.length
      ? ['## Generated file receipts\n', ...receipts.map((r) => `- ${r.path} · sha256 ${r.hash} · from ${r.origin}`)]
      : []),
  ]
    .filter(Boolean)
    .join('\n');
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
    'Answer with a line `VERDICT: PASS` or `VERDICT: FAIL`, then a required `## Findings (JSON)` heading and a ```json block shaped as `{"version":1,"findings":[{"id":"F1","status":"open|resolved","severity":"low|medium|high|critical","lens":"core|security|performance|data|accessibility|ai","title":"...","file":"path","line":1,"evidence":"..."}]}`. Include every finding, including resolved findings; use an empty array when there are none. A PASS is forbidden when any finding is open, security, and high or critical. Follow the JSON with any concise advisory prose; guard decisions use only this validated structure.',
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
