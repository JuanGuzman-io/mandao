/**
 * Stack verification (phase 18): every stack choice the constitution writes is checked on the project's runtime,
 * the way specify's Premise Ledger is (MDO-0001: `sqlite-vec` was approved against PyPI only, and the project's
 * Python could not load SQLite extensions). Pure: the CLI runs the command and writes the record.
 */

export interface StackCheck {
  id: string;
  claim: string;
  /** The constitution says it could not be checked here: `UNVERIFIED`, with the reason. */
  unverified: boolean;
}

export interface StackFinding {
  ref: string;
  level: 'warn' | 'info';
  message: string;
}

/** `### S2 — claim` sections of `## Stack verification` in `architecture.md`. */
export function parseStackChecks(architecture: string): StackCheck[] {
  const section = architecture.split(/^## Stack verification\s*$/m)[1]?.split(/^## (?!#)/m)[0] ?? '';
  return section.split(/^(?=### S\d+\b)/m).flatMap((part) => {
    const h = /^### (S\d+)\s*[—–-]\s*(.+)$/m.exec(part);
    return h ? [{ id: h[1]!, claim: h[2]!.trim(), unverified: /\bUNVERIFIED\b/.test(part) }] : [];
  });
}

/** The checks with a run recorded by `mandao run stack-check`: `## Sn — run` sections of the stack log. */
export function recordedStackChecks(log: string | undefined): Set<string> {
  return new Set([...(log ?? '').matchAll(/^## (S\d+) — run\s*$/gm)].map((m) => m[1]!));
}

const STACK_LOG_HEAD = '# Stack checks\n\nWritten by `mandao run stack-check`: the run that proves each stack choice.\n';

/** The stack log with one check's run put in place: replaced when it was recorded, appended otherwise. */
export function withStackRun(log: string | undefined, id: string, body: string): string {
  const text = log?.trim() ? log : STACK_LOG_HEAD;
  const section = `## ${id} — run\n\n${body.trim()}\n`;
  const parts = text.split(/^(?=## S\d+ — run\s*$)/m);
  const at = parts.findIndex((p) => p.startsWith(`## ${id} — run`));
  if (at >= 0) parts[at] = `${section}\n`;
  else parts.push(`${parts.at(-1)!.endsWith('\n\n') ? '' : '\n'}${section}`);
  return `${parts.join('').trimEnd()}\n`;
}

/**
 * What doctor reports (warnings, never a block: the constitution has no approval step to stop, and a spec that
 * relies on the choice makes it a High premise, which blocks its design approval): a check with no run and no
 * `UNVERIFIED` mark, and, for information, each check marked `UNVERIFIED`.
 */
export function stackFindings(architecture: string | undefined, recorded: Set<string>, where: string): StackFinding[] {
  if (!architecture) return [];
  return parseStackChecks(architecture).flatMap((c): StackFinding[] => {
    if (recorded.has(c.id)) return [];
    if (c.unverified)
      return [
        {
          ref: c.id,
          level: 'info',
          message: `${where} ${c.id} is UNVERIFIED (${c.claim}): a spec that relies on it must prove it as a High premise`,
        },
      ];
    return [
      {
        ref: c.id,
        level: 'warn',
        message: `${where} ${c.id} has no recorded run (${c.claim}): run \`mandao run stack-check ${c.id} -- <command>\` or mark it UNVERIFIED`,
      },
    ];
  });
}
