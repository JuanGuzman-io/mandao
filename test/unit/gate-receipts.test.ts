import { describe, expect, test } from 'vitest';
import { type GateReceiptInputs, gateReceiptFingerprint, reusableGateReceipt } from '../../src/scripts/gate-receipts.js';

const inputs: GateReceiptInputs = {
  codeTree: 'tree-a',
  configuration: 'config-a',
  selectedTests: ['test/a.test.ts'],
  toolVersions: { node: 'v22.0.0', vitest: '5.0.0' },
};

describe('gate receipts', () => {
  test('reuse requires exact code, configuration, selected tests, and tool versions', () => {
    const fingerprint = gateReceiptFingerprint(inputs);
    const receipt = { version: 1, fingerprint, result: { status: 'PASS' }, output: '' };
    expect(reusableGateReceipt(receipt, fingerprint)).toEqual(receipt);
    for (const changed of [
      { ...inputs, codeTree: 'tree-b' },
      { ...inputs, configuration: 'config-b' },
      { ...inputs, selectedTests: ['test/b.test.ts'] },
      { ...inputs, toolVersions: { ...inputs.toolVersions, vitest: '5.0.1' } },
    ]) {
      expect(gateReceiptFingerprint(changed)).not.toBe(fingerprint);
    }
  });

  test('tool key ordering does not change the identity, but malformed or old receipts are rejected', () => {
    const fingerprint = gateReceiptFingerprint(inputs);
    expect(gateReceiptFingerprint({ ...inputs, toolVersions: { vitest: '5.0.0', node: 'v22.0.0' } })).toBe(fingerprint);
    expect(reusableGateReceipt({ version: 0, fingerprint, result: {}, output: '' }, fingerprint)).toBeUndefined();
    expect(reusableGateReceipt({ version: 1, fingerprint: 'stale', result: {}, output: '' }, fingerprint)).toBeUndefined();
  });
});
