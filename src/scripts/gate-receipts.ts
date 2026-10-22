import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { writeText } from '../writer/files.js';
import type { Budget } from './resources.js';
import type { TestRun } from './run-tests.js';

/** Inputs that must remain byte-for-byte equivalent before a recorded gate result can be reused. */
export interface GateReceiptInputs {
  codeTree: string;
  configuration: string;
  selectedTests: string[];
  toolVersions: Record<string, string>;
}

export interface GateReceipt<T> {
  version: 1;
  fingerprint: string;
  result: T;
  output: string;
}

const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

/** A canonical fingerprint: array and object key order cannot hide a changed input. */
export function gateReceiptFingerprint(input: GateReceiptInputs): string {
  const tools = Object.entries(input.toolVersions).sort(([a], [b]) => a.localeCompare(b));
  return sha256(JSON.stringify([input.codeTree, input.configuration, [...input.selectedTests], tools]));
}

/** True only for a versioned receipt with the exact current fingerprint. */
export function reusableGateReceipt<T>(value: unknown, fingerprint: string): GateReceipt<T> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const receipt = value as Partial<GateReceipt<T>>;
  if (receipt.version !== 1 || receipt.fingerprint !== fingerprint || typeof receipt.output !== 'string' || !('result' in receipt))
    return undefined;
  return receipt as GateReceipt<T>;
}

/** Hashes every tracked file's current contents plus non-ignored untracked files, including staged changes. */
export function codeTreeFingerprint(root: string): string {
  const files = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })
    .split('\0')
    .filter((file) => Boolean(file) && !file.startsWith('.mandao/') && !file.split('/').includes('_log'))
    .sort();
  const hash = createHash('sha256');
  for (const file of files) {
    const full = join(root, file);
    hash.update(file).update('\0');
    if (existsSync(full))
      hash
        .update(String(lstatSync(full).mode))
        .update('\0')
        .update(readFileSync(full));
    else hash.update('<deleted>');
    hash.update('\0');
  }
  return hash.digest('hex');
}

/** Stable content identity for the resolved project configuration and lockfiles that pin its tools. */
export function gateConfigurationFingerprint(root: string, configuration: unknown, additionalRoot?: string): string {
  const lockFiles = [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lockb',
    'bun.lock',
    'pyproject.toml',
    'requirements.txt',
    'uv.lock',
    'poetry.lock',
    'go.mod',
    'go.sum',
    'Cargo.toml',
    'Cargo.lock',
  ];
  const roots = additionalRoot && additionalRoot !== root ? [root, additionalRoot] : [root];
  const locks = roots.flatMap((base) =>
    lockFiles.flatMap((file) => {
      const full = join(base, file);
      return existsSync(full) ? [[`${base === root ? '' : 'project/'}${file}`, readFileSync(full).toString('base64')]] : [];
    }),
  );
  return sha256(JSON.stringify([configuration, locks]));
}

/** Runtime versions used by the gate process itself and its local package toolchain. */
export function gateToolVersions(root: string, additionalRoot: string | undefined, command: string): Record<string, string> | undefined {
  const versions: Record<string, string> = { node: process.version };
  const roots = [root, ...(additionalRoot && additionalRoot !== root ? [additionalRoot] : [])];
  readLocalToolVersions(roots, versions);
  const probes = commandProbes();
  const names = Object.keys(probes).filter((tool) => new RegExp(`\\b${tool}\\b`).test(command));
  if (!names.length || !readCommandToolVersions(names, probes, additionalRoot ?? root, versions)) return undefined;
  if (names.includes('npx') && !addNpxPackageVersion(command, roots, versions)) return undefined;
  return versions;
}

function readLocalToolVersions(roots: string[], versions: Record<string, string>): void {
  for (const tool of ['vitest', 'jest', 'typescript', 'tsup', '@biomejs/biome', 'eslint']) {
    for (const base of roots) {
      try {
        const manifest = JSON.parse(readFileSync(join(base, 'node_modules', tool, 'package.json'), 'utf8')) as { version?: string };
        if (manifest.version) versions[tool] = manifest.version;
      } catch {
        // A tool that is not installed cannot contribute a local version; its lockfile remains fingerprinted.
      }
    }
  }
}

