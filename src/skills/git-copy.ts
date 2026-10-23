import { spawnSync } from 'node:child_process';
import { existsSync, lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, isAbsolute, join, sep } from 'node:path';
import { parseDocument } from 'yaml';
import { copyNewFile, makeScratchDir, removeScratchDir, writeText } from '../writer/files.js';
import type { InstallOptions, InstallStep, Runner, SkillResult } from './install.js';

type CopyStep = InstallStep & { kind: 'copy' };
type Outcome = Pick<SkillResult, 'status' | 'detail' | 'scripts'>;

/** Script extensions left out by default (C-2, S-3.4). */
const SCRIPT_EXTENSIONS = new Set(['.sh', '.bash', '.zsh', '.js', '.mjs', '.cjs', '.ts', '.py', '.rb', '.ps1', '.bat', '.cmd']);
/** Only HTTPS catalog sources are allowed; local and alternate git transports are refused. */
const ALLOWED_PROTOCOLS = new Set(['https:']);
/** What a skill's scripts do beyond being third-party code, when known (P3). */
const SCRIPT_NOTES: Record<string, string> = {
  brainstorming: "brainstorming's scripts start a local server.",
};

const exists = (path: string) => lstatSync(path, { throwIfNoEntry: false }) !== undefined;

/** A file is a script when it has the executable bit, a script extension, or sits under a `scripts/` folder. */
function isScript(rel: string, mode: number): boolean {
  return (mode & 0o111) !== 0 || SCRIPT_EXTENSIONS.has(extname(rel).toLowerCase()) || rel.split('/').slice(0, -1).includes('scripts');
}

/** How long one git call may take before the skill is reported pending, so a hung fetch never blocks init. */
const GIT_TIMEOUT_MS = 120_000;

/** Keeps the user's SSH command and adds non-interactive mode only when BatchMode is unspecified. */
function gitSshCommand(configured = process.env.GIT_SSH_COMMAND): string {
  const command = configured?.trim();
  if (!command) return 'ssh -o BatchMode=yes';
  if (/(?:^|\s)(?:-o\s*)?BatchMode\s*=\s*(?:yes|no)(?=\s|$)/i.test(command)) return command;
  return `${command} -o BatchMode=yes`;
}

/** Runs git with an argument array (never a shell string), no prompts (terminal or ssh), a timeout, and no `ext::` transport. */
function git(args: string[], cwd: string, input?: string) {
  return spawnSync('git', ['-c', 'protocol.ext.allow=never', ...args], {
    cwd,
    input,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: GIT_TIMEOUT_MS,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_SSH_COMMAND: gitSshCommand() },
  });
}

/** Why a git call did not succeed: a timeout, an error starting it, or the first line it printed. */
function gitFailure(what: string, r: ReturnType<typeof git>): string {
  if ((r.error as NodeJS.ErrnoException | undefined)?.code === 'ETIMEDOUT') return `${what} timed out after ${GIT_TIMEOUT_MS / 1000}s`;
  const reason = r.error?.message ?? r.stderr?.trim().split('\n')[0];
  return `${what} failed${reason ? `: ${reason}` : ''}`;
}

/** Pure: why a catalog `url` or `path` is refused, or undefined when it is safe to fetch and copy. */
function unsafe(step: CopyStep): string | undefined {
  let protocol = '';
  try {
    protocol = new URL(step.url).protocol;
  } catch {
    return `unsupported repository URL ${step.url}`;
  }
  if (!ALLOWED_PROTOCOLS.has(protocol)) return `unsupported repository URL ${step.url}`;
  const parts = step.path.split(/[\\/]/);
  if (isAbsolute(step.path) || step.path.startsWith('-') || parts.includes('..')) return `unsafe skill path ${step.path}`;
  return undefined;
}

/** A full commit hash, any case (the schema refuses uppercase; this path does not depend on it). */
const FULL_COMMIT = /^[0-9a-f]{40}$/i;

/**
 * Downloads `ref` into `dir`, shallow and without blobs: a tag or branch with `clone --branch`, a full commit
 * (upstreams without tags) with `init` + `fetch --depth 1 origin <commit>` + checkout of `FETCH_HEAD`.
 */
function download(step: CopyStep, dir: string): ReturnType<typeof git> {
  if (!FULL_COMMIT.test(step.ref))
    return git(['clone', '--quiet', '--depth', '1', '--branch', step.ref, '--filter=blob:none', '--sparse', '--', step.url, dir], dir);
  const init = git(['init', '--quiet'], dir);
  if (init.status !== 0) return init;
  const remote = git(['remote', 'add', '--', 'origin', step.url], dir);
  if (remote.status !== 0) return remote;
  return git(['fetch', '--quiet', '--depth', '1', '--filter=blob:none', 'origin', '--', step.ref.toLowerCase()], dir);
}

