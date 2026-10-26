import { posix } from 'node:path';
import { launcherCommand } from '../engine/launcher.js';
import type { CommandFrontmatter, Config, Profile, WorkspaceMode } from '../schemas/index.js';
import { PROFILES, WORKSPACE_MODES } from '../schemas/index.js';

/** Facts about the workspace and the target harness that rendering depends on. */
export interface RenderContext {
  harness: string;
  profiles: ReadonlySet<Profile>;
  multiProject: boolean;
  mode: WorkspaceMode;
  paths: Config['paths'];
  version: string;
  language: Config['language'];
  /** Who decides (`{{roles.po}}`, `{{roles.tech_lead}}`, `{{roles.dev}}`). */
  roles: Config['roles'];
  /** Known command ids; when set, `{{command:x}}` must reference one of them. */
  commands?: ReadonlySet<string>;
}

/** How a harness spells the parts of a command that differ between harnesses. */
export interface TokenSyntax {
  args(meta: CommandFrontmatter): string;
  arg(meta: CommandFrontmatter, name: string): string;
  command(id: string): string;
}

export const TEMPLATES_DIR = '.mandao/templates';

export function contextFromConfig(config: Config, harness: string, version: string): RenderContext {
  return {
    harness,
    profiles: new Set(config.projects.map((p) => p.profile)),
    multiProject: config.projects.length > 1,
    mode: config.workspace,
    // Paths are relative to `workspace.home`; agents run from the workspace root.
    paths: Object.fromEntries(Object.entries(config.paths).map(([k, v]) => [k, posix.join(config.home, v)])) as Config['paths'],
    version,
    language: config.language,
    roles: config.roles,
  };
}

/** Scripts run through the launcher, which resolves local → global → `npx mandao@<locked version>`. */
export function scriptCommand(name: string): string {
  return `${launcherCommand()} run ${name}`;
}

/**
 * Templates are installed per profile in use (`.mandao/templates/<profile>/<name>`), each one already
 * resolved to its profile variant or the shared fallback. With a single profile the path is concrete;
 * otherwise the agent substitutes the profile of the project it is working on.
 */
export function templateReference(ctx: RenderContext, name: string): string {
  const profiles = [...ctx.profiles];
  const profile = profiles.length === 1 ? profiles[0] : '<profile>';
  return `${TEMPLATES_DIR}/${profile}/${name}`;
}

const IF_RE = /^[ \t]*<!--\s*mandao:if\s+(.+?)\s*-->[ \t]*\r?\n?/;
const ENDIF_RE = /^[ \t]*<!--\s*mandao:endif\s*-->[ \t]*\r?\n?/;
const MARKER_RE = /^[ \t]*<!--\s*mandao:(if\s+.+?|endif)\s*-->[ \t]*\r?\n?/gm;
const TOKEN_RE = /\{\{\s*([a-zA-Z._]+)(?::([A-Za-z0-9._/-]+))?\s*\}\}/g;

export class RenderError extends Error {}

function evalCondition(cond: string, ctx: RenderContext): boolean {
  const negated = cond.startsWith('!');
  const expr = negated ? cond.slice(1).trim() : cond;
  let value: boolean;
  const [key, arg] = expr.split('=').map((s) => s.trim());
  switch (key) {
    case 'profile':
      if (!PROFILES.includes(arg as Profile)) throw new RenderError(`unknown profile "${arg}" in condition "${cond}"`);
      value = ctx.profiles.has(arg as Profile);
      break;
    case 'mode':
      if (!WORKSPACE_MODES.includes(arg as WorkspaceMode)) throw new RenderError(`unknown mode "${arg}" in condition "${cond}"`);
      value = ctx.mode === arg;
      break;
    case 'harness':
      if (!arg) throw new RenderError(`missing harness in condition "${cond}"`);
      value = ctx.harness === arg;
      break;
    case 'multiProject':
      if (arg !== undefined) throw new RenderError(`multiProject takes no value in condition "${cond}"`);
      value = ctx.multiProject;
      break;
    default:
      throw new RenderError(`unknown condition "${cond}"`);
  }
  return negated ? !value : value;
}

