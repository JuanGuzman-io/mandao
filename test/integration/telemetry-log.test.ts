import { describe, expect, test, vi } from 'vitest';
import { buildProgram } from '../../src/cli/program.js';
import { appendTelemetryEvent, measureGate, readTelemetryEvents } from '../../src/scripts/telemetry.js';
import { summarizeTelemetry } from '../../src/spec/telemetry.js';
import { makeTree } from '../helpers.js';

describe('script-owned telemetry log', () => {
  test('appends events to execution.md while preserving the task table', () => {
    const root = makeTree({
      'spec/story.md': '---\nid: MDO-0001\nschema_version: 2\n---\n',
      'spec/_log/execution.md':
        '# Execution\n\n## Log\n\n| Date | Task | Attempt | Tier | Harness | Implementer | Reviewer | Verdict | Notes |\n|---|---|---|---|---|---|---|---|---|\n| 2026-01-01 | T1 | 1 | standard | claude | a | b | PASS | done |\n',
    });
    const dir = `${root}/spec`;
    appendTelemetryEvent(dir, 'MDO-1', {
      id: 'run-1',
      run: 'run-1',
      type: 'command_start',
      command: 'implement',
      at: '2026-01-01T00:00:00.000Z',
    });
    expect(() =>
      appendTelemetryEvent(dir, 'MDO-1', {
        id: 'run-1',
        run: 'run-1',
        type: 'command_start',
        command: 'verify',
        at: '2026-01-01T00:00:02.000Z',
      }),
    ).toThrow('already exists with different data');
    appendTelemetryEvent(dir, 'MDO-1', {
      id: 'run-1',
      run: 'run-1',
      type: 'command_start',
      command: 'implement',
      at: '2026-01-01T00:00:01.000Z',
    });
    appendTelemetryEvent(dir, 'MDO-1', {
      id: 'run-1',
      run: 'run-1',
      type: 'command_end',
      command: 'implement',
      at: '2026-01-01T00:00:10.000Z',
    });
    expect(readTelemetryEvents(dir).map((e) => e.type)).toEqual(['command_start', 'command_end']);
  });

  test('run event stamps command and classified question intervals through the CLI', async () => {
    const root = makeTree({
      '.mandao/config.yml': 'schema_version: 1\nworkspace: single\nprojects:\n  - name: shop\n    path: .\nharnesses: [claude]\n',
      'specs/MDO-0001-sample/story.md': '---\nid: MDO-0001\nschema_version: 2\n---\n',
    });
    const out: string[] = [];
    const log = vi.spyOn(console, 'log').mockImplementation((line: string) => void out.push(line));
    try {
      await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'event', 'MDO-0001', 'command_start', '--command', 'specify']);
      const started = JSON.parse(out.pop()!) as { runId: string };
      await buildProgram(() => root).parseAsync([
        'node',
        'mandao',
        'run',
        'event',
        'MDO-0001',
        'asked',
        '--run',
        started.runId,
        '--command',
        'specify',
        '--question',
        'product',
      ]);
      const asked = JSON.parse(out.pop()!) as { id: string };
      await buildProgram(() => root).parseAsync([
        'node',
        'mandao',
        'run',
        'event',
        'MDO-0001',
        'answered',
        '--run',
        started.runId,
        '--id',
        asked.id,
        '--command',
        'specify',
        '--question',
        'product',
      ]);
      await buildProgram(() => root).parseAsync([
        'node',
        'mandao',
        'run',
        'event',
        'MDO-0001',
        'command_end',
        '--run',
        started.runId,
        '--command',
        'specify',
      ]);
    } finally {
      log.mockRestore();
    }
    const events = readTelemetryEvents(`${root}/specs/MDO-0001-sample`);
    expect(events.map((event) => event.type)).toEqual(['command_start', 'asked', 'answered', 'command_end']);
    expect(events[1]).toMatchObject({ question: 'product', command: 'specify' });
    expect(summarizeTelemetry(events)).toMatchObject([{ command: 'specify', runs: 1, incomplete: 0 }]);
  });

  test('closes a gate span when its runner throws', async () => {
    const root = makeTree({ 'spec/story.md': '---\nid: MDO-0001\nschema_version: 2\n---\n' });
    const dir = `${root}/spec`;
    await expect(
      measureGate(dir, 'MDO-0001', 'test', async () => {
        throw new Error('runner failed');
      }),
    ).rejects.toThrow('runner failed');
    expect(readTelemetryEvents(dir).map((event) => event.type)).toEqual(['gate_start', 'gate_end']);
  });

  test('creates the quick telemetry log at command start before quick has another log', async () => {
    const root = makeTree({
      '.mandao/config.yml': 'schema_version: 1\nworkspace: single\nprojects:\n  - name: shop\n    path: .\nharnesses: [claude]\n',
    });
    const out: string[] = [];
    const log = vi.spyOn(console, 'log').mockImplementation((line: string) => void out.push(line));
    try {
      await buildProgram(() => root).parseAsync(['node', 'mandao', 'run', 'event', 'quick', 'command_start', '--command', 'quick']);
    } finally {
      log.mockRestore();
    }
    expect(readTelemetryEvents(`${root}/specs/quick`).map((event) => event.type)).toEqual(['command_start']);
  });
});
