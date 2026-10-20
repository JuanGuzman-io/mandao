import { posix } from 'node:path';
import type { TokenSyntax } from '../render/render.js';
import type { Capability } from '../schemas/index.js';
import { BLOCK_BEGIN, BLOCK_END } from './agents-md.js';
import {
  argumentHint,
  commandName,
  frontmatter,
  generatedNotice,
  mapCapabilities,
  personaVariants,
  renderCommandBody,
  renderContext,
  renderPersonaBody,
  selectCommands,
} from './shared.js';
import type { Adapter, AdapterInput, GeneratedFile } from './types.js';

/** CLAUDE.md is only a pointer to AGENTS.md, next to every AGENTS.md that Mandao manages. */
function claudeMdPointers(input: AdapterInput): GeneratedFile[] {
  const dirs = new Set([input.config.home, ...input.config.projects.map((p) => p.path)]);
  return [...dirs].sort().map((dir) => ({
    path: posix.join(dir, 'CLAUDE.md'),
    content: `${BLOCK_BEGIN}\n@AGENTS.md\n${BLOCK_END}`,
    ownership: 'managed-block' as const,
    from: 'block:claude-pointer',
    harness: 'claude' as const,
    scope: 'project' as const,
  }));
}

const TOOLS: Record<Capability, string[]> = {
  read: ['Read'],
  search: ['Grep', 'Glob'],
  edit: ['Edit', 'Write'],
  shell: ['Bash'],
  web: ['WebFetch', 'WebSearch'],
  // MCP tools are namespaced per server; Claude Code asks for permission when they are used.
  mcp: [],
  agents: ['Agent'],
};

const syntax: TokenSyntax = {
  args: () => '$ARGUMENTS',
  // Named arguments are declared in the `arguments` frontmatter list.
  arg: (_meta, name) => `$${name}`,
  command: (id) => `/${commandName(id)}`,
};

/** Claude Code: commands become user-invoked skills, personas become subagents. */
export const claudeAdapter: Adapter = {
  id: 'claude',
  name: 'Claude Code',
  verified: { date: '2026-10-19', docs: ['https://code.claude.com/docs/en/skills'] },
  render(input) {
    const ctx = renderContext(input, 'claude');
    const files: GeneratedFile[] = [];

    for (const cmd of selectCommands(input)) {
      const from = `command:${cmd.meta.id}`;
      const head = frontmatter({
        name: commandName(cmd.meta.id),
        description: cmd.meta.description,
        'argument-hint': argumentHint(cmd),
        arguments: cmd.meta.arguments.length ? cmd.meta.arguments.map((a) => a.name) : undefined,
        'allowed-tools': mapCapabilities(cmd.meta.capabilities, TOOLS).join(', ') || undefined,
        // Mandaos are given explicitly; the model should not trigger them on its own.
        'disable-model-invocation': true,
        ...cmd.meta.harness.claude,
      });
      files.push({
        path: `${input.scope === 'global' ? '' : '.claude/'}skills/${commandName(cmd.meta.id)}/SKILL.md`,
        content: `${head}${generatedNotice(input.version, from)}\n\n${renderCommandBody(cmd, ctx, syntax)}`,
        ownership: 'owned',
        from,
        harness: 'claude',
        scope: input.scope,
      });
    }

    if (input.scope === 'project') {
      for (const persona of input.resolution.personas) {
        const body = renderPersonaBody(persona, ctx, syntax);
        for (const v of personaVariants(persona, input.models.claude)) {
          const head = frontmatter({
            name: v.name,
            description: v.description,
            tools: mapCapabilities(persona.meta.capabilities, TOOLS).join(', ') || undefined,
            model: v.model,
            ...persona.meta.harness.claude,
          });
          files.push({
            path: `.claude/agents/${v.name}.md`,
            content: `${head}${generatedNotice(input.version, v.from)}\n\n${v.preface ? `${v.preface}\n\n` : ''}${body}`,
            ownership: 'owned',
            from: v.from,
            harness: 'claude',
            scope: 'project',
          });
        }
      }
    }

    if (input.scope === 'project') files.push(...claudeMdPointers(input));

    return { files, warnings: [] };
  },
};
