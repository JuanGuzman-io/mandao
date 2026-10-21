import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { ADAPTERS } from '../../src/adapters/index.js';
import { readCatalog } from '../../src/engine/catalog.js';
import { buildOutputs } from '../../src/engine/sync.js';
import { loadLayers } from '../../src/resolver/layers.js';
import { configSchema, PROFILES, WORKSPACE_MODES } from '../../src/schemas/index.js';
import { frontmatterOf } from '../../src/spec/markdown.js';

/** The shipped core must resolve and render for every profile, mode and harness. */
describe('core content', () => {
  const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');

  test.each(PROFILES.flatMap((profile) => WORKSPACE_MODES.map((mode) => [profile, mode] as const)))(
    'renders for %s in %s mode',
    (profile, mode) => {
      const projects =
        mode === 'single'
          ? [{ name: 'a', path: '.', profile }]
          : [
              { name: 'a', path: 'a', profile, repo: 'local' },
              { name: 'b', path: 'b', profile: 'app' as const, repo: 'local' },
            ];
      const config = configSchema.parse({ schema_version: 1, workspace: mode, projects, harnesses: Object.keys(ADAPTERS) });
      const out = buildOutputs(config, {}, layers, '0.0.0', 'project');
      expect(out.files.length).toBeGreaterThan(20);
      // Nothing unrendered may leak into generated files.
      for (const f of out.files) expect(f.content, f.path).not.toMatch(/\{\{|mandao:if|mandao:endif/);
    },
  );

  test('ships every command in the flow, with stubs declared as such', () => {
    const layers = loadLayers(process.cwd(), []).filter((l) => l.kind === 'core');
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.', profile: 'app' }],
      harnesses: ['claude'],
    });
    const { resolution } = buildOutputs(config, {}, layers, '0.0.0', 'project');
    const status = Object.fromEntries(resolution.commands.map((c) => [c.meta.id, c.meta.status]));
    expect(status).toEqual({
      constitution: 'stable',
      specify: 'stable',
      quick: 'stable',
      init: 'stable',
      story: 'stable',
      clarify: 'stable',
      tasks: 'stable',
      implement: 'stable',
      resume: 'stable',
      verify: 'stable',
      close: 'stable',
      audit: 'stub',
      perf: 'stub',
    });
    expect(resolution.personas.map((p) => p.meta.id)).toEqual(['implementer', 'leader', 'reviewer', 'tester']);
  });

  describe('skill guidance in /mandao-story and /mandao-specify', () => {
    const render = (harnesses: string[]) => {
      const config = configSchema.parse({
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'a', path: '.', profile: 'app' }],
        harnesses,
      });
      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
      // The command's own rendered markdown only; not auxiliary files such as codex's agents/openai.yaml.
      return files.filter((f) => /mandao-(story|specify).*\.md$/.test(f.path));
    };

    const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'];
    const LEFTOVER = /\{\{|mandao:if|mandao:endif/;

    test.each(HARNESSES)('S-5.1: %s render says when to use each skill, with no harness label, and the brainstorming hand-off', (h) => {
      const files = render([h]);
      expect(files.length).toBeGreaterThanOrEqual(2);
      for (const f of files) {
        expect(f.content, f.path).toMatch(/Use `?brainstorming`? when the story starts from nothing \(no code and no\s+tracker context\)/);
        expect(f.content, f.path).toMatch(/`?product-manager-toolkit`? when there is code and product context/);
        expect(f.content, f.path).not.toMatch(/Skills \(Claude Code\)/);
        expect(f.content, f.path).toMatch(/steps continue after `?brainstorming`?[^.]*`?superpowers:writing-plans`?/i);
        expect(f.content, f.path).not.toMatch(LEFTOVER);
      }
    });

    test.each(HARNESSES)(
      'S-5.1/C1: %s render says a missing skill leaves the command on its own steps and names the missing skill',
      (h) => {
        for (const f of render([h])) {
          expect(f.content, f.path).toMatch(
            /when a skill is missing,?\s+follow[^.]*own\s+steps[^.]*note[^.]*which\s+skill\s+was\s+missing/i,
          );
          expect(f.content, f.path).not.toMatch(LEFTOVER);
        }
      },
    );
  });

  /** MDO-0010 T3: the worktree entry and the next step, per harness. */
  describe('worktree entry and next step in the rendered commands', () => {
    const HARNESSES = ['claude', 'codex', 'opencode', 'copilot', 'antigravity'] as const;
    const render = (h: string, ids: string[]) => {
      const config = configSchema.parse({
        schema_version: 1,
        workspace: 'single',
        projects: [{ name: 'a', path: '.', profile: 'app' }],
        harnesses: [h],
      });
      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
      return ids.map((id) => {
        const f = files.find((x) => new RegExp(`mandao-${id}(/SKILL\\.md|\\.md|\\.prompt\\.md)$`).test(x.path));
        expect(f, `${h}: mandao-${id}`).toBeDefined();
        return { id, path: f!.path, content: f!.content };
      });
    };
    /** The §0 check: the text from the first `run where` on. */
    const whereStep = (content: string) => {
      const at = content.search(/run where/);
      expect(at, 'a run where step').toBeGreaterThanOrEqual(0);
      return content.slice(at, at + 700);
    };

    /** A resume command copied into a text, whatever the harness. */
    const COPIED = /(claude|codex) ["']\/?\$?mandao-|then run \/mandao-|open (opencode|antigravity) there/;
    const RESUME_COMMANDS = ['specify', 'quick', 'implement', 'verify', 'close', 'tasks'];

    test.each(HARNESSES)('S-2.2/C1: %s prints the resume field of the script output, never a command copied into the text', (h) => {
      for (const f of render(h, RESUME_COMMANDS)) {
        expect(f.content, f.path).toMatch(/`resume`/);
        expect(f.content, f.path).not.toMatch(COPIED);
        expect(f.content, f.path).not.toMatch(/claude --resume/);
      }
    });

    test.each(HARNESSES)('S-2.2/C1: %s passes its own harness to run where and to spec-new', (h) => {
      for (const f of render(h, ['implement', 'verify', 'close', 'tasks'])) {
        expect(f.content.slice(f.content.search(/run where/)), f.path).toMatch(/^run where [^\n]*--harness <this harness>/);
      }
      for (const f of render(h, ['specify', 'quick'])) {
        const at = f.content.search(/run spec-new/);
        expect(f.content.slice(at, at + 500), f.path).toMatch(/--harness <this harness>[\s\S]*--first "\/mandao-(specify|quick) /);
      }
    });

    test.each(HARNESSES.filter((h) => h !== 'claude'))('S-2.2: %s mentions no EnterWorktree and prints the resume field', (h) => {
      for (const f of render(h, RESUME_COMMANDS)) expect(f.content, f.path).not.toMatch(/EnterWorktree/);
    });

    test('S-2.1: claude specify, quick and implement enter the worktree with EnterWorktree and the path, without a new session', () => {
      for (const f of render('claude', ['specify', 'quick', 'implement'])) {
        expect(f.content, f.path).toMatch(/EnterWorktree[^.]*path/i);
        expect(f.content, f.path).toMatch(/without (asking for )?a new session/i);
      }
    });

    test('S-2.3 and S-2.3/C1: claude prints the resume command and stops when EnterWorktree is refused, never working in the main checkout', () => {
      for (const f of render('claude', ['specify', 'quick'])) {
        expect(f.content, f.path).toMatch(/EnterWorktree[\s\S]{0,200}(refused|fails)[\s\S]{0,200}`resume`[\s\S]{0,120}stop/i);
        expect(f.content, f.path).toMatch(/not (go on|continue|keep) working in the main checkout/i);
      }
    });

    test.each(['implement', 'verify', 'close'])(
      'S-3.3 and S-3.3/C1: %s re-enters the worktree (claude) or prints the resume field (others) in its run where step',
      (id) => {
        const [claude] = render('claude', [id]);
        expect(whereStep(claude!.content)).toMatch(/EnterWorktree/);
        expect(whereStep(claude!.content)).toMatch(/`resume`/);
        for (const h of HARNESSES.filter((x) => x !== 'claude')) {
          const [f] = render(h, [id]);
          expect(whereStep(f!.content), f!.path).toMatch(/`resume`/);
          expect(whereStep(f!.content), f!.path).not.toMatch(/EnterWorktree/);
        }
      },
    );

    test('S-4.3: quick records its cost before quick-log and the commit, and the commit lists the quick costs file', () => {
      const [f] = render('claude', ['quick']);
      const body = f!.content.slice(f!.content.indexOf('## 6.'));
      const cost = body.search(/run cost/);
      const log = body.search(/run quick-log/);
      const commit = body.search(/Commit following/);
      expect(cost, 'a cost record in §6').toBeGreaterThanOrEqual(0);
      expect(cost).toBeLessThan(log);
      expect(log).toBeLessThan(commit);
      expect(body.slice(commit)).toMatch(/specs\/quick\/_log\/costs\.yml/);
    });

    test.each(HARNESSES)(
      'S-4.3: %s implement and tasks call approve --by-running with --harness and no longer say running the command is no approval',
      (h) => {
        for (const f of render(h, ['implement', 'tasks'])) {
          expect(f.content, f.path).toMatch(/approve --by-running/);
          for (const m of f.content.matchAll(/approve --by-running/g)) {
            const call = f.content.slice(m.index, m.index! + 200);
            expect(call, f.path).toMatch(new RegExp(`--harness (<this harness>|${h})`));
            expect(call, f.path).toMatch(/approve --by-running \/mandao-implement\b/);
          }
          // the step is named, as FR-5 does: `spec` for a lite draft, `tasks` for draft tasks
          if (f.path.includes('implement')) expect(f.content, f.path).toMatch(/`spec` for a lite draft[\s\S]{0,60}`tasks` for draft tasks/);
          else expect(f.content, f.path).toMatch(/approve --by-running \/mandao-implement [^\n]* tasks\b/);
          expect(f.content, f.path).not.toMatch(/running\s+the\s+next command is not one/);
        }
      },
    );
  });

  test('the catalog is valid', () => {
    expect(() => readCatalog()).not.toThrow();
  });

  /** MDO-0011 T2: tasks.md at every depth; quickstart and data-model by kind of content, never by count. */
  describe('one layout per depth in the commands (AC-1)', () => {
    const config = configSchema.parse({
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.', profile: 'app' }],
      harnesses: ['claude'],
    });
    const rendered = (id: string) => {
      const { files } = buildOutputs(config, {}, layers, '0.0.0', 'project');
      const f = files.find((x) => new RegExp(`mandao-${id}(/SKILL\\.md|\\.md)$`).test(x.path));
      expect(f, `mandao-${id}`).toBeDefined();
      return f!.content;
    };
    const BY_COUNT = /3 tasks or fewer|3 or fewer|fourth task|up to 3 tasks|more than 3|inline under `## Tasks`/i;

    test('S-1.2: no command or lite rule decides where tasks go by how many there are', () => {
      for (const id of ['specify', 'tasks', 'implement', 'clarify']) expect(rendered(id), id).not.toMatch(BY_COUNT);
    });

    test('S-1.2/C2: the spec template has no ## Tasks, and the tasks step writes tasks.md at every depth', () => {
      const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/spec.md'), 'utf8');
      expect(tpl).not.toContain('## Tasks');
      expect(rendered('tasks')).toMatch(/tasks\.md[^.]*(every|any|all) depth|(every|any|all) depth[^.]*tasks\.md/i);
    });

    test('S-1.3: specify writes quickstart.md only for visible behavior and data-model.md only for data changes', () => {
      const specify = rendered('specify');
      expect(specify).toMatch(/quickstart\.md[^\n]*(only|when)[^\n]*(visible|user or PO can see)/i);
      expect(specify).toMatch(/data-model\.md[^\n]*only when data changes/i);
    });

    test('S-1.3/C1: neither file is conditioned on the number of tasks, requirements or scenarios', () => {
      const specify = rendered('specify');
      for (const line of specify.split('\n').filter((l) => /quickstart\.md|data-model\.md/.test(l)))
        expect(line).not.toMatch(/\b\d+ (tasks|requirements|scenarios)|number of|fewer|more than/i);
      expect(specify).not.toMatch(/lite[^\n]*writes? (the )?tasks|tasks inline/i);
    });

    test('AC-1: a story rendered from the template starts at layout version 2', () => {
      const tpl = readFileSync(join(process.cwd(), 'core/templates/shared/spec/story.md'), 'utf8');
      expect(frontmatterOf(tpl).data.schema_version).toBe(2);
    });
  });
});
