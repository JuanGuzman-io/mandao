import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Finding } from './doctor.js';
import type { Probe } from './tools.js';

/** `~/.codex/config.toml`, or `$CODEX_HOME/config.toml`. */
export const codexConfigFile = () => join(process.env.CODEX_HOME ?? join(homedir(), '.codex'), 'config.toml');

/**
 * Trust lives in the user's Codex config as `[projects."<absolute path>"] trust_level = "trusted"`.
 * Without it Codex skips the project's `.codex/` layer: agents, rules and hooks (ADR 0021).
 */
export function isCodexTrusted(configText: string | undefined, paths: string[]): boolean {
  if (!configText) return false;
  const sections = configText.split(/^(?=\[)/m);
  return paths.some((p) =>
    sections.some((s) => s.startsWith(`[projects.${JSON.stringify(p)}]`) && /^\s*trust_level\s*=\s*"trusted"/m.test(s)),
  );
}

/** Trust of this checkout (each worktree is its own path) and the CLI login. */
export function codexFindings(paths: string[], probe: Probe, configText = readIf(codexConfigFile())): Finding[] {
  const out: Finding[] = [];
  if (isCodexTrusted(configText, paths)) {
    out.push({ level: 'ok', message: 'codex: this project is trusted, so .codex/agents and .codex/rules load' });
  } else {
    out.push({
      level: 'warn',
      message:
        'codex: this project is not trusted, so Codex ignores .codex/agents (no Implementer or Reviewer agents) and .codex/rules (the commit prompt)',
      fix: `open Codex here and trust the project, or add to ${codexConfigFile()}: [projects.${JSON.stringify(paths[0])}] trust_level = "trusted"`,
    });
  }
  if (probe('codex --version') !== undefined && probe('codex login status') === undefined) {
    out.push({
      level: 'warn',
      message: 'codex: not logged in, so it can neither resume a spec nor review for another harness',
      fix: 'run `codex login`',
    });
  }
  return out;
}

function readIf(file: string): string | undefined {
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
}
