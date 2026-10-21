import { describe, expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { buildOutputs } from '../../src/engine/sync.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { configSchema, PROFILES, WORKSPACE_MODES } from '../../src/schemas/index.js';

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
      const out = buildOutputs(config, {}, layers, '0.0.0', 'project');
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
    const { resolution } = buildOutputs(config, {}, layers, '0.0.0', 'project');
    const status = Object.fromEntries(resolution.commands.map((c) => [c.meta.id, c.meta.status]));
    expect(status).toEqual({
      constitution: 'stable',
      specify: 'stable',
      quick: 'stable',
      init: 'stable',
      story: 'stable',
      clarify: 'stable',
      tasks: 'stable',
      implement: 'stable',
      resume: 'stable',
      verify: 'stable',
      close: 'stable',
      audit: 'stub',
      perf: 'stub',
    });
    expect(resolution.personas.map((p) => p.meta.id)).toEqual(['implementer', 'leader', 'reviewer', 'tester']);
  });

  describe('skill guidance in /mandao-story and /mandao-specify', () => {
    const render = (harnesses: string[]) => {
      const config = configSchema.parse({
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'a', path: '.', profile: 'app' }],
        harnesses,
      });
      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
      // The command's own rendered markdown only; not auxiliary files such as codex's agents/openai.yaml.
      return files.filter((f) => /mandao-(story|specify).*\.md$/.test(f.path));
    };

    const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'];
    const LEFTOVER = /\{\{|mandao:if|mandao:endif/;

    test.each(HARNESSES)('S-5.1: %s render says when to use each skill, with no harness label, and the brainstorming hand-off', (h) => {
      const files = render([h]);
      expect(files.length).toBeGreaterThanOrEqual(2);
      for (const f of files) {
        expect(f.content, f.path).toMatch(/Use `?brainstorming`? when the story starts from nothing \(no code and no\s+tracker context\)/);
        expect(f.content, f.path).toMatch(/`?product-manager-toolkit`? when there is code and product context/);
        expect(f.content, f.path).not.toMatch(/Skills \(Claude Code\)/);
        expect(f.content, f.path).toMatch(/steps continue after `?brainstorming`?[^.]*`?superpowers:writing-plans`?/i);
        expect(f.content, f.path).not.toMatch(LEFTOVER);
      }
    });

    test.each(HARNESSES)(
      'S-5.1/C1: %s render says a missing skill leaves the command on its own steps and names the missing skill',
      (h) => {
        for (const f of render([h])) {
          expect(f.content, f.path).toMatch(
            /when a skill is missing,?\s+follow[^.]*own\s+steps[^.]*note[^.]*which\s+skill\s+was\s+missing/i,
          );
          expect(f.content, f.path).not.toMatch(LEFTOVER);
        }
      },
    );
  });

  test('the catalog is valid', () => {
    expect(() => readCatalog()).not.toThrow();
  });
});
