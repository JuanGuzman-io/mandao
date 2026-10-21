// `npm run diagrams:check`: fails when a source changed and a diagram or a generated page did not follow.
// Needs no Archify, so it runs in CI and in the pre-commit hook. The fix is always `npm run diagrams`.
import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { ALL_DIAGRAMS, sources } from './derive.mjs';
import { generatedDocs } from './docs.mjs';
import { specHash } from './hash.mjs';

const root = resolve(import.meta.dirname, '../..');
const problems = [];

for (const [name, derive] of Object.entries(ALL_DIAGRAMS)) {
  const file = join(root, 'docs/diagrams/src', `${name}.json`);
  if (!existsSync(file)) {
    problems.push(`${name}: never generated`);
    continue;
  }
  const committed = JSON.parse(readFileSync(file, 'utf8'));
  const src = sources(root);
  const hash = specHash(derive(src.read));
  if (hash !== committed.specSha256) problems.push(`${name}: its sources changed the diagram (stale SVG)`);
  const changed = src
    .derivedFrom()
    .filter((d) => committed.derivedFrom.find((c) => c.path === d.path)?.sha256 !== d.sha256)
    .map((d) => d.path);
  if (changed.length) problems.push(`${name}: derivedFrom changed (${changed.join(', ')})`);
  for (const theme of ['light', 'dark']) {
    const svg = join(root, 'docs/diagrams', `${name}-${theme}.svg`);
    if (!existsSync(svg) || !readFileSync(svg, 'utf8').includes(`spec-sha256 ${committed.specSha256}`))
      problems.push(`${name}: ${theme} SVG missing or not from its specification`);
  }
}

const read = (rel) => readFileSync(join(root, rel), 'utf8');
for (const [path, content] of Object.entries(generatedDocs(read))) {
  const file = join(root, path);
  if (!existsSync(file) || readFileSync(file, 'utf8') !== content) problems.push(`${path}: out of date`);
}

if (problems.length) {
  console.error(`Diagrams are out of date. Run \`npm run diagrams\` (needs Archify) and commit the result:\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`diagrams: ${Object.keys(ALL_DIAGRAMS).length} diagrams and their pages are up to date`);
