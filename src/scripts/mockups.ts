import { createHash } from 'node:crypto';
import { existsSync, lstatSync, readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Config } from '../schemas/index.js';
import {
  frontmatterOf,
  hasUxReferences,
  MOCK_DECISIONS,
  MOCK_SOURCES,
  MOCKUPS_FOLDER,
  type MockDecision,
  type MockOffer,
  type MockSource,
  type MockState,
  type MockupFileKind,
  mockOffer,
  mockupProblems,
  parseMockupReadme,
  redactPrivateLinks,
  type Task,
} from '../spec/index.js';
import type { SpecFolder } from './spec.js';
import { readState, specKeepsState, updateState } from './spec-log.js';
import { isUiProject } from './ui-surface.js';

/** The spec's mock folder (phase 13), as the approval hashes name it. */
export const MOCKUPS_DIR = MOCKUPS_FOLDER;
const README = 'README.md';

const readmeText = (specDir: string) => {
  const file = join(specDir, MOCKUPS_DIR, README);
  return existsSync(file) ? readFileSync(file, 'utf8') : undefined;
};

/** Regular files under `dir`, sorted; symlinks (to files or folders) are neither followed nor listed. */
function filesUnder(dir: string, prefix = ''): string[] {
  if (!lstatSync(dir, { throwIfNoEntry: false })?.isDirectory()) return [];
  return readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name.localeCompare(b.name))
    .flatMap((e) => {
      if (e.isDirectory()) return filesUnder(join(dir, e.name), `${prefix}${e.name}/`);
      return e.isFile() ? [`${prefix}${e.name}`] : [];
    });
}

/** What a listed path is, without following a symlink. */
/**
 * What each listed path is: a file only when `filesUnder` reaches it (never through a symlinked folder);
 * anything else there, followed or not, is `other`.
 */
function fileKinds(specDir: string): (file: string) => MockupFileKind {
  const regular = new Set(filesUnder(join(specDir, MOCKUPS_DIR)));
  return (file) => (regular.has(file) ? 'file' : existsSync(join(specDir, MOCKUPS_DIR, file)) ? 'other' : 'missing');
}

/** The hash of every file under `mockups/`, keyed `mockups/<path>`: the mock is approved with the design. */
export function mockupHashes(specDir: string): Record<string, string> {
  const dir = join(specDir, MOCKUPS_DIR);
  return Object.fromEntries(
    filesUnder(dir).map((f) => [
      `${MOCKUPS_DIR}${f}`,
      `sha256-${createHash('sha256')
        .update(readFileSync(join(dir, f)))
        .digest('base64')}`,
    ]),
  );
}

/** The recorded mock decision; a version 1 spec keeps none. */
export const mockDecision = (specDir: string): MockState | undefined => (specKeepsState(specDir) ? readState(specDir).mock : undefined);

/** Why the design (lite: spec) approval is refused because of the mock: missing README, files or export. */
export function mockupBlockers(specDir: string): string[] {
  const decision = mockDecision(specDir)?.decision;
  const readme = readmeText(specDir);
  return mockupProblems({
    ...(decision ? { decision } : {}),
    ...(readme !== undefined ? { readme } : {}),
    kind: fileKinds(specDir),
    present: filesUnder(join(specDir, MOCKUPS_DIR)),
  });
}

/** `run mock-offer`: whether to suggest a mock for this spec, from its story, the UI projects and the recorded decision. */
export function mockOfferFor(root: string, config: Config, spec: SpecFolder): MockOffer {
  if (!spec.story) throw new Error(`${spec.name}: story.md could not be read: ${spec.issues.join('; ')}`);
  return mockOffer({
    storyProjects: spec.story.meta.projects,
    uiProjects: config.projects.filter((p) => isUiProject(root, p)).map((p) => p.name),
    uxReferences: hasUxReferences(spec.story.raw),
    keepsState: specKeepsState(spec.dir),
    mock: mockDecision(spec.dir),
  });
}

