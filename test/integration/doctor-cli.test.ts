import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import type { Finding } from '../../src/engine/doctor.js';
import { makeTree } from '../helpers.js';

// File-scoped mock (MDO-0004 D3): delegates to the real runDoctor unless a test overrides it once.
vi.mock('../../src/engine/doctor.js', async (importActual) => {
  const actual = await importActual<typeof import('../../src/engine/doctor.js')>();
  return { ...actual, runDoctor: vi.fn(actual.runDoctor) };
});

const { runDoctor } = await import('../../src/engine/doctor.js');
const mocked = vi.mocked(runDoctor);

const run = (root: string, ...args: string[]) => buildProgram(() => root).parseAsync(['node', 'mandao', ...args]);
// biome-ignore lint/suspicious/noControlCharactersInRegex: detecting ANSI escapes
const ANSI = /\x1b\[/;

const ttyDescriptor = Object.getOwnPropertyDescriptor(process.stdout, 'isTTY');
const noColor = process.env.NO_COLOR;
const mandaoHome = process.env.MANDAO_HOME;
let log: ReturnType<typeof vi.spyOn>;
let write: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  process.env.MANDAO_HOME = makeTree({});
  process.exitCode = undefined;
  log = vi.spyOn(console, 'log').mockImplementation(() => {});
  write = vi.spyOn(process.stdout, 'write').mockImplementation(() => true);
});

afterEach(() => {
  process.exitCode = undefined;
  if (ttyDescriptor) Object.defineProperty(process.stdout, 'isTTY', ttyDescriptor);
  else delete (process.stdout as { isTTY?: boolean }).isTTY;
  if (noColor === undefined) delete process.env.NO_COLOR;
  else process.env.NO_COLOR = noColor;
  if (mandaoHome === undefined) delete process.env.MANDAO_HOME;
  else process.env.MANDAO_HOME = mandaoHome;
  mocked.mockReset();
  vi.restoreAllMocks();
});

const setTty = (value: boolean) => Object.defineProperty(process.stdout, 'isTTY', { value, configurable: true, writable: true });
const exitCode = () => process.exitCode ?? 0;
const output = () => log.mock.calls.map((a: unknown[]) => String(a[0]));

const several: Finding[] = [
  { level: 'ok', message: 'Node 22.18.0' },
  { level: 'info', message: 'gitleaks not found: skip' },
  { level: 'warn', message: 'x was edited by hand', fix: 'move the change into .mandao/overrides/' },
];

describe('doctor --json with mocked findings', () => {
  test('S-2.1: one console.log, equal to the report, no ANSI, no arrow, no other line', async () => {
    setTty(true);
    delete process.env.NO_COLOR;
    mocked.mockReturnValueOnce(several);
    await run('/unused', 'doctor', '--json');
    expect(log).toHaveBeenCalledTimes(1);
    expect(write).not.toHaveBeenCalled();
    const text = output()[0];
    expect(JSON.parse(text)).toEqual({
      schema_version: 1,
      counts: { error: 0, warn: 1, info: 1, ok: 1 },
      findings: several,
    });
    expect(text).not.toMatch(ANSI);
    expect(text).not.toContain('→');
    expect(text).toBe(JSON.stringify(JSON.parse(text), null, 2));
  });

  test('S-2.2: when runDoctor throws, nothing reaches stdout and the error propagates', async () => {
    mocked.mockImplementationOnce(() => {
      throw new Error('boom: invalid preset');
    });
    // index.ts turns the rejection into stderr output and exit code 1 (unchanged); here we prove stdout stays empty.
    // The stderr message and exit code 1 are proven at process level in doctor-process.test.ts (MDO-0005).
    await expect(run('/unused', 'doctor', '--json')).rejects.toThrow('boom: invalid preset');
    expect(log).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  test('S-3.1: an error finding gives exit code 1 under --json', async () => {
    mocked.mockReturnValueOnce([...several, { level: 'error', message: 'broken' }]);
    await run('/unused', 'doctor', '--json');
    expect(exitCode()).toBe(1);
  });

  test('S-3.2: warn, info and ok only give exit code 0 under --json', async () => {
    mocked.mockReturnValueOnce(several);
    await run('/unused', 'doctor', '--json');
    expect(JSON.parse(output()[0]).counts.error).toBe(0);
    expect(exitCode()).toBe(0);
  });
});

describe('doctor --json with the real runDoctor', () => {
  test('S-4.1: no .mandao/config.yml gives a parseable report with the init fix and exit code 1', async () => {
    const root = makeTree({ 'package.json': '{}' });
    await run(root, 'doctor', '--json');
    expect(log).toHaveBeenCalledTimes(1);
    const report = JSON.parse(output()[0]);
    expect(report.findings).toContainEqual({
      level: 'error',
      message: 'no .mandao/config.yml in this directory',
      fix: 'run `npx mandao init`',
    });
    expect(report.counts.error).toBeGreaterThanOrEqual(1);
    expect(exitCode()).toBe(1);
  });

  test.each([
    ['workspace: galaxy', 'schema_version: 1\nworkspace: galaxy\nprojects:\n  - name: a\n    path: .\nharnesses: [claude]\n', 'workspace'],
    ['broken YAML', 'schema_version: 1\nworkspace: [unclosed\n  : :\n', undefined],
  ])('S-4.2: %s gives parseable error findings naming the file, no fix, exit code 1', async (_name, yaml, field) => {
    const root = makeTree({ '.mandao/config.yml': yaml });
    await run(root, 'doctor', '--json');
    expect(log).toHaveBeenCalledTimes(1);
    const report = JSON.parse(output()[0]);
    const errors = report.findings.filter((f: Finding) => f.level === 'error');
    expect(errors.length).toBeGreaterThanOrEqual(1);
    for (const f of errors) {
      expect(f.message).toContain('config.yml');
      expect(f).not.toHaveProperty('fix');
    }
    if (field) expect(errors.some((f: Finding) => f.message.includes(field))).toBe(true);
    expect(exitCode()).toBe(1);
  });
});

describe('doctor without --json (AC-4)', () => {
  test('S-5.1: prints exactly the ok, warn and arrow lines with exit code 0; an error finding gives exit code 1', async () => {
    setTty(false);
    delete process.env.NO_COLOR;
    const findings: Finding[] = [
      { level: 'ok', message: 'Node 22.18.0' },
      { level: 'warn', message: 'x was edited by hand', fix: 'move the change into .mandao/overrides/' },
    ];
    mocked.mockReturnValueOnce(findings);
    await run('/unused', 'doctor');
    expect(output()).toEqual(['  ok    Node 22.18.0', '  warn  x was edited by hand', '        → move the change into .mandao/overrides/']);
    expect(exitCode()).toBe(0);

    log.mockClear();
    mocked.mockReturnValueOnce([...findings, { level: 'error', message: 'broken' }]);
    await run('/unused', 'doctor');
    expect(output()).toHaveLength(4);
    expect(exitCode()).toBe(1);
  });
});