function commandProbes(): Record<string, string[]> {
  const tools = [
    'biome',
    'bun',
    'cargo',
    'eslint',
    'go',
    'jest',
    'make',
    'npm',
    'npx',
    'node',
    'pnpm',
    'pytest',
    'python',
    'python3',
    'tsc',
    'tsup',
    'vitest',
    'yarn',
  ];
  return Object.fromEntries(tools.map((tool) => [tool, [tool === 'go' ? 'version' : '--version']]));
}

function readCommandToolVersions(
  names: string[],
  probes: Record<string, string[]>,
  cwd: string,
  versions: Record<string, string>,
): boolean {
  for (const tool of names) {
    if (names.includes('npx') && ['biome', 'eslint', 'jest', 'tsc', 'tsup', 'vitest'].includes(tool)) continue;
    try {
      versions[tool] = execFileSync(tool, probes[tool]!, {
        cwd,
        encoding: 'utf8',
        timeout: 2500,
        stdio: ['ignore', 'pipe', 'ignore'],
      }).trim();
    } catch {
      return false;
    }
  }
  return true;
}

function addNpxPackageVersion(command: string, roots: string[], versions: Record<string, string>): boolean {
  const npxPackage = /\bnpx\s+(?:(?:--[\w-]+|-\w)\s+)*([@\w./-]+)/.exec(command)?.[1];
  if (!npxPackage) return true;
  const packageName = npxPackage.replace(/@[^/]+$/, '');
  if (!/^(@[\w.-]+\/)?[\w.-]+$/.test(packageName)) return false;
  for (const base of roots) {
    try {
      const manifest = JSON.parse(readFileSync(join(base, 'node_modules', packageName, 'package.json'), 'utf8')) as { version?: string };
      if (manifest.version) {
        versions[`npx:${packageName}`] = manifest.version;
        return true;
      }
    } catch {
      // npx may fetch an unpinned remote package; without a local exact version, disable receipt reuse.
    }
  }
  return false;
}

export interface ReusableGateInput {
  root: string;
  project: string;
  gate: string;
  command: string;
  configuration: unknown;
  selectedTests: string[];
  budget: Budget;
  projectRoot?: string;
  force?: boolean;
}

function isReusableRun(value: unknown): value is TestRun {
  if (!value || typeof value !== 'object') return false;
  const run = value as Partial<TestRun>;
  return (
    (run.status === 'PASS' || run.status === 'FAIL') &&
    typeof run.workers === 'number' &&
    typeof run.durationMs === 'number' &&
    typeof run.reason === 'string'
  );
}

/** Runs or reuses a gate only while its full tree, config, test selection, and tool versions match. */
export async function runWithGateReceipt(input: ReusableGateInput, execute: () => Promise<TestRun>): Promise<TestRun> {
  const toolRoot = input.projectRoot ?? input.root;
  const tools = gateToolVersions(input.root, toolRoot, input.command);
  if (!tools) return execute();
  let codeTree: string;
  try {
    codeTree = codeTreeFingerprint(input.root);
  } catch {
    return execute();
  }
  const fingerprint = gateReceiptFingerprint({
    codeTree,
    configuration: gateConfigurationFingerprint(
      input.root,
      {
        configuration: input.configuration,
        project: input.project,
        gate: input.gate,
        command: input.command,
        budget: input.budget,
      },
      toolRoot,
    ),
    selectedTests: input.selectedTests,
    toolVersions: tools,
  });
  const file = join(input.root, '.mandao', 'cache', 'gate-receipts', `${safeName(input.project)}-${safeName(input.gate)}.json`);
  if (!input.force && input.budget.decision !== 'defer' && existsSync(file)) {
    try {
      const receipt = reusableGateReceipt<TestRun>(JSON.parse(readFileSync(file, 'utf8')), fingerprint);
      if (receipt && isReusableRun(receipt.result)) return receipt.result;
    } catch {
      // A damaged local receipt is a cache miss; it must never prevent the gate from running.
    }
  }
  const result = await execute();
  const missingTool = result.exitCode === 127 || /command not found|not recognized as an internal/i.test(result.output ?? '');
  if (!input.force && !missingTool && (result.status === 'PASS' || result.status === 'FAIL')) {
    writeText(file, `${JSON.stringify({ version: 1, fingerprint, result, output: '' }, null, 2)}\n`);
  }
  return result;
}

const safeName = (value: string) => value.replace(/[^\w.-]/g, '_');
