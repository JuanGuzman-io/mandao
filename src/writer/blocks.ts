/** Managed blocks use the comment syntax of the file they live in. */
export function blockMarkers(path: string): { begin: string; end: string } {
  return /\.(md|mdx|markdown)$/i.test(path)
    ? { begin: '<!-- mandao:begin -->', end: '<!-- mandao:end -->' }
    : { begin: '# mandao:begin', end: '# mandao:end' };
}

/** Wraps generated lines in the managed-block markers for `path`. */
export function wrapBlock(path: string, lines: string[]): string {
  const { begin, end } = blockMarkers(path);
  return [begin, ...lines, end].join('\n');
}

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const blockRe = (path: string) => {
  const { begin, end } = blockMarkers(path);
  return new RegExp(`${escapeRe(begin)}[\\s\\S]*?${escapeRe(end)}`);
};

export function extractBlock(path: string, content: string): string | undefined {
  return content.match(blockRe(path))?.[0];
}

/** Replaces the managed block, or appends it after the user's content. */
export function upsertBlock(path: string, existing: string | undefined, block: string): string {
  if (existing === undefined || existing.trim() === '') return `${block}\n`;
  if (extractBlock(path, existing) !== undefined) return existing.replace(blockRe(path), () => block);
  return `${existing.trimEnd()}\n\n${block}\n`;
}

/** Removes the managed block; returns undefined when nothing else is left in the file. */
export function removeBlock(path: string, existing: string): string | undefined {
  const rest = existing
    .replace(blockRe(path), '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return rest === '' ? undefined : `${rest}\n`;
}
