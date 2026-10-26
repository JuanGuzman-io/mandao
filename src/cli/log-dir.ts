import { join } from 'node:path';
import type { Config } from '../schemas/index.js';
import { findSpec } from '../scripts/spec.js';

/**
 * The folder whose `_log/` a command's events and cost go to: the spec's, `<specs>/quick` for quick changes, and
 * `.mandao/log/` (git-ignored, phase 16) for `workspace`, a command with no spec yet such as an intake.
 */
export function logDirFor(root: string, config: Config, ref: string): string {
  if (ref === 'quick') return join(root, config.paths.specs, 'quick');
  if (ref === 'workspace') return join(root, '.mandao', 'log');
  return findSpec(root, config, ref);
}
