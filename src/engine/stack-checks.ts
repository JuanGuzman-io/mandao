import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import type { Config } from '../schemas/index.js';
import { parseStackChecks, recordedStackChecks, stackFindings } from '../spec/index.js';

/** The constitution folder of the workspace, or of one project. */
export function constitutionDir(root: string, config: Config, projectPath?: string): string {
  return resolve(root, config.home, projectPath ?? '', config.paths.constitution);
}

/** Where a constitution's stack checks are recorded: beside it, in `_log/stack.md` (out of its hash). */
export const stackLogPath = (dir: string) => join(dir, '_log', 'stack.md');

const readIf = (f: string) => (existsSync(f) ? readFileSync(f, 'utf8') : undefined);

/** Files that pin a project's runtime: the version a stack check ran on stays the one the project uses. */
const PIN_FILES = [
  '.python-version',
  '.nvmrc',
  '.node-version',
  '.tool-versions',
  '.ruby-version',
  'rust-toolchain.toml',
  'rust-toolchain',
  'go.mod',
  '.java-version',
];

function pinsRuntime(dir: string): boolean {
  if (PIN_FILES.some((f) => existsSync(join(dir, f)))) return true;
  const pkg = readIf(join(dir, 'package.json'));
  if (pkg && /"engines"\s*:/.test(pkg)) return true;
  const pyproject = readIf(join(dir, 'pyproject.toml'));
  return Boolean(pyproject && /^\s*requires-python\s*=/m.test(pyproject));
}

/** Doctor's stack findings for the workspace and each project constitution that has a `## Stack verification`. */
export function stackCheckFindings(root: string, config: Config) {
  const places = [
    { where: 'workspace', dir: constitutionDir(root, config), project: resolve(root, config.home) },
    ...config.projects.map((p) => ({
      where: p.name,
      dir: constitutionDir(root, config, p.path),
      project: resolve(root, config.home, p.path),
    })),
  ];
  const seen = new Set<string>();
  return places.flatMap(({ where, dir, project }) => {
    if (seen.has(dir)) return [];
    seen.add(dir);
    const architecture = readIf(join(dir, 'architecture.md'));
    if (!architecture || !parseStackChecks(architecture).length) return [];
    const findings = stackFindings(architecture, recordedStackChecks(readIf(stackLogPath(dir))), where).map((f) => ({
      level: f.level,
      message: f.message,
      fix: 'run /mandao-constitution in active mode, or record the check with mandao run stack-check',
    }));
    const pin = pinsRuntime(project) || pinsRuntime(resolve(root, config.home));
    return pin
      ? findings
      : [
          ...findings,
          {
            level: 'warn' as const,
            message: `${where}: the stack is checked but no file pins the runtime`,
            fix: 'add .python-version, .nvmrc, engines or the like',
          },
        ];
  });
}
