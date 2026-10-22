// mandao-scans: none — builds temporary git repos with closed specs and tags.
import { existsSync, mkdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { syncProject } from '../../src/engine/sync.js';
import { changelogLine, upsertChangelog } from '../../src/spec/index.js';
import { initTestRepo, makeTree, pkg } from '../helpers.js';
import { git, lastOut, useLogEnv } from '../log-v2-helpers.js';

useLogEnv();

const put = (root: string, file: string, text: string) => {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), text);
};

/** A single-project workspace on `main` with one base commit; `business` is `language.business`. */
function workspace(business = 'en', extra: Record<string, unknown> = {}) {
  const root = realpathSync(makeTree({ 'package.json': pkg('shop') }));
  initTestRepo(root, '-q', '-b', 'main');
  writeYaml(join(root, '.mandao/config.yml'), {
    schema_version: 1,
    workspace: 'single',
    projects: [{ name: 'shop', path: '.' }],
    harnesses: ['claude'],
    language: { business, technical: 'en' },
    ...extra,
  });
  git(root, 'add', '.');
  git(root, 'commit', '-qm', 'base');
  return root;
}

const story = (id: string, type: string, version: 1 | 2, status: string) =>
  `---\nschema_version: ${version}\ntracker: none\ntype: ${type}\nid: ${id}\nstatus: ${status}\n---\n\n# Title ${id}\n\n## Acceptance criteria\n\n### AC-1 — Works\ncritical: false\n\n- **GIVEN** a\n- **WHEN** b\n- **THEN** c\n`;

const poText = (id: string) => `What ${id} gives users: \`$&\` and {version} stay as written.\n\n- one\n- two`;

interface SpecOptions {
  type?: string;
  version?: 1 | 2;
  /** false: closed but with no PO text. */
  text?: boolean;
  /** false: commits reference it, but its story is not closed and it has no CHANGELOG line. */
  closed?: boolean;
  /** false: closed story (a version 1 close before the CHANGELOG existed) without a CHANGELOG line. */
  changelog?: boolean;
}

/** One commit that adds a spec folder (closed by default, with a CHANGELOG line) and carries `Refs: <id>`. */
function spec(root: string, id: string, o: SpecOptions = {}) {
  const { type = 'story', version = 2, text = true, closed = true, changelog = closed } = o;
  const dir = `specs/${id}-x`;
  put(root, `${dir}/story.md`, story(id, type, version, closed ? 'closed' : 'in-progress'));
  if (version === 2) {
    const po = text ? `## For the PO\n\n${poText(id)}\n\n` : '';
    put(
      root,
      `${dir}/close-summary.md`,
      `---\nschema_version: 1\nspec: ${id}\n---\n\n# Close — ${id}\n\n${po}## For developers\n\nDev notes.\n`,
    );
  } else if (text) put(root, `docs/releases/${id}/release-notes.md`, `${poText(id)}\n`);
  if (changelog) {
    const log = join(root, 'docs/CHANGELOG.md');
    const before = existsSync(log) ? readFileSync(log, 'utf8') : undefined;
    put(root, 'docs/CHANGELOG.md', upsertChangelog(before, id, changelogLine(id, `Title ${id}`, type, '2026-10-01', `../${dir}/`)));
  }
  commitRefs(root, id, `close ${id}`);
}

function commitRefs(root: string, id: string, subject: string) {
  commitWith(root, subject, `Refs: ${id}`);
}

/** One commit whose message ends with the given trailer block. */
function commitWith(root: string, subject: string, trailers: string) {
  put(root, `work/${Date.now()}-${Math.random()}.txt`, subject);
  git(root, 'add', '-A');
  git(root, 'commit', '-qm', subject, '-m', trailers);
}

/** Runs `mandao run version-notes` and returns its JSON plus the exit code it set. */
async function notes(root: string, ...args: string[]) {
  process.exitCode = undefined;
  await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'version-notes', ...args]);
  const code = process.exitCode;
  process.exitCode = undefined;
  return { ...lastOut(), code };
}

