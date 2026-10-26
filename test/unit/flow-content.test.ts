import { readFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { buildOutputs } from '../../src/engine/sync.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { configSchema } from '../../src/schemas/index.js';

/** Phase 16: commands carry the work on to the next one; the content says so the same way everywhere. */
describe('continuous flow in the rendered commands', () => {
  const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');

  test('completed implementation returns an automatic verify transition instead of a handoff', () => {
    const implement = readFileSync('core/commands/implement.md', 'utf8');
    expect(implement).toMatch(/Verify always\s+follows implement in this same session \(`autoContinue`\)/);
    const rule = readFileSync('core/templates/shared/rules/next-step.md', 'utf8');
    expect(rule).toMatch(/\*\*`autoContinue: true`:\*\*[\s\S]*Invoke `recommended.invocation` now, in this\s+same session/);
  });

  test('phase 16: every flow command ends with the shared next-step rule and never sends delivery to a terminal', () => {
    for (const c of ['story', 'specify', 'clarify', 'tasks', 'implement', 'verify']) {
      const body = readFileSync(`core/commands/${c}.md`, 'utf8');
      expect(body, c).toContain('{{template:rules/next-step.md}}');
      expect(body, c).not.toMatch(/names the command that follows; give it/);
    }
    for (const c of ['close', 'quick'])
      expect(readFileSync(`core/commands/${c}.md`, 'utf8'), c).toMatch(/deliver [^\n]*--target <branch> --scope/);
  });

  test('phase 16: with flow.chain on, Claude may invoke the flow commands itself; off, or outside the flow, it may not', () => {
    const files = (chain: boolean) => {
      const config = configSchema.parse({
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'a', path: '.', profile: 'app' }],
        harnesses: ['claude'],
        flow: { chain },
      });
      return buildOutputs(config, {}, layers, '0.0.0', 'project').files;
    };
    const skill = (fs: { path: string; content: string }[], id: string) =>
      fs.find((f) => f.path === `.claude/skills/mandao-${id}/SKILL.md`)!.content;
    const on = files(true);
    for (const id of ['story', 'specify', 'clarify', 'tasks', 'implement', 'verify', 'close'])
      expect(skill(on, id), id).not.toContain('disable-model-invocation');
    for (const id of ['init', 'constitution', 'quick']) expect(skill(on, id), id).toContain('disable-model-invocation: true');
    expect(skill(files(false), 'implement')).toContain('disable-model-invocation: true');
  });
});
