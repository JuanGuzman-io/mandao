import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Finding } from './doctor.js';

/** Other spec-driven frameworks whose commands or skills can compete with Mandao's (ADR 0030). */
const FRAMEWORKS: { name: string; entry: RegExp; marker?: string }[] = [
  { name: 'AKILI-SPECS', entry: /^akili[-_.]/i },
  {
    name: 'GitHub Spec Kit',
    entry: /^(speckit[-_.]|(specify|plan|tasks|constitution|clarify|analyze|implement)(\.md|\.prompt\.md|\.toml)?$)/i,
    marker: '.specify',
  },
  { name: 'BMAD', entry: /^bmad[-_.]/i, marker: '.bmad-core' },
  { name: 'OpenSpec', entry: /^openspec[-_.]/i, marker: 'openspec' },
  { name: 'Kiro', entry: /^kiro[-_.]/i, marker: '.kiro' },
  { name: 'Agent OS', entry: /^agent-os[-_.]/i, marker: '.agent-os' },
];

/** Folders where harnesses load commands and skills from, per scope. */
function places(root: string, home: string): { scope: 'project' | 'user'; dir: string; harness: string }[] {
  const config = process.env.XDG_CONFIG_HOME ?? join(home, '.config');
  return [
    { scope: 'project', dir: join(root, '.claude/commands'), harness: 'Claude Code' },
    { scope: 'project', dir: join(root, '.claude/skills'), harness: 'Claude Code (and OpenCode)' },
    { scope: 'project', dir: join(root, '.github/prompts'), harness: 'Copilot' },
    { scope: 'project', dir: join(root, '.agents/skills'), harness: 'Codex (and OpenCode, Antigravity)' },
    { scope: 'project', dir: join(root, '.opencode/commands'), harness: 'OpenCode' },
    { scope: 'user', dir: join(home, '.claude/commands'), harness: 'Claude Code' },
    { scope: 'user', dir: join(home, '.claude/skills'), harness: 'Claude Code (and OpenCode)' },
    { scope: 'user', dir: join(home, '.agents/skills'), harness: 'Codex (and OpenCode)' },
    { scope: 'user', dir: join(home, '.codex/prompts'), harness: 'Codex' },
    { scope: 'user', dir: join(config, 'opencode/commands'), harness: 'OpenCode' },
    { scope: 'user', dir: join(home, '.gemini/config/skills'), harness: 'Antigravity' },
  ];
}

const list = (dir: string) => (existsSync(dir) ? readdirSync(dir) : []);

/**
 * Commands and skills of other SDD frameworks installed for the project or the user. Mandao never
 * changes or removes them; it says where they are and how to keep them out of Mandao's way.
 */
export function sddConflictFindings(root: string, home: string): Finding[] {
  const out: Finding[] = [];
  for (const fw of FRAMEWORKS) {
    const hits = places(root, home).flatMap((p) => {
      const names = list(p.dir).filter((n) => !n.startsWith('mandao-') && fw.entry.test(n));
      return names.length ? [{ ...p, names }] : [];
    });
    const marker = fw.marker && existsSync(join(root, fw.marker)) ? fw.marker : undefined;
    if (!hits.length && !marker) continue;
    const where = [
      ...hits.map(
        (h) => `${h.scope} ${h.dir.replace(home, '~')} (${h.harness}: ${h.names.slice(0, 3).join(', ')}${h.names.length > 3 ? ', …' : ''})`,
      ),
      ...(marker ? [`project ${marker}/`] : []),
    ];
    const user = hits.some((h) => h.scope === 'user');
    out.push({
      level: 'warn',
      message: `${fw.name} is installed and can compete with Mandao's commands: ${where.join('; ')}`,
      fix: user
        ? `invoke Mandao explicitly as /mandao-<command> and, while piloting, move the user-level ${fw.name} entries out of the harness folders (or into a different profile); in OpenCode, a "permission.skill" deny for them in your own project opencode.json keeps their skills away. Mandao does not touch them.`
        : `use one SDD framework per project: remove or archive ${fw.name}'s project files, or keep them and always invoke /mandao-<command> explicitly. Mandao does not touch them.`,
    });
  }
  return out;
}
