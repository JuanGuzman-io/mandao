import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import type { Config } from '../schemas/index.js';
import { progressSchema } from '../spec/index.js';
import type { Finding } from './doctor.js';

/**
 * Tasks that passed review and still wait for their commit (ADR 0021): any harness, the human or the
 * next session commits them with `mandao run commit`.
 */
export function pendingCommitFindings(root: string, config: Config): Finding[] {
  const dir = join(root, config.paths.specs);
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(dir, d.name, 'progress.yml')))
    .flatMap((d): Finding[] => {
      const parsed = progressSchema.safeParse(parseYaml(readFileSync(join(dir, d.name, 'progress.yml'), 'utf8')));
      const pending = parsed.success ? parsed.data.pending_commits.map((p) => p.task) : [];
      return pending.length
        ? [
            {
              level: 'warn',
              message: `${d.name}: ${pending.join(', ')} passed review and wait for their commit`,
              fix: `run \`mandao run commit ${d.name}\` (local only, one commit per task)`,
            },
          ]
        : [];
    });
}
