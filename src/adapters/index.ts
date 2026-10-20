import type { HarnessId } from '../schemas/index.js';
import { claudeAdapter } from './claude.js';
import { copilotAdapter } from './copilot.js';
import type { Adapter } from './types.js';

export const ADAPTERS: Record<HarnessId, Adapter> = {
  claude: claudeAdapter,
  copilot: copilotAdapter,
};

export * from './types.js';
