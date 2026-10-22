import { existsSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Config } from '../schemas/index.js';
import type { Finding } from './doctor.js';

const EXTENSIONS = ['js', 'cjs', 'mjs', 'ts', 'cts'];
const CONFIG_FILES = [
  ...EXTENSIONS.map((e) => `commitlint.config.${e}`),
  '.commitlintrc',
  '.commitlintrc.json',
  '.commitlintrc.yaml',
  '.commitlintrc.yml',
  ...EXTENSIONS.map((e) => `.commitlintrc.${e}`),
  '.config/commitlintrc',
  '.config/commitlintrc.json',
  '.config/commitlintrc.yaml',
  '.config/commitlintrc.yml',
  ...EXTENSIONS.map((e) => `.config/commitlintrc.${e}`),
];
const MANDAO_EXTENDS = /\.mandao\/commitlint\.config\.mjs/;
/**
 * The official presets whose header/type/subject-case rules reject an emoji prefix. commitlint resolves a
 * shorthand like `conventional` to `commitlint-config-conventional` (a different package), so only the
 * full `@commitlint/config-*` names match; `-type-enum` and similar sibling packages do not.
 */
const EMOJI_HOSTILE = /@commitlint\/config-(?:conventional|angular)(?![\w-])/;
/** `rules:` in JSON/JS/YAML (also a YAML block), or the shorthand `rules,` / `rules }` in JS; or a custom parser preset. */
const HAS_RULES = /\brules\s*["']?\s*:|[{,]\s*rules\s*[,}]|\bparserPreset\b/;

/** A project's own commitlint config as text (never executed), with the file it came from. */
function projectConfig(dir: string): { file: string; text: string } | undefined {
  for (const file of CONFIG_FILES) {
    const path = join(dir, file);
    if (existsSync(path)) return { file, text: readFileSync(path, 'utf8') };
  }
  const pkgPath = join(dir, 'package.json');
  if (!existsSync(pkgPath)) return undefined;
  try {
    const manifest = JSON.parse(readFileSync(pkgPath, 'utf8')) as { commitlint?: unknown };
    if (manifest.commitlint !== undefined) return { file: 'package.json', text: JSON.stringify(manifest.commitlint) };
  } catch {
    // an unreadable package.json is not Mandao's to report here
  }
  return undefined;
}

function findingsFor(root: string, dir: string, config: Config): Finding[] {
  const found = projectConfig(dir);
  if (!found || MANDAO_EXTENDS.test(found.text)) return [];
  const file = join(relative(root, dir), found.file);
  if (EMOJI_HOSTILE.test(found.text)) {
    if (config.commits.emoji === false) return [];
    return [
      {
        level: 'warn',
        message: `${file} extends a commitlint preset (@commitlint/config-conventional or -angular) whose header, type and subject-case rules reject Mandao's emoji prefix, so Mandao's commits fail it`,
        fix: 'set `commits.emoji: false` in .mandao/config.yml for plain Conventional Commits, or extend ./.mandao/commitlint.config.mjs instead. Mandao does not edit your commitlint config.',
      },
    ];
  }
  if (HAS_RULES.test(found.text)) {
    return [
      {
        level: 'info',
        message: `${file} has custom rules Mandao cannot evaluate, so it may reject Mandao's commit format`,
        fix: "extend Mandao's config from yours: `extends: ['./.mandao/commitlint.config.mjs']`. Mandao does not edit your commitlint config.",
      },
    ];
  }
  return [];
}

/**
 * Project-owned commitlint configs that could reject Mandao's commit format (ADR 0055). Detection is
 * static: files are read as text, never executed, and Mandao never edits them. Mandao's own
 * `.mandao/commitlint.config.mjs` is not a project config, and one that extends it is left alone. A
 * polyrepo also checks each project's repository root.
 */
export function commitlintFindings(root: string, config: Config): Finding[] {
  const dirs = [root, ...(config.workspace === 'polyrepo' ? config.projects.map((p) => join(root, p.path)) : [])];
  return [...new Set(dirs)].flatMap((dir) => findingsFor(root, dir, config));
}
