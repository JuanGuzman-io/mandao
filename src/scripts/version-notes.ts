import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix, relative } from 'node:path';
import { TEMPLATES_DIR } from '../render/render.js';
import { type Config, keepsLogCache, STORY_ID } from '../schemas/index.js';
import {
  changelogEntries,
  chooseTemplateLanguage,
  parseStory,
  parseVersionNotesTemplate,
  type Story,
  splitRefs,
  type VersionNoteEntry,
  type VersionNotesTemplate,
} from '../spec/index.js';
import { coreDir } from '../util/package-root.js';
import { poNotes } from './publish.js';

const RECORD = '\x1e';

const git = (repo: string, args: string[]) =>
  execFileSync('git', args, { cwd: repo, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] }).trim();

/** Best-effort git read: undefined when the ref or the tag does not exist. */
function tryGit(repo: string, args: string[]): string | undefined {
  try {
    return git(repo, args) || undefined;
  } catch {
    return undefined; // missing ref, no tag reachable, or a root commit without a parent: the caller decides
  }
}

const commitOf = (repo: string, ref: string) => tryGit(repo, ['rev-parse', '--verify', '--quiet', `${ref}^{commit}`]);

/** The nearest version tag (`v1.2.3` or `1.2.3`) reachable from `ref`; other tags (`deploy-prod`) are ignored. */
const releaseTag = (repo: string, ref: string) =>
  tryGit(repo, ['describe', '--tags', '--abbrev=0', '--match', 'v[0-9]*', '--match', '[0-9]*', ref]);

export interface VersionRange {
  /** The previous tag; null when there is none and the range is the whole history. */
  from: string | null;
  to: string;
}

/**
 * `<previous tag>..<to>`. `to` defaults to `origin/<base>` when that ref exists, else HEAD. The previous tag is `--from`
 * or the nearest tag reachable from `to`, except the version's own tag sitting on `to` (re-running for a tagged release).
 */
export function versionRange(repo: string, version: string, base: string, o: { from?: string; to?: string }): VersionRange {
  const to = o.to ?? (commitOf(repo, `refs/remotes/origin/${base}`) ? `origin/${base}` : 'HEAD');
  const head = commitOf(repo, to);
  if (!head) throw new Error(`"${to}" is not a commit in this repository`);
  if (o.from) {
    if (!commitOf(repo, o.from)) throw new Error(`"${o.from}" is not a commit in this repository`);
    return { from: o.from, to };
  }
  const tag = releaseTag(repo, to);
  const own = tag !== undefined && tag.replace(/^v/, '') === version && commitOf(repo, tag) === head;
  const from = own ? releaseTag(repo, `${to}^`) : tag;
  return { from: from ?? null, to };
}

/** The story IDs named by the `refs` trailer of every commit in `range` (a git revision range); other values are ignored. */
function refsIn(repo: string, trailer: string, range: string): string[] {
  const log = git(repo, ['log', `--format=%(trailers:key=${trailer},valueonly,separator=%x2C)${RECORD}`, range]);
  return log
    .split(RECORD)
    .flatMap((r) => r.split(','))
    .map((id) => id.trim())
    .filter((id) => STORY_ID.test(id));
}

/** A file's text at commit `ref` (path relative to the workspace); undefined when it does not exist there. */
function showAt(repo: string, ref: string, path: string): string | undefined {
  try {
    return execFileSync('git', ['show', `${ref}:./${path}`], {
      cwd: repo,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return undefined; // the path does not exist at `ref`: absent, as the caller expects
  }
}

/** A spec folder at `ref`, found like `findSpec` (exact name or `<ID>-…`), with its parsed story. */
interface SpecAt {
  dir: string;
  story?: Story;
}

function specsAt(repo: string, ref: string, specs: string): string[] {
  const list = tryGit(repo, ['ls-tree', '-d', '--name-only', ref, '--', `${specs}/`]) ?? '';
  return list
    .split('\n')
    .map((p) => posix.basename(p.trim()))
    .filter(Boolean);
}

function specAt(read: (path: string) => string | undefined, folders: string[], specs: string, id: string): SpecAt | undefined {
  const name = folders.find((f) => f === id) ?? folders.find((f) => f.startsWith(`${id}-`));
  if (!name) return undefined;
  const dir = posix.join(specs, name);
  const text = read(posix.join(dir, 'story.md'));
  const story = text ? parseStory(text).story : undefined;
  return { dir, ...(story ? { story } : {}) };
}

/**
 * Closed specs referenced in the range, with their PO text or why it is missing, all read at `range.to` (never the
 * working tree). Closed: a `docs/CHANGELOG.md` line, or a story with `status: closed` (version 1 closes before the CHANGELOG).
 */
export function collectSpecs(root: string, config: Config, range: VersionRange) {
  const read = (path: string) => showAt(root, range.to, path);
  const changelog = changelogEntries(read('docs/CHANGELOG.md'));
  const trailer = config.commits.trailers.refs;
  const inRange = refsIn(root, trailer, range.from ? `${range.from}..${range.to}` : range.to);
  const before = range.from ? refsIn(root, trailer, range.from) : [];
  const folders = specsAt(root, range.to, config.paths.specs);
  const specs = new Map([...new Set(inRange)].map((id) => [id, specAt(read, folders, config.paths.specs, id)]));
  const closed = new Set([...specs].filter(([id, spec]) => changelog.has(id) || spec?.story?.meta.status === 'closed').map(([id]) => id));
  const { ids, straddling } = splitRefs(inRange, before, closed);
  const entries = ids.map((id): VersionNoteEntry => {
    const line = changelog.get(id);
    const spec = specs.get(id);
    const head = { id, title: spec?.story?.title || line?.title || id, type: spec?.story?.meta.type ?? line?.type ?? 'story' };
    if (!spec) return { ...head, reason: `no spec folder for ${id} in ${config.paths.specs}` };
    const version = keepsLogCache(spec.story?.meta.schema_version) ? 2 : 1;
    const notes = poNotes(read, posix.join(config.paths.releases, id), spec.dir, version);
    return 'text' in notes ? { ...head, text: notes.text } : { ...head, reason: notes.missing };
  });
  return { entries, straddling };
}

export interface LoadedTemplate {
  template: VersionNotesTemplate;
  /** Relative to the workspace for an installed template; `core:<path>` for the package's copy. */
  path: string;
  language: string;
  fallback: boolean;
}

/**
 * The template for `language.business`: the copy `sync` installed per profile (`.mandao/templates/<profile>/release/`,
 * where overrides land), else the package's core copy. A language with neither falls back to `en`.
 */
export function loadTemplate(root: string, config: Config): LoadedTemplate {
  const business = config.language.business;
  const profiles = [...new Set(config.projects.map((p) => p.profile))];
  const fileFor = (lang: string) =>
    [
      ...profiles.map((p) => join(root, TEMPLATES_DIR, p, 'release', `version-notes.${lang}.md`)),
      join(coreDir(), 'templates', 'shared', 'release', `version-notes.${lang}.md`),
    ].find((f) => existsSync(f));
  const available = [business, business.split(/[-_]/)[0] ?? business].filter((l) => fileFor(l));
  const { language, fallback } = chooseTemplateLanguage(business, available);
  const file = fileFor(language);
  if (!file) throw new Error(`no version notes template for "${language}"`);
  const inCore = relative(coreDir(), file);
  const path = inCore.startsWith('..') ? relative(root, file).split('\\').join('/') : `core:${inCore.split('\\').join('/')}`;
  return { template: parseVersionNotesTemplate(readFileSync(file, 'utf8')), path, language, fallback };
}
