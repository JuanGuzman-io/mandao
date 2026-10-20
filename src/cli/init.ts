import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as p from '@clack/prompts';
import { CONFIG_FILE, hasConfig, MODELS_FILE, SOURCES_FILE, writeYaml } from '../engine/files.js';
import { syncGlobal, syncProject } from '../engine/sync.js';
import { type ConfigInput, configSchema, DEFAULT_MODELS, HARNESS_IDS, type HarnessId, PROFILES, type Profile } from '../schemas/index.js';
import { type DetectedProject, type DetectedWorkspace, detectWorkspace } from '../workspace/detect.js';
import { c, printChanges, printWarnings } from './output.js';

export type PolyrepoStrategy = 'workspace-repo' | 'home' | 'local';

export interface InitOptions {
  scope?: 'project' | 'global';
  harness?: string[];
  profile?: Profile;
  polyrepo?: PolyrepoStrategy;
  home?: string;
  yes?: boolean;
  force?: boolean;
}

const HARNESS_LABEL: Record<HarnessId, string> = { claude: 'Claude Code', copilot: 'GitHub Copilot' };

function bail(value: unknown): asserts value is NonNullable<unknown> {
  if (p.isCancel(value)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
}

function parseHarnesses(list: string[]): HarnessId[] {
  const ids = list
    .flatMap((h) => h.split(','))
    .map((h) => h.trim())
    .filter(Boolean);
  const bad = ids.filter((h) => !(HARNESS_IDS as readonly string[]).includes(h));
  if (bad.length) throw new Error(`Unknown harness: ${bad.join(', ')}. Available: ${HARNESS_IDS.join(', ')}`);
  return ids as HarnessId[];
}

async function chooseHarnesses(opts: InitOptions): Promise<HarnessId[]> {
  if (opts.harness?.length) return parseHarnesses(opts.harness);
  if (opts.yes) return ['claude'];
  const picked = await p.multiselect({
    message: 'Which harnesses should Mandao generate commands for?',
    options: HARNESS_IDS.map((h) => ({ value: h, label: HARNESS_LABEL[h] })),
    initialValues: ['claude'],
    required: true,
  });
  bail(picked);
  return picked as HarnessId[];
}

async function confirmProjects(ws: DetectedWorkspace, opts: InitOptions): Promise<DetectedProject[]> {
  const projects = opts.profile ? ws.projects.map((pr) => ({ ...pr, profile: opts.profile! })) : ws.projects;
  if (opts.yes) return projects;
  p.note(
    projects.map((pr) => `${pr.name.padEnd(20)} ${pr.path.padEnd(28)} ${pr.profile}`).join('\n'),
    `Detected ${ws.mode} workspace (${ws.reason})`,
  );
  const ok = await p.confirm({ message: 'Are these projects and profiles right?' });
  bail(ok);
  if (ok) return projects;
  const out: DetectedProject[] = [];
  for (const pr of projects) {
    const profile = await p.select({
      message: `Profile for ${pr.name} (${pr.path})`,
      options: PROFILES.map((v) => ({ value: v, label: v })),
      initialValue: pr.profile,
    });
    bail(profile);
    out.push({ ...pr, profile: profile as Profile });
  }
  p.log.info('Edit .mandao/config.yml later to add, remove or rename projects.');
  return out;
}

async function choosePolyrepoStrategy(ws: DetectedWorkspace, opts: InitOptions): Promise<{ strategy: PolyrepoStrategy; home: string }> {
  if (opts.polyrepo) {
    if (opts.polyrepo === 'home' && !opts.home) throw new Error('--polyrepo home needs --home <project path>');
    return { strategy: opts.polyrepo, home: opts.polyrepo === 'home' ? opts.home! : '.' };
  }
  if (opts.yes) return { strategy: 'workspace-repo', home: '.' };
  p.log.warn('The workspace root is not a git repository: specs and the workspace constitution written here would not be versioned.');
  const strategy = await p.select({
    message: 'Where should the canonical specs live?',
    options: [
      { value: 'workspace-repo', label: 'Make the root a workspace repository', hint: 'recommended; child repositories are git-ignored' },
      { value: 'home', label: 'Use one of the repositories as the home for specs' },
      { value: 'local', label: 'Keep them local only', hint: 'not versioned; doctor keeps warning' },
    ],
  });
  bail(strategy);
  if (strategy !== 'home') return { strategy: strategy as PolyrepoStrategy, home: '.' };
  const home = await p.select({ message: 'Home repository', options: ws.projects.map((pr) => ({ value: pr.path, label: pr.name })) });
  bail(home);
  return { strategy: 'home', home: home as string };
}

function initWorkspaceRepo(root: string, projects: DetectedProject[]) {
  execFileSync('git', ['init', '--quiet'], { cwd: root });
  const ignore = join(root, '.gitignore');
  const existing = existsSync(ignore) ? readFileSync(ignore, 'utf8') : '';
  const lines = projects.map((pr) => `/${pr.path}/`).filter((l) => !existing.split('\n').includes(l));
  if (lines.length)
    appendFileSync(
      ignore,
      `${existing && !existing.endsWith('\n') ? '\n' : ''}# Child repositories (Mandao polyrepo workspace)\n${lines.join('\n')}\n`,
    );
}

const OVERRIDES_README = `# Overrides

Files here win over presets and Mandao core. \`mandao update\` never touches this folder.

- Replace a whole command: \`commands/<id>.md\`
- Patch only its frontmatter: \`commands/<id>.patch.yml\` (objects merge, arrays replace, \`null\` deletes)
- Replace a template: \`templates/<shared|app|ai|data>/<name>\`
- Replace or patch a persona: \`personas/<id>.md\` or \`personas/<id>.patch.yml\`

Run \`mandao sync\` after editing.
`;

const SOURCES_TEMPLATE = {
  schema_version: 1,
  tracker: 'none',
  docs: [],
  meetings: [],
  chat: [],
  design: [],
};

export async function runInit(root: string, opts: InitOptions) {
  const interactive = !opts.yes;
  if (interactive) p.intro(c.bold('mandao init'));

  let scope = opts.scope;
  if (!scope) {
    if (opts.yes) scope = 'project';
    else {
      const picked = await p.select({
        message: 'Install scope',
        options: [
          { value: 'project', label: 'This workspace', hint: 'creates .mandao/ and the harness folders here' },
          { value: 'global', label: 'Global', hint: 'installs /mandao-init for your user, to set up any repo later' },
        ],
      });
      bail(picked);
      scope = picked as 'project' | 'global';
    }
  }

  const harnesses = await chooseHarnesses(opts);

  if (scope === 'global') {
    const result = syncGlobal(harnesses, { force: opts.force });
    printChanges(result.changes);
    const msg = 'Global install done. Open any repository in your agent and run /mandao-init.';
    interactive ? p.outro(msg) : console.log(msg);
    return;
  }

  if (hasConfig(root) && !opts.force) {
    throw new Error(`${CONFIG_FILE} already exists. Use \`mandao sync\`, \`mandao harness add\`, or \`mandao init --force\`.`);
  }

  const ws = detectWorkspace(root);
  const projects = await confirmProjects(ws, opts);

  let home = '.';
  let localOnly: boolean | undefined;
  if (ws.mode === 'polyrepo' && !ws.rootIsRepo) {
    const choice = await choosePolyrepoStrategy(ws, opts);
    home = choice.home;
    if (choice.strategy === 'workspace-repo') initWorkspaceRepo(root, projects);
    if (choice.strategy === 'local') localOnly = true;
  }

  const config: ConfigInput = {
    schema_version: 1,
    workspace: ws.mode,
    ...(home !== '.' ? { home } : {}),
    ...(localOnly ? { local_only: localOnly } : {}),
    projects: projects.map((pr) => ({ name: pr.name, path: pr.path, profile: pr.profile, ...(pr.repo ? { repo: pr.repo } : {}) })),
    harnesses,
  };
  const models = {
    schema_version: 1,
    harnesses: Object.fromEntries(harnesses.filter((h) => DEFAULT_MODELS[h]).map((h) => [h, DEFAULT_MODELS[h]])),
  };
  const parsed = configSchema.safeParse(config);
  if (!parsed.success) throw new Error(`Generated config is invalid: ${parsed.error.message}`);

  writeYaml(join(root, CONFIG_FILE), config, '# Mandao configuration. Run `mandao sync` after editing. Schema: docs/schemas.md');
  if (!existsSync(join(root, MODELS_FILE))) {
    writeYaml(
      join(root, MODELS_FILE),
      models,
      '# Model tier registry per harness: fast | standard | strong. The Reviewer must differ from the Implementer.',
    );
  }
  if (!existsSync(join(root, SOURCES_FILE))) {
    writeYaml(join(root, SOURCES_FILE), SOURCES_TEMPLATE, '# Where business context lives: tracker, docs, chat, design, transcripts.');
  }
  const overrides = join(root, '.mandao', 'overrides');
  mkdirSync(overrides, { recursive: true });
  if (!existsSync(join(overrides, 'README.md'))) writeFileSync(join(overrides, 'README.md'), OVERRIDES_README);

  const result = syncProject(root, { force: opts.force });
  printChanges(result.changes);
  printWarnings(result.warnings);

  const next = 'Next: open your agent here and run /mandao-constitution.';
  interactive ? p.outro(next) : console.log(next);
}
