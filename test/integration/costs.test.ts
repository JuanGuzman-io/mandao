import { mkdirSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { writeYaml } from '../../src/engine/files.js';
import { readRecommendations } from '../../src/models/load.js';
import { claudeSessionCost, usageCost } from '../../src/scripts/session-cost.js';
import { costKaizen, type ExecutionRow, summarizeCosts, type Task } from '../../src/spec/index.js';
import { makeTree } from '../helpers.js';

const prices = readRecommendations().harnesses.claude!.prices!.per_mtok;
let out: string[];

const line = (id: string, model: string, usage: Record<string, unknown>) => JSON.stringify({ message: { id, model, usage } });

/** A Claude Code session: the main transcript and one Reviewer subagent, as Claude Code lays them out. */
function session(home: string, id: string, extra = '') {
  const dir = join(home, 'projects', '-tmp-proj');
  mkdirSync(join(dir, id, 'subagents'), { recursive: true });
  writeFileSync(
    join(dir, `${id}.jsonl`),
    [
      // A streamed response is written twice; the second line has the final output tokens.
      line('m1', 'claude-opus-5-5', { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 1_000_000 }),
      line('m1', 'claude-opus-5-5', { input_tokens: 10, output_tokens: 1000, cache_read_input_tokens: 1_000_000 }),
      line('m2', 'gpt-x', { input_tokens: 1, output_tokens: 1 }),
      extra,
    ].join('\n'),
  );
  writeFileSync(join(dir, id, 'subagents', 'agent-a.jsonl'), line('r1', 'claude-sonnet-5-5', { output_tokens: 100_000 }));
  writeFileSync(join(dir, id, 'subagents', 'agent-a.meta.json'), JSON.stringify({ agentType: 'mandao-reviewer' }));
}

describe('cost from the session record and the official prices (ADR 0036)', () => {
  test('one response priced like the provider bills it: input, 5m and 1h writes, reads, output', () => {
    // MDO-0006 implement, Opus: Claude Code reported 1.1481824 USD for these tokens.
    const opus = {
      input_tokens: 56,
      output_tokens: 16307,
      cache_read_input_tokens: 1050887,
      cache_creation_input_tokens: 92354,
      cache_creation: { ephemeral_1h_input_tokens: 49957 },
    };
    expect(usageCost(opus, prices['claude-opus-5-5']!)).toBeCloseTo(1.1481824, 6);
    // Haiku over 100K prompt tokens takes the long-context prices.
    expect(usageCost({ input_tokens: 200_000 }, prices['claude-haiku-5-5']!)).toBeCloseTo(0.1, 6);
  });

  test('a session splits by role (main session, each subagent type) and keeps the last line of a streamed response', () => {
    const home = realpathSync(makeTree({}));
    session(home, 's1');
    const c = claudeSessionCost(join(home, 'projects/-tmp-proj/s1.jsonl'), 'leader', prices);
    expect(c.roles).toEqual({ leader: 0.22004, 'mandao-reviewer': 1 });
    expect(c.unpriced).toEqual(['gpt-x']);
  });
});

describe('mandao run cost', () => {
  let root: string;
  let home: string;
  beforeEach(() => {
    root = realpathSync(makeTree({ 'specs/MDO-0001-x/story.md': '---\nschema_version: 1\nid: MDO-0001\n---\n# X\n' }));
    home = realpathSync(makeTree({}));
    vi.stubEnv('CLAUDE_CONFIG_DIR', home);
    writeYaml(join(root, '.mandao/config.yml'), {
      schema_version: 1,
      workspace: 'single',
      projects: [{ name: 'a', path: '.' }],
      harnesses: ['claude'],
      budget: { per_spec: 1.5 },
    });
    out = [];
    vi.spyOn(console, 'log').mockImplementation((s: string) => void out.push(s));
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });
  const cost = async (...args: string[]) => {
    await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'cost', ...args]);
    return JSON.parse(out.at(-1)!);
  };

  test('records what the session spent since its last record, per role, and warns at 80% of the budget', async () => {
    session(home, 's1');
    const first = await cost('MDO-0001', '--record', '--command', 'implement', '--session', 's1');
    expect(first).toMatchObject({
      recorded: { usd: 1.22, roles: { leader: 0.22, 'mandao-reviewer': 1 } },
      total: 1.22,
      status: 'warn',
      usedPct: 81,
    });
    // More work in the same session: only the new response counts.
    session(home, 's1', line('m3', 'claude-sonnet-5-5', { output_tokens: 50_000 }));
    const second = await cost('MDO-0001', '--record', '--command', 'verify', '--role', 'verify', '--session', 's1');
    expect(second).toMatchObject({
      recorded: { usd: 0.5, roles: { verify: 0.5 } },
      byCommand: { implement: 1.22, verify: 0.5 },
      status: 'over',
    });
    expect(readdirSync(join(root, 'specs/MDO-0001-x/_log'))).toContain('costs.yml');
    expect(readFileSync(join(root, 'specs/MDO-0001-x/_log/costs.yml'), 'utf8')).toContain('source: claude-code');
  });

  test('other harnesses record by hand; quick changes have their own log', async () => {
    expect(await cost('quick', '--record', '--command', 'quick', '--harness', 'codex', '--usd', '0.3')).toMatchObject({
      total: 0.3,
      byRole: { quick: 0.3 },
    });
    expect(readFileSync(join(root, 'specs/quick/_log/costs.yml'), 'utf8')).toContain('source: manual');
  });
});