/** Shallow, sparse fetch of the ref into `dir`; returns the commit it resolved to, or the reason it failed. */
function fetchTag(step: CopyStep, dir: string): { head: string } | { error: string } {
  const fetched = download(step, dir);
  if (fetched.status !== 0) return { error: gitFailure('fetch', fetched) };
  const sparse =
    step.path === '.' ? git(['sparse-checkout', 'disable'], dir) : git(['sparse-checkout', 'set', '--stdin'], dir, `${step.path}\n`);
  if (sparse.status !== 0) return { error: gitFailure(`checkout of ${step.path}`, sparse) };
  if (FULL_COMMIT.test(step.ref)) {
    const checkout = git(['checkout', '--quiet', '--detach', 'FETCH_HEAD'], dir);
    if (checkout.status !== 0) return { error: gitFailure(`checkout of ${step.ref}`, checkout) };
  }
  const head = git(['rev-parse', 'HEAD'], dir);
  if (head.status !== 0) return { error: gitFailure('reading the fetched commit', head) };
  return { head: head.stdout.trim() };
}

interface Plan {
  src: string;
  docs: string[];
  scripts: string[];
  /** Symlinks are never followed nor copied. */
  links: string[];
}

function walk(dir: string, rel: string, plan: Plan) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name === '.git') continue;
    const r = rel ? `${rel}/${e.name}` : e.name;
    const full = join(dir, e.name);
    if (e.isSymbolicLink()) plan.links.push(r);
    else if (e.isDirectory()) walk(full, r, plan);
    else if (e.isFile()) (isScript(r, lstatSync(full).mode) ? plan.scripts : plan.docs).push(r);
  }
}

/** The files of the skill folder, after checking it is a real folder inside the clone with a SKILL.md. */
function planCopy(clone: string, path: string): Plan | { error: string } {
  const src = join(clone, path);
  const stat = lstatSync(src, { throwIfNoEntry: false });
  if (!stat?.isDirectory()) return { error: `${path} is not a folder at the pinned commit` };
  const base = realpathSync(clone);
  const real = realpathSync(src);
  if (real !== base && !real.startsWith(base + sep)) return { error: `${path} resolves outside the repository` };
  const plan: Plan = { src: real, docs: [], scripts: [], links: [] };
  walk(real, '', plan);
  if (!plan.docs.includes('SKILL.md')) return { error: `no SKILL.md in ${path} at the pinned commit` };
  return plan;
}

/**
 * Pure: the SKILL.md with `disable-model-invocation: true` in its frontmatter (Claude Code loads it only when
 * invoked). Literal edit (no `$` patterns), keeping a BOM and CRLF line ends; creates the frontmatter if missing.
 */
export function withModelInvocationDisabled(text: string): string {
  const bom = text.startsWith('\uFEFF') ? '\uFEFF' : '';
  const rest = text.slice(bom.length);
  const eol = /^[^\n]*\r\n/.test(rest) ? '\r\n' : '\n';
  const fm = /^---\r?\n(?:([\s\S]*?)\r?\n)?---(?=\r?\n|$)/.exec(rest);
  const lines = fm?.[1] ? fm[1].split(/\r?\n/) : [];
  const at = lines.findIndex((l) => /^disable-model-invocation\s*:/.test(l));
  if (at >= 0) lines[at] = 'disable-model-invocation: true';
  else lines.push('disable-model-invocation: true');
  const head = `---${eol}${lines.join(eol)}${eol}---`;
  return fm ? bom + head + rest.slice(fm[0].length) : `${bom}${head}${eol}${rest}`;
}

/** Codex reads `agents/openai.yaml` next to SKILL.md; this policy keeps it from invoking the skill on its own. */
const CODEX_POLICY = `# Written by mandao: the catalog sets model_invocation: false, so the skill is invoked explicitly.
policy:
  allow_implicit_invocation: false
`;
const INVOCATION_NOTE =
  'automatic invocation disabled (Claude Code: disable-model-invocation; Codex: agents/openai.yaml; other harnesses have no equivalent: load it explicitly)';

/** Upstream `agents/openai.yaml` with `policy.allow_implicit_invocation: false` set, the rest (comments too) kept. */
function withCodexPolicy(text: string): string {
  const doc = parseDocument(text);
  if (doc.errors.length) throw new Error(`agents/openai.yaml does not parse: ${doc.errors[0]!.message}`);
  doc.setIn(['policy', 'allow_implicit_invocation'], false);
  return String(doc);
}

/** Disables automatic invocation in a fresh copy: SKILL.md frontmatter, plus the Codex policy under `.agents/skills`. */
function disableInvocation(target: { rel: string; abs: string }) {
  const skill = join(target.abs, 'SKILL.md');
  writeText(skill, withModelInvocationDisabled(readFileSync(skill, 'utf8')));
  if (!target.rel.startsWith('.agents/skills/')) return;
  const policy = join(target.abs, 'agents', 'openai.yaml');
  writeText(policy, existsSync(policy) ? withCodexPolicy(readFileSync(policy, 'utf8')) : CODEX_POLICY);
}

