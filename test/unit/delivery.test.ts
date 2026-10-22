import { describe, expect, test } from 'vitest';
import { resolveBranching } from '../../src/schemas/branching.js';
import {
  canDeleteMergedBranch,
  manualPullRequestUrl,
  parseRemoteBranches,
  providerForRemote,
  releaseLabel,
} from '../../src/scripts/delivery.js';
import { deliveryTargets, pullRequestBody, resolveDeliveryTarget } from '../../src/spec/delivery.js';

describe('delivery target selection', () => {
  const branching = resolveBranching({ model: 'env-branches' });
  const remote = ['feature', 'test', 'staging', 'main', 'release/next'];

  test('defaults to the worktree base and lists configured alternatives with the mismatch visible', () => {
    const targets = deliveryTargets('feature', branching, remote);
    expect(targets[0]).toMatchObject({ branch: 'feature', default: true, difference: 'worktree/config target is test' });
    expect(targets.map((target) => target.branch)).toEqual(['feature', 'test', 'staging', 'main']);
    expect(targets.find((target) => target.branch === 'test')).toMatchObject({
      default: false,
      difference: 'worktree/config target is feature',
    });
  });

  test('allows choosing another configured branch', () => {
    const targets = deliveryTargets('test', branching, remote);
    expect(resolveDeliveryTarget('staging', targets, remote)).toBe('staging');
  });

  test('allows a typed branch only when it exists on the remote', () => {
    expect(resolveDeliveryTarget('other:release/next', deliveryTargets('test', branching, remote), remote)).toBe('release/next');
    expect(() => resolveDeliveryTarget('other:missing', [], remote)).toThrow(/does not exist on the remote/);
  });

  test('uses the hotfix source as default and preserves configured back-merge branches', () => {
    const hotfix = deliveryTargets('test', resolveBranching({ model: 'gitflow' }), ['main', 'develop'], true);
    expect(hotfix.map((target) => target.branch)).toEqual(['main', 'develop']);
    expect(hotfix[0]).toMatchObject({ branch: 'main', default: true });
  });

  test('does not offer configured branches absent from the remote', () => {
    expect(deliveryTargets('test', branching, ['test']).map((target) => target.branch)).toEqual(['test']);
  });
});

describe('provider-neutral delivery helpers', () => {
  test('parses remote refs and classifies GitHub separately from other providers', () => {
    expect(parseRemoteBranches('abc refs/heads/main\ndef refs/heads/release/1\n')).toEqual(['main', 'release/1']);
    expect(providerForRemote('git@github.com:org/repo.git')).toBe('github');
    expect(providerForRemote('https://gitlab.com/org/repo.git')).toBe('other');
    expect(providerForRemote(undefined)).toBeUndefined();
  });

  test('provides a manual GitHub PR URL but no fabricated URL for another host', () => {
    expect(manualPullRequestUrl('git@github.com:org/repo.git', 'main', 'feat/a')).toContain('/compare/main...feat%2Fa');
    expect(manualPullRequestUrl('https://gitlab.com/org/repo.git', 'main', 'feat/a')).toBeUndefined();
  });

  test('requires a positive ancestry check before deleting a merged branch', () => {
    expect(canDeleteMergedBranch(true)).toBe(true);
    expect(canDeleteMergedBranch(false)).toBe(false);
  });

  test('reports the expected historical release evidence', () => {
    expect(releaseLabel({ target: 'main', pr: '#1', mergeSha: '99451ba12345678' })).toBe('released on main, PR #1, merge 99451ba');
  });

  test('builds a PR body from Outcome, For developers and a link to the spec', () => {
    const body = pullRequestBody(
      '---\nschema_version: 1\nspec: MDO-1\nenvironments: []\npublished: []\napplied: []\n---\n\n## Outcome\n\n- AC-1: met\n\n## For developers\n\nUse the transaction boundary.\n',
      { schema_version: 1, spec: 'MDO-1', environments: [], published: [], applied: [] },
      'specs/MDO-1/',
    );
    expect(body).toContain('- AC-1: met');
    expect(body).toContain('Use the transaction boundary.');
    expect(body).toContain('[MDO-1](specs/MDO-1/)');
  });
});
