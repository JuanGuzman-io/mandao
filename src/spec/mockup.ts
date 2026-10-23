import { posix } from 'node:path';
import { z } from 'zod';
import { frontmatterOf, sections } from './markdown.js';

/** Phase 13: the UI mock of a spec. Pure; the IO is in `src/scripts/mockups.ts`. */
export const MOCK_DECISIONS = ['accepted', 'declined'] as const;
export const MOCK_SOURCES = ['design', 'html'] as const;
export type MockDecision = (typeof MOCK_DECISIONS)[number];
export type MockSource = (typeof MOCK_SOURCES)[number];

/** `mock` section of `state.yml`: the answer to the one mock offer of the spec. */
export const mockStateSchema = z
  .object({ decision: z.enum(MOCK_DECISIONS), source: z.enum(MOCK_SOURCES).optional(), at: z.string().min(1) })
  .refine((m) => m.decision === 'accepted' || !m.source, { message: 'a declined mock has no source' });
export type MockState = z.infer<typeof mockStateSchema>;

/** The spec's mock folder, as the approval hashes key its files (`mockups/<path>`). */
export const MOCKUPS_FOLDER = 'mockups/';

/** A file inside `mockups/` other than its README: relative, no empty, `.` or `..` segment, no backslash. */
const mockupFile = z
  .string()
  .min(1)
  .refine((f) => !f.includes('\\') && !posix.isAbsolute(f) && f.split('/').every((seg) => seg !== '' && seg !== '.' && seg !== '..'), {
    message: 'files are file paths inside mockups/ (relative; no empty, . or .. segment)',
  })
  .refine((f) => f !== 'README.md', { message: 'files lists the mock files, not README.md' });

/** `mockups/README.md` frontmatter. `link` (private claude.ai canvas) and `artboard` exist only for `source: design`. */
export const mockupReadmeSchema = z
  .object({
    schema_version: z.literal(1),
    source: z.enum(MOCK_SOURCES),
    link: z.string().min(1).optional(),
    artboard: z.string().min(1).optional(),
    files: z.array(mockupFile).min(1),
  })
  .superRefine((r, ctx) => {
    for (const key of ['link', 'artboard'] as const)
      if (r[key] !== undefined && r.source !== 'design')
        ctx.addIssue({ code: 'custom', path: [key], message: `${key} only with source: design` });
  });
export type MockupReadme = z.infer<typeof mockupReadmeSchema>;

export function parseMockupReadme(text: string): { readme?: MockupReadme; issues: string[] } {
  const r = mockupReadmeSchema.safeParse(frontmatterOf(text).data);
  if (r.success) return { readme: r.data, issues: [] };
  return { issues: r.error.issues.map((i) => `${i.path.join('.') || 'frontmatter'}: ${i.message}`) };
}

