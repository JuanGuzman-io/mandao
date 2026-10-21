import type { GeneratedFile } from '../adapters/types.js';
import { wrapBlock } from '../writer/blocks.js';

/** Conventional build outputs that never belong in the code graph. */
export const BUILD_OUTPUTS = ['dist/', 'build/', 'out/', 'coverage/', '.next/', '.turbo/', 'target/'];

/**
 * Patterns for everything Mandao generates, derived from the adapters' output rather than kept by
 * hand: whole Mandao-owned folders collapse to one pattern, other files are listed one by one.
 * Managed blocks are left out because the files they live in also hold user content.
 */
export function generatedPatterns(files: GeneratedFile[]): string[] {
  const patterns = new Set<string>();
  for (const f of files) {
    if (f.ownership !== 'owned' || f.scope !== 'project') continue;
    const inMandao = f.path.match(/^(\.mandao\/[^/]+\/)/);
    const ownedDir = f.path.match(/^(.*\/mandao-[^/]+\/)[^/]+$/);
    patterns.add(inMandao?.[1] ?? ownedDir?.[1] ?? f.path);
  }
  return [...patterns].sort();
}

/** `.graphifyignore`: graphify reads it with gitignore semantics on top of `.gitignore`. */
export function graphIgnoreBlock(files: GeneratedFile[], version: string): GeneratedFile {
  const path = '.graphifyignore';
  return {
    path,
    content: wrapBlock(path, [
      `# Managed by mandao ${version}: generated files and build outputs stay out of the code graph.`,
      ...generatedPatterns(files),
      ...BUILD_OUTPUTS,
    ]),
    ownership: 'managed-block',
    from: 'block:graph-ignore',
    harness: 'mandao',
    scope: 'project',
  };
}

/** `.gitignore`: the graph output is rebuilt by hooks and never committed; polyrepo children are their own repos. */
export function gitIgnoreBlock(childRepos: string[], version: string): GeneratedFile {
  const path = '.gitignore';
  return {
    path,
    content: wrapBlock(path, [
      `# Managed by mandao ${version}.`,
      'graphify-out/',
      // One heavy test run at a time (ADR 0013); the lock belongs to this machine.
      '.mandao/run.lock',
      // The CLI's own log (forced runs, ADR 0024) belongs to this machine.
      '.mandao/cli.log',
      // Each spec's local bulk: Reviewer packs, full gate output, probes, mutations, integrity (MDO-0011 D3).
      '.mandao/cache/',
      // Machine-specific agent settings (ADR 0015).
      '.claude/settings.local.json',
      ...childRepos.map((p) => `/${p}/`),
    ]),
    ownership: 'managed-block',
    from: 'block:gitignore',
    harness: 'mandao',
    scope: 'project',
  };
}
