// mandao-scans: docs/ — reads docs/cli.md by path.
import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, test } from 'vitest';
import { cliReference, DEPRECATED_COMMANDS, MAINTAINER_COMMANDS, USER_COMMANDS } from '../../src/cli/cli-reference.js';
import { buildProgram } from '../../src/cli/program.js';

const FILE = 'docs/cli.md';
const BLOCK = /<!-- mandao:cli-index:begin[\s\S]*?<!-- mandao:cli-index:end -->/;

describe('docs/cli.md command index (phase 16)', () => {
  test('is the index derived from the CLI: every command and flag documented, each classified', () => {
    const generated = cliReference(buildProgram());
    const doc = readFileSync(FILE, 'utf8');
    // `npm run docs:cli` sets MANDAO_WRITE_CLI_DOCS to rewrite the block instead of comparing it.
    if (process.env.MANDAO_WRITE_CLI_DOCS) writeFileSync(FILE, BLOCK.test(doc) ? doc.replace(BLOCK, generated) : `${doc}\n${generated}\n`);
    else expect(doc.match(BLOCK)?.[0], 'docs/cli.md is out of date: run `npm run docs:cli`').toBe(generated);
  });

  test('every classified command exists in the CLI', () => {
    const generated = cliReference(buildProgram());
    for (const path of [...USER_COMMANDS.map((c) => c.path), ...MAINTAINER_COMMANDS, ...Object.keys(DEPRECATED_COMMANDS)])
      expect(generated, path).toContain(`\`mandao ${path}`);
  });
});
