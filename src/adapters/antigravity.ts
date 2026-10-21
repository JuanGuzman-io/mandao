import type { TokenSyntax } from '../render/render.js';
import { renderAgentsSkills } from './agents-skills.js';
import { commandName, frontmatter, generatedNotice, openByHand, personaVariants, renderContext, renderPersonaBody } from './shared.js';
import type { Adapter, AdapterInput, GeneratedFile } from './types.js';

const syntax: TokenSyntax = {
  args: () => 'the text the user wrote after the skill name',
  arg: (_meta, name) => `<${name}>`,
  command: (id) => `/${commandName(id)}`,
};

/**
 * Personas as subagents in `.agents/agents/`. Antigravity's `model` is a tier (`inherit`, `flash`, `pro`),
 * never a model ID. Its tool names are not documented, so a read-only persona says so in its prompt but
 * Antigravity does not enforce it (ADR 0019).
 */
function renderAgents(input: AdapterInput): GeneratedFile[] {
  const ctx = renderContext(input, 'antigravity');
  return input.resolution.personas.flatMap((persona) => {
    const body = renderPersonaBody(persona, ctx, syntax);
    return personaVariants(persona, input.models.antigravity).map((v): GeneratedFile => {
      const head = frontmatter({ name: v.name, description: v.description, model: v.model, ...persona.meta.harness.antigravity });
      return {
        path: `.agents/agents/${v.name}.md`,
        content: `${head}${generatedNotice(input.version, v.from)}\n\n${v.preface ? `${v.preface}\n\n` : ''}${body}`,
        ownership: 'owned',
        from: v.from,
        harness: 'antigravity',
        scope: 'project',
      };
    });
  });
}

/**
 * Antigravity (Google), experimental: mandaos are the shared `.agents/skills/` (also read by Codex, so
 * they are rendered once), personas are subagents with a model tier. Instructions come from AGENTS.md.
 */
export const antigravityAdapter: Adapter = {
  id: 'antigravity',
  name: 'Antigravity',
  session: {
    enterWorktree: false,
    newConversation: '⌘N / Ctrl+N',
    resume: (worktree, first) => openByHand('antigravity', worktree, first),
  },
  experimental:
    'not live-tested: covered by snapshot tests only (no Antigravity account); its formats moved this month (workflows became skills on 2026-10-19) and skill arguments and agent tool names are not documented',
  verified: {
    date: '2026-10-20',
    docs: [
      'https://antigravity.google/docs/skills',
      'https://antigravity.google/docs/subagents',
      'https://antigravity.google/docs/rules',
      'https://antigravity.google/docs/models',
    ],
  },
  render(input) {
    const files = renderAgentsSkills(input, 'antigravity');
    if (input.scope === 'project') files.push(...renderAgents(input));
    return { files, warnings: [] };
  },
};
