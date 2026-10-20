import { chmodSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { agentIdentity, identityCell, identityNotes } from '../../src/scripts/identity.js';
import { crossReviewers, parseVerdict, reviewArgv, reviewerInstructions, runReview } from '../../src/scripts/review.js';
import { makeTree } from '../helpers.js';

const agents = () =>
  realpathSync(
    makeTree({
      '.claude/agents/mandao-reviewer.md':
        '---\nname: mandao-reviewer\ntools: Read, Grep, Glob\nmodel: claude-opus-5-5\n---\nReview carefully.\n',
      '.codex/agents/mandao-reviewer.toml': `name = "mandao_reviewer"\nmodel = "gpt-6-sol"\nmodel_reasoning_effort = "high"\ndeveloper_instructions = '''\nReview like a Mandao reviewer.\n'''\n`,
    }),
  );

afterEach(() => vi.unstubAllEnvs());

describe('identity from the agent file the harness loads, never from the model (ADR 0021)', () => {
  test('claude and codex agent files, snake_case names, self', () => {
    const root = agents();
    expect(agentIdentity(root, 'mandao-reviewer', 'claude')).toEqual({
      harness: 'claude',
      agent: 'mandao-reviewer',
      model: 'claude-opus-5-5',
      source: 'agent-file',
    });
    const codex = agentIdentity(root, 'mandao_reviewer@codex', 'claude');
    expect(codex).toMatchObject({ harness: 'codex', model: 'gpt-6-sol', effort: 'high' });
    expect(identityCell(codex)).toBe('gpt-6-sol (high)');
    expect(agentIdentity(root, 'self', 'codex')).toMatchObject({ model: 'self', source: 'self' });
    expect(() => agentIdentity(root, 'mandao-tester', 'claude')).toThrow(/\.claude\/agents\/mandao-tester\.md does not exist/);
  });

  test('a claim that differs from the invoked agent is flagged; a self review is reduced independence', () => {
    const root = agents();
    const id = agentIdentity(root, 'mandao_reviewer@codex', 'codex');
    expect(identityNotes('reviewer', id, 'gpt-6-sol')).toEqual([]);
    expect(identityNotes('reviewer', id, 'gpt-6.1-sol')).toEqual(['identity mismatch: reviewer claimed gpt-6.1-sol, invoked gpt-6-sol']);
    expect(identityNotes('reviewer', agentIdentity(root, 'self', 'codex'), 'gpt-6-sol')).toEqual([
      'reduced independence (reviewed in the Leader context)',
    ]);
  });
});

describe('review in another harness as a read-only process', () => {
  test('command lines are read-only by construction', () => {
    const codex = reviewArgv('codex', '/r', { model: 'gpt-6-sol', effort: 'high', source: 'recommendation' });
    expect(codex.args).toEqual(expect.arrayContaining(['-s', 'read-only', '-m', 'gpt-6-sol', '-c', 'model_reasoning_effort=high']));
    const claude = reviewArgv('claude', '/r', { model: 'claude-opus-5-5', source: 'recommendation' });
    expect(claude.args.join(' ')).toContain('--tools Read,Grep,Glob --disallowedTools mcp__* --permission-mode plan');
  });

  test('the verdict is the last VERDICT line, emphasis allowed', () => {
    expect(parseVerdict('VERDICT: FAIL\n…\n**VERDICT: PASS**')).toBe('PASS');
    expect(parseVerdict('- **Verdict:** fail')).toBe('FAIL');
    expect(parseVerdict('looks fine to me')).toBeUndefined();
  });

  test('persona instructions come from the generated agent of that harness', () => {
    const root = agents();
    expect(reviewerInstructions(root, 'codex')).toBe('Review like a Mandao reviewer.');
    expect(reviewerInstructions(root, 'claude')).toBe('Review carefully.');
  });

  test('the recorded identity is what Mandao launched, whatever the output claims', () => {
    const root = agents();
    const bin = realpathSync(
      makeTree({ codex: '#!/bin/sh\ncat >/dev/null\necho "I am gpt-9-ultra"\necho "args: $*"\necho "VERDICT: PASS"\n' }),
    );
    chmodSync(join(bin, 'codex'), 0o755);
    vi.stubEnv('PATH', `${bin}:${process.env.PATH}`);
    const r = runReview('codex', root, { model: 'gpt-6-sol', effort: 'high', source: 'recommendation' }, 'prompt');
    expect(r).toMatchObject({
      verdict: 'PASS',
      exitCode: 0,
      identity: { harness: 'codex', model: 'gpt-6-sol', effort: 'high', source: 'process' },
    });
    expect(r.output).toContain('-s read-only -m gpt-6-sol');
  });

  test('cross reviewers: other installed harnesses with their CLI available', () => {
    const reviewer = { model: 'gpt-6-sol', source: 'recommendation' as const };
    const models = {
      codex: { harness: 'codex' as const, mode: 'routed' as const, reviewer, implementer: {}, tiers: { 'gpt-6-sol': 'strong' as const } },
    };
    expect(crossReviewers(['claude', 'codex', 'copilot'], 'claude', models, () => true)).toEqual([
      { harness: 'codex', reviewer, tier: 'strong' },
    ]);
    expect(crossReviewers(['claude', 'codex'], 'claude', models, () => false)).toEqual([]);
    expect(crossReviewers(['claude', 'codex'], 'codex', models, () => true)).toEqual([]);
  });
});