/** Evaluates `<!-- mandao:if -->` blocks. Nested blocks are supported; unbalanced markers throw. */
export function applyConditionals(body: string, ctx: RenderContext): string {
  const out: string[] = [];
  const stack: boolean[] = [];
  let last = 0;
  for (const m of body.matchAll(MARKER_RE)) {
    const visible = stack.every(Boolean);
    if (visible) out.push(body.slice(last, m.index));
    last = m.index + m[0].length;
    if (ENDIF_RE.test(m[0])) {
      if (!stack.length) throw new RenderError('mandao:endif without a matching mandao:if');
      stack.pop();
    } else {
      const cond = m[0].match(IF_RE)?.[1] ?? '';
      stack.push(evalCondition(cond, ctx));
    }
  }
  if (stack.length) throw new RenderError('mandao:if without a matching mandao:endif');
  out.push(body.slice(last));
  return out.join('');
}

/** One role's name, or a render error for a role the config does not have. */
function roleOf(roles: Config['roles'], whole: string, key: string): string {
  if (!Object.hasOwn(roles, key)) throw new RenderError(`unknown role token "${whole}"`);
  return roles[key as keyof Config['roles']];
}

const ROLE_RE = /\{\{\s*roles\.([a-z_]+)\s*\}\}/g;

/** Templates are copied as written except for `{{roles.*}}` (phase 18): their other braces are the agent's placeholders. */
export function renderRoles(text: string, roles: Config['roles']): string {
  return text.replace(ROLE_RE, (whole, key: string) => roleOf(roles, whole, key));
}

/** Replaces `{{paths.*}}`, `{{version}}`, `{{language.*}}` and `{{roles.*}}`. Used for frontmatter strings such as input/output paths. */
export function renderInline(text: string, ctx: RenderContext): string {
  return text.replace(TOKEN_RE, (whole, name: string) => {
    if (name.startsWith('paths.')) {
      const key = name.slice('paths.'.length) as keyof RenderContext['paths'];
      if (!(key in ctx.paths)) throw new RenderError(`unknown path token "${whole}"`);
      return ctx.paths[key];
    }
    if (name === 'version') return ctx.version;
    if (name === 'language.business' || name === 'language.technical') return ctx.language[name.slice('language.'.length) as 'business'];
    if (name.startsWith('roles.')) return roleOf(ctx.roles, whole, name.slice('roles.'.length));
    throw new RenderError(`token "${whole}" is not allowed here`);
  });
}

/** A token that takes no argument, such as `{{mandao}}` or `{{harness}}`. */
function bareToken(whole: string, arg: string | undefined, value: () => string): string {
  if (arg !== undefined) throw new RenderError(`unknown token "${whole}"`);
  return value();
}

/** Renders a command body for one harness: conditionals first, then tokens. */
export function renderBody(meta: CommandFrontmatter, body: string, ctx: RenderContext, syntax: TokenSyntax): string {
  const visible = applyConditionals(body, ctx);
  return visible.replace(TOKEN_RE, (whole, name: string, arg?: string) => {
    switch (name) {
      case 'args':
        return syntax.args(meta);
      case 'arg':
        if (!arg || !meta.arguments.some((a) => a.name === arg)) throw new RenderError(`"${whole}" is not a declared argument`);
        return syntax.arg(meta, arg);
      case 'template':
        if (!arg || !meta.templates.includes(arg)) throw new RenderError(`"${whole}" is not listed in frontmatter templates`);
        return templateReference(ctx, arg);
      case 'script':
        if (!arg || !meta.scripts.includes(arg)) throw new RenderError(`"${whole}" is not listed in frontmatter scripts`);
        return scriptCommand(arg);
      case 'mandao':
        return bareToken(whole, arg, launcherCommand);
      case 'harness':
        return bareToken(whole, arg, () => ctx.harness);
      case 'command':
        if (!arg) throw new RenderError(`"${whole}" needs a command id`);
        if (ctx.commands && !ctx.commands.has(arg)) throw new RenderError(`"${whole}" references an unknown command`);
        return syntax.command(arg);
      default:
        if (arg === undefined) return renderInline(whole, ctx);
        throw new RenderError(`unknown token "${whole}"`);
    }
  });
}
