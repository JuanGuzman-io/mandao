import type { HarnessId } from '../schemas/index.js';
import { antigravityAdapter } from './antigravity.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { copilotAdapter } from './copilot.js';
import { opencodeAdapter } from './opencode.js';
import type { Adapter } from './types.js';

export const ADAPTERS: Record<HarnessId, Adapter> = {
  claude: claudeAdapter,
  copilot: copilotAdapter,
  codex: codexAdapter,
  opencode: opencodeAdapter,
  antigravity: antigravityAdapter,
};

export * from './types.js';
