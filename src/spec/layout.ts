/** The depths a spec can have, and the stages its story status moves it through (design D1). */
export const DEPTHS = ['lite', 'standard', 'full'] as const;
export type Depth = (typeof DEPTHS)[number];
export const STAGES = ['draft', 'specified', 'planned', 'verified', 'closed'] as const;
export type Stage = (typeof STAGES)[number];
/** The layout versions a story's `schema_version` may name: the one place the set is written. */
export const LAYOUT_VERSIONS = [1, 2] as const;
export type LayoutVersion = (typeof LAYOUT_VERSIONS)[number];

export interface LayoutManifest {
  version: LayoutVersion;
  depth: Depth;
  /** Files (directories end in `/`) that must exist once the spec reaches each stage. */
  required: Record<Stage, string[]>;
  /** Files that may exist, never required: conditionals, derived folders and, for version 1, the legacy root log. */
  optional: string[];
  /** Version 2 only: the six committed files of `_log/`. */
  log: string[];
  /** Required alternatives: from `stage` on, every file of at least one option must exist. */
  oneOf: { stage: Stage; options: string[][] }[];
}

/** The six committed log files of a version 2 spec (FR-3). */
export const LOG_FILES_V2 = ['state.yml', 'execution.md', 'reviews.md', 'gates.md', 'premises.md', 'costs.yml'];

/** Conditional files, with when each one appears (rendered in `docs/spec-anatomy.md`). */
export const CONDITIONALS: { file: string; when: string }[] = [
  { file: 'quickstart.md', when: 'the spec has behavior a user or PO can see' },
  { file: 'data-model.md', when: 'the spec changes data' },
  { file: 'contract/', when: 'the spec spans several projects' },
];

/** What each file is for, rendered in `docs/spec-anatomy.md`. */
export const FILE_PURPOSE: Record<string, string> = {
  'story.md': 'The request and its acceptance criteria',
  'spec.md': 'Requirements, design and decisions of a lite spec in one document',
  'requirements.md': 'Functional requirements and scenarios',
  'design.md': 'Decisions, changes by module and risks',
  'tasks.md': 'The task plan and its details',
  'verify-report.md': 'The result of verify',
  'close-summary.md': 'The record of the close',
  'quickstart.md': 'How a PO checks the behavior by hand',
  'data-model.md': 'The data the spec changes',
  'contract/': 'The contract between projects',
  'state.yml': 'Start request, baseline, progress, approvals and session-cut estimates',
  'execution.md': 'One row per execution event',
  'reviews.md': 'Verdict and findings per task and attempt',
  'gates.md': 'Gate status per attempt, with output only for failing gates',
  'premises.md': 'Per premise: claim, command, exit code and excerpt',
  'costs.yml': 'Spend per role',
};

const V1_LEGACY = [
  'execution.md',
  'progress.yml',
  'approvals.yml',
  'costs.yml',
  'full-runs.md',
  'session-cuts.md',
  'discrepancies.md',
  'reviews/',
  'mutations/',
  'gates/',
  'premises/',
  'release-notes.md',
];

/** True when a story's `schema_version` names a layout whose tasks always live in `tasks.md`, whatever their number. */
export function tasksHaveOwnFile(schemaVersion: unknown): boolean {
  const version = LAYOUT_VERSIONS.find((v) => v === schemaVersion);
  return version !== undefined && layoutManifest(version, 'lite').required.planned.includes('tasks.md');
}

const docs = (depth: Depth) => (depth === 'lite' ? ['spec.md'] : ['requirements.md', 'design.md']);

/** The one manifest behind the folder check, the close gate and `docs/spec-anatomy.md` (design D1). */
export function layoutManifest(version: LayoutVersion, depth: Depth): LayoutManifest {
  const tasks = version === 2 || depth !== 'lite' ? ['tasks.md'] : [];
  return {
    version,
    depth,
    required: {
      draft: ['story.md'],
      // Version 1 lite specs kept their documents either in spec.md or in the requirements + design pair (oneOf).
      specified: version === 1 && depth === 'lite' ? [] : docs(depth),
      planned: tasks,
      // A version 1 spec closed without these two files; it is accepted in its own format.
      verified: version === 2 ? ['verify-report.md'] : [],
      closed: version === 2 ? ['close-summary.md'] : [],
    },
    optional: [
      ...(version === 1
        ? ['spec.md', 'requirements.md', 'design.md', 'tasks.md', 'verify-report.md', 'close-summary.md', ...V1_LEGACY]
        : []),
      ...CONDITIONALS.map((c) => c.file),
      'diagrams/',
      '_log/',
    ],
    log: version === 2 ? LOG_FILES_V2 : [],
    oneOf: version === 1 && depth === 'lite' ? [{ stage: 'specified', options: [docs('lite'), docs('standard')] }] : [],
  };
}

