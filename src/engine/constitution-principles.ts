import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Config } from '../schemas/index.js';
import { declaredPrinciples } from '../util/constitution.js';

function standardsPath(root: string, config: Config, projectPath?: string): string {
  return resolve(root, config.home, projectPath ?? '', config.paths.constitution, 'standards.md');
}

export function principlesForProjects(root: string, config: Config, projectNames: string[] = []): string[] {
  const paths = [
    standardsPath(root, config),
    ...config.projects.filter((project) => projectNames.includes(project.name)).map((project) => standardsPath(root, config, project.path)),
  ];
  return [...new Set(paths.flatMap((file) => (existsSync(file) ? declaredPrinciples(readFileSync(file, 'utf8')) : [])))];
}

/** Missing principles are advisory: existing constitutions are never silently rewritten. */
export function constitutionPrincipleFindings(root: string, config: Config) {
  const workspacePath = standardsPath(root, config);
  const workspaceIds = existsSync(workspacePath) ? declaredPrinciples(readFileSync(workspacePath, 'utf8')) : [];
  const findings = workspaceIds.length
    ? []
    : [
        {
          level: 'info' as const,
          message: 'workspace constitution has no declared design principles',
          fix: 'run /mandao-constitution in active mode to review and approve a principles section',
        },
      ];
  const seen = new Set([workspacePath]);
  for (const project of config.projects) {
    const path = standardsPath(root, config, project.path);
    if (seen.has(path)) continue;
    seen.add(path);
    const local = existsSync(path) ? declaredPrinciples(readFileSync(path, 'utf8')) : [];
    if (!workspaceIds.length && !local.length) {
      findings.push({
        level: 'info',
        message: `${project.name} constitution has no declared design principles`,
        fix: 'run /mandao-constitution in active mode to review and approve a principles section',
      });
    }
  }
  return findings;
}
