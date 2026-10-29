import { spawnSync } from 'node:child_process';
import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { STORY_ID } from '../schemas/index.js';
import { proposeSpec, type SpecProposal } from '../scripts/spec.js';
import type { CliContext } from './context.js';
import { type OpenOptions, openCommand, recordRequest, type Step, setUp } from './spec-open.js';

interface StartOptions extends OpenOptions {
  harness?: string;
  open?: boolean;
  json?: boolean;
}

/** `PROJ-123 optional title` → the tracker id and title; anything else is a description for a local id. */
export function parseRequest(words: string[]): { id?: string; title: string } {
  const [first = '', ...rest] = words;
  return STORY_ID.test(first) ? { id: first, title: rest.join(' ') } : { title: words.join(' ') };
}

function proposalOptions(id: string | undefined, o: StartOptions) {
  const chosen = o.quick ? 'quick' : id;
  return { ...(chosen ? { id: chosen } : {}), type: o.type, ...(o.hotfix ? { hotfix: true } : {}) };
}

const MARK: Record<Step['status'], string> = { done: '✓', skipped: '·', warning: '!', failed: '✗' };

function report(p: SpecProposal, steps: Step[], harness: string, open: string, o: StartOptions) {
  if (o.json) return console.log(JSON.stringify({ id: p.id, branch: p.branch, worktree: p.worktree, steps, open }));
  for (const s of steps) console.log(`${MARK[s.status]} ${s.step}: ${s.detail}`);
  console.log(`\nOpen ${harness} in the worktree:\n  ${open}`);
  if (!o.quick) console.log(`  (standard or full depth: run /mandao-story ${p.id} first)`);
}

function launch(harness: string, worktree: string, argv?: string[]) {
  if (!argv) return console.log(`--open: ${harness} cannot be launched from the command line; run the command above.`);
  spawnSync(argv[0]!, argv.slice(1), { cwd: worktree, stdio: 'inherit' });
}

/**
 * `mandao start "<description|ID>"` (§14.5, ADR 0037): the branch, the worktree and its whole setup as a
 * script, before any session opens, so the first command (or the lite session) is born in the worktree.
 */
export function registerStart(program: Command, ctx: CliContext) {
  program
    .command('start <request...>')
    .description(
      'Create the spec branch and worktree and set it up (env files, dependencies, setup hooks, graph, baseline), then open the harness there. Deprecated: story and specify do this in the session',
    )
    .option('--quick', 'a quick change instead of a spec')
    .option('--hotfix', 'hotfix lane: from branching.hotfix.from')
    .option('--type <type>', 'story | bug | …', 'story')
    .option('--harness <id>', 'harness to open (default: the first configured)')
    .option('--open', 'launch the harness in the worktree when its CLI allows it')
    .option('--no-install', 'skip installing dependencies')
    .option('--no-baseline', 'skip the baseline gates')
    .option('--json', 'print the result as JSON')
    .action(async (words: string[], o: StartOptions) => {
      if (!o.json)
        console.error('mandao start is deprecated: /mandao-story and /mandao-specify open the spec and its branch in the session.');
      const root = ctx.root();
      const config = readConfig(root);
      const { id, title } = parseRequest(words);
      const proposal = proposeSpec(root, config, title, proposalOptions(id, o));
      if (proposal.issues.length) throw new Error(proposal.issues.join('; '));
      const steps = await setUp(root, config, proposal, o);
      recordRequest(config, proposal, title, o);
      const harness = o.harness ?? config.harnesses[0] ?? 'claude';
      const open = openCommand(
        harness,
        proposal.worktree,
        o.quick ? `/mandao-quick ${title}` : `/mandao-specify ${proposal.id} --depth lite`,
      );
      report(proposal, steps, harness, open.text, o);
      if (steps.some((s) => s.status === 'failed')) process.exitCode = 1;
      if (o.open) launch(harness, proposal.worktree, open.launch);
    });
}
