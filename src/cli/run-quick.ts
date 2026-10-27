import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { agentIdentity } from '../scripts/identity.js';
import { collectDiff } from '../scripts/quick-check.js';
import { appendQuickLog } from '../scripts/quick-log.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

interface QuickLogOptions {
  project?: string;
  gates: string;
  verdict: string;
  reviewer: string;
  harness: string;
  claimedReviewer?: string;
  reducedIndependence?: boolean;
  base: string;
}

/** The short hash of the commit that added each line of a committed file; uncommitted lines have none. */
export function blameCommits(file: string): (line: number) => string | undefined {
  if (!existsSync(file)) return () => undefined;
  let out = '';
  try {
    out = execFileSync('git', ['blame', '--line-porcelain', '--', file], {
      cwd: dirname(file),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return () => undefined; // not in git yet
  }
  const hashes = [...out.matchAll(/^([0-9a-f]{40}) \d+ \d+/gm)].map((m) => m[1]!);
  return (line) => {
    const h = hashes[line];
    return h && !/^0+$/.test(h) ? h.slice(0, 7) : undefined;
  };
}

/**
 * `mandao run quick-log`: the quick-log row, with files and lines from the real diff and the reviewer's
 * model from its agent file. The model never types an identity into a record (ADR 0021, MDO-0005).
 */
export function registerQuickLog(run: Command, ctx: CliContext) {
  run
    .command('quick-log <name>')
    .description('Append the quick-log row: measured diff, gates, verdict and the reviewer identity from its agent file')
    .requiredOption('--gates <text>', 'gate results, e.g. "format, lint, test pass; secrets not installed"')
    .requiredOption('--verdict <verdict>', 'the lite review verdict: PASS | FAIL')
    .requiredOption('--reviewer <agent>', 'agent that reviewed: mandao-reviewer[@<harness>], mandao-reviewer-alt or self')
    .option('--harness <id>', 'harness running the session', 'claude')
    .option('--reduced-independence', 'the reviewer ran on the same model as the author (no alternative reviewer)')
    .option('--claimed-reviewer <text>', 'what the reviewer said about itself: compared, never recorded as the identity')
    .option('--project <name>', 'project touched (default: the only project)')
    .option('--base <ref>', 'git ref the change is measured against', 'HEAD')
    .action((name: string, o: QuickLogOptions) => {
      if (o.verdict !== 'PASS' && o.verdict !== 'FAIL') throw new Error('--verdict must be PASS or FAIL');
      // MDO-0006: the independence note landed in the Gates column. It belongs to the review.
      if (/independence/i.test(o.gates)) throw new Error('--gates lists gate results only; use --reduced-independence for the review');
      const root = ctx.root();
      const config = readConfig(root);
      const specsDir = join(root, config.paths.specs);
      const logPath = relative(root, join(specsDir, 'quick', 'quick-log.md')).replace(/\\/g, '/');
      const files = collectDiff(root, o.base).files.filter((f) => f.path !== logPath);
      const reviewer = agentIdentity(root, o.reviewer, o.harness);
      const file = appendQuickLog(
        specsDir,
        {
          date: new Date().toISOString().slice(0, 10),
          name,
          project: o.project ?? config.projects[0]!.name,
          files,
          gates: o.gates,
          verdict: o.verdict,
          reviewer,
          ...(o.claimedReviewer ? { claimedReviewer: o.claimedReviewer } : {}),
          ...(o.reducedIndependence ? { reducedIndependence: true } : {}),
        },
        blameCommits,
      );
      json({ written: relative(root, file), reviewer, files: files.map((f) => f.path) });
    });
}
