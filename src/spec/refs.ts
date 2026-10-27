import { withoutFences } from './markdown.js';
import type { TraceFinding } from './trace.js';

/**
 * A spec reference as written in its documents: `AC-2`, `AC-2/C1`, `FR-3`, `NFR-1`, `S-1.2`, `S-1.2/C1`. Not part of
 * a longer token: `FR-1` is not found inside `NFR-1`, `FR-10` or `XFR-1`.
 */
const REF = /(?<![A-Za-z0-9_-])(?:AC-\d+(?:\/C\d+)?|N?FR-\d+|S-\d+\.\d+(?:\/C\d+)?)(?![A-Za-z0-9_]|\.\d)/g;
const IS_REF = /^(?:AC-\d+(?:\/C\d+)?|N?FR-\d+|S-\d+\.\d+(?:\/C\d+)?)$/;

/** The documents of a spec whose references must agree; the story defines the AC and is the source. */
export const REF_DOCS = ['story.md', 'requirements.md', 'design.md', 'data-model.md', 'tasks.md', 'quickstart.md', 'spec.md'] as const;

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Pure: `text` with every whole occurrence of reference `from` replaced by `to`, and how many there were. */
export function renameRef(text: string, from: string, to: string): { text: string; count: number } {
  if (!IS_REF.test(from) || !IS_REF.test(to)) throw new Error(`references look like AC-2, FR-3, NFR-1 or S-1.2: got ${from} → ${to}`);
  const pattern = new RegExp(`(?<![A-Za-z0-9_-])${escapeRegExp(from)}(?![0-9]|\\.[0-9])`, 'g');
  let count = 0;
  const out = text.replace(pattern, () => {
    count++;
    return to;
  });
  return { text: out, count };
}

/**
 * Another spec's reference (`MDO-0003 FR-2`, `PROJ-12/AC-1`) is not this spec's: it is left out. The token before must
 * not be one of this spec's own references, so `AC-1 AC-9` or `FR-3: AC-9` still checks `AC-9`.
 */
const OTHER_SPEC = /(?<![A-Za-z0-9_-])(?!(?:AC|N?FR|S)-)[A-Z][A-Z0-9]*-\d+[\s:/#]+$/;

/** The references a text cites, fenced examples already removed by the caller. */
function ownRefs(text: string): string[] {
  return [...text.matchAll(REF)].filter((m) => !OTHER_SPEC.test(text.slice(Math.max(0, m.index - 24), m.index))).map((m) => m[0]);
}

/**
 * Pure: references a document cites that the spec does not define (phase 20). At MDO-0001's close a reference fix
 * reached only the story; design, data model and tasks kept the old IDs, and nothing said so.
 */
export function staleRefs(docs: { name: string; text: string }[], defined: Set<string>): TraceFinding[] {
  return docs.flatMap(({ name, text }) =>
    [...new Set(ownRefs(withoutFences(text)))]
      .filter((r) => !defined.has(r))
      .map((r) => ({
        type: 'STALE_REF' as const,
        ref: r,
        message: `${name} cites ${r}, which the spec does not define: fix it in every document with \`mandao run rename-ref\``,
      })),
  );
}
