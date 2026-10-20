import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'tsup';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';
import { makeTree } from '../helpers.js';

// Process-level proof (MDO-0005 D1): the real entry point, built once, run as a separate process.
// The bundle lives inside the repository so packageInfo() finds core/ (P5).
const root = fileURLToPath(new URL('../..', import.meta.url));
const cache = join(root, 'node_modules', '.cache');
let outDir = '';

beforeAll(async () => {
  mkdirSync(cache, { recursive: true });
  outDir = mkdtempSync(join(cache, 'mandao-cli-'));
  // Same entry, format, target and platform as tsup.config.ts.
  await build({
    entry: { cli: join(root, 'src/cli/index.ts') },
    format: ['esm'],
    target: 'node22',
    platform: 'node',
    outDir,
    config: false,
    silent: true,
  });
}, 20_000);

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true });
});

const config = 'schema_version: 1\nworkspace: single\nprojects:\n  - name: a\n    path: .\nharnesses: [claude]\n';
const brokenYaml = 'schema_version: 1\nworkspace: [unclosed\n  : :\n';
const lockSchemaInvalid = 'schema_version: 1\nunexpected: [1, 2]\nworkspace: 42\n';
const modelsSchemaInvalid = 'schema_version: 1\nmode: galaxy\n';

/** Runs `mandao doctor --json` as a separate process from a workspace holding the given broken file. */
function doctor(file: string, content: string) {
  const cwd = makeTree({ '.mandao/config.yml': config, [`.mandao/${file}`]: content });
  const result = spawnSync(process.execPath, [join(outDir, 'cli.js'), 'doctor', '--json'], {
    cwd,
    encoding: 'utf8',
    timeout: 20_000,
    env: { ...process.env, MANDAO_HOME: makeTree({}) },
  });
  return { status: result.status, stdout: result.stdout, stderr: result.stderr };
}

describe('doctor --json as a separate process', () => {
  test.each([
    ['S-1.1: a lock with broken YAML', brokenYaml],
    ['S-1.2: a lock that is valid YAML but fails the lock schema', lockSchemaInvalid],
  ])('%s crashes: status 1, empty stdout, error naming the lock on stderr', (_name, content) => {
    const { status, stdout, stderr } = doctor('mandao.lock', content);
    expect(status).toBe(1);
    expect(stdout).toBe('');
    expect(stderr).toMatch(/\berror\b/);
    expect(stderr).toContain(join('.mandao', 'mandao.lock'));
  });

  test.each([
    ['S-2.1: a models.yml with broken YAML', brokenYaml],
    ['S-2.2: a models.yml that is valid YAML but fails the models schema', modelsSchemaInvalid],
  ])('%s is an error finding in one JSON report, not a crash', (_name, content) => {
    const { status, stdout, stderr } = doctor('models.yml', content);
    expect(status).toBe(1);
    expect(stderr).toBe('');
    const report = JSON.parse(stdout);
    expect(report.schema_version).toBe(1);
    expect(report.findings).toContainEqual(
      expect.objectContaining({ level: 'error', message: expect.stringContaining(join('.mandao', 'models.yml')) }),
    );
  });
});
