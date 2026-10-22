import { describe, expect, test } from 'vitest';
import { verifiedOutput } from '../../scripts/diagrams/verified-output.mjs';

describe('diagram output receipts', () => {
  test('requires a marker and a prior matching hash before skipping Archify', () => {
    expect(verifiedOutput(true, 'sha256:good', 'sha256:good')).toBe(true);
    expect(verifiedOutput(true, undefined, 'sha256:tampered')).toBe(false);
    expect(verifiedOutput(true, 'sha256:good', 'sha256:tampered')).toBe(false);
    expect(verifiedOutput(false, 'sha256:good', 'sha256:good')).toBe(false);
  });
});
