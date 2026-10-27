import { describe, expect, test } from 'vitest';
import { decidePublish, missingTags, publishArgs } from '../../scripts/publish-tag.mjs';

describe('npm dist-tag decision', () => {
  test('first beta with nothing published: beta, and latest follows it', () => {
    expect(decidePublish('0.1.0-beta.0', [])).toEqual({ publish: true, tag: 'beta', alsoTag: ['latest'] });
  });

  test('later beta with only prereleases published: latest keeps following', () => {
    expect(decidePublish('0.1.0-beta.1', ['0.1.0-beta.0'])).toEqual({ publish: true, tag: 'beta', alsoTag: ['latest'] });
  });

  test('prereleases of another line do not count as a stable', () => {
    expect(decidePublish('0.2.0-beta.0', ['0.1.0-beta.0', '0.1.0-beta.1'])).toMatchObject({ tag: 'beta', alsoTag: ['latest'] });
  });

  test('prerelease when a stable exists: beta only, latest untouched', () => {
    expect(decidePublish('0.2.0-beta.0', ['0.1.0-beta.0', '0.1.0'])).toEqual({ publish: true, tag: 'beta', alsoTag: [] });
  });

  test('a stable older than the prerelease still blocks moving latest', () => {
    expect(decidePublish('1.0.0-beta.0', ['0.9.0'])).toMatchObject({ tag: 'beta', alsoTag: [] });
  });

  test('stable publishes with an explicit latest tag', () => {
    expect(decidePublish('0.1.0', ['0.1.0-beta.0'])).toEqual({ publish: true, tag: 'latest', alsoTag: [] });
    expect(decidePublish('0.1.0', [])).toEqual({ publish: true, tag: 'latest', alsoTag: [] });
  });

  test('an already published version is not published again but keeps its tag rule', () => {
    expect(decidePublish('0.1.0-beta.0', ['0.1.0-beta.0'])).toEqual({ publish: false, tag: 'beta', alsoTag: ['latest'] });
  });

  test('build metadata is not a prerelease', () => {
    expect(decidePublish('1.0.0+build-1', [])).toEqual({ publish: true, tag: 'latest', alsoTag: [] });
    expect(decidePublish('0.2.0-beta.0', ['1.0.0+build-1'])).toMatchObject({ alsoTag: [] });
  });

  test('a rerun retries only the tags that do not point at the version yet', () => {
    const plan = decidePublish('0.1.0-beta.0', ['0.1.0-beta.0']);
    expect(missingTags(plan, '0.1.0-beta.0', { beta: '0.1.0-beta.0' })).toEqual(['latest']);
    expect(missingTags(plan, '0.1.0-beta.0', { beta: '0.1.0-beta.0', latest: '0.1.0-beta.0' })).toEqual([]);
    expect(missingTags(decidePublish('0.2.0-beta.0', ['0.1.0']), '0.2.0-beta.0', {})).toEqual([]);
  });

  test('the version is staged for the maintainer to approve; extra arguments follow the explicit tag', () => {
    const plan = decidePublish('0.1.0-beta.0', []);
    expect(publishArgs(plan)).toEqual(['stage', 'publish', '--tag', 'beta']);
    expect(publishArgs(plan, ['--provenance=false'])).toEqual(['stage', 'publish', '--tag', 'beta', '--provenance=false']);
    expect(publishArgs(plan, ['--otp=123456'])).toEqual(['stage', 'publish', '--tag', 'beta', '--otp=123456']);
    for (const bad of [['--tag', 'latest'], ['--tag=latest'], ['--dry-run'], ['--access=restricted']])
      expect(() => publishArgs(plan, bad)).toThrow(/only --provenance=false and --otp=<code>/);
  });
});
