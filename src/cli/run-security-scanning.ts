import type { Command } from 'commander';
import { readConfig } from '../engine/files.js';
import { collectSecurityScanning } from '../engine/security-scanning.js';
import type { CliContext } from './context.js';
import { json } from './json.js';

/** Registers deterministic, read-only scan discovery for constitution, verify and doctor workflows. */
export function registerSecurityScanning(run: Command, ctx: CliContext): void {
  run
    .command('security-scanning')
    .description('Detect per-project secret and SAST coverage from gates, CI files and GitHub APIs (JSON on stdout)')
    .action(() => json(collectSecurityScanning(ctx.root(), readConfig(ctx.root()))));
}
