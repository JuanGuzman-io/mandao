import * as p from '@clack/prompts';
import { type HarnessId, MODEL_PROFILES, type ModelMode, type ModelProfile } from '../schemas/index.js';
import { profilesTable } from './models.js';

const bail = (value: unknown) => {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
};

/** One question: the model profile, with every profile's models per harness to compare (cost-conscious design). */
export async function chooseProfile(
  harnesses: HarnessId[],
  mode: ModelMode,
  opts: { modelProfile?: ModelProfile; yes?: boolean },
): Promise<ModelProfile> {
  if (opts.modelProfile && !MODEL_PROFILES.includes(opts.modelProfile))
    throw new Error(`--model-profile must be one of ${MODEL_PROFILES.join(', ')}`);
  if (opts.modelProfile || opts.yes) return opts.modelProfile ?? 'peak';
  p.note(profilesTable(harnesses, mode), 'Model profiles (you can change it later with `mandao models profile`)');
  const picked = await p.select({
    message: 'Which model profile?',
    options: [
      { value: 'peak', label: 'Peak', hint: 'the best model per role (default)' },
      { value: 'balanced', label: 'Balanced', hint: 'a lighter Leader; the Reviewer stays strong' },
      { value: 'economy', label: 'Economy', hint: 'the cheapest set that keeps a minimum quality' },
    ],
    initialValue: 'peak',
  });
  bail(picked);
  return picked as ModelProfile;
}
