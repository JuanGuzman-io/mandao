import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { CURRENT_LAYOUT_VERSION, LAYOUT_VERSIONS } from '../../src/spec/layout.js';

const story = readFileSync(join(import.meta.dirname, '../../core/templates/shared/spec/story.md'), 'utf8');

describe('the layout version a new spec starts at (AC-3, design D3)', () => {
  test('the story template names CURRENT_LAYOUT_VERSION, the last known layout version', () => {
    const declared = Number(/^schema_version:\s*(\d+)/m.exec(story)?.[1]);
    expect(declared).toBe(CURRENT_LAYOUT_VERSION);
    expect(CURRENT_LAYOUT_VERSION).toBe(LAYOUT_VERSIONS[LAYOUT_VERSIONS.length - 1]);
  });
});
