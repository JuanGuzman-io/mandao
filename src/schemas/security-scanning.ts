import { z } from 'zod';

const names = z.array(z.string().trim().min(1)).default([]);
const emptyCoverage = () => ({
  local: [],
  ci: [],
  provider: [],
  declared: { local: [], ci: [], provider: [] },
  unknown: [],
  checked: { local: false, ci: false, provider: false },
});

/** A declared location is kept separate from scanners discovered in project files or provider APIs. */
const scannerCoverage = z
  .object({
    local: names,
    ci: names,
    provider: names,
    declared: z.object({ local: names, ci: names, provider: names }).default({ local: [], ci: [], provider: [] }),
    /** Locations that could not be inspected (for example, GitHub settings without API permission). */
    unknown: names,
    /** Which locations have been inspected; empty arrays alone do not prove `none`. */
    checked: z
      .object({ local: z.boolean().default(false), ci: z.boolean().default(false), provider: z.boolean().default(false) })
      .default({ local: false, ci: false, provider: false }),
  })
  .default(emptyCoverage);

export const securityScanningSchema = z
  .object({ secrets: scannerCoverage, sast: scannerCoverage })
  .default(() => ({ secrets: emptyCoverage(), sast: emptyCoverage() }));

export type SecurityScanning = z.infer<typeof securityScanningSchema>;
export type SecurityScanKind = keyof SecurityScanning;
export type SecurityScanState = 'covered' | 'none' | 'unknown';

/** Unknown evidence takes precedence over an empty, unverified inventory; it is never silently `none`. */
export function securityScanState(coverage: SecurityScanning[SecurityScanKind]): SecurityScanState {
  const hasScanner = [
    coverage.local,
    coverage.ci,
    coverage.provider,
    coverage.declared.local,
    coverage.declared.ci,
    coverage.declared.provider,
  ].some((items) => items.length > 0);
  if (hasScanner) return 'covered';
  if (coverage.unknown.length || !Object.values(coverage.checked).every(Boolean)) return 'unknown';
  return 'none';
}
