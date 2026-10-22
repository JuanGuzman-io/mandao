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

/** A Reviewer's whole answer in a file, for `checkpoint --review` (MDO-0008). */
export function reviewFile(verdict: 'PASS' | 'FAIL', findings = ''): string {
  const parsed = findings.split('\n').flatMap((line, i) => {
    const match = /\[(core|security|performance|data|accessibility|ai)\/(low|medium|high|critical)\]\s+(?:(\S+):(\d+)\s+)?(.*)/i.exec(line);
    if (!match) return [];
    return [
      {
        id: `F${i + 1}`,
        status: /\b(fixed|resolved)\b/i.test(match[5]!) ? 'resolved' : 'open',
        lens: match[1]!.toLowerCase(),
        severity: match[2]!.toLowerCase(),
        title: match[5] || 'finding',
        file: match[3] ?? 'src/example.ts',
        line: Number(match[4] ?? 1),
        evidence: match[5] || 'test finding',
        ...(/\b(fixed|resolved)\b/i.test(match[5]!) ? { resolution: 'Resolved in this attempt.' } : {}),
      },
    ];
  });
  const payload = JSON.stringify({ version: 1, findings: parsed });
  return join(
    makeTree({ 'review.md': `VERDICT: ${verdict}\n\n## Findings (JSON)\n\n\`\`\`json\n${payload}\n\`\`\`\n${findings}` }),
    'review.md',
  );
}
