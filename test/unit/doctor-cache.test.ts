import { mkdirSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Finding } from '../../src/engine/doctor.js';
import { cacheFindings } from '../../src/engine/doctor-cache.js';
import type { Probe } from '../../src/engine/tools.js';
import { makeTree, removeTrees } from '../helpers.js';

// MDO-0008 T1 (AC-1): doctor reports the Claude Code prompt-cache TTL and its source (D1).
// ASSUMPTION: cacheFindings(root, home, env, probe) is the unit under test, pure over its inputs.

let root: string;
let home: string;
beforeEach(() => {
  root = makeTree({});
  home = makeTree({});
});
afterEach(removeTrees);

const current: Probe = () => '2.1.250 (Claude Code)';
const put = (file: string, content: string) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
};
const user = (obj: object) => put(join(home, '.claude/settings.json'), JSON.stringify(obj));
const project = (obj: object) => put(join(root, '.claude/settings.json'), JSON.stringify(obj));
const local = (obj: object) => put(join(root, '.claude/settings.local.json'), JSON.stringify(obj));
const run = (env: Record<string, string> = {}, probe: Probe = current): Finding[] => cacheFindings(root, home, env, probe);
const info = (fs: Finding[]) => fs.find((f) => f.level === 'info');
const text = (f?: Finding) => `${f?.message ?? ''}\n${f?.fix ?? ''}`;

