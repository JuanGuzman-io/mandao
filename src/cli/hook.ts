import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Command } from 'commander';
import matter from 'gray-matter';
import type { CliContext } from './context.js';

/** True for a Claude Code subagent whose definition gives it no shell (the Reviewer). */
export function agentWithoutShell(root: string, agentType: string | undefined): boolean {
  if (!agentType || !/^[\w-]+$/.test(agentType)) return false;
  const file = join(root, '.claude/agents', `${agentType}.md`);
  if (!existsSync(file)) return false;
  const tools = (matter(readFileSync(file, 'utf8')).data as { tools?: string | string[] }).tools;
  if (tools === undefined) return false; // no list: the agent inherits every tool, shell included
  return !(Array.isArray(tools) ? tools : tools.split(',')).some((t) => t.trim() === 'Bash');
}

function readStdin(): string {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

/**
 * `mandao hook graph-guard <mode>`: graphify's PreToolUse guard for roles with a shell only. A role
 * without one cannot run `graphify query`, so it gets nothing here and its graph context comes in the
 * Leader's brief instead (ADR 0021).
 */
export function registerHook(program: Command, ctx: CliContext) {
  program
    .command('hook', { hidden: true })
    .description('Agent hooks Mandao wraps')
    .command('graph-guard <mode>')
    .description("Run graphify's hook guard unless the calling subagent has no shell")
    .action((mode: string) => {
      const input = readStdin();
      let agentType: string | undefined;
      try {
        agentType = (JSON.parse(input) as { agent_type?: string }).agent_type;
      } catch {
        agentType = undefined;
      }
      if (agentWithoutShell(ctx.root(), agentType)) return;
      const r = spawnSync('graphify', ['hook-guard', mode], { input, stdio: ['pipe', 'inherit', 'inherit'] });
      // graphify missing never blocks the agent.
      process.exitCode = r.error ? 0 : (r.status ?? 0);
    });
}