describe('Kaizen on cost', () => {
  const t = (id: string, tier: 'fast' | 'standard') => ({ id, tier, tests: { unit: [], e2e: [] } }) as unknown as Task;
  const row = (task: string, tier: string, verdict: 'PASS' | 'FAIL'): ExecutionRow => ({
    date: 'd',
    task,
    attempt: 1,
    tier,
    harness: 'claude',
    implementer: 'x',
    reviewer: 'y',
    verdict,
    notes: '',
  });
  const spend = (leader: number, other: number) => [
    {
      at: 'x',
      command: 'implement',
      harness: 'claude',
      usd: leader + other,
      roles: { leader, 'mandao-reviewer': other },
      models: {},
      source: 'claude-code' as const,
    },
  ];

  test('the budget status follows 80% and 100%', () => {
    expect(summarizeCosts(spend(0.5, 0.2), 1).status).toBe('ok');
    expect(summarizeCosts(spend(0.6, 0.2), 1).status).toBe('warn');
    expect(summarizeCosts(spend(0.8, 0.2), 1).status).toBe('over');
    expect(summarizeCosts(spend(0.8, 0.2)).status).toBe('no-budget');
  });

  test('recommends with data and an estimated saving, never below the sample minimum', () => {
    const specs = [1, 2, 3].map((i) => ({
      spec: `S${i}`,
      costs: spend(1, 0.5),
      tasks: [t(`T1`, 'fast'), t('T2', 'fast')],
      rows: [row('T1', 'fast', 'PASS'), row('T2', 'fast', 'PASS')],
    }));
    const k = costKaizen(specs, { profile: 'balanced', model: 'claude-sonnet-5-5', priceRatio: 0.5 });
    expect(k).toMatchObject({ n: 3, avgPerSpec: 1.5, leaderShare: 0.67, firstPassByTier: { fast: { tasks: 6, rate: 1 } } });
    expect(k.recommendations[0]).toBe(
      'The Leader is 67% of implement (3 specs). The balanced profile runs it on claude-sonnet-5-5: about 0.5 USD less per spec. To apply: mandao models profile balanced.',
    );
    expect(k.recommendations[1]).toMatch(/^fast tasks pass review the first time 100% of the time \(6 tasks\)/);
    expect(
      costKaizen(specs.slice(0, 2), { profile: 'balanced', model: 'm', priceRatio: 0.5 }).recommendations.some((r) =>
        r.includes('profile'),
      ),
    ).toBe(false);
  });
});
