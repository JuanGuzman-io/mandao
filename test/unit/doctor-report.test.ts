import { describe, expect, test } from 'vitest';
import { doctorReport } from '../../src/cli/output.js';
import type { Finding } from '../../src/engine/doctor.js';

describe('doctorReport (MDO-0004, D1)', () => {
  test('S-1.1: four findings keep their order; only the warn entry has fix; counts are 1/1/1/1 and schema_version is 1', () => {
    const findings: Finding[] = [
      { level: 'ok', message: 'Node 22.18.0' },
      { level: 'info', message: 'no .mandao/sources.yml: nothing to sync' },
      { level: 'warn', message: 'lock was written by an older Mandao', fix: 'run mandao sync' },
      { level: 'error', message: 'config is invalid' },
    ];
    const report = doctorReport(findings);
    expect(report.schema_version).toBe(1);
    expect(report.counts).toEqual({ error: 1, warn: 1, info: 1, ok: 1 });
    expect(report.findings).toEqual(findings);
    expect(report.findings.map((f) => f.level)).toEqual(['ok', 'info', 'warn', 'error']);
    expect(report.findings.map((f) => 'fix' in f)).toEqual([false, false, true, false]);
  });

  test('S-1.2: only ok findings give counts error 0, warn 0, info 0, ok n', () => {
    const report = doctorReport([
      { level: 'ok', message: 'a' },
      { level: 'ok', message: 'b' },
      { level: 'ok', message: 'c' },
    ]);
    expect(report.counts).toEqual({ error: 0, warn: 0, info: 0, ok: 3 });
    expect(report.findings).toHaveLength(3);
  });

  test('NFR-2: top-level keys are exactly schema_version, counts, findings; finding keys are a subset of level, message, fix; counts keys are exactly error, warn, info, ok', () => {
    const report = doctorReport([
      { level: 'warn', message: 'w', fix: 'f' },
      { level: 'ok', message: 'o' },
    ]);
    expect(Object.keys(report).sort()).toEqual(['counts', 'findings', 'schema_version']);
    expect(Object.keys(report.counts).sort()).toEqual(['error', 'info', 'ok', 'warn']);
    for (const f of report.findings) {
      for (const key of Object.keys(f)) expect(['level', 'message', 'fix']).toContain(key);
    }
    // the report must survive JSON round-trip unchanged (what CI reads)
    expect(JSON.parse(JSON.stringify(report))).toEqual(report);
    // empty input still has all four count keys
    expect(doctorReport([]).counts).toEqual({ error: 0, warn: 0, info: 0, ok: 0 });
  });
});
