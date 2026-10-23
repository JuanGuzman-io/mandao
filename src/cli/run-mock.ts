import type { Command } from 'commander';
import { mockOfferFor, recordMockDecision } from '../scripts/mockups.js';
import type { CliContext } from './context.js';
import { json } from './json.js';
import { registerMockInstall } from './mock-install.js';
import { skillsToOffer } from './mock-skills.js';
import { loadSpec } from './spec-context.js';

interface MockOptions {
  record?: string;
  source?: string;
  force?: boolean;
}

/** `mandao run mock-offer <spec>`: whether to suggest a UI mock (phase 13), and `--record` the answer once; also registers `mock-install`. */
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
      const offer = mockOfferFor(ctx.root(), config, spec);
      // The skills come with the suggestion, so the one consent question names them before the answer (trial 13 D1),
      // and again after acceptance until they are installed (review F9).
      const skills = offer.suggest || offer.decided === 'accepted' ? skillsToOffer(ctx.root(), config, spec) : [];
      json({ ...offer, ...(mock ? { recorded: true } : {}), ...(skills.length ? { skills } : {}) });
    });
  registerMockInstall(run, ctx);
}
