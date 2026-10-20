// Installs Mandao's own pre-commit hook into this repository's git hooks folder (worktrees share it).
// Never overwrites a hook that is not Mandao's; leaves other hooks (graphify's) alone.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const MARK = '# mandao: pre-commit gates';
let hooks;
try {
  hooks = resolve(root, execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: root, encoding: 'utf8' }).trim());
} catch {
  process.exit(0); // not a git checkout (e.g. installed from the registry)
}
const target = join(hooks, 'pre-commit');
if (existsSync(target) && !readFileSync(target, 'utf8').includes(MARK)) {
  console.warn(`mandao: ${target} exists and is not Mandao's; not replaced. Add scripts/hooks/pre-commit to it by hand.`);
  process.exit(0);
}
mkdirSync(hooks, { recursive: true });
copyFileSync(join(root, 'scripts/hooks/pre-commit'), target);
chmodSync(target, 0o755);
