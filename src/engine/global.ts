import { homedir, platform } from 'node:os';
import { join } from 'node:path';
import type { HarnessId } from '../schemas/index.js';

/** Home directory, overridable for tests and sandboxes. */
export const home = () => process.env.MANDAO_HOME ?? homedir();

/** Where global (user-level) installs land for each harness. */
export function globalRoots(): Record<HarnessId, string> {
  const h = home();
  const vscodeUser =
    platform() === 'darwin'
      ? join(h, 'Library', 'Application Support', 'Code', 'User')
      : platform() === 'win32'
        ? join(process.env.APPDATA ?? join(h, 'AppData', 'Roaming'), 'Code', 'User')
        : join(h, '.config', 'Code', 'User');
  return {
    claude: join(h, '.claude'),
    copilot: join(vscodeUser, 'prompts'),
    // Codex reads user skills from ~/.agents/skills (learn.chatgpt.com/docs/build-skills).
    codex: join(h, '.agents'),
    // OpenCode reads user commands from ~/.config/opencode/commands (opencode.ai/docs/commands).
    opencode: join(process.env.XDG_CONFIG_HOME ?? join(h, '.config'), 'opencode'),
    // Antigravity reads user skills from ~/.gemini/config/skills (antigravity.google/docs/skills).
    antigravity: join(h, '.gemini', 'config'),
  };
}

export const globalLockFile = () => join(home(), '.mandao', 'global.lock');