/** What a reviewer and the team can open without the private claude.ai link. */
export const EXPORT_EXTENSIONS = ['.html', '.htm', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.pdf'];
const isExport = (file: string) => EXPORT_EXTENSIONS.includes(posix.extname(file).toLowerCase());

/** What a listed path is inside `mockups/`: a regular file, nothing, or anything else (folder, symlink). */
export type MockupFileKind = 'file' | 'missing' | 'other';

const REDACTED = '[private claude.ai link omitted]';
/**
 * Any claude.ai address (the host or a subdomain, scheme optional), up to whitespace or a closing bracket;
 * trailing punctuation stays. Bounded on both sides, so `notclaude.ai` or `claude.aim` do not match. Only the
 * exact redaction token is skipped (so redacting twice changes nothing); `[private claude.ai/x]` is still matched.
 */
const CLAUDE_URL =
  /(?<![\w.-])(?!(?<=\[private )claude\.ai link omitted\])(?:https?:\/\/)?(?:[\w-]+\.)*claude\.ai(?![\w-])(?:[/?#][^\s)\]>"'`]*[^\s)\]>"'`.,;:!?])?/gi;

/** The text with the private `link` value and every claude.ai URL replaced (literal replacement: no `$` patterns). */
export function redactPrivateLinks(text: string, link: string | undefined): string {
  const named = link ? text.split(link).join(REDACTED) : text;
  // A %-encoded address (`https%3A%2F%2Fclaude.ai`, `claude%2Eai`) is matched decoded; its whole token is redacted
  // first, so the plain pass never leaves half of an encoded token behind.
  const decoded = named.replace(ENCODED_TOKEN, (token) => {
    const plain = percentDecoded(token);
    return ANY_CLAUDE_URL.test(plain) || (link !== undefined && plain.includes(link)) ? REDACTED : token;
  });
  return decoded.replace(CLAUDE_URL, () => REDACTED);
}

/**
 * A run of URL-ish characters holding at least one `%XX` escape. The lookbehind anchors each match at the start
 * of a run, so a long run without an escape is scanned once (linear), not once per position (quadratic).
 */
const ENCODED_TOKEN = /(?<![^\s"'<>()[\]`])[^\s"'<>()[\]`]*%[0-9A-Fa-f]{2}[^\s"'<>()[\]`]*/g;
const ANY_CLAUDE_URL = new RegExp(CLAUDE_URL.source, 'i');

/** Lenient %-decoding, repeated for double encoding (a malformed escape stays as is; never throws). */
function percentDecoded(token: string): string {
  let text = token;
  for (let i = 0; i < 3; i++) {
    const next = text.replace(/%([0-9A-Fa-f]{2})/g, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
    if (next === text) break;
    text = next;
  }
  return text;
}

/** Every string inside `value` (a brief) with `redactPrivateLinks` applied; the shape is kept. */
export function redactStrings<T>(value: T, link: string | undefined): T {
  if (typeof value === 'string') return redactPrivateLinks(value, link) as T;
  if (Array.isArray(value)) return value.map((v) => redactStrings(v, link)) as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, redactStrings(v, link)])) as T;
  return value;
}

/** `<file>:<line>` for each line of `text` with a claude.ai address (scheme optional): the link is private. */
export function privateLinkLines(file: string, text: string): string[] {
  return text
    .split(/\r?\n/)
    .flatMap((line, i) =>
      redactPrivateLinks(line, undefined) === line
        ? []
        : [`${file}:${i + 1}: a claude.ai address is private: remove it (only the frontmatter link of mockups/README.md may hold it)`],
    );
}

/** Mock files read as binary, never scanned for private links: images and PDF. Every other listed file is text. */
export const MOCK_BINARY_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];
export const isMockText = (file: string) => !MOCK_BINARY_EXTENSIONS.includes(posix.extname(file).toLowerCase());

const MOCK_RULE_START = 'A task whose brief carries `mockup`';
/** The Reviewer's mock rule when the installed rules/review.md has no such paragraph (an override dropped it). */
export const MOCK_RULE_FALLBACK =
  "Follow the approved mock: a deviation must be justified in the Implementer's report; otherwise FAIL on the core lens. If the mock cannot be checked (problem), record an open finding.";

/** The mock paragraph of an installed `rules/review.md`, on one line; the fixed instruction when there is none. */
export function reviewerMockRule(reviewRules: string | undefined): string {
  const paragraph = (reviewRules ?? '').split(/\r?\n[ \t]*\r?\n/).find((p) => p.trimStart().startsWith(MOCK_RULE_START));
  return paragraph
    ? paragraph
        .trim()
        .split(/\s*\r?\n\s*/)
        .join(' ')
    : MOCK_RULE_FALLBACK;
}

/** A skill name a harness loads: the SKILL.md `name` when it is a plain lowercase slug, else the folder id. */
export const skillLoadName = (name: unknown, id: string) =>
  typeof name === 'string' && /^[a-z0-9][a-z0-9-]*$/.test(name.trim()) ? name.trim() : id;

/** True when the README body (frontmatter left out) carries the private link or any claude.ai URL. */
const bodyHasPrivateLink = (body: string, link: string | undefined) => redactPrivateLinks(body, link) !== body;

/** Why the design (lite: spec) approval is refused because of the mock; `kind` answers for paths inside `mockups/`. */
export function mockupProblems(input: {
  decision?: MockDecision;
  readme?: string;
  kind: (file: string) => MockupFileKind;
  /** Every regular file under `mockups/`, relative to it. */
  present?: string[];
  /** Every symlink under `mockups/`, relative to it (never followed). */
  symlinks?: string[];
}): string[] {
  const isZip = (f: string) => posix.extname(f).toLowerCase() === '.zip';
  const present = input.present ?? [];
  const zips = present.filter(isZip).map((f) => `mockups/${f}: unzip the export into mockups/ and remove the .zip`);
  const links = (input.symlinks ?? []).map((f) => `mockups/${f} is a symlink: copy the file instead`);
  const listed = input.readme === undefined ? undefined : parseMockupReadme(input.readme).readme?.files;
  const unlisted = listed
    ? present
        .filter((f) => f !== 'README.md' && !isZip(f) && !listed.includes(f))
        .map((f) => `unlisted file mockups/${f}: list it in files or remove it`)
    : [];
  return [...zips, ...links, ...unlisted, ...readmeProblems(input)];
}

const noExportProblem = (source: MockSource) =>
  source === 'design'
    ? `mockups/README.md: source design lists no export (${EXPORT_EXTENSIONS.join(', ')}): the claude.ai link is private, export the chosen artboard into mockups/ and list it under files`
    : `mockups/README.md: source html lists no export (${EXPORT_EXTENSIONS.join(', ')}): list the mock file itself under files`;

function readmeProblems(input: { decision?: MockDecision; readme?: string; kind: (file: string) => MockupFileKind }): string[] {
  if (input.readme === undefined) {
    return input.decision === 'accepted'
      ? [
          'the mock was accepted (mock-offer) but mockups/README.md is missing: make the mock and write its README, or record the decision again',
        ]
      : [];
  }
  const { readme, issues } = parseMockupReadme(input.readme);
  if (!readme) return [`mockups/README.md: ${issues.join('; ')}`];
  const files = readme.files.flatMap((f) => {
    const kind = input.kind(f);
    if (kind === 'missing') return [`mockups/${f} is listed in mockups/README.md but missing`];
    return kind === 'other' ? [`mockups/${f} is not a regular file: list the mock files themselves`] : [];
  });
  const leaked = bodyHasPrivateLink(frontmatterOf(input.readme).content, readme.link)
    ? ['mockups/README.md: the body carries the private claude.ai link: keep it only in the frontmatter `link`']
    : [];
  const noExport = readme.files.some(isExport) ? [] : [noExportProblem(readme.source)];
  return [...files, ...leaked, ...noExport];
}

/** Whole-line placeholders that stand for no reference; `Not yet designed.` is content (rules/mockups.md). */
const PLACEHOLDER = /^(?:none|n\/a|-|—|–|tbd|tbc|todo|pending|pendiente)\.?$/i;
/** An `ASSUMPTION`/`OPEN` marker line stating that references are absent (`none`, or no/none/without + design words). */
const NOTHING_MARKER =
  /^(?:ASSUMPTION|OPEN)\b[^:]*:\s*(?:none\.?$|.*\b(?:no|none|without)\b.*\b(?:ux|ui|designs?|references?|mocks?|mockups?|figma)\b)/i;

/** A line that stands for "no references": a placeholder or a marker saying there are no designs. */
function isPlaceholder(line: string): boolean {
  const text = line.replace(/^\s*(?:[-*+]|\d+\.)\s+/, '').trim();
  if (!text) return true;
  if (PLACEHOLDER.test(text) || /^[-—–]$/.test(line.trim())) return true;
  return NOTHING_MARKER.test(text) && !/https?:\/\//i.test(text);
}

/** True when the story's `## UX references` section has content beyond whitespace, HTML comments and placeholders. */
export function hasUxReferences(story: string): boolean {
  const body = sections(story, 2).find((s) => /^UX references\b/i.test(s.heading))?.body ?? '';
  return !body
    .replace(/<!--[\s\S]*?(-->|$)/g, '')
    .split(/\r?\n/)
    .every(isPlaceholder);
}

export interface MockOffer {
  suggest: boolean;
  reason: string;
  /** The story's projects with a UI surface. */
  uiProjects: string[];
  uxReferences: boolean;
  decided?: MockDecision;
  source?: MockSource;
}

export interface MockOfferInput {
  storyProjects: string[];
  /** Every configured project with a UI surface. */
  uiProjects: string[];
  uxReferences: boolean;
  /** The spec keeps `state.yml` (layout version 2): only there is the decision recorded. */
  keepsState: boolean;
  mock?: MockState | undefined;
}

/** Suggest a mock once per spec: a UI project in the story, no UX references, nothing decided yet. */
export function mockOffer(input: MockOfferInput): MockOffer {
  const uiProjects = input.storyProjects.filter((p) => input.uiProjects.includes(p));
  const base = { uiProjects, uxReferences: input.uxReferences };
  const no = (reason: string): MockOffer => ({ suggest: false, reason, ...base });
  if (!input.keepsState) return no('a layout version 1 spec keeps no mock decision (state.yml is version 2 only)');
  if (input.mock)
    return {
      ...no(`the mock was already ${input.mock.decision} at ${input.mock.at}`),
      decided: input.mock.decision,
      ...(input.mock.source ? { source: input.mock.source } : {}),
    };
  if (!uiProjects.length) return no(`the story's projects (${input.storyProjects.join(', ') || 'none'}) have no UI surface`);
  if (input.uxReferences) return no('the story already has UX references');
  return { suggest: true, reason: `the story touches the UI of ${uiProjects.join(', ')} and has no UX references`, ...base };
}
