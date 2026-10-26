import { describe, expect, test } from 'vitest';
import { configSchema, GATES } from '../../src/schemas/index.js';
import { GATE_ORDER } from '../../src/scripts/gates.js';

describe('the eval gate (phase 17, MDO-0001: a real-model evaluation went into the metrics slot)', () => {
  test('is a named gate of the config', () => {
    expect(GATES).toContain('eval');
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.', gates: { eval: 'uv run pytest -m eval' } }],
      harnesses: ['claude'],
    });
    expect(config.projects[0]!.gates.eval).toBe('uv run pytest -m eval');
  });

  test('never runs among the task gates: it costs real model calls, so verify runs it (PE decision)', () => {
    expect(GATE_ORDER).not.toContain('eval');
  });
});
