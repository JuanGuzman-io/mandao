import type { HarnessId } from '../schemas/index.js';
import { claudeAdapter } from './claude.js';
import { codexAdapter } from './codex.js';
import { copilotAdapter } from './copilot.js';
import type { Adapter } from './types.js';

export const ADAPTERS: Record<HarnessId, Adapter> = {
  claude: claudeAdapter,
  copilot: copilotAdapter,
  codex: codexAdapter,
};

export * from './types.js';