/** The files still missing for the option closest to complete (the first on a tie). */
function missingOfOneOf(options: string[][], present: string[]): string[] {
  const gaps = options.map((o) => o.filter((f) => !present.includes(f)));
  return gaps.reduce((best, gap) => (gap.length < best.length ? gap : best));
}

export interface LayoutFindings {
  version: LayoutVersion;
  depth: Depth;
  stage: Stage;
  missing: string[];
  unexpected: string[];
  ok: boolean;
}

/** `approved` is set when the PO approves the story, before specify runs, so it is still the draft stage. */
const STAGE_OF_STATUS: Record<string, Stage> = {
  draft: 'draft',
  approved: 'draft',
  abandoned: 'draft',
  'in-progress': 'planned',
  blocked: 'planned',
  verified: 'verified',
  closed: 'closed',
};

/** What `layoutFindings` needs, all read by the caller (IO stays out of the domain). */
export interface LayoutInput {
  /** The story.md frontmatter. */
  story: { schema_version?: unknown; status?: unknown };
  /** One key per present `spec.md`, `requirements.md` or `design.md`, with that document's frontmatter. */
  docs: Record<string, { depth?: unknown } | undefined>;
  /** The folder's entry names; directories end in `/`. */
  entries: string[];
}

/** `depth:` of `spec.md`, `requirements.md` or `design.md`; lite when none has one and `spec.md` exists, else standard (D1). */
function depthOf(docs: LayoutInput['docs']): Depth {
  for (const f of ['spec.md', 'requirements.md', 'design.md']) {
    const depth = docs[f]?.depth;
    if (DEPTHS.includes(depth as Depth)) return depth as Depth;
  }
  return 'spec.md' in docs ? 'lite' : 'standard';
}

/** Compares a folder's contents with its manifest. The version is the story's `schema_version`, nothing else. */
export function layoutFindings({ story, docs, entries }: LayoutInput): LayoutFindings {
  const version = LAYOUT_VERSIONS.find((v) => v === story.schema_version);
  if (!version) throw new Error(`story.md: schema_version must be ${LAYOUT_VERSIONS.join(' or ')}, got ${String(story.schema_version)}`);
  const depth = depthOf(docs);
  const stage = STAGE_OF_STATUS[String(story.status ?? 'draft')] ?? 'draft';
  const manifest = layoutManifest(version, depth);
  const reached = STAGES.slice(0, STAGES.indexOf(stage) + 1);
  const present = entries.filter((e) => e !== '.DS_Store');
  const required = reached.flatMap((s) => manifest.required[s]);
  for (const alt of manifest.oneOf) if (reached.includes(alt.stage)) required.push(...missingOfOneOf(alt.options, present));
  const allowed = new Set([
    ...STAGES.flatMap((s) => manifest.required[s]),
    ...manifest.oneOf.flatMap((a) => a.options.flat()),
    ...manifest.optional,
  ]);
  const missing = required.filter((f) => !present.includes(f)).sort();
  const unexpected = present.filter((f) => !allowed.has(f)).sort();
  return { version, depth, stage, missing, unexpected, ok: !missing.length && !unexpected.length };
}

/** The problems a close refusal names, one line each; empty when the folder matches. */
export function layoutProblems(found: LayoutFindings): string[] {
  return [
    ...(found.missing.length ? [`layout: missing ${found.missing.join(', ')}`] : []),
    ...(found.unexpected.length ? [`layout: unexpected ${found.unexpected.join(', ')}`] : []),
  ];
}

/** The tables of `docs/spec-anatomy.md`, from the manifest (S-8.1). */
export function anatomyTables(): string {
  const row = (f: string, note: string) => `| \`${f}\` | ${FILE_PURPOSE[f] ?? ''} | ${note} |`;
  const header = '| File | What it is for | When |\n|---|---|---|';
  const statuses = (s: Stage) => Object.keys(STAGE_OF_STATUS).filter((k) => STAGE_OF_STATUS[k] === s);
  const stageRows = STAGES.map((s) => {
    const of = statuses(s);
    return `| ${s} | ${of.length ? of.map((k) => `\`${k}\``).join(', ') : 'none: no status maps here, so its files are required from the next stage reached'} |`;
  });
  const parts = [`### Stages\n\n| Stage | Story status |\n|---|---|\n${stageRows.join('\n')}`];
  for (const depth of DEPTHS) {
    const m = layoutManifest(2, depth);
    const rows = STAGES.flatMap((s) => m.required[s].map((f) => row(f, `from the ${s} stage`)));
    parts.push(`### ${depth}\n\n${header}\n${rows.join('\n')}`);
  }
  const cond = CONDITIONALS.map((c) => row(c.file, `only when ${c.when}`));
  const log = LOG_FILES_V2.map((f) => row(f, 'always, in `_log/`'));
  parts.push(`### Conditional files\n\n${header}\n${cond.join('\n')}`);
  parts.push(`### The six log files (\`_log/\`)\n\n${header}\n${log.join('\n')}`);
  return parts.join('\n\n');
}
