import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import {
  changelogEntries,
  chooseTemplateLanguage,
  parseVersionNotesTemplate,
  releaseVersion,
  splitRefs,
  unifiedDiff,
  type VersionNoteEntry,
  versionNotes,
} from '../../src/spec/index.js';

const core = (lang: string) =>
  parseVersionNotesTemplate(readFileSync(join(process.cwd(), `core/templates/shared/release/version-notes.${lang}.md`), 'utf8'));

const entry = (id: string, type: string, text?: string): VersionNoteEntry => ({
  id,
  title: `Title of ${id}`,
  type,
  ...(text !== undefined ? { text } : {}),
});

describe('versionNotes', () => {
  test('groups specs by type in the template order, then by spec id, under template headings', () => {
    const { markdown, specs } = versionNotes(core('en'), '0.2.0', [
      entry('MDO-0010', 'bug', 'Fix ten.\n'),
      entry('MDO-0003', 'story', 'Story three.\n'),
      entry('MDO-0002', 'bug', 'Fix two.\n'),
      entry('MDO-0001', 'story', 'Story one.\n'),
    ]);
    expect(specs.map((s) => s.id)).toEqual(['MDO-0001', 'MDO-0003', 'MDO-0002', 'MDO-0010']);
    expect(markdown).toBe(
      [
        '# Release notes — v0.2.0',
        '',
        'What changes for users in version 0.2.0, spec by spec.',
        '',
        '## New features',
        '',
        '### MDO-0001 — Title of MDO-0001',
        '',
        'Story one.',
        '',
        '### MDO-0003 — Title of MDO-0003',
        '',
        'Story three.',
        '',
        '## Fixes',
        '',
        '### MDO-0002 — Title of MDO-0002',
        '',
        'Fix two.',
        '',
        '### MDO-0010 — Title of MDO-0010',
        '',
        'Fix ten.',
        '',
      ].join('\n'),
    );
  });

  test('copies each text byte for byte, tokens and replacement patterns included', () => {
    const text = 'Línea con `$&`, $1 y {version}.  \n\n- ítem *uno*\n\n| a | b |\n|---|---|\n';
    const { markdown } = versionNotes(core('en'), '1.0.0', [entry('MDO-0001', 'story', text)]);
    expect(markdown).toContain(`### MDO-0001 — Title of MDO-0001\n\n${text}`);
    expect(markdown.match(/\{version\}/g)).toHaveLength(1);
  });

  test('a spec without text is listed as missing and never rendered', () => {
    const { markdown, specs, missing } = versionNotes(core('en'), '1.0.0', [
      entry('MDO-0001', 'story', 'One.\n'),
      { ...entry('MDO-0002', 'story'), reason: 'close-summary.md has no "For the PO" section' },
      entry('MDO-0003', 'bug', '   \n'),
    ]);
    expect(specs.map((s) => s.id)).toEqual(['MDO-0001']);
    expect(missing).toEqual([
      { id: 'MDO-0002', reason: 'close-summary.md has no "For the PO" section' },
      { id: 'MDO-0003', reason: 'no "For the PO" text' },
    ]);
    expect(markdown).not.toContain('MDO-0002');
    expect(markdown).not.toContain('MDO-0003');
    expect(markdown).not.toContain('## Fixes');
  });

  test('the es template gives Spanish headings and labels', () => {
    const { markdown } = versionNotes(core('es'), '0.1.0-beta.0', [entry('MDO-0001', 'bug', 'Arreglo.\n')]);
    expect(markdown).toMatch(/^# Notas de la versión v0\.1\.0-beta\.0\n/);
    expect(markdown).toContain('## Correcciones\n\n### MDO-0001 — Title of MDO-0001\n\nArreglo.\n');
  });

  test('no spec renders the template empty line; an unknown type keeps its name and goes last', () => {
    expect(versionNotes(core('en'), '1.0.0', []).markdown).toContain('No spec was closed in this version.');
    const t = parseVersionNotesTemplate(
      '---\nschema_version: 1\nlanguage: en\ngroup_heading: "## {type}"\nspec_heading: "### {id}"\nempty: none\ntypes:\n  bug: Fixes\n---\n{specs}\n',
    );
    const { markdown } = versionNotes(t, '1.0.0', [entry('MDO-0002', 'spike', 'S.\n'), entry('MDO-0001', 'bug', 'B.\n')]);
    expect(markdown).toBe('## Fixes\n\n### MDO-0001\n\nB.\n\n## spike\n\n### MDO-0002\n\nS.\n');
  });

  test('a template with an unknown token or broken frontmatter is refused', () => {
    expect(() =>
      versionNotes(
        parseVersionNotesTemplate(
          '---\nschema_version: 1\nlanguage: en\ngroup_heading: "## {type}"\nspec_heading: "### {id}"\nempty: none\n---\n{date}\n',
        ),
        '1.0.0',
        [],
      ),
    ).toThrow(/\{date\}/);
    expect(() => parseVersionNotesTemplate('---\nschema_version: 1\n---\nbody\n')).toThrow(/group_heading/);
  });
});

describe('chooseTemplateLanguage', () => {
  test('exact language, then its primary subtag, then en with fallback', () => {
    expect(chooseTemplateLanguage('es', ['en', 'es'])).toEqual({ language: 'es', fallback: false });
    expect(chooseTemplateLanguage('es-CO', ['en', 'es'])).toEqual({ language: 'es', fallback: false });
    expect(chooseTemplateLanguage('en', ['en', 'es'])).toEqual({ language: 'en', fallback: false });
    expect(chooseTemplateLanguage('pt', ['en', 'es'])).toEqual({ language: 'en', fallback: true });
  });
});

describe('releaseVersion', () => {
  test('accepts semver and drops a leading v', () => {
    expect(releaseVersion('0.1.0-beta.0')).toBe('0.1.0-beta.0');
    expect(releaseVersion('v1.2.3')).toBe('1.2.3');
  });
  test.each(['MDO-0001', '1.0', 'latest', '../1.0.0', 'v', ''])('rejects %j', (v) => {
    expect(() => releaseVersion(v)).toThrow(/semver/);
  });
});

describe('splitRefs', () => {
  test('keeps closed specs referenced in the range, sorted, and flags those also referenced before it', () => {
    expect(
      splitRefs(['MDO-0003', 'MDO-0001', 'MDO-0002', 'MDO-0001'], ['MDO-0001', 'MDO-0009'], new Set(['MDO-0001', 'MDO-0003'])),
    ).toEqual({ ids: ['MDO-0001', 'MDO-0003'], straddling: ['MDO-0001'] });
  });
});

describe('changelogEntries', () => {
  test('reads id, title (escaped pipes restored) and type from each CHANGELOG line', () => {
    const text =
      '# Changelog\n\n| Spec | Title | Type | Closed | Folder |\n|---|---|---|---|---|\n| MDO-0001 | A \\| B | bug | 2026-10-01 | [spec](../specs/MDO-0001-a/) |\n';
    expect([...changelogEntries(text)]).toEqual([['MDO-0001', { title: 'A | B', type: 'bug' }]]);
    expect(changelogEntries(undefined).size).toBe(0);
  });
});

describe('unifiedDiff', () => {
  test('marks removed and added lines against the existing file', () => {
    const diff = unifiedDiff('a\nb\nc\n', 'a\nB\nc\nd\n', 'docs/releases/v1.0.0.md');
    expect(diff).toBe(
      ['--- a/docs/releases/v1.0.0.md', '+++ b/docs/releases/v1.0.0.md', '@@ -1,3 +1,4 @@', ' a', '-b', '+B', ' c', '+d', ''].join('\n'),
    );
    expect(unifiedDiff('same\n', 'same\n', 'x.md')).toBe('');
  });
});
