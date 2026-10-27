import * as p from '@clack/prompts';
import type { Config } from '../schemas/index.js';

type Roles = Partial<Config['roles']>;
const ROLE_KEYS = ['po', 'tech_lead', 'dev'] as const;

const solo = (name: string): Roles => ({ po: name, tech_lead: name, dev: name });

/**
 * `--roles`: `team` (PO, tech lead, dev: no key), `solo` (one person in every role, `PE`), `solo=<name>`, or
 * `po=<name>,tech_lead=<name>,dev=<name>` (any of them). Phase 18.
 */
export function parseRoles(value: string): Roles {
  const v = value.trim();
  if (v === 'team' || v === '') return {};
  if (v === 'solo') return solo('PE');
  if (v.startsWith('solo=')) return solo(v.slice('solo='.length).trim() || 'PE');
  const roles: Roles = {};
  for (const pair of v.split(',')) {
    const [key, name] = pair.split('=').map((s) => s.trim());
    if (!(ROLE_KEYS as readonly string[]).includes(key ?? '') || !name)
      throw new Error(`--roles must be team, solo, solo=<name> or po=<name>,tech_lead=<name>,dev=<name>; got "${value}"`);
    roles[key as (typeof ROLE_KEYS)[number]] = name;
  }
  return roles;
}

const bail = <T>(v: T | symbol): T => {
  if (p.isCancel(v)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
  return v as T;
};

/** Who decides, as a config fragment: a team keeps the defaults (no key); a solo maintainer names their one role. */
export async function chooseRoles(given: string | undefined, yes: boolean | undefined): Promise<{ roles?: Roles }> {
  const fragment = (roles: Roles) => (Object.keys(roles).length ? { roles } : {});
  if (given !== undefined) return fragment(parseRoles(given));
  if (yes) return {};
  const who = bail(
    await p.select({
      message: 'Who makes the product and technical decisions?',
      options: [
        { value: 'team', label: 'A team', hint: 'PO, tech lead and dev' },
        { value: 'solo', label: 'Only me', hint: 'one role name for every decision, e.g. PE (Product Engineer)' },
      ],
    }),
  );
  if (who === 'team') return {};
  const name = bail(await p.text({ message: 'Your role name', placeholder: 'PE', defaultValue: 'PE' }));
  return fragment(solo(String(name).trim() || 'PE'));
}
