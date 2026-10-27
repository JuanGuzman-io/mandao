import * as p from '@clack/prompts';
import { PROFILES, type Profile } from '../schemas/index.js';
import type { DetectedProject, DetectedWorkspace } from '../workspace/detect.js';

const bail = (value: unknown) => {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
};

/**
 * The profiles `init` offers and what each changes (phase 20). `data` adds nothing yet (MANDAO-DESIGN §9), so it
 * is not offered; `--profile data` and the config still accept it.
 */
const OFFERED: readonly { value: Profile; hint: string }[] = [
  { value: 'app', hint: 'web, API, mobile or CLI; acceptance as Given/When/Then scenarios' },
  {
    value: 'ai',
    hint: 'LLM, RAG or agents; acceptance as eval thresholds, plus a model and prompt registry. Keeps everything app does: an app with AI features picks ai',
  },
];

export const PROFILE_QUESTION = 'What kind of project is this? It changes the spec templates, not the commands';

/** A detected `data` project starts as `app` until `data` has its own templates. */
const offered = (profile: Profile | undefined): Profile | undefined => (profile === 'data' ? 'app' : profile);

/** Pure: the select options, the preselected one naming what was detected; `data` only when it is already the value. */
export function profileOptions(initial: Profile, evidence?: string) {
  const offeredHere =
    initial === 'data'
      ? [...OFFERED, { value: 'data' as const, hint: 'set by --profile or --default-profile; not specialized yet' }]
      : OFFERED;
  return offeredHere.map((o) => ({
    value: o.value,
    label: o.value,
    hint: o.value === initial && evidence ? `${o.hint} · detected: ${evidence}` : o.hint,
  }));
}

/** Pure: the workspace default: the profile most projects point to, with one project's evidence for it; else `app`. */
export function defaultProfileGuess(ws: DetectedWorkspace): { profile: Profile; evidence?: string } {
  const guesses = ws.projects.map((pr) => ({ profile: offered(pr.profile), evidence: pr.evidence }));
  const counts = PROFILES.map((v) => [v, guesses.filter((g) => g.profile === v).length] as const).sort((a, b) => b[1] - a[1]);
  const top = counts[0];
  if (!top || top[1] === 0) return { profile: 'app' };
  const source = ws.projects.find((pr) => offered(pr.profile) === top[0]);
  const note = source?.profile === 'data' ? ' (the data profile is not specialized yet)' : '';
  return { profile: top[0], ...(source?.evidence ? { evidence: `${source.evidence}${note}` } : {}) };
}

/** The workspace default profile: the flag, the guess with `--yes`, else one question with hints and the evidence. */
export async function chooseDefaultProfile(ws: DetectedWorkspace, opts: { defaultProfile?: Profile; yes?: boolean }): Promise<Profile> {
  if (opts.defaultProfile) return opts.defaultProfile;
  const guess = defaultProfileGuess(ws);
  if (opts.yes) return guess.profile;
  const picked = await p.select({
    message: `${PROFILE_QUESTION} (each project can differ)`,
    options: profileOptions(guess.profile, guess.evidence),
    initialValue: guess.profile,
  });
  bail(picked);
  return picked as Profile;
}

/**
 * The profile one project starts with: the flag, else what was detected, else the workspace default. A detected
 * `data` project takes the default (`app` unless `--default-profile data` said otherwise).
 */
export const startingProfile = (pr: DetectedProject, flag: Profile | undefined, fallback: Profile): Profile =>
  flag ?? (pr.profile === 'data' ? fallback : pr.profile) ?? fallback;

/** One project's profile, asked when the person said the detected ones are wrong. */
export async function askProjectProfile(pr: DetectedProject & { profile: Profile }): Promise<Profile> {
  const picked = await p.select({
    message: `${pr.name} (${pr.path}): ${PROFILE_QUESTION}`,
    options: profileOptions(pr.profile, pr.evidence),
    initialValue: pr.profile,
  });
  bail(picked);
  return picked as Profile;
}