/** Copies the files into `dest` (never over an existing file, never a symlink), keeping their permission bits. */
function copyFiles(src: string, dest: string, files: string[]) {
  for (const rel of files) copyNewFile(join(src, rel), join(dest, rel));
}

function copiedDetail(id: string, plan: Plan, written: string[], kept: string[], withScripts: boolean): string {
  const parts = [`copied into ${written.join(', ')}`, ...kept];
  if (plan.scripts.length && !withScripts) {
    parts.push(
      `left out ${plan.scripts.length} script(s): ${plan.scripts.join(', ')}; add them with \`mandao skills add ${id} --with-scripts\``,
    );
  }
  if (plan.links.length) parts.push(`left out symlink(s): ${plan.links.join(', ')}`);
  return parts.join('; ');
}

/** Removes the targets of a failed copy (none existed before this call); never throws, says what it could not remove. */
function undoCopies(targets: { rel: string; abs: string }[], root: string): string {
  const left = targets.filter((t) => {
    try {
      removeScratchDir(t.abs, root);
      return false;
    } catch {
      return true;
    }
  });
  return left.length
    ? `could not remove the partial copy in ${left.map((t) => t.rel).join(', ')}`
    : `nothing left in ${targets.map((t) => t.rel).join(', ')}`;
}

function copyPlan(
  id: string,
  step: CopyStep,
  plan: Plan,
  targets: { rel: string; abs: string }[],
  kept: string[],
  opts: InstallOptions & { root: string; manual: string; modelInvocation?: boolean },
): Outcome {
  const { root, manual } = opts;
  const withScripts = Boolean(opts.withScripts) && plan.scripts.length > 0;
  if (withScripts) {
    const warn = opts.warn ?? ((m: string) => console.log(m));
    warn(
      `${id}: copying ${plan.scripts.length} script(s) (${plan.scripts.join(', ')}). They are third-party code from ${step.url}; review them before running them.${SCRIPT_NOTES[id] ? ` ${SCRIPT_NOTES[id]}` : ''}`,
    );
  }
  const files = withScripts ? [...plan.docs, ...plan.scripts] : plan.docs;
  try {
    for (const t of targets) copyFiles(plan.src, t.abs, files);
    if (opts.modelInvocation === false) for (const t of targets) disableInvocation(t);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { status: 'failed', detail: `copy failed: ${reason}; ${undoCopies(targets, root)}; ${manual}` };
  }
  return {
    status: 'installed',
    detail: copiedDetail(
      id,
      plan,
      targets.map((t) => t.rel),
      opts.modelInvocation === false ? [...kept, INVOCATION_NOTE] : kept,
      withScripts,
    ),
    ...(withScripts ? { scripts: true } : {}),
  };
}

/**
 * Fetches a `git` source into a temporary folder outside the project, checks the tag is the pinned
 * commit, and copies the skill folder as `<folder>/<id>/` into each target folder that does not exist
 * yet (D3). Scripts only with `withScripts` (C-2). The temporary folder is removed in every outcome.
 */
export function copyGitSkill(
  id: string,
  step: CopyStep,
  root: string,
  runner: Runner,
  opts: InstallOptions & { folders: string[]; manual: string; modelInvocation?: boolean },
): Outcome {
  const refused = unsafe(step);
  if (refused) return { status: 'failed', detail: `${refused}; nothing copied` };
  const targets = opts.folders.map((f) => ({ rel: `${f}/${id}`, abs: join(root, f, id) }));
  const existing = targets.filter((t) => exists(t.abs));
  const kept = existing.length ? [`already exists, left as is: ${existing.map((t) => t.rel).join(', ')}`] : [];
  const fresh = targets.filter((t) => !exists(t.abs));
  const manual = `install it by hand: ${opts.manual}`;
  if (!targets.length) return { status: 'pending', detail: `no skills folder for the chosen harnesses; ${manual}` };
  if (!fresh.length) {
    // Nothing to copy: an existing folder is never trusted as the pinned commit (D3), so it is not pinned.
    const rels = existing.map((t) => t.rel).join(', ');
    return { status: 'pending', detail: `already exists, not verified against commit ${step.commit}, left as is: ${rels}; ${manual}` };
  }
  if (!runner.has('git')) return { status: 'pending', detail: `git is not available; ${manual}` };
  const tmp = makeScratchDir('mandao-skill-');
  try {
    const fetched = fetchTag(step, tmp);
    if ('error' in fetched) return { status: 'pending', detail: `${fetched.error}; ${manual}` };
    if (fetched.head !== step.commit) {
      return {
        status: 'failed',
        detail: `tag ${step.ref} resolves to ${fetched.head}, not the pinned commit ${step.commit}; nothing copied`,
      };
    }
    const plan = planCopy(tmp, step.path);
    if ('error' in plan) return { status: 'failed', detail: `${plan.error}; nothing copied` };
    return copyPlan(id, step, plan, fresh, kept, { ...opts, root, manual });
  } finally {
    removeScratchDir(tmp, tmpdir());
  }
}
