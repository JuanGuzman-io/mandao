import type { Capability } from '../schemas/index.js';
import type { TokenSyntax } from '../render/render.js';
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
import type { Adapter, GeneratedFile } from './types.js';

// VS Code built-in tool sets. Tools that are unavailable at run time are ignored by Copilot.
const TOOLS: Record<Capability, string[]> = {
  read: ['read'],
  search: ['search'],
  edit: ['edit'],
  shell: ['execute'],
  web: ['web'],
  // MCP servers are referenced as `<server>/*`; they are configured per workspace, not by Mandao.
  mcp: [],
  agents: ['agent'],
};

const placeholder = (text: string) => text.replace(/[}\n]/g, ' ').replace(/:/g, ' -').trim();

const syntax: TokenSyntax = {
  args: (meta) =>
    meta.arguments.length
      ? meta.arguments.map((a) => `${a.name}: \${input:${a.name}:${placeholder(a.description)}}`).join(', ')
      : '(no arguments)',
  arg: (meta, name) => {
    const a = meta.arguments.find((x) => x.name === name)!;
    return `\${input:${name}:${placeholder(a.description)}}`;
  },
  command: (id) => `/${commandName(id)}`,
};

/** GitHub Copilot in VS Code: commands become prompt files, personas become custom agents. */
export const copilotAdapter: Adapter = {
  id: 'copilot',
  name: 'GitHub Copilot',
  verified: {
    date: '2026-10-19',
    docs: ['https://code.visualstudio.com/docs/agent-customization/prompt-files', 'https://code.visualstudio.com/docs/agent-customization/custom-agents'],
  },
  render(input) {
    const ctx = renderContext(input, 'copilot');
    const files: GeneratedFile[] = [];

    for (const cmd of selectCommands(input)) {
      const from = `command:${cmd.meta.id}`;
      const head = frontmatter({
        name: commandName(cmd.meta.id),
        description: cmd.meta.description,
        'argument-hint': argumentHint(cmd),
        agent: 'agent',
        model: modelFor(input, 'copilot', cmd.meta.tier),
        tools: mapCapabilities(cmd.meta.capabilities, TOOLS),
        ...cmd.meta.harness.copilot,
      });
      files.push({
        path: `${input.scope === 'global' ? '' : '.github/prompts/'}${commandName(cmd.meta.id)}.prompt.md`,
        content: `${head}${generatedNotice(input.version, from)}\n\n${renderCommandBody(cmd, ctx, syntax)}`,
        ownership: 'owned',
        from,
        harness: 'copilot',
        scope: input.scope,
      });
    }

    if (input.scope === 'project') {
      for (const persona of input.resolution.personas) {
        const from = `persona:${persona.meta.id}`;
        const head = frontmatter({
          name: commandName(persona.meta.id),
          description: persona.meta.description,
          tools: mapCapabilities(persona.meta.capabilities, TOOLS),
          model: modelFor(input, 'copilot', persona.meta.tier),
          ...persona.meta.harness.copilot,
        });
        files.push({
          path: `.github/agents/${commandName(persona.meta.id)}.agent.md`,
          content: `${head}${generatedNotice(input.version, from)}\n\n${renderPersonaBody(persona, ctx, syntax)}`,
          ownership: 'owned',
          from,
          harness: 'copilot',
          scope: 'project',
        });
      }
    }

    return { files, warnings: input.scope === 'project' ? modelSeparationWarnings(input, 'copilot') : [] };
  },
};
