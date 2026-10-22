import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { constitutionPrincipleFindings, principlesForProjects } from '../../src/engine/constitution-principles.js';
import { configSchema } from '../../src/schemas/config.js';
import { makeTree } from '../helpers.js';

const config = configSchema.parse({
  schema_version: 1,
  workspace: 'single',
  projects: [{ name: 'app', path: 'app' }],
  harnesses: ['claude'],
});

describe('constitution design principles', () => {
  test('doctor reports a missing principle section as info and never writes it', () => {
    const root = makeTree({});
    const findings = constitutionPrincipleFindings(root, config);
    expect(findings).toEqual([
      expect.objectContaining({ level: 'info', message: 'workspace constitution has no declared design principles' }),
      expect.objectContaining({ level: 'info', message: 'app constitution has no declared design principles' }),
    ]);
  });

  test('reads approved principle IDs from workspace and relevant project constitutions', () => {
    const root = makeTree({});
    const workspace = join(root, config.paths.constitution);
    const project = join(root, 'app', config.paths.constitution);
    mkdirSync(workspace, { recursive: true });
    mkdirSync(project, { recursive: true });
    const standards = (id: string) =>
      `## Design principles\n\n| ID | Principle | Rule |\n|---|---|---|\n| ${id} | rule | concrete rule |\n`;
    writeFileSync(join(workspace, 'standards.md'), standards('DP-SIMPLE'));
    writeFileSync(join(project, 'standards.md'), standards('DP-APP'));
    expect(principlesForProjects(root, config, ['app'])).toEqual(['DP-SIMPLE', 'DP-APP']);
    expect(constitutionPrincipleFindings(root, config)).toEqual([]);
  });
});