/** Records the answer to the mock offer in `state.yml`; a second answer needs `force`. Version 1 specs are refused. */
export function recordMockDecision(spec: SpecFolder, decision: string, source: string | undefined, force = false): MockState {
  if (!(MOCK_DECISIONS as readonly string[]).includes(decision)) throw new Error(`--record must be ${MOCK_DECISIONS.join(' or ')}`);
  if (source !== undefined && !(MOCK_SOURCES as readonly string[]).includes(source))
    throw new Error(`--source must be ${MOCK_SOURCES.join(' or ')}`);
  if (source !== undefined && decision !== 'accepted') throw new Error('--source goes only with --record accepted');
  if (!specKeepsState(spec.dir))
    throw new Error(
      `${spec.name} is a layout version 1 spec: the mock decision lives in state.yml (version 2); make the mock without recording it`,
    );
  const previous = readState(spec.dir).mock;
  if (previous && !force)
    throw new Error(`the mock was already ${previous.decision} at ${previous.at}: pass --force to replace the decision`);
  const mock: MockState = {
    decision: decision as MockDecision,
    ...(source ? { source: source as MockSource } : {}),
    at: new Date().toISOString(),
  };
  updateState(spec.dir, (s) => ({ ...s, mock }));
  return mock;
}

/** The approved mock as the brief carries it: README and file paths from the root, source and artboard; never the link. */
export interface BriefMockup {
  readme: string;
  files: string[];
  source: MockSource;
  artboard?: string;
  /** Listed files that are not regular files in `mockups/` now. */
  missing?: string[];
}
/** The README stopped parsing: the brief says so instead of dropping the mock. */
export type BriefMockupProblem = { readme: string; problem: string };

/** The mock for a task of a UI project when the spec has a `mockups/README.md`. */
export function mockupForBrief(root: string, config: Config, spec: SpecFolder, task: Task): BriefMockup | BriefMockupProblem | undefined {
  const text = readmeText(spec.dir);
  const project = config.projects.find((p) => p.name === task.project);
  if (text === undefined || !project || !isUiProject(root, project)) return undefined;
  const path = (f: string) =>
    relative(root, join(spec.dir, MOCKUPS_DIR, f))
      .split('\\')
      .join('/');
  const { readme, issues } = parseMockupReadme(text);
  if (!readme) return { readme: path(README), problem: issues.join('; ') };
  const kind = fileKinds(spec.dir);
  const missing = readme.files.filter((f) => kind(f) !== 'file').map(path);
  return {
    readme: path(README),
    files: readme.files.map(path),
    source: readme.source,
    ...(readme.artboard ? { artboard: readme.artboard } : {}),
    ...(missing.length ? { missing } : {}),
  };
}

/**
 * The review pack's `## Approved mock` section: the files to check against and the README body, frontmatter
 * left out and every private link redacted (the link value and any claude.ai URL).
 */
export function mockupPackSection(root: string, mockup: BriefMockup | BriefMockupProblem | undefined): string[] {
  if (!mockup) return [];
  if ('problem' in mockup)
    return [
      '## Approved mock',
      '',
      `${mockup.readme} does not parse (${mockup.problem}): the task cannot be checked against the mock.`,
      '',
    ];
  const text = readFileSync(join(root, mockup.readme), 'utf8');
  const body = redactPrivateLinks(frontmatterOf(text).content.trim(), parseMockupReadme(text).readme?.link);
  return [
    '## Approved mock',
    '',
    `Check the task against these files (source: ${mockup.source}${mockup.artboard ? `, artboard ${mockup.artboard}` : ''}):`,
    '',
    ...mockup.files.map((f) => `- \`${f}\``),
    '',
    ...(mockup.missing ? [`Missing (listed but not a file in mockups/): ${mockup.missing.map((f) => `\`${f}\``).join(', ')}`, ''] : []),
    `\`${mockup.readme}\`:`,
    '',
    body,
    '',
  ];
}
