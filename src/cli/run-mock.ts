import { join } from 'node:path';
import type { Command } from 'commander';
import { readCatalog } from '../engine/catalog.js';
import { LOCK_FILE, readLock } from '../engine/files.js';
import type { Config } from '../schemas/index.js';
import { mockOfferFor, recordMockDecision } from '../scripts/mockups.js';
import type { SpecFolder } from '../scripts/spec.js';
import { mockSkills } from '../skills/on-demand.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { loadSpec } from './spec-context.js';

interface MockOptions {
  record?: string;
  source?: string;
  force?: boolean;
}

/** The skills an accepted mock may install, as commands for the session to run after the person agrees. */
function skillsToOffer(root: string, config: Config, spec: SpecFolder) {
  const projects = spec.story?.meta.projects ?? [];
  const profiles = config.projects.filter((p) => projects.includes(p.name)).map((p) => p.profile);
  const pinned = (readLock(join(root, LOCK_FILE))?.skills ?? []).map((s) => s.id);
  return mockSkills(readCatalog(), { profiles, harnesses: config.harnesses, pinned });
}

/** `mandao run mock-offer <spec>`: whether to suggest a UI mock (phase 13), and `--record` the answer once. */
export function registerMockOffer(run: Command, ctx: CliContext) {
  run
    .command('mock-offer <spec>')
    .description('Whether to suggest a UI mock: a UI project in the story, no UX references, nothing decided yet (JSON)')
    .option('--record <decision>', 'record the answer: accepted | declined (version 2 specs, state.yml)')
    .option('--source <source>', 'with --record accepted: design | html')
    .option('--force', 'replace a decision already recorded')
    .action((ref: string, o: MockOptions) => {
      const { config, spec } = loadSpec(ctx, ref);
      if (o.source !== undefined && o.record === undefined) throw new Error('--source goes only with --record accepted');
      const mock = o.record !== undefined ? recordMockDecision(spec, o.record, o.source, o.force) : undefined;
      const skills = mock?.decision === 'accepted' ? skillsToOffer(ctx.root(), config, spec) : undefined;
      json({ ...mockOfferFor(ctx.root(), config, spec), ...(mock ? { recorded: true } : {}), ...(skills ? { skills } : {}) });
    });
}
