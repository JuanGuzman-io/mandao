import { describe, expect, test } from 'vitest';
import type { Layer, LayerKind } from '../../src/resolver/layers.js';
import { mergePatch, ResolveError, resolve } from '../../src/resolver/resolve.js';

const layer = (kind: LayerKind, files: Record<string, string>, id: string = kind): Layer => ({
  kind,
  id,
  files: new Map(Object.entries(files)),
});

const command = (id: string, extra = '', body = 'Body') => `---
schema_version: 1
id: ${id}
title: ${id}
description: ${id} command
status: stable
inputs: []
outputs: []
scope: project
capabilities: [read]
${extra}---
${body}
`;

describe('resolve', () => {
  test('overrides beat presets, which beat core, per file', () => {
    const r = resolve([
      layer('core', { 'commands/a.md': command('a', '', 'core a'), 'commands/b.md': command('b', '', 'core b') }),
      layer('preset', { 'commands/a.md': command('a', '', 'preset a') }, 'team'),
      layer('overrides', { 'commands/b.md': command('b', '', 'override b') }),
    ]);
    expect(r.commands.map((c) => [c.meta.id, c.body.trim(), c.origin.id])).toEqual([
      ['a', 'preset a', 'team'],
      ['b', 'override b', 'overrides'],
    ]);
  });

  test('patches from higher layers merge frontmatter and keep the body', () => {
    const r = resolve([
      layer('core', { 'commands/a.md': command('a', 'approval: none\nharness:\n  claude: { x: 1, y: 2 }\n') }),
      layer('overrides', { 'commands/a.patch.yml': 'approval: required\nstatus: stub\nharness:\n  claude: { y: null, z: 3 }\n' }),
    ]);
    const a = r.commands[0]!;
    expect(a.meta.status).toBe('stub');
    expect(a.meta.approval).toBe('required');
    expect(a.meta.harness.claude).toEqual({ x: 1, z: 3 });
    expect(a.body.trim()).toBe('Body');
    expect(a.origin.patchedBy).toEqual(['overrides']);
  });

  test('a patch in a layer below the full replacement is ignored', () => {
    const r = resolve([
      layer('core', { 'commands/a.md': command('a') }),
      layer('preset', { 'commands/a.patch.yml': 'approval: required\n' }),
      layer('overrides', { 'commands/a.md': command('a') }),
    ]);
    expect(r.commands[0]!.meta.approval).toBe('none');
  });

  test('reports orphan patches, id mismatches, invalid frontmatter and broken references together', () => {
    let err: ResolveError | undefined;
    try {
      resolve([
        layer('core', {
          'commands/a.md': command('a', 'flow: { next: [ghost] }\n'),
          'commands/b.md': command('not-b'),
          'commands/c.md': command('c', 'approval: maybe\n'),
          'personas/reviewer.md':
            '---\nschema_version: 1\nid: reviewer\ntitle: R\ndescription: r\ncapabilities: [read]\nmust_differ_from: implementer\n---\n',
        }),
        layer('overrides', { 'commands/zzz.patch.yml': 'approval: required\n' }),
      ]);
    } catch (e) {
      err = e as ResolveError;
    }
    expect(err).toBeInstanceOf(ResolveError);
    expect(err!.issues).toEqual(
      expect.arrayContaining([
        'core:commands/b.md: id "not-b" does not match the file name "b"',
        expect.stringMatching(/^core:commands\/c\.md: approval: /),
        'overrides:commands/zzz.patch.yml: patches unknown command "zzz"',
        'command "a": flow references unknown command "ghost"',
        'persona "reviewer": must_differ_from references unknown persona "implementer"',
      ]),
    );
  });

  test('templates resolve per profile key', () => {
    const r = resolve([
      layer('core', { 'templates/shared/design.md': 'core shared', 'templates/ai/design.md': 'core ai' }),
      layer('overrides', { 'templates/shared/design.md': 'mine' }),
    ]);
    expect(r.templates.map((t) => [t.key, t.content])).toEqual([
      ['ai/design.md', 'core ai'],
      ['shared/design.md', 'mine'],
    ]);
  });
});

test('mergePatch replaces arrays instead of concatenating', () => {
  expect(mergePatch({ a: [1, 2], b: { c: 1 } }, { a: [3], b: { d: 2 } })).toEqual({ a: [3], b: { c: 1, d: 2 } });
});
