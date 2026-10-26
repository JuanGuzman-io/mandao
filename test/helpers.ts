import { AsyncLocalStorage } from 'node:async_hooks';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

/** Async test ownership keeps concurrent tests' temporary folders isolated. */
export const testTreeScope = new AsyncLocalStorage<string>();
const trees = new Map<string, Set<string>>();

/** Initializes isolated test repos with local identity so commits never depend on the developer machine. */
export function initTestRepo(root: string, ...args: string[]): void {
  const options = { cwd: root, stdio: 'ignore' as const };
  execFileSync('git', ['init', ...args], options);
  execFileSync('git', ['config', '--local', 'user.name', 'Mandao Test'], options);
  execFileSync('git', ['config', '--local', 'user.email', 'mandao-test@example.invalid'], options);
  execFileSync('git', ['config', '--local', 'gc.auto', '0'], options);
  execFileSync('git', ['config', '--local', 'maintenance.auto', 'false'], options);
}

/** Creates a temp directory from a `{ 'path/file': content }` map. A trailing `/` creates an empty dir. */
export function makeTree(files: Record<string, string>): string {
  return makeTreeAt(tmpdir(), 'mandao-test-', files);
}

/** Creates an isolated test-owned folder under a path where the child process can resolve repo dependencies. */
export function makeTreeAt(parent: string, prefix: string, files: Record<string, string>): string {
  const owner = testTreeScope.getStore();
  if (!owner) throw new Error('makeTree must be called inside a test');
  mkdirSync(parent, { recursive: true });
  const root = mkdtempSync(join(parent, prefix));
  const owned = trees.get(owner) ?? new Set<string>();
  owned.add(root);
  trees.set(owner, owned);
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

/** Removes only folders registered to this test owner. Exact-path recursive force tolerates prior deletion. */
export function removeTrees(owner = testTreeScope.getStore()): void {
  if (!owner) throw new Error('removeTrees requires the current test owner');
  for (const dir of trees.get(owner) ?? []) rmSync(dir, { recursive: true, force: true });
  trees.delete(owner);
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

/** Makes stdin look like a terminal (prompting commands refuse without one); returns the undo. */
export function stubTerminal(value = true): () => void {
  const before = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY');
  Object.defineProperty(process.stdin, 'isTTY', { value, configurable: true, writable: true });
  return () => {
    if (before) Object.defineProperty(process.stdin, 'isTTY', before);
    else delete (process.stdin as { isTTY?: boolean }).isTTY;
  };
}
