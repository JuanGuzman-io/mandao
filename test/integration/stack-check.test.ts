// mandao-scans: none — reads only the temporary trees it creates.
import { mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { stackCheckFindings } from '../../src/engine/stack-checks.js';
import { configSchema } from '../../src/schemas/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';

/** Phase 18: a stack choice is proven by a run on the project's runtime, recorded beside the constitution. */
let out: string[];
beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  out = [];
  vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
});
afterEach(() => {
  vi.restoreAllMocks();
  process.exitCode = undefined;
});

const ARCH = `# Architecture

## Stack verification

### S1 — Node runs the CLI on the pinned runtime

### S2 — Qdrant local mode runs without a server
UNVERIFIED: no wheel for this platform yet.
`;

function workspace(pinned: boolean) {
  const root = realpathSync(
    makeTree({ 'package.json': pinned ? JSON.stringify({ name: 'shop', engines: { node: '>=20' } }) : pkg('shop') }),
  );
  initTestRepo(root);
  const config = { schema_version: 1, workspace: 'single', projects: [{ name: 'shop', path: '.' }], harnesses: ['claude'] };
  writeYaml(join(root, '.mandao/config.yml'), config);
  mkdirSync(join(root, 'docs/constitution'), { recursive: true });
  writeFileSync(join(root, 'docs/constitution/architecture.md'), ARCH);
  return { root, config: configSchema.parse(config) };
}
const cli = async (root: string, ...args: string[]) => {
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', ...args]);
  return JSON.parse(out.at(-1)!);
};
const messages = (root: string, config: ReturnType<typeof configSchema.parse>) =>
  stackCheckFindings(root, config).map((f) => `${f.level}: ${f.message}`);

describe('mandao run stack-check (phase 18)', () => {
  test('doctor warns on an unchecked choice and on an unpinned runtime, informs on UNVERIFIED', () => {
    const { root, config } = workspace(false);
    const found = messages(root, config);
    expect(found).toHaveLength(3);
    expect(found[0]).toMatch(/^warn: workspace S1 has no recorded run/);
    expect(found[1]).toMatch(/^info: workspace S2 is UNVERIFIED/);
    expect(found[2]).toMatch(/^warn: workspace: the stack is checked but no file pins the runtime/);
  });

  test('a recorded run, with its runtime version and exit, clears the warning; a failing run is recorded too', async () => {
    const { root, config } = workspace(true);
    const r = await cli(root, 'stack-check', 'S1', '--', 'node', '-e', 'console.log("ok")');
    expect(r).toMatchObject({ check: 'S1', recorded: true, exitCode: 0, record: 'docs/constitution/_log/stack.md' });
    expect(r.runtime).toMatch(/^v\d+/);
    const log = readFileSync(join(root, 'docs/constitution/_log/stack.md'), 'utf8');
    expect(log).toContain('## S1 — run');
    expect(log).toContain('- Claim: Node runs the CLI on the pinned runtime');
    expect(log).toMatch(/- Runtime: v\d+/);
    expect(messages(root, config)).toEqual([expect.stringMatching(/^info: workspace S2 is UNVERIFIED/)]);

    const failed = await cli(root, 'stack-check', 'S1', '--', 'node', '-e', 'process.exit(3)');
    expect(failed).toMatchObject({ recorded: true, exitCode: 3 });
    expect(readFileSync(join(root, 'docs/constitution/_log/stack.md'), 'utf8').match(/## S1 — run/g)).toHaveLength(1);
    expect(messages(root, config)[0]).toMatch(/^warn: workspace S1's last run failed \(exit 3\)/);
    // The probe's scratch and HOME never live in the committed constitution folder (review F4).
    const home = await cli(root, 'stack-check', 'S1', '--', 'node', '-e', 'console.log(process.env.HOME)');
    expect(home.excerpt).toContain(join(root, '.mandao/cache/stack/tmp/S1-home'));
  });

  test('a launcher as first word records no launcher version as the runtime (review F2)', async () => {
    const { root } = workspace(true);
    const r = await cli(root, 'stack-check', 'S1', '--', 'npx', '--version');
    expect(r.runtime).toBe('unknown (npx is a launcher: pass --runtime)');
    const given = await cli(root, 'stack-check', 'S1', '--runtime', 'node --version', '--', 'npx', '--version');
    expect(given.runtime).toMatch(/^v\d+/);
  });

  test("a project's check runs from its folder: a relative path inside the workspace passes, one outside is refused", async () => {
    const { root } = workspace(true);
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'monorepo',
      projects: [
        { name: 'shop', path: '.' },
        { name: 'api', path: 'apps/api' },
      ],
      harnesses: ['claude'],
    });
    mkdirSync(join(root, 'apps/api/docs/constitution'), { recursive: true });
    writeFileSync(join(root, 'apps/api/docs/constitution/architecture.md'), ARCH);
    writeFileSync(join(root, 'probe.js'), 'console.log("probe")');
    const inside = await cli(root, 'stack-check', 'S1', '--project', 'api', '--', 'node', '../../probe.js');
    expect(inside).toMatchObject({ recorded: true, exitCode: 0, record: 'apps/api/docs/constitution/_log/stack.md' });
    await expect(cli(root, 'stack-check', 'S1', '--project', 'api', '--', 'node', '../../../x.js')).rejects.toThrow(/outside the worktree/);
  });

  test('a path-qualified launcher is still a launcher', async () => {
    const { root } = workspace(true);
    const r = await cli(root, 'stack-check', 'S1', '--', '/usr/bin/env', 'node', '-v');
    expect(r.runtime).toBe('unknown (env is a launcher: pass --runtime)');
  });

  test('a check that is not in the Stack verification is refused', async () => {
    const { root } = workspace(true);
    await expect(cli(root, 'stack-check', 'S7', '--', 'node', '-v')).rejects.toThrow(/S7 is not in the Stack verification/);
  });
});
