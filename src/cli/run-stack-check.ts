import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { constitutionDir, stackLogPath } from '../engine/stack-checks.js';
import { excerpt } from '../scripts/gates.js';
import { parseStackChecks, withStackRun } from '../spec/index.js';
import { writeText } from '../writer/files.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { pathsOutside, runProbe, sha, shellJoin } from './run-premise.js';

/** Lines of a stack check's output kept in the record. */
const STACK_LINES = 20;

/** The runtime's version, as `<program> --version` (or `--runtime`) prints it; `unknown` when it cannot run. */
function runtimeVersion(cwd: string, command: string): string {
  try {
    return (
      execSync(command, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15_000 })
        .trim()
        .split('\n')[0] || 'unknown'
    );
  } catch {
    return 'unknown';
  }
}

interface StackCheckOptions {
  project?: string;
  runtime?: string;
  timeout: string;
  force?: boolean;
}

/** The check in the workspace's (or the project's) `architecture.md`, its constitution folder and where it runs. */
function locateCheck(root: string, id: string, projectName: string | undefined) {
  const config = readConfig(root);
  const project = projectName ? config.projects.find((p) => p.name === projectName) : undefined;
  if (projectName && !project) throw new Error(`no project named ${projectName} in .mandao/config.yml`);
  const dir = constitutionDir(root, config, project?.path);
  const architecture = join(dir, 'architecture.md');
  const check = existsSync(architecture) ? parseStackChecks(readFileSync(architecture, 'utf8')).find((c) => c.id === id) : undefined;
  if (!check) throw new Error(`${id} is not in the Stack verification of ${relative(root, architecture)}`);
  return { config, project, dir, check, cwd: join(root, config.home, project?.path ?? '') };
}

/**
 * `mandao run stack-check <Sn> -- <command>` (phase 18): runs the command that proves a stack choice of
 * `architecture.md` (install or import it on the project's runtime) and records the command, the runtime version,
 * the exit and the output in `<constitution>/_log/stack.md`. A failing run is recorded too: it is the evidence
 * that the choice does not hold here.
 */
export function registerStackCheck(run: Command, ctx: CliContext) {
  run
    .command('stack-check <check> <command...>')
    .description('Run the command that proves a stack choice on the project runtime and record it (constitution)')
    .option('--project <name>', "the project whose constitution holds the check (default: the workspace's)")
    .option('--runtime <command>', 'the command that prints the runtime version (default: <program> --version)')
    .option('--timeout <s>', 'seconds before the run is stopped', '300')
    .option('--force', 'run even when the budget defers (recorded; ADR 0024)')
    .action(async (id: string, words: string[], o: StackCheckOptions) => {
      const root = ctx.root();
      const { config, project, dir, check, cwd } = locateCheck(root, id, o.project);
      const outside = pathsOutside(words, root);
      if (outside.length) throw new Error(`the command names paths outside the worktree (${outside.join(', ')})`);
      const command = shellJoin(words);
      const work = join(dir, '_log');
      const result = await runProbe({
        root,
        cwd,
        config,
        project,
        label: `${id} stack check`,
        command,
        timeoutS: Number(o.timeout),
        work,
        scratchId: id,
        force: o.force,
      });
      if (result.status !== 'PASS' && result.status !== 'FAIL') {
        json({ check: id, recorded: false, status: result.status, reason: result.reason });
        process.exitCode = 1;
        return;
      }
      const runtime = runtimeVersion(cwd, o.runtime ?? `${shellJoin(words.slice(0, 1))} --version`);
      const body = [
        `- Claim: ${check.claim}`,
        `- Command: \`${command}\` (from ${relative(root, cwd) || 'the workspace root'})`,
        `- Runtime: ${runtime}`,
        `- Ran at: ${new Date().toISOString()} on ${sha(root)}`,
        `- Exit: ${result.exitCode}`,
        '',
        '```',
        excerpt(result.output, STACK_LINES),
        '```',
      ].join('\n');
      const log = stackLogPath(dir);
      writeText(log, withStackRun(existsSync(log) ? readFileSync(log, 'utf8') : undefined, id, body));
      json({
        check: id,
        recorded: true,
        exitCode: result.exitCode,
        runtime,
        excerpt: excerpt(result.output, 10),
        record: relative(root, log),
      });
    });
}
