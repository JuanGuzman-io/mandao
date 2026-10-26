import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ADAPTERS } from '../adapters/index.js';
import type { HarnessId } from '../schemas/index.js';
import type { NextStep } from '../spec/index.js';
import { frontmatterOf } from '../spec/markdown.js';

/**
 * The recommended step and every option as the person types them in this harness, with the spec id: copy-ready
 * (phase 16; before it, `next` named a bare `/mandao-specify`). Steps that are not a mandao stay as they are.
 */
export function withInvocations(next: NextStep, id: string, harness: HarnessId) {
  const full = (command: string) =>
    command.startsWith('/mandao-') ? ADAPTERS[harness].session.invoke(`${command.slice(1)} ${id}`) : command;
  return { ...next, recommended: { ...next.recommended, invocation: full(next.recommended.command) }, invocations: next.options.map(full) };
}

/** One frontmatter field of a spec document, when the document exists. */
export function frontField(dir: string, file: string, key: string): unknown {
  const path = join(dir, file);
  return existsSync(path) ? frontmatterOf(readFileSync(path, 'utf8')).data[key] : undefined;
}
