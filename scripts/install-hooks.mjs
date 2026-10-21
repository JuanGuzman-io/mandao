// Installs Mandao's pre-commit and commit-msg hooks (worktrees share the git hooks folder).
// Never overwrites a hook that is not Mandao's; leaves other hooks (graphify's) alone.
import { execFileSync } from 'node:child_process';
import { chmodSync, copyFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
let hooks;
try {
  hooks = resolve(root, execFileSync('git', ['rev-parse', '--git-path', 'hooks'], { cwd: root, encoding: 'utf8' }).trim());
} catch {
  process.exit(0); // not a git checkout (e.g. installed from the registry)
}
mkdirSync(hooks, { recursive: true });
for (const [name, mark] of [['pre-commit', '# mandao: pre-commit gates'], ['commit-msg', '# mandao: commit-msg gate']]) {
  const target = join(hooks, name);
  if (existsSync(target) && !readFileSync(target, 'utf8').includes(mark)) {
    console.warn(`mandao: ${target} exists and is not Mandao's; not replaced. Add scripts/hooks/${name} to it by hand.`);
    continue;
  }
  copyFileSync(join(root, 'scripts/hooks', name), target);
  chmodSync(target, 0o755);
}
