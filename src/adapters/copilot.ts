import type { TokenSyntax } from '../render/render.js';
import { argumentUsage, type Capability } from '../schemas/index.js';
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

/**
 * Only positional arguments become `${input:…}` prompts; a flag (`--hotfix`) is read from what the person typed
 * after the command, as in the other harnesses, never asked as free text (phase 19 review F12).
 */
const syntax: TokenSyntax = {
  args: (meta) => {
    const positional = meta.arguments.filter((a) => !a.flag).map((a) => `${a.name}: \${input:${a.name}:${placeholder(a.description)}}`);
    const flags = meta.arguments.filter((a) => a.flag).map(argumentUsage);
    const typed = flags.length ? [`flags typed after the command, if any: ${flags.join(' ')}`] : [];
    return [...positional, ...typed].join(', ') || '(no arguments)';
  },
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
  session: {
    invoke: (command) => `/${command}`,
    enterWorktree: false,
    newConversation: 'New chat (⌘N / Ctrl+N)',
    resume: (worktree, first) => ({ text: `code ${JSON.stringify(worktree)}   # then run ${first} in Copilot Chat` }),
  },
  verified: {
    date: '2026-10-19',
    docs: [
      'https://code.visualstudio.com/docs/agent-customization/prompt-files',
      'https://code.visualstudio.com/docs/agent-customization/custom-agents',
    ],
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
        const body = renderPersonaBody(persona, ctx, syntax);
        for (const v of personaVariants(persona, input.models.copilot)) {
          const head = frontmatter({
            name: v.name,
            description: v.description,
            tools: mapCapabilities(persona.meta.capabilities, TOOLS),
            model: v.model,
            ...persona.meta.harness.copilot,
          });
          files.push({
            path: `.github/agents/${v.name}.agent.md`,
            content: `${head}${generatedNotice(input.version, v.from)}\n\n${v.preface ? `${v.preface}\n\n` : ''}${body}`,
            ownership: 'owned',
            from: v.from,
            harness: 'copilot',
            scope: 'project',
          });
        }
      }
    }

    return { files, warnings: [] };
  },
};
