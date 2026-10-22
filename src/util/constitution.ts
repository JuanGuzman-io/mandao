/** Reads approved DP-* table rows from the explicit Design principles section. */
export function declaredPrinciples(markdown: string): string[] {
  const lines = markdown.split('\n');
  const ids: string[] = [];
  let inSection = false;
  let inFence = false;
  for (const line of lines) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (/^#{1,2}\s+/.test(line)) {
      inSection = /^##\s+Design principles\s*$/i.test(line);
      continue;
    }
    if (!inSection) continue;
    const id = line.match(/^\|\s*(DP-[A-Z0-9][A-Z0-9-]*)\s*\|/)?.[1];
    if (id) ids.push(id);
  }
  return ids;
}