/** v0.0.1, MDO-0001, v0.1.0, then MDO-0002 (bug), MDO-0003 (story, no PO text), MDO-0004 (not closed). */
function twoTags() {
  const root = workspace();
  git(root, 'tag', 'v0.0.1');
  spec(root, 'MDO-0001');
  git(root, 'tag', 'v0.1.0');
  spec(root, 'MDO-0002', { type: 'bug' });
  spec(root, 'MDO-0003', { text: false });
  spec(root, 'MDO-0004', { closed: false });
  return root;
}

const ids = (r: { specs: { id: string }[] }) => r.specs.map((s) => s.id);

describe('mandao run version-notes', () => {
  test('only closed specs merged after the previous tag appear, grouped by type and copied verbatim', async () => {
    const root = twoTags();
    const r = await notes(root, '0.2.0');
    expect(r.range).toEqual({ from: 'v0.1.0', to: 'HEAD' });
    expect(ids(r)).toEqual(['MDO-0002']);
    expect(r.missing).toEqual([{ id: 'MDO-0003', reason: expect.stringContaining('For the PO') }]);
    expect(r.straddling).toEqual([]);
    expect(r.markdown).toContain(`## Fixes\n\n### MDO-0002 — Title MDO-0002\n\n${poText('MDO-0002')}\n`);
    expect(r.markdown).not.toContain('MDO-0001');
    expect(r.markdown).not.toContain('MDO-0004');
    expect(r).toMatchObject({ version: '0.2.0', file: 'docs/releases/v0.2.0.md', written: false, language: 'en', fallback: false });
    expect(existsSync(join(root, 'docs/releases/v0.2.0.md'))).toBe(false);
    expect(r.code).toBeUndefined();
  });

  test('--from and --to choose the range; a tag on --to named after the version is not its own start', async () => {
    const root = twoTags();
    expect(ids(await notes(root, '0.2.0', '--from', 'v0.0.1'))).toEqual(['MDO-0001', 'MDO-0002']);
    const tagged = await notes(root, '0.1.0', '--to', 'v0.1.0');
    expect(tagged.range).toEqual({ from: 'v0.0.1', to: 'v0.1.0' });
    expect(ids(tagged)).toEqual(['MDO-0001']);
  });

  test('without tags the whole history is the range', async () => {
    const root = workspace();
    spec(root, 'MDO-0001');
    spec(root, 'MDO-0002', { version: 1 });
    const r = await notes(root, '0.1.0');
    expect(r.range).toEqual({ from: null, to: 'HEAD' });
    expect(ids(r)).toEqual(['MDO-0001', 'MDO-0002']);
    expect(r.markdown).toContain(`### MDO-0002 — Title MDO-0002\n\n${poText('MDO-0002')}\n`);
  });

  test('a story marked closed counts without a CHANGELOG line; an unclosed story with commits in range does not', async () => {
    const root = workspace();
    spec(root, 'MDO-0001', { version: 1, changelog: false });
    spec(root, 'MDO-0002', { closed: false });
    const r = await notes(root, '0.1.0');
    expect(ids(r)).toEqual(['MDO-0001']);
    expect(r.missing).toEqual([]);
    expect(r.markdown).toContain(`### MDO-0001 — Title MDO-0001\n\n${poText('MDO-0001')}\n`);
    expect(r.markdown).not.toContain('MDO-0002');
  });

  test('to defaults to origin/<base> when it exists', async () => {
    const root = workspace();
    spec(root, 'MDO-0001');
    git(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    spec(root, 'MDO-0002');
    const r = await notes(root, '0.1.0');
    expect(r.range.to).toBe('origin/main');
    expect(ids(r)).toEqual(['MDO-0001']);
  });

  test('a spec with commits before and after the previous tag is listed as straddling', async () => {
    const root = workspace();
    commitRefs(root, 'MDO-0001', 'first half');
    git(root, 'tag', 'v0.1.0');
    spec(root, 'MDO-0001');
    const r = await notes(root, '0.2.0');
    expect(ids(r)).toEqual(['MDO-0001']);
    expect(r.straddling).toEqual(['MDO-0001']);
  });

  test('--write writes docs/releases/v<version>.md once; without --force an existing file is kept and the diff shown', async () => {
    const root = twoTags();
    put(root, 'docs/releases/MDO-0009/release-notes.md', 'legacy\n');
    git(root, 'add', '-A');
    git(root, 'commit', '-qm', 'legacy notes');
    const first = await notes(root, 'v0.2.0', '--write');
    const file = join(root, 'docs/releases/v0.2.0.md');
    expect(first).toMatchObject({ written: 'created', file: 'docs/releases/v0.2.0.md' });
    expect(readFileSync(file, 'utf8')).toBe(first.markdown);

    writeFileSync(file, 'edited by hand\n');
    const kept = await notes(root, '0.2.0', '--write');
    expect(kept.code).toBe(1);
    expect(kept.written).toBe(false);
    expect(kept.warning).toMatch(/exists.*--force/);
    expect(kept.diff).toContain('-edited by hand');
    expect(kept.diff).toContain('+# Release notes — v0.2.0');
    expect(readFileSync(file, 'utf8')).toBe('edited by hand\n');

    const forced = await notes(root, '0.2.0', '--write', '--force');
    expect(forced).toMatchObject({ written: 'updated', code: undefined });
    expect(readFileSync(file, 'utf8')).toBe(first.markdown);
    expect(readFileSync(join(root, 'docs/releases/MDO-0009/release-notes.md'), 'utf8')).toBe('legacy\n');
    expect(git(root, 'status', '--porcelain', '--', 'docs/releases/MDO-0009')).toBe('');
    expect(git(root, 'tag')).toBe('v0.0.1\nv0.1.0');
  });

  test('a version that is not semver is rejected before anything is written', async () => {
    const root = twoTags();
    for (const v of ['MDO-0001', '1.0', 'latest']) {
      await expect(notes(root, v, '--write')).rejects.toThrow(/semver/);
    }
    expect(existsSync(join(root, 'docs/releases'))).toBe(false);
  });

  test('language.business picks its template; one with no template falls back to en and says so', async () => {
    const es = workspace('es');
    spec(es, 'MDO-0001', { type: 'bug' });
    const r = await notes(es, '0.1.0');
    expect(r).toMatchObject({ language: 'es', templateLanguage: 'es', fallback: false });
    expect(r.markdown).toContain('## Correcciones');
    const pt = workspace('pt');
    spec(pt, 'MDO-0001');
    expect(await notes(pt, '0.1.0')).toMatchObject({ language: 'pt', templateLanguage: 'en', fallback: true });
  });

  test('the installed template, overridable through .mandao/overrides, wins over the core copy', async () => {
    const root = workspace();
    put(
      root,
      '.mandao/overrides/templates/shared/release/version-notes.en.md',
      '---\nschema_version: 1\nlanguage: en\ngroup_heading: "## {type}"\nspec_heading: "### {title}"\nempty: none\ntypes:\n  story: Shipped\n---\n# Our {version}\n\n{specs}\n',
    );
    syncProject(root);
    spec(root, 'MDO-0001');
    const r = await notes(root, '0.1.0');
    expect(r.template).toBe('.mandao/templates/app/release/version-notes.en.md');
    expect(r.markdown).toBe(`# Our 0.1.0\n\n## Shipped\n\n### Title MDO-0001\n\n${poText('MDO-0001')}\n`);
  });
});

describe('version-notes reads the range end, not the working tree', () => {
  test('with --to v0.1.0, a spec closed after that tag is not closed there', async () => {
    const root = workspace();
    git(root, 'tag', 'v0.0.1');
    spec(root, 'MDO-0001', { closed: false });
    git(root, 'tag', 'v0.1.0');
    spec(root, 'MDO-0001');
    const r = await notes(root, '0.1.0', '--to', 'v0.1.0');
    expect(r.range).toEqual({ from: 'v0.0.1', to: 'v0.1.0' });
    expect(ids(r)).toEqual([]);
    expect(r.missing).toEqual([]);
  });

  test('a spec closed upstream but absent from the working tree is included', async () => {
    const root = workspace();
    spec(root, 'MDO-0001');
    git(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    git(root, 'reset', '-q', '--hard', 'HEAD~1');
    const r = await notes(root, '0.1.0');
    expect(r.range.to).toBe('origin/main');
    expect(ids(r)).toEqual(['MDO-0001']);
    expect(r.markdown).toContain(`### MDO-0001 — Title MDO-0001\n\n${poText('MDO-0001')}\n`);
  });

  test('a local close not merged into origin/<base> is not included', async () => {
    const root = workspace();
    spec(root, 'MDO-0001', { closed: false });
    git(root, 'update-ref', 'refs/remotes/origin/main', 'HEAD');
    spec(root, 'MDO-0001');
    const r = await notes(root, '0.1.0');
    expect(ids(r)).toEqual([]);
    expect(r.missing).toEqual([]);
  });
});

describe('version-notes trailers and tags', () => {
  test('Refs values that are not story ids are ignored, even with a CHANGELOG line', async () => {
    const root = workspace();
    for (const bad of ['../x', 'MDO']) {
      const log = join(root, 'docs/CHANGELOG.md');
      const before = existsSync(log) ? readFileSync(log, 'utf8') : undefined;
      put(root, 'docs/CHANGELOG.md', upsertChangelog(before, bad, changelogLine(bad, 'Bad', 'story', '2026-10-01', '../specs/x/')));
      commitWith(root, `bad ${bad}`, `Refs: ${bad}`);
    }
    const r = await notes(root, '0.1.0');
    expect(r).toMatchObject({ specs: [], missing: [], straddling: [] });
  });

  test('one commit may name several specs, in one trailer or several', async () => {
    const root = workspace();
    for (const id of ['MDO-0001', 'MDO-0002', 'MDO-0003']) spec(root, id);
    git(root, 'tag', 'v0.1.0');
    for (const id of ['MDO-0001', 'MDO-0002', 'MDO-0003']) put(root, `specs/${id}-x/extra.md`, 'more\n');
    commitWith(root, 'shared fix', 'Refs: MDO-0001, MDO-0002\nRefs: MDO-0003');
    const r = await notes(root, '0.2.0');
    expect(ids(r)).toEqual(['MDO-0001', 'MDO-0002', 'MDO-0003']);
    expect(r.straddling).toEqual(['MDO-0001', 'MDO-0002', 'MDO-0003']);
  });

  test('a non-default refs trailer is the one read', async () => {
    const root = workspace('en', { commits: { trailers: { refs: 'Story' } } });
    spec(root, 'MDO-0001');
    commitWith(root, 'story trailer', 'Story: MDO-0002');
    put(
      root,
      'docs/CHANGELOG.md',
      upsertChangelog(
        readFileSync(join(root, 'docs/CHANGELOG.md'), 'utf8'),
        'MDO-0002',
        changelogLine('MDO-0002', 'Two', 'bug', '2026-10-01', '../specs/MDO-0002-x/'),
      ),
    );
    commitWith(root, 'changelog', 'Story: MDO-0002');
    const r = await notes(root, '0.1.0');
    expect(ids(r)).toEqual([]);
    expect(r.missing).toEqual([{ id: 'MDO-0002', reason: 'no spec folder for MDO-0002 in specs' }]);
  });

  test('a closed CHANGELOG id with no spec folder is missing, with the reason', async () => {
    const root = workspace();
    put(
      root,
      'docs/CHANGELOG.md',
      upsertChangelog(undefined, 'MDO-0007', changelogLine('MDO-0007', 'Gone', 'bug', '2026-10-01', '../specs/MDO-0007-x/')),
    );
    commitRefs(root, 'MDO-0007', 'gone');
    const r = await notes(root, '0.1.0');
    expect(r.specs).toEqual([]);
    expect(r.missing).toEqual([{ id: 'MDO-0007', reason: 'no spec folder for MDO-0007 in specs' }]);
  });

  test('re-writing an identical file is unchanged and sets no exit code', async () => {
    const root = twoTags();
    expect(await notes(root, '0.2.0', '--write')).toMatchObject({ written: 'created' });
    const again = await notes(root, '0.2.0', '--write');
    expect(again).toMatchObject({ written: 'unchanged', code: undefined });
    expect(again.diff).toBeUndefined();
    expect(again.warning).toBeUndefined();
  });

  test('a non-release tag after the release tag is not the previous tag', async () => {
    const root = workspace();
    spec(root, 'MDO-0001');
    git(root, 'tag', 'v0.1.0');
    spec(root, 'MDO-0002');
    git(root, 'tag', 'deploy-prod');
    spec(root, 'MDO-0003');
    const r = await notes(root, '0.2.0');
    expect(r.range.from).toBe('v0.1.0');
    expect(ids(r)).toEqual(['MDO-0002', 'MDO-0003']);
  });
});
