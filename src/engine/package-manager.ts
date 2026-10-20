export type PackageManager = 'npm' | 'pnpm' | 'bun';

/** The package manager that launched Mandao, from npm_config_user_agent (`pnpm/9.1.0 npm/? node/v22…`). */
export function detectPackageManager(userAgent = process.env.npm_config_user_agent ?? ''): PackageManager {
  if (userAgent.startsWith('pnpm/')) return 'pnpm';
  if (userAgent.startsWith('bun/')) return 'bun';
  return 'npm';
}

/** One-off runner for the latest Mandao with the same package manager. */
export function latestRunner(pm: PackageManager): string {
  return { npm: 'npx mandao@latest', pnpm: 'pnpm dlx mandao@latest', bun: 'bunx mandao@latest' }[pm];
}
