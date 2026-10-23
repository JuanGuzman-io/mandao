export interface PublishPlan {
  /** False when this exact version is already on the registry: only missing extra tags remain. */
  publish: boolean;
  /** The dist-tag passed to `npm publish --tag`; always explicit. */
  tag: 'beta' | 'latest';
  /** Extra dist-tags to point at this version after publishing. */
  alsoTag: string[];
}
export function decidePublish(version: string, publishedVersions: string[]): PublishPlan;
export function missingTags(plan: PublishPlan, version: string, distTags: Record<string, string>): string[];
export function publishArgs(plan: PublishPlan, extra?: string[]): string[];
