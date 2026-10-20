import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    passWithNoTests: true,
    setupFiles: ['test/setup.ts'],
    // The makeTree cleanup of MDO-0006 (AC-2/C1) relies on hooks running serially (`stack`), never in parallel.
    sequence: { hooks: 'stack' },
  },
});
