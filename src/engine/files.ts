import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import type { z } from 'zod';
import {
  type Config,
  configSchema,
  emptyModels,
  formatIssues,
  type Lock,
  lockSchema,
  type Models,
  modelsSchema,
  type Sources,
  sourcesSchema,
} from '../schemas/index.js';

export const MANDAO_DIR = '.mandao';
export const CONFIG_FILE = `${MANDAO_DIR}/config.yml`;
export const LOCK_FILE = `${MANDAO_DIR}/mandao.lock`;
export const SOURCES_FILE = `${MANDAO_DIR}/sources.yml`;
export const MODELS_FILE = `${MANDAO_DIR}/models.yml`;

export class ConfigError extends Error {
  constructor(readonly issues: string[]) {
    super(issues.join('\n'));
  }
}

export function readYamlFile<S extends z.ZodType>(file: string, schema: S): z.infer<S> {
  let raw: unknown;
  try {
    raw = parseYaml(readFileSync(file, 'utf8'));
  } catch (e) {
    throw new ConfigError([`${file}: ${(e as Error).message}`]);
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw new ConfigError(formatIssues(result.error, file));
  return result.data;
}

export const hasConfig = (root: string) => existsSync(join(root, CONFIG_FILE));
export const readConfig = (root: string): Config => readYamlFile(join(root, CONFIG_FILE), configSchema);
export const readSources = (root: string): Sources => readYamlFile(join(root, SOURCES_FILE), sourcesSchema);
export const readModels = (root: string): Models =>
  existsSync(join(root, MODELS_FILE)) ? readYamlFile(join(root, MODELS_FILE), modelsSchema) : emptyModels();
const textOrEmpty = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : '');
/** What the lock's config_hash covers: the files a user edits to change generated output. */
export const inputsText = (root: string) => `${textOrEmpty(join(root, CONFIG_FILE))}\0${textOrEmpty(join(root, MODELS_FILE))}`;

export function readLock(file: string): Lock | undefined {
  return existsSync(file) ? readYamlFile(file, lockSchema) : undefined;
}

export function writeYaml(file: string, data: unknown, header?: string) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${header ? `${header}\n` : ''}${stringifyYaml(data, { lineWidth: 0 })}`);
}
