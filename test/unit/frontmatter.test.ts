import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';
import { agentWithoutShell } from '../../src/cli/hook.js';
import { parseFrontmatter } from '../../src/engine/frontmatter.js';
import { agentIdentity } from '../../src/scripts/identity.js';
import { makeTree } from '../helpers.js';

// gray-matter evals `---js` blocks inside its own CommonJS module, where `require` exists: this payload
// would write a file if it ran.
const payload = (marker: string, fence = 'js') =>
  `---${fence}\n(require('fs').writeFileSync(${JSON.stringify(marker)}, 'ran'), { model: 'pwned' })\n---\n# Agent\n`;

describe('front matter is YAML or JSON only, never evaluated (MDO-0008 security finding)', () => {
  test('a ---js, ---javascript or ---coffee block runs nothing and is refused', () => {
    const root = makeTree({});
    for (const fence of ['js', 'javascript', 'JS', 'coffee', 'coffeescript', 'cson']) {
      const marker = join(root, `ran-${fence}`);
      expect(() => parseFrontmatter(payload(marker, fence)), fence).toThrow(/is not allowed|not registered/);
      expect(existsSync(marker), fence).toBe(false);
    }
  });

  test('YAML (1.2: timestamps stay strings) and JSON still parse', () => {
    expect(parseFrontmatter('---\nmodel: claude-opus-5-5\nat: 2026-10-20\n---\nbody\n')).toEqual({
      data: { model: 'claude-opus-5-5', at: '2026-10-20' },
      content: 'body\n',
    });
    expect(parseFrontmatter('---json\n{ "model": "x" }\n---\n').data).toEqual({ model: 'x' });
    expect(parseFrontmatter('no front matter\n')).toEqual({ data: {}, content: 'no front matter\n' });
  });

  test('a cloned repo cannot run code through its agent files: identity and the graph hook read them safely', () => {
    const marker = join(makeTree({}), 'ran');
    const root = makeTree({ '.claude/agents/mandao-reviewer.md': payload(marker) });
    expect(() => agentIdentity(root, 'mandao-reviewer', 'claude')).toThrow(/is not allowed/);
    expect(agentWithoutShell(root, 'mandao-reviewer')).toBe(false);
    expect(existsSync(marker)).toBe(false);
  });
});
