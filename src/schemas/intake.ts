import { z } from 'zod';

/**
 * Requirements document intake (phase 14): the extraction report and its `sections.json` in
 * `.mandao/cache/intake/<doc>/`, and the frontmatter of a proposal in `docs/product/intake/`.
 */

/** A doc slug: it names the cache folder, so `..`, a path or anything but lower-case words throws before any IO. */
export const INTAKE_DOC = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const INTAKE_SOURCE_TYPES = ['pdf', 'markdown'] as const;
export const INTAKE_EXTRACTORS = ['pdftotext', 'markdown', 'native'] as const;
export const INTAKE_STATUSES = ['ready', 'needs-tool', 'refused'] as const;

const sha256Hex = z.string().regex(/^[0-9a-f]{64}$/, 'must be a sha256 in lower-case hex');
const doc = z.string().regex(INTAKE_DOC, 'must be a slug (lower-case words joined by -)');

export const intakeSectionSchema = z.object({
  id: z.string().regex(/^S\d+$/),
  ref: z.string().min(1),
  /** null for native pages: the agent read them, Mandao never saw the text. */
  chars: z.number().int().nonnegative().nullable(),
  ocr: z.boolean(),
});
export type IntakeSection = z.infer<typeof intakeSectionSchema>;

export const intakeSourceSchema = z.object({ path: z.string().min(1), sha256: sha256Hex, type: z.enum(INTAKE_SOURCE_TYPES) });
export type IntakeSource = z.infer<typeof intakeSourceSchema>;

export const intakeSummarySchema = z.object({
  sections: z.number().int().nonnegative(),
  chars: z.number().int().nonnegative().nullable(),
  batches: z.number().int().nonnegative(),
  batch_chars: z.number().int().positive(),
  ocr_refs: z.array(z.string()),
});

/** `sections.json`: what `intake-check` verifies references and coverage against. */
export const intakeSectionsFileSchema = z.object({
  doc,
  source: intakeSourceSchema,
  extractor: z.enum(INTAKE_EXTRACTORS),
  sections: z.array(intakeSectionSchema),
  summary: intakeSummarySchema,
  batches: z.array(z.array(z.string())),
});
export type IntakeSectionsFile = z.infer<typeof intakeSectionsFileSchema>;

/** What `run intake-extract` prints. A refused file keeps its own type (`docx`) and has no extractor. */
export interface IntakeReport extends Omit<IntakeSectionsFile, 'source' | 'extractor'> {
  source: { path: string; sha256: string; type: string };
  extractor?: IntakeSectionsFile['extractor'];
  cache: string;
  status: (typeof INTAKE_STATUSES)[number];
  hint?: string;
}

export const intakeFrontmatterSchema = z.object({
  schema_version: z.literal(1),
  source: z.object({ path: z.string().min(1), sha256: sha256Hex, extractor: z.enum(INTAKE_EXTRACTORS) }),
  doc,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be an ISO date (YYYY-MM-DD)'),
  status: z.enum(['proposed', 'closed']),
});
export type IntakeFrontmatter = z.infer<typeof intakeFrontmatterSchema>;

export const INTAKE_KINDS = ['rule', 'term', 'actor'] as const;
export const INTAKE_TARGETS = ['business-rules.md', 'glossary.md', 'product.md'] as const;
export const INTAKE_CONTEXT_STATUSES = ['proposed', 'approved', 'applied', 'rejected', 'CONFLICT'] as const;
export const INTAKE_OPEN_TYPES = ['OPEN', 'CONFLICT'] as const;
export const INTAKE_COVERAGE = ['covered', 'no requirement', 'requires OCR'] as const;
