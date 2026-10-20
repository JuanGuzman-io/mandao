import type { Finding } from '../engine/doctor.js';
import type { Change } from '../writer/plan.js';

const color = (code: number) => (s: string) => (process.stdout.isTTY && !process.env.NO_COLOR ? `\x1b[${code}m${s}\x1b[0m` : s);
export const c = { red: color(31), green: color(32), yellow: color(33), blue: color(34), dim: color(2), bold: color(1) };

const SYMBOL: Record<Change['action'], string> = {
  create: c.green('+'),
  update: c.blue('~'),
  delete: c.red('-'),
  unchanged: c.dim('='),
  drift: c.yellow('!'),
  'drift-orphan': c.yellow('!'),
};

export function printChanges(changes: Change[], verbose = false) {
  let shown = verbose ? changes : changes.filter((ch) => ch.action !== 'unchanged');
  // Installed templates are many and uninteresting one by one; summarize them unless verbose.
  const templates = shown.filter((ch) => ch.path.startsWith('.mandao/templates/') && ch.action !== 'drift' && ch.action !== 'drift-orphan');
  if (!verbose && templates.length > 3) {
    shown = shown.filter((ch) => !templates.includes(ch));
    console.log(`  ${c.dim('·')} .mandao/templates/ ${c.dim(`(${templates.length} files)`)}`);
  }
  for (const ch of shown) {
    const note =
      ch.action === 'drift'
        ? ' (edited by hand, kept)'
        : ch.action === 'drift-orphan'
          ? ' (no longer generated, edited by hand, kept)'
          : '';
    console.log(`  ${SYMBOL[ch.action]} ${ch.path}${c.dim(note)}`);
  }
  const count = (a: Change['action']) => changes.filter((ch) => ch.action === a).length;
  console.log(
    c.dim(
      `  ${count('create')} created, ${count('update')} updated, ${count('delete')} deleted, ${count('unchanged')} unchanged, ${count('drift') + count('drift-orphan')} drifted`,
    ),
  );
  if (count('drift') + count('drift-orphan') > 0) {
    console.log(c.yellow('  Drifted files were not overwritten. Move the change into .mandao/overrides/, then run `mandao sync --force`.'));
  }
}

export function printWarnings(warnings: string[]) {
  for (const w of warnings) console.log(`  ${c.yellow('warn')} ${w}`);
}

const LEVEL: Record<Finding['level'], string> = {
  ok: c.green('ok   '),
  info: c.blue('info '),
  warn: c.yellow('warn '),
  error: c.red('error'),
};

export function printFindings(findings: Finding[]) {
  for (const f of findings) {
    console.log(`  ${LEVEL[f.level]} ${f.message}`);
    if (f.fix) console.log(`        ${c.dim(`→ ${f.fix}`)}`);
  }
}

/** Steps a harness needs from the user after its files are generated (ADR 0021). */
export function harnessSetupNotes(harnesses: readonly string[]): string[] {
  if (!harnesses.includes('codex')) return [];
  return [
    'Codex: trust this project (Codex asks the first time you open it here; each worktree is its own path).',
    '  Without trust Codex ignores .codex/agents (no Implementer or Reviewer agents) and .codex/rules',
    '  (the approval prompt that lets `mandao run commit` write .git). `mandao doctor` checks it.',
  ];
}
