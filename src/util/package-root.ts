import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

let cached: { root: string; version: string } | undefined;

/** Finds the installed `mandao` package root, both from `dist/` and from `src/` in tests. */
export function packageInfo(): { root: string; version: string } {
  if (cached) return cached;
  let dir = dirname(fileURLToPath(import.meta.url));
  while (dir !== dirname(dir)) {
    const pkgFile = join(dir, 'package.json');
    if (existsSync(pkgFile)) {
      const pkg = JSON.parse(readFileSync(pkgFile, 'utf8')) as { name?: string; version?: string };
      if (pkg.name === 'mandao') {
        cached = { root: dir, version: pkg.version ?? '0.0.0' };
        return cached;
      }
    }
    dir = dirname(dir);
  }
  throw new Error('Could not locate the mandao package root');
}

export const coreDir = () => join(packageInfo().root, 'core');
