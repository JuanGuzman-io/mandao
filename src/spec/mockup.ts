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
  return named.replace(CLAUDE_URL, () => REDACTED);
}

/** True when the README body (frontmatter left out) carries the private link or any claude.ai URL. */
const bodyHasPrivateLink = (body: string, link: string | undefined) => redactPrivateLinks(body, link) !== body;

/** Why the design (lite: spec) approval is refused because of the mock; `kind` answers for paths inside `mockups/`. */
export function mockupProblems(input: {
  decision?: MockDecision;
  readme?: string;
  kind: (file: string) => MockupFileKind;
  /** Every file under `mockups/`, relative to it. */
  present?: string[];
}): string[] {
  const zips = (input.present ?? [])
    .filter((f) => posix.extname(f).toLowerCase() === '.zip')
    .map((f) => `mockups/${f}: unzip the export into mockups/ and remove the .zip`);
  return [...zips, ...readmeProblems(input)];
}

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
  const noExport =
    readme.source === 'design' && !readme.files.some(isExport)
      ? [
          `mockups/README.md: source design lists no export (${EXPORT_EXTENSIONS.join(', ')}): the claude.ai link is private, export the chosen artboard into mockups/ and list it under files`,
        ]
      : [];
  return [...files, ...leaked, ...noExport];
}

const PLACEHOLDER = /^(?:none|n\/a|-|—|–)\.?$/i;
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
