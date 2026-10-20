import { BLOCK_BEGIN, BLOCK_END } from '../adapters/agents-md.js';

const blockRe = () => new RegExp(`${escapeRe(BLOCK_BEGIN)}[\\s\\S]*?${escapeRe(BLOCK_END)}`);
function escapeRe(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function extractBlock(content: string): string | undefined {
  return content.match(blockRe())?.[0];
}

/** Replaces the managed block, or appends it after the user's content. */
export function upsertBlock(existing: string | undefined, block: string): string {
  if (existing === undefined || existing.trim() === '') return `${block}\n`;
  if (extractBlock(existing) !== undefined) return existing.replace(blockRe(), () => block);
  return `${existing.trimEnd()}\n\n${block}\n`;
}

/** Removes the managed block; returns undefined when nothing else is left in the file. */
export function removeBlock(existing: string): string | undefined {
  const rest = existing
    .replace(blockRe(), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return rest === '' ? undefined : `${rest}\n`;
}
