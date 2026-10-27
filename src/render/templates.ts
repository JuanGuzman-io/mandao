import type { ResolvedTemplate } from '../resolver/resolve.js';
import type { Config, Profile } from '../schemas/index.js';
import { renderRoles, TEMPLATES_DIR } from './render.js';

export interface InstalledTemplate {
  path: string;
  content: string;
  from: string;
}

/** One copy per profile in use: the profile variant when it exists, else `shared/`. */
export function installTemplates(
  templates: ResolvedTemplate[],
  profiles: Iterable<Profile>,
  roles: Config['roles'] = { po: 'PO', tech_lead: 'tech lead', dev: 'dev' },
): InstalledTemplate[] {
  const byKey = new Map(templates.map((t) => [t.key, t]));
  const out: InstalledTemplate[] = [];
  for (const profile of [...new Set(profiles)].sort()) {
    const names = new Set<string>();
    for (const t of templates) {
      const [scope, ...rest] = t.key.split('/');
      if (scope === 'shared' || scope === profile) names.add(rest.join('/'));
    }
    for (const name of [...names].sort()) {
      const t = byKey.get(`${profile}/${name}`) ?? byKey.get(`shared/${name}`)!;
      out.push({ path: `${TEMPLATES_DIR}/${profile}/${name}`, content: renderRoles(t.content, roles), from: `template:${t.key}` });
    }
  }
  return out;
}
