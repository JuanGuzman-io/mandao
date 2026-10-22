import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { reviewDiff } from '../../src/scripts/review.js';
import { sha256 } from '../../src/util/hash.js';

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function repo(files: Record<string, string>) {
  const root = mkdtempSync(join(tmpdir(), 'mandao-review-diff-'));
  roots.push(root);
  for (const [path, content] of Object.entries(files)) {
    const full = join(root, path);
    mkdirSync(dirname(full), { recursive: true });
    writeFileSync(full, content);
  }
  const git = (...args: string[]) => execFileSync('git', args, { cwd: root, stdio: 'ignore' });
  git('init', '-q');
  git('config', 'user.name', 'Mandao Test');
  git('config', 'user.email', 'mandao-test@example.invalid');
  git('add', '.');
  git('commit', '-qm', 'baseline');
  return { root, git };
}

describe('Reviewer source diff receipts', () => {
  test('replaces a matching owned generated copy with a hash and origin receipt', () => {
    const generated = 'generated copy v2\n';
    const oldLock = JSON.stringify({ schema_version: 1, mandao: '0.1.0', config_hash: sha256(''), layers: [], files: [] });
    const { root } = repo({
      '.mandao/mandao.lock': oldLock,
      'src/main.ts': 'export const value = 1;\n',
      '.claude/commands/mandao-test.md': 'generated copy v1\n',
    });
    const lock = JSON.stringify({
      schema_version: 1,
      mandao: '0.1.0',
      config_hash: sha256(''),
      layers: [],
      files: [
        {
          path: '.claude/commands/mandao-test.md',
          harness: 'claude',
          from: 'command:test',
          ownership: 'owned',
          hash: sha256(generated),
          scope: 'project',
        },
      ],
    });
    writeFileSync(join(root, '.mandao/mandao.lock'), lock);
    writeFileSync(join(root, '.claude/commands/mandao-test.md'), generated);
    writeFileSync(join(root, 'src/main.ts'), 'export const value = 2;\n');
    const diff = reviewDiff(root, join(root, 'specs/example'));
    expect(diff).toContain('+export const value = 2;');
    expect(diff).toContain('.claude/commands/mandao-test.md');
    expect(diff).toContain('from command:test');
    expect(diff).not.toContain('+generated copy v2');
  });

  test('includes the complete generated diff when its receipt does not match', () => {
    const { root } = repo({ '.claude/commands/mandao-test.md': 'generated v1\n' });
    writeFileSync(join(root, '.claude/commands/mandao-test.md'), 'generated v2\n');
    const diff = reviewDiff(root, join(root, 'specs/example'));
    expect(diff).toContain('+generated v2');
    expect(diff).not.toContain('Generated file receipts');
  });

  test('receipts a diagram SVG only when the source specification and marker agree', () => {
    const spec = { nodes: ['a', 'b'] };
    const specSha256 = createHash('sha256').update(JSON.stringify(spec)).digest('hex');
    const currentSvg = `<!-- mandao:diagram test-flow spec-sha256 ${specSha256} -->\n<svg>new</svg>\n`;
    const source = 'const source = true;\n';
    const sourceHash = createHash('sha256').update(source).digest('hex');
    const sourceRecord = JSON.stringify({
      name: 'test-flow',
      spec,
      specSha256,
      derivedFrom: [{ path: 'core/commands/test.md', sha256: sourceHash }],
      svgSha256: { light: createHash('sha256').update(currentSvg).digest('hex') },
    });
    const { root } = repo({
      'docs/diagrams/src/test-flow.json': sourceRecord,
      'docs/diagrams/test-flow-light.svg': '<svg>old</svg>\n',
      'core/commands/test.md': source,
    });
    writeFileSync(join(root, 'docs/diagrams/test-flow-light.svg'), currentSvg);
    const receipt = reviewDiff(root, join(root, 'specs/example'));
    expect(receipt).toContain('from docs/diagrams/src/test-flow.json');
    expect(receipt).not.toContain('+<svg>new</svg>');
    writeFileSync(join(root, 'docs/diagrams/test-flow-light.svg'), '<svg>tampered</svg>\n');
    const fallback = reviewDiff(root, join(root, 'specs/example'));
    expect(fallback).toContain('+<svg>tampered</svg>');
    expect(fallback).not.toContain('Generated file receipts');
    writeFileSync(join(root, 'docs/diagrams/test-flow-light.svg'), currentSvg);
    writeFileSync(
      join(root, 'docs/diagrams/src/test-flow.json'),
      JSON.stringify({
        name: 'test-flow',
        spec,
        specSha256,
        derivedFrom: [],
        svgSha256: { light: createHash('sha256').update(currentSvg).digest('hex') },
      }),
    );
    const missingSources = reviewDiff(root, join(root, 'specs/example'));
    expect(missingSources).toContain('+<svg>new</svg>');
    expect(missingSources).not.toContain('from docs/diagrams/src/test-flow.json');
  });
});
