import { describe, expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { buildOutputs } from '../../src/engine/sync.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { configSchema, emptyModels, PROFILES, WORKSPACE_MODES } from '../../src/schemas/index.js';

/** The shipped core must resolve and render for every profile, mode and harness. */
describe('core content', () => {
  const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');

  test.each(PROFILES.flatMap((profile) => WORKSPACE_MODES.map((mode) => [profile, mode] as const)))(
    'renders for %s in %s mode',
    (profile, mode) => {
      const projects =
        mode === 'single'
          ? [{ name: 'a', path: '.', profile }]
          : [
              { name: 'a', path: 'a', profile, repo: 'local' },
              { name: 'b', path: 'b', profile: 'app' as const, repo: 'local' },
            ];
      const config = configSchema.parse({ schema_version: 1, workspace: mode, projects, harnesses: Object.keys(ADAPTERS) });
      const out = buildOutputs(config, emptyModels(), layers, '0.0.0', 'project');
      expect(out.files.length).toBeGreaterThan(20);
      // Nothing unrendered may leak into generated files.
      for (const f of out.files) expect(f.content, f.path).not.toMatch(/\{\{|mandao:if|mandao:endif/);
    },
  );

  test('ships every command in the flow, with stubs declared as such', () => {
    const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.', profile: 'app' }],
      harnesses: ['claude'],
    });
    const { resolution } = buildOutputs(config, emptyModels(), layers, '0.0.0', 'project');
    const status = Object.fromEntries(resolution.commands.map((c) => [c.meta.id, c.meta.status]));
    expect(status).toMatchObject({
      constitution: 'stable',
      specify: 'stable',
      quick: 'stable',
      init: 'stable',
      story: 'stub',
      tasks: 'stub',
      implement: 'stub',
    });
    expect(resolution.personas.map((p) => p.meta.id)).toEqual(['implementer', 'leader', 'reviewer', 'tester']);
  });

  test('the catalog is valid', () => {
    expect(() => readCatalog()).not.toThrow();
  });
});
