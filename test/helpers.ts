import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** Folders created by `makeTree` in this test file's worker; removed by `removeTrees`. */
export const trees = new Set<string>();

/** Creates a temp directory from a `{ 'path/file': content }` map. A trailing `/` creates an empty dir. */
export function makeTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'mandao-test-'));
  trees.add(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    if (path.endsWith('/')) {
      mkdirSync(full, { recursive: true });
    } else {
      mkdirSync(dirname(full), { recursive: true });
      writeFileSync(full, content);
    }
  }
  return root;
}

/** Removes every folder `makeTree` registered, then clears the registry. Never selects by name. */
export function removeTrees(): void {
  for (const dir of trees) rmSync(dir, { recursive: true, force: true });
  trees.clear();
}

export const pkg = (name: string, deps: Record<string, string> = {}) => JSON.stringify({ name, dependencies: deps });
