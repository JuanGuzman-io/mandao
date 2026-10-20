import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** Creates a temp directory from a `{ 'path/file': content }` map. A trailing `/` creates an empty dir. */
export function makeTree(files: Record<string, string>): string {
  const root = mkdtempSync(join(tmpdir(), 'mandao-test-'));
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

export const pkg = (name: string, deps: Record<string, string> = {}) => JSON.stringify({ name, dependencies: deps });
