import type { TraceFinding } from './trace.js';

export interface Premise {
  id: string;
  claim: string;
  impact: 'High' | 'Low' | 'unknown';
  /** The ledger says it was not verified: `UNVERIFIED`. */
  unverified: boolean;
}

/** `### P3 — claim (High)` sections, the readable ledger layout. */
function headingPremises(markdown: string): Premise[] {
  const out: Premise[] = [];
  const parts = markdown.split(/^(?=### P\d+\b)/m).slice(1);
  for (const part of parts) {
    const h = /^### (P\d+)\s*[—–-]\s*(.+)$/m.exec(part);
    if (!h) continue;
    const body = part.split(/^##\s/m)[0]!;
    const impact = /\((High|Low)\)\s*$/.exec(h[2]!)?.[1] as Premise['impact'] | undefined;
    out.push({
      id: h[1]!,
      claim: h[2]!.replace(/\s*\((High|Low)\)\s*$/, ''),
      impact: impact ?? 'unknown',
      unverified: /UNVERIFIED/.test(body),
    });
  }
  return out;
}

/** `| P1 | claim | evidence | if false | impact |` rows, the older table layout. */
function tablePremises(markdown: string): Premise[] {
  return [...markdown.matchAll(/^\|\s*(P\d+)\s*\|(.+)\|\s*$/gm)].map((m) => {
    const cells = m[2]!.split('|').map((c) => c.trim());
    const impact = /\bHigh\b/.test(cells.at(-1) ?? '') ? 'High' : /\bLow\b/.test(cells.at(-1) ?? '') ? 'Low' : 'unknown';
    return { id: m[1]!, claim: cells[0] ?? '', impact, unverified: /UNVERIFIED/.test(cells[1] ?? '') };
  });
}

/** The Premise Ledger of a design (or a lite spec.md), in either layout. */
export function parsePremises(design: string): Premise[] {
  const ledger = design.split(/^## Premise Ledger\s*$/m)[1]?.split(/^## (?!#)/m)[0] ?? '';
  const found = headingPremises(ledger);
  return found.length ? found : tablePremises(ledger);
}

/**
 * A High premise counts as verified only with a run recorded by `mandao run premise` (never a search or a
 * read); otherwise the ledger must say `UNVERIFIED`. MDO-0005 and MDO-0006 each trusted a premise that
 * was only read or searched, and it was false.
 */
export function premiseFindings(design: string | undefined, recorded: Set<string>): TraceFinding[] {
  if (!design) return [];
  return parsePremises(design)
    .filter((p) => p.impact === 'High' && !recorded.has(p.id) && !p.unverified)
    .map((p) => ({
      type: 'PREMISE_UNPROVEN' as const,
      ref: p.id,
      message: `${p.id} is High impact with no recorded run: run it with \`mandao run premise <spec> ${p.id} -- <command>\` or mark it UNVERIFIED`,
    }));
}
