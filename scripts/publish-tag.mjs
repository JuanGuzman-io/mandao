// Stages the package version in package.json on npm with an explicit dist-tag (`npm stage publish`): the
// trusted publisher may only stage, and the maintainer approves the staged version with 2FA on npmjs.com
// (Staged Packages) or `npm stage approve <id>`. Once approved, a rerun tags git and moves `latest`.
// Changesets only versions; it never chooses the tag. Rule, from the version and the versions already on the registry:
//   prerelease, no stable published yet -> `--tag beta`, then `latest` also points at it (beta period)
//   prerelease, a stable exists         -> `--tag beta` only; `latest` is untouched
//   stable                              -> `--tag latest`
// Extra arguments go to `npm publish`; the hand-run first publish needs `--provenance=false`.
// Provenance and trusted publishing come from publishConfig.provenance and the workflow's OIDC.
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import semver from 'semver';

const isPrerelease = (version) => (semver.prerelease(version)?.length ?? 0) > 0;

/**
 * Pure decision: the dist-tag a publish of `version` uses, the extra tags that should point at it,
 * and whether it still needs publishing, given the versions already on the registry.
 */
export function decidePublish(version, publishedVersions) {
  const publish = !publishedVersions.includes(version);
  if (!isPrerelease(version)) return { publish, tag: 'latest', alsoTag: [] };
  const stableExists = publishedVersions.some((published) => !isPrerelease(published));
  return { publish, tag: 'beta', alsoTag: stableExists ? [] : ['latest'] };
}

/** Pure: the extra tags not yet pointing at `version`, given the registry's current dist-tags. */
export function missingTags(plan, version, distTags) {
  return plan.alsoTag.filter((tag) => distTags[tag] !== version);
}

/** Pure: the `npm stage publish` arguments; extra arguments (e.g. `--provenance=false`) pass through last. */
export function publishArgs(plan, extra = []) {
  const refused = extra.filter((arg) => arg !== '--provenance=false' && !/^--otp=\d+$/.test(arg));
  if (refused.length) throw new Error(`refused ${refused.join(' ')}: only --provenance=false and --otp=<code> may be passed; the tag comes from the rule`);
  return ['stage', 'publish', '--tag', plan.tag, ...extra];
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmRun = (args, options = {}) =>
  execFileSync(npm, args, { encoding: 'utf8', shell: process.platform === 'win32', ...options });

/** Versions on the registry; a 404 (package never published) means none. */
function registryVersions(name) {
  try {
    const out = npmRun(['view', name, 'versions', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] });
    const parsed = JSON.parse(out);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    if (/E404|404 Not Found/.test(`${error.stderr ?? ''}${error.stdout ?? ''}`)) return [];
    throw error;
  }
}

const registryDistTags = (name) => JSON.parse(npmRun(['view', name, 'dist-tags', '--json'], { stdio: ['ignore', 'pipe', 'pipe'] }));

function main(extraArgs) {
  const pkg = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'package.json'), 'utf8'));
  const { name, version } = pkg;
  const plan = decidePublish(version, registryVersions(name));
  let pending = plan.alsoTag;
  if (plan.publish) {
    // Staged, not published: no git tag and no dist-tag until the maintainer approves it.
    console.log(`staging ${name}@${version} with --tag ${plan.tag}`);
    npmRun(publishArgs(plan, extraArgs), { stdio: 'inherit' });
    console.log(
      `${name}@${version} is staged. Approve it with 2FA on npmjs.com (package → Staged Packages) or \`npm stage approve <id>\` (\`npm stage list ${name}\`), then run the Release workflow on main again to tag it.`,
    );
    return;
  } else {
    // A rerun after a failed dist-tag add: publishing is done; retry only the tags still missing.
    pending = missingTags(plan, version, registryDistTags(name));
    console.log(`${name}@${version} is already published`);
  }
  // Local git tags and the `New tag:` line (read by changesets/action to push tags and create the
  // GitHub release) come before the dist-tag step. If that step fails the script exits 1, so the
  // workflow run fails before the action pushes the tags or creates the release; after the manual
  // dist-tag, a rerun finds the version published and the tags set, then the action finishes.
  // git-tag's own output is dropped so the line is printed once.
  npmRun(['exec', '--no', '--', 'changeset', 'git-tag'], { stdio: ['ignore', 'pipe', 'inherit'] });
  console.log(`New tag: ${name}@${version}`);
  const failed = [];
  for (const tag of pending) {
    try {
      npmRun(['dist-tag', 'add', `${name}@${version}`, tag], { stdio: 'inherit' });
    } catch {
      failed.push(tag);
    }
  }
  if (failed.length > 0) {
    // Trusted publishing (OIDC) may only authorize publish, not dist-tag changes.
    const commands = failed.map((tag) => `npm dist-tag add ${name}@${version} ${tag}`).join('; ');
    console.error(`could not set dist-tag(s) ${failed.join(', ')}; run by hand: ${commands}`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) main(process.argv.slice(2));
