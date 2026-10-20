import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { readModels, readYamlFile } from '../engine/files.js';
import { type Config, type HarnessId, type Models, modelsSchema, type Recommendations, recommendationsSchema } from '../schemas/index.js';
import { coreDir } from '../util/package-root.js';
import { type ModelLayer, type ResolvedModels, resolveModels } from './resolve.js';

export const readRecommendations = (): Recommendations =>
  readYamlFile(join(coreDir(), 'models', 'recommendations.yml'), recommendationsSchema);

/** `<project>/.mandao/models.yml`, for projects that are not the workspace root. */
export function readProjectModels(root: string, project: Config['projects'][number]): Models | undefined {
  if (project.path === '.') return undefined;
  const file = join(root, project.path, '.mandao', 'models.yml');
  return existsSync(file) ? readYamlFile(file, modelsSchema) : undefined;
}

export interface ResolveOptions {
  project?: Config['projects'][number];
  /** Extra layers: spec frontmatter and command flags. */
  extra?: ModelLayer[];
}

/** Resolves every active harness: recommendation < workspace < project < spec < flag. */
export function resolveWorkspaceModels(
  root: string,
  config: Config,
  recommendations: Recommendations,
  opts: ResolveOptions = {},
): Partial<Record<HarnessId, ResolvedModels>> {
  const workspace = readModels(root);
  const project = opts.project ? readProjectModels(root, opts.project) : undefined;
  const mode = project?.mode ?? workspace.mode ?? 'routed';
  const out: Partial<Record<HarnessId, ResolvedModels>> = {};
  for (const harness of config.harnesses) {
    out[harness] = resolveModels(
      harness,
      mode,
      recommendations,
      [
        { source: 'workspace', models: workspace.harnesses[harness] },
        { source: 'project', models: project?.harnesses[harness] },
        ...(opts.extra ?? []),
      ],
      workspace.profile ?? 'peak',
    );
  }
  return out;
}
