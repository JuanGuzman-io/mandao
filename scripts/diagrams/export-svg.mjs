// Exports light and dark SVG from an Archify HTML artifact: headless Chrome runs Archify's own
// serializeSvg (the function its viewer uses for downloads) with the theme locked, so the files are
// Archify's output, not a re-drawing.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_BIN ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const HOOK = 'function runExport(format) {';

/** Archify keeps serializeSvg inside its viewer closure; expose it next to its only caller. */
function withHook(html) {
  if (!html.includes(HOOK)) throw new Error('Archify template changed: runExport not found, update export-svg.mjs');
  const probe = `
<script>
window.addEventListener('load', () => setTimeout(() => {
  const out = {};
  for (const theme of ['light', 'dark']) {
    document.documentElement.setAttribute('data-theme', theme);
    out[theme] = window.__mandaoSerializeSvg(1).svgString;
  }
  const pre = document.createElement('pre');
  pre.id = 'mandao-export';
  pre.textContent = JSON.stringify(out);
  document.body.appendChild(pre);
}, 300));
</script>`;
  return html.replace(HOOK, `window.__mandaoSerializeSvg = serializeSvg;\n      ${HOOK}`).replace('</body>', `${probe}</body>`);
}

export function exportSvgs(htmlPath) {
  const dir = mkdtempSync(join(tmpdir(), 'mandao-diagram-'));
  try {
    const page = join(dir, 'page.html');
    writeFileSync(page, withHook(readFileSync(htmlPath, 'utf8')));
    const dom = execFileSync(
      CHROME,
      ['--headless=new', '--disable-gpu', '--no-sandbox', `--user-data-dir=${join(dir, 'profile')}`, '--virtual-time-budget=5000', '--dump-dom', `file://${page}`],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] },
    );
    const m = /<pre id="mandao-export">([\s\S]*?)<\/pre>/.exec(dom);
    if (!m) throw new Error(`no SVG came back from ${htmlPath}`);
    const text = m[1].replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');
    const svgs = JSON.parse(text);
    // Archify emits harmless trailing spaces in CSS blocks; normalize them so generated artifacts pass diff checks.
    return Object.fromEntries(Object.entries(svgs).map(([theme, svg]) => [theme, svg.replace(/[ \t]+\r?$/gm, '')]));
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const out = exportSvgs(process.argv[2]);
  for (const [theme, svg] of Object.entries(out)) {
    writeFileSync(process.argv[3].replace('{theme}', theme), svg);
    console.log(theme, svg.length);
  }
}
