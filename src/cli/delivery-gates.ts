import { execFileSync, spawnSync } from 'node:child_process';
import { join } from 'node:path';
import type { Config, ProjectConfig } from '../schemas/index.js';
import { detectRunner, fillCommand, findScanners, projectDir, readGraph, selectImpact } from '../scripts/impact.js';
import { runTests } from '../scripts/run-tests.js';
import { budgetFor } from './budget.js';

const git = (cwd: string, args: string[]) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();

function fromProject(project: ProjectConfig, command: string): string {
  if (project.path === '.') return command;
  return `cd '${project.path.replaceAll("'", "'\\''")}' && ${command}`;
}

function command(cwd: string, bin: string, args: string[]): string {
  const result = spawnSync(bin, args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${bin} ${args.join(' ')} failed: ${(result.stderr || result.stdout || '').trim()}`);
  return result.stdout.trim();
}

function ensureTargetRef(repo: string, target: string): string {
  const remoteRef = `refs/remotes/origin/${target}`;
  try {
    git(repo, ['rev-parse', '--verify', remoteRef]);
  } catch {
    command(repo, 'git', ['fetch', '--quiet', 'origin', `${target}:${remoteRef}`]);
  }
  return remoteRef;
}

async function runPrePushGate(
  repo: string,
  config: Config,
  project: ProjectConfig,
  gate: 'lint' | 'typecheck' | 'build' | 'test',
  check: string,
): Promise<void> {
  const kind = gate === 'build' ? 'build' : 'unit';
  const budget = budgetFor(repo, config, project, kind, `delivery ${gate}`);
  const result = await runTests(repo, `delivery ${gate}`, fromProject(project, check), budget);
  if (result.status !== 'PASS') throw new Error(`pre-push ${gate} ${result.status}: ${result.reason}`);
}

async function runProjectGates(repo: string, config: Config, project: ProjectConfig): Promise<void> {
  for (const gate of ['lint', 'typecheck', 'build'] as const) {
    const check = project.gates[gate];
    if (!check) continue;
    console.log(`Pre-push ${project.name}/${gate}: ${check}`);
    await runPrePushGate(repo, config, project, gate, check);
  }
}

async function runProjectTests(repo: string, config: Config, project: ProjectConfig, changed: string[]): Promise<void> {
  const cwd = projectDir(repo, project.path);
  if (config.delivery.pre_push === 'full') {
    const full = project.gates.test;
    if (full) await runPrePushGate(repo, config, project, 'test', full);
    return;
  }
  const impact = selectImpact({
    changed,
    projectPath: project.path,
    configured: project.tests.impacted,
    runner: detectRunner(cwd),
    graph: readGraph(join(repo, 'graphify-out', 'graph.json')),
    scanners: findScanners(repo, project.path),
  });
  if (!impact.command || !impact.files.length) {
    console.log(`Pre-push tests: no impacted tests configured/detected for ${project.name}.`);
    return;
  }
  const budget = budgetFor(repo, config, project, 'unit', `delivery impacted tests ${project.name}`);
  const commandLine = fillCommand(impact.command, impact.files, Math.max(1, budget.workers));
  console.log(`Pre-push ${project.name}/impacted tests (${impact.source}): ${commandLine}`);
  const result = await runTests(repo, `delivery impacted tests ${project.name}`, fromProject(project, commandLine), budget);
  if (result.status !== 'PASS') throw new Error(`pre-push impacted tests ${result.status}: ${result.reason}`);
}

/** Applies configured pre-push checks under the resource and serial-run guards. */
export async function prePush(repo: string, config: Config, target: string, branch: string): Promise<void> {
  if (config.delivery.pre_push === 'none') {
    console.log('Pre-push checks: disabled by delivery.pre_push: none.');
    return;
  }
  const remoteRef = ensureTargetRef(repo, target);
  const changed = git(repo, ['diff', '--name-only', `${remoteRef}...${branch}`])
    .split('\n')
    .filter(Boolean);
  for (const project of config.projects) {
    await runProjectGates(repo, config, project);
    await runProjectTests(repo, config, project, changed);
  }
}
