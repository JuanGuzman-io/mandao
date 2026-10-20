import type { Capability } from '../schemas/index.js';
import {
  argumentHint,
  commandName,
  frontmatter,
  generatedNotice,
  mapCapabilities,
  modelFor,
  modelSeparationWarnings,
  renderCommandBody,
  renderContext,
  renderPersonaBody,
  selectCommands,
} from './shared.js';
import type { TokenSyntax } from '../render/render.js';
import type { Adapter, GeneratedFile } from './types.js';

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
  arg: (_meta, name) => `<${name}>`,
  command: (id) => `/${commandName(id)}`,
};

/** Claude Code: commands become user-invoked skills, personas become subagents. */
export const claudeAdapter: Adapter = {
  id: 'claude',
  name: 'Claude Code',
  render(input) {
    const ctx = renderContext(input, 'claude');
    const files: GeneratedFile[] = [];

    for (const cmd of selectCommands(input)) {
      const from = `command:${cmd.meta.id}`;
      const head = frontmatter({
        name: commandName(cmd.meta.id),
        description: cmd.meta.description,
        'argument-hint': argumentHint(cmd),
        'allowed-tools': mapCapabilities(cmd.meta.capabilities, TOOLS).join(', ') || undefined,
        model: modelFor(input, 'claude', cmd.meta.tier),
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
        const from = `persona:${persona.meta.id}`;
        const head = frontmatter({
          name: commandName(persona.meta.id),
          description: persona.meta.description,
          tools: mapCapabilities(persona.meta.capabilities, TOOLS).join(', ') || undefined,
          model: modelFor(input, 'claude', persona.meta.tier),
          ...persona.meta.harness.claude,
        });
        files.push({
          path: `.claude/agents/${commandName(persona.meta.id)}.md`,
          content: `${head}${generatedNotice(input.version, from)}\n\n${renderPersonaBody(persona, ctx, syntax)}`,
          ownership: 'owned',
          from,
          harness: 'claude',
          scope: 'project',
        });
      }
    }

    return { files, warnings: input.scope === 'project' ? modelSeparationWarnings(input, 'claude') : [] };
  },
};