describe('doctor reports the prompt-cache TTL (AC-1)', () => {
  test('S-1.1: nothing set gives an info with both defaults and the ADR 0036 fix', () => {
    const fs = run();
    expect(fs.filter((f) => f.level !== 'info')).toEqual([]);
    const f = info(fs);
    expect(f).toBeDefined();
    expect(f?.message).toMatch(/unset/i);
    expect(f?.message).toMatch(/1h/);
    expect(f?.message).toMatch(/5m/);
    expect(f?.message).toMatch(/subscription/i);
    expect(f?.message).toMatch(/subagents?[^.]*5m/i);
    expect(f?.fix).toBe('ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings');
  });

  test('S-1.2: the highest file wins for a key and the environment wins for a variable; nothing is touched (C1)', () => {
    const userFile = user({ promptCacheTtl: '1h' });
    const localFile = local({ promptCacheTtl: '5m' });
    const old = new Date('2020-01-01T00:00:00Z');
    for (const f of [userFile, localFile]) utimesSync(f, old, old);
    const before = [userFile, localFile].map((f) => [readFileSync(f, 'utf8'), statSync(f).mtimeMs]);
    const fs = run({ CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL: '1h' });
    const msg = info(fs)?.message ?? '';
    expect(msg).toMatch(/main[^.;]*5m[^.;]*\.claude\/settings\.local\.json/);
    expect(msg).toMatch(/subagents?[^.;]*1h[^.;]*environment/i);
    // S-1.2/C1: content and modification times identical, and no file created
    const after = [userFile, localFile].map((f) => [readFileSync(f, 'utf8'), statSync(f).mtimeMs]);
    expect(after).toEqual(before);
    expect(() => statSync(join(root, '.claude/settings.json'))).toThrow();
  });

  test('S-1.3 and S-1.3/C2: an invalid value warns, is named, and the default stays in effect', () => {
    project({ promptCacheTtl: '10m' });
    const fs = run();
    const warn = fs.find((f) => f.level === 'warn');
    expect(warn).toBeDefined();
    expect(warn?.message).toContain('.claude/settings.json');
    expect(warn?.message).toContain('10m');
    expect(warn?.message).toMatch(/not 5m or 1h/);
    expect(warn?.message).toMatch(/ignored by Claude Code/);
    const main = text(info(fs));
    expect(main).toMatch(/default/i);
    expect(main).not.toMatch(/main[^.;]*10m/i);
    expect(main).not.toMatch(/10m[^.;]*in effect/i);
  });

  test('S-1.3/C2: an ignored value goes on to the next step instead of winning', () => {
    project({ promptCacheTtl: '10m' });
    const fs = run({ ENABLE_PROMPT_CACHING_1H: '1' });
    expect(info(fs)?.message).toMatch(/main[^.;]*1h[^.;]*ENABLE_PROMPT_CACHING_1H/);
    expect(info(fs)?.message ?? '').not.toMatch(/main[^.;]*10m/i);
  });

  test('S-1.4: no cache-TTL finding without Claude Code is a wiring concern, so the unit never runs for it', () => {
    // The harness gate lives in runDoctor: it must call cacheFindings only when `claude` is a harness.
    // Proven here by the exported guard, which returns nothing when claude is absent.
    expect(cacheFindings(root, home, {}, current, ['codex'])).toEqual([]);
    expect(cacheFindings(root, home, {}, current, ['claude']).length).toBeGreaterThan(0);
  });

  test('S-1.5: FORCE_PROMPT_CACHING_5M beats the key for both TTLs', () => {
    user({ promptCacheTtl: '1h' });
    const msg = info(run({ FORCE_PROMPT_CACHING_5M: '1' }))?.message ?? '';
    expect(msg).toMatch(/main[^.;]*5m[^.;]*FORCE_PROMPT_CACHING_5M/);
    expect(msg).toMatch(/subagents?[^.;]*5m[^.;]*FORCE_PROMPT_CACHING_5M/i);
  });

  test('S-1.5: ENABLE_PROMPT_CACHING_1H gives main 1h while the subagent key stays 5m', () => {
    user({ subagentPromptCacheTtl: '5m' });
    const msg = info(run({ ENABLE_PROMPT_CACHING_1H: '1' }))?.message ?? '';
    expect(msg).toMatch(/main[^.;]*1h[^.;]*ENABLE_PROMPT_CACHING_1H/);
    expect(msg).toMatch(/subagents?[^.;]*5m[^.;]*subagentPromptCacheTtl/i);
  });

  test('S-1.6: an agent whose frontmatter sets experimental.cacheTtl is named with its value', () => {
    put(join(root, '.claude/agents/scribe.md'), '---\nname: scribe\nexperimental:\n  cacheTtl: 1h\n---\nBody\n');
    put(join(root, '.claude/agents/plain.md'), '---\nname: plain\n---\nBody\n');
    const msg = info(run())?.message ?? '';
    expect(msg).toContain('scribe');
    expect(msg).toMatch(/scribe[^.;]*1h/);
    expect(msg).toContain('2.1.248');
    expect(msg).not.toContain('plain');
  });

  test('S-1.6: an agent override ranks ahead of ENABLE_PROMPT_CACHING_1H (D1 step 4 before 5)', () => {
    put(join(root, '.claude/agents/scribe.md'), '---\nname: scribe\nexperimental:\n  cacheTtl: 5m\n---\nBody\n');
    const msg = info(run({ ENABLE_PROMPT_CACHING_1H: '1' }))?.message ?? '';
    expect(msg).toMatch(/subagents?[^.;]*1h[^.;]*ENABLE_PROMPT_CACHING_1H/i);
    expect(msg).toMatch(/agent scribe[^;]*5m[^;]*ahead of ENABLE_PROMPT_CACHING_1H/);
  });

  test('S-1.6: an agent override is not listed when the subagent key wins (steps 1-3)', () => {
    user({ subagentPromptCacheTtl: '5m' });
    put(join(root, '.claude/agents/scribe.md'), '---\nname: scribe\nexperimental:\n  cacheTtl: 1h\n---\nBody\n');
    expect(info(run())?.message ?? '').not.toContain('scribe');
  });

  test('S-1.6 and AC-1/C2: an invalid agent cacheTtl warns, names the agent, and is not an override', () => {
    put(join(root, '.claude/agents/scribe.md'), '---\nname: scribe\nexperimental:\n  cacheTtl: 10m\n---\nBody\n');
    const fs = run();
    const warn = fs.find((f) => f.level === 'warn');
    expect(warn?.message).toContain('scribe');
    expect(warn?.message).toContain('10m');
    expect(warn?.message).toMatch(/not 5m or 1h/);
    expect(warn?.message).toMatch(/ignored by Claude Code/);
    const msg = info(fs)?.message ?? '';
    expect(msg).not.toMatch(/overrides the subagent TTL/);
    expect(msg).not.toContain('10m');
  });

  test('S-1.6: a .claude/agents path that is a file is skipped, not thrown', () => {
    put(join(root, '.claude/agents'), 'not a directory');
    expect(() => run()).not.toThrow();
    expect(info(run())?.message ?? '').not.toMatch(/overrides the subagent TTL/);
  });

  test('S-1.7: an old Claude Code ignores the TTL settings, so the default is reported', () => {
    local({ promptCacheTtl: '1h' });
    const f = info(run({}, () => '2.1.200 (Claude Code)'));
    const msg = text(f);
    expect(msg).toContain('2.1.242');
    expect(msg).toMatch(/ignores/i);
    expect(msg).toMatch(/default/i);
    expect(f?.message ?? '').not.toMatch(/main[^.;]*1h[^.;]*settings\.local/);
  });

  test('S-1.7: with no version available it says the version was not checked', () => {
    expect(text(info(run({}, () => undefined)))).toMatch(/version[^.;]*not checked/i);
  });
});
