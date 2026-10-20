# Review pack — T1, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T1-2.md`.

## Brief

```json
{
  "spec": "MDO-0008-measure-what-the-session-cut-rule-needs-doctor-r",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/engine/doctor-cache.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-cache.test.ts"
    ],
    "exemplar": "src/engine/doctor-harness.ts",
    "ac": [
      "AC-1",
      "AC-1/C1",
      "AC-1/C2"
    ],
    "scenarios": [
      "S-1.1",
      "S-1.2",
      "S-1.2/C1",
      "S-1.3",
      "S-1.3/C2",
      "S-1.4",
      "S-1.5",
      "S-1.6",
      "S-1.7"
    ],
    "test_levels": {
      "S-1.1": "unit",
      "S-1.2": "unit",
      "S-1.2/C1": "unit",
      "S-1.3": "unit",
      "S-1.3/C2": "unit",
      "S-1.4": "unit",
      "S-1.5": "unit",
      "S-1.6": "unit",
      "S-1.7": "unit"
    },
    "evidence": "tdd",
    "risk_tags": [
      "input"
    ],
    "depends_on": [],
    "parallel_safe": true,
    "verify": "npx vitest run test/unit/doctor-cache.test.ts test/unit/doctor-report.test.ts",
    "tests": {
      "unit": [
        "S-1.1",
        "S-1.2",
        "S-1.2/C1",
        "S-1.3",
        "S-1.3/C2",
        "S-1.4",
        "S-1.5",
        "S-1.6",
        "S-1.7"
      ],
      "e2e": []
    },
    "dod": [],
    "characterization": false,
    "id": "T1",
    "title": "doctor reports the Claude Code prompt-cache TTL and its source",
    "done": false,
    "line": 41
  },
  "acceptance": [
    {
      "ref": "AC-1",
      "text": "**GIVEN** a workspace whose harnesses include Claude Code · **WHEN** the maintainer runs `mandao doctor` · **THEN** an info finding gives the cache duration for the main conversation and for subagents, where each comes from (environment, project or user settings, or the default when unset), and the ADR 0036 recommendation · **BUT it must NOT** write or change any Claude Code settings file · **AND IT MUST** say \"not 5m or 1h\" for a value Claude Code ignores, instead of reporting it as in effect"
    },
    {
      "ref": "AC-1/C1",
      "text": "**BUT it must NOT** write or change any Claude Code settings file"
    },
    {
      "ref": "AC-1/C2",
      "text": "**AND IT MUST** say \"not 5m or 1h\" for a value Claude Code ignores, instead of reporting it as in effect"
    }
  ],
  "scenarios": [
    {
      "ref": "S-1.1",
      "text": "**Given** none of the variables or keys of [D1](#d1) set in the environment or in the user, project or project-local settings · **When** `mandao doctor` runs · **Then** an `info` finding says both are unset and gives the default (main 1h on a Claude subscription within plan usage, 5m with usage credits, an API key or a cloud provider; subagents 5m), with the fix \"ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings\""
    },
    {
      "ref": "S-1.2",
      "text": "**Given** `promptCacheTtl: \"1h\"` in the user settings and `\"5m\"` in `.claude/settings.local.json`, and `subagentPromptCacheTtl` set nowhere but `CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL=1h` in the environment · **When** `mandao doctor` runs · **Then** the `info` finding reports main `5m` from `.claude/settings.local.json` and subagents `1h` from the environment, following the order of [D1](#d1) · **BUT it must NOT** create, change or touch the modification time of any settings file"
    },
    {
      "ref": "S-1.2/C1",
      "text": "**BUT it must NOT** create, change or touch the modification time of any settings file"
    },
    {
      "ref": "S-1.3",
      "text": "**Given** `promptCacheTtl: \"10m\"` in the project settings and no other TTL source · **When** `mandao doctor` runs · **Then** a `warn` finding names the file and the value, and the main TTL is the default · **AND IT MUST** say the value is \"not 5m or 1h\" and ignored by Claude Code, never report `10m` as the TTL in effect"
    },
    {
      "ref": "S-1.3/C2",
      "text": "**AND IT MUST** say the value is \"not 5m or 1h\" and ignored by Claude Code, never report `10m` as the TTL in effect"
    },
    {
      "ref": "S-1.4",
      "text": "**Given** a workspace whose harnesses do not include `claude` · **When** `mandao doctor` runs · **Then** there is no cache-TTL finding"
    },
    {
      "ref": "S-1.5",
      "text": "**Given** `FORCE_PROMPT_CACHING_5M=1` and `promptCacheTtl: \"1h\"` in the user settings · **When** `mandao doctor` runs · **Then** both TTLs are `5m` from `FORCE_PROMPT_CACHING_5M`; and with only `ENABLE_PROMPT_CACHING_1H=1` and `subagentPromptCacheTtl: \"5m\"` set, main is `1h` from `ENABLE_PROMPT_CACHING_1H` and subagents `5m` from the settings key"
    },
    {
      "ref": "S-1.6",
      "text": "**Given** an agent file in `.claude/agents/` whose frontmatter sets `experimental.cacheTtl: 1h`, and no subagent variable or key · **When** `mandao doctor` runs · **Then** the finding names that agent as overriding the subagent TTL with `1h` (Claude Code 2.1.248+)"
    },
    {
      "ref": "S-1.7",
      "text": "**Given** `claude --version` reports 2.1.200 · **When** `mandao doctor` runs · **Then** the finding says this version ignores the TTL variables and keys (they need 2.1.242+) and reports the default; with no version available it says the version was not checked"
    }
  ],
  "project": {
    "name": "mandao",
    "path": ".",
    "gates": {
      "format": "npx biome format .",
      "lint": "npm run lint",
      "typecheck": "npm run typecheck",
      "test": "npm test",
      "build": "npm run build",
      "secrets": "gitleaks git . --redact --no-banner",
      "audit": "npm audit --omit=dev",
      "sast": "semgrep scan --config p/typescript --config p/javascript --error --metrics=off",
      "metrics": "npx biome lint --only=complexity/noExcessiveCognitiveComplexity --only=complexity/noExcessiveLinesPerFunction --only=style/noExcessiveLinesPerFile"
    }
  },
  "skillMap": [
    "| graphify | core | constitution, specify, implement, close | all | 0.9.92, pinned in the lock; Claude Code hooks through `mandao hook graph-guard` (roles with a shell only, ADR 0021) and git hooks installed |",
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`, generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [
    "security"
  ],
  "loop": {
    "task": "T1",
    "tier": "standard",
    "attempt": 2,
    "failsAtTier": 1,
    "tdd": {
      "required": true,
      "testsBy": "tester",
      "red": true,
      "evidence": "red"
    },
    "implementer": {
      "model": "claude-sonnet-5-5"
    },
    "reviewer": {
      "role": "reviewer",
      "model": "claude-opus-5-5"
    },
    "notes": [],
    "action": "review",
    "reason": "implementation reported, awaiting review"
  },
  "impact": {
    "source": "runner",
    "runner": "vitest",
    "graphTests": [
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "files": [
      "src/engine/doctor-cache.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-cache.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/leader-scripts.test.ts",
      "test/integration/lite-spec.test.ts",
      "test/integration/mdo-0004-defects.test.ts",
      "test/integration/mdo-0005-defects.test.ts",
      "test/integration/mdo-0006-defects.test.ts",
      "test/integration/premise.test.ts",
      "test/integration/shadow.test.ts",
      "test/integration/spec-log.test.ts",
      "test/integration/start.test.ts",
      "test/integration/tdd.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/engine/doctor-cache.ts src/engine/doctor.ts test/unit/doctor-cache.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/engine.test.ts test/integration/leader-scripts.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/doctor-codex.test.ts test/unit/doctor-report.test.ts test/unit/doctor-sdd.test.ts test/unit/model-profiles.test.ts test/unit/models.test.ts test/unit/providers.test.ts test/unit/skills-list.test.ts test/unit/tools.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/output.ts",
      "src/cli/setup.ts",
      "src/engine/doctor-codex.ts",
      "src/engine/doctor-harness.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-opencode.ts",
      "src/engine/doctor-sdd.ts",
      "src/engine/doctor-specs.ts",
      "src/engine/tools.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/shadow.test.ts",
      "test/unit/doctor-report.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/doctor-cache.test.ts"
    ],
    "changed": [
      "test/unit/doctor-cache.test.ts"
    ]
  }
}
```

## Gates — T1, attempt 2

A gate failed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | FAIL | 1 |
| lint | FAIL | 1 |
| typecheck | FAIL | 2 |
| test | FAIL | 1 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/src/engine/doctor.ts b/src/engine/doctor.ts
index f7944eb..1e81b9d 100644
--- a/src/engine/doctor.ts
+++ b/src/engine/doctor.ts
@@ -1,4 +1,5 @@
 import { existsSync, readdirSync } from 'node:fs';
+import { homedir } from 'node:os';
 import { join } from 'node:path';
 import semver from 'semver';
 import { ADAPTERS } from '../adapters/index.js';
@@ -12,6 +13,7 @@ import { onPath } from '../util/which.js';
 import { isRepo } from '../workspace/detect.js';
 import { planChanges } from '../writer/plan.js';
 import { readCatalog } from './catalog.js';
+import { cacheFindings } from './doctor-cache.js';
 import { harnessFindings } from './doctor-harness.js';
 import { modelFindings } from './doctor-models.js';
 import { branchingFindings, pendingCommitFindings } from './doctor-specs.js';
@@ -102,6 +104,10 @@ export interface DoctorOptions {
   probe?: Probe;
 }
 
+function cacheCheck(root: string, probe: Probe, harnesses: string[]): Finding[] {
+  return cacheFindings(root, process.env.MANDAO_HOME ?? homedir(), process.env, probe, harnesses);
+}
+
 export function runDoctor(root: string, opts: DoctorOptions = {}): Finding[] {
   const probe = opts.probe ?? shellProbe;
   const findings: Finding[] = [];
@@ -149,7 +155,7 @@ export function runDoctor(root: string, opts: DoctorOptions = {}): Finding[] {
   }
   findings.push(...build.warnings.map((m) => ({ level: 'warn' as const, message: m })));
   const recs = readRecommendations();
-  findings.push(...modelFindings(root, config, recs));
+  findings.push(...modelFindings(root, config, recs), ...cacheCheck(root, probe, config.harnesses));
   findings.push(...harnessFindings(root, config, build.files, lockForTools?.files ?? [], recs, probe));
   const catalog = readCatalog();
   findings.push(

--- /dev/null
+++ b/src/engine/doctor-cache.ts (new file)
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import matter from 'gray-matter';
import semver from 'semver';
import type { Finding } from './doctor.js';
import type { Probe } from './tools.js';

const MIN_SETTINGS = '2.1.242';
const MIN_FRONTMATTER = '2.1.248';
const VALID = ['5m', '1h'];
const FIX = 'ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings';
const MAIN_DEFAULT = 'default (1h on a Claude subscription within plan usage, 5m with usage credits, an API key or a cloud provider)';

interface Settings {
  label: string;
  json: Record<string, unknown>;
}

interface Bucket {
  name: string;
  variable: string;
  key: string;
  fallback: string;
}

interface Resolved {
  ttl: string;
  source: string;
}

/** Settings files, highest first. Read only: Mandao never writes Claude Code settings (ADR 0036). */
function readSettings(root: string, home: string, env: Record<string, string | undefined>): { found: Settings[]; skipped: string[] } {
  const userDir = env.CLAUDE_CONFIG_DIR ?? join(home, '.claude');
  const files = [
    { label: '.claude/settings.local.json', path: join(root, '.claude/settings.local.json') },
    { label: '.claude/settings.json', path: join(root, '.claude/settings.json') },
    { label: env.CLAUDE_CONFIG_DIR ? join(userDir, 'settings.json') : '~/.claude/settings.json', path: join(userDir, 'settings.json') },
  ];
  const found: Settings[] = [];
  const skipped: string[] = [];
  for (const f of files) {
    if (!existsSync(f.path)) continue;
    try {
      const json: unknown = JSON.parse(readFileSync(f.path, 'utf8'));
      if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('not an object');
      found.push({ label: f.label, json: json as Record<string, unknown> });
    } catch {
      skipped.push(f.label);
    }
  }
  return { found, skipped };
}

/** A settings `env` block replaces the shell value, so the highest file that defines the variable wins. */
function variable(name: string, settings: Settings[], env: Record<string, string | undefined>): Resolved | undefined {
  for (const s of settings) {
    const block = s.json.env;
    const value = typeof block === 'object' && block !== null ? (block as Record<string, unknown>)[name] : undefined;
    if (typeof value === 'string') return { ttl: value, source: `${name} in the env block of ${s.label}` };
  }
  const value = env[name];
  return value === undefined ? undefined : { ttl: value, source: `${name} in the environment` };
}

function key(name: string, settings: Settings[]): Resolved | undefined {
  for (const s of settings) {
    const value = s.json[name];
    if (value !== undefined) return { ttl: String(value), source: `${name} in ${s.label}` };
  }
  return undefined;
}

/** Agents in .claude/agents/ whose frontmatter sets experimental.cacheTtl. */
function agentOverrides(root: string): { name: string; ttl: string }[] {
  const dir = join(root, '.claude/agents');
  if (!existsSync(dir)) return [];
  const out: { name: string; ttl: string }[] = [];
  for (const file of readdirSync(dir).filter((f) => f.endsWith('.md'))) {
    try {
      const data = matter(readFileSync(join(dir, file), 'utf8')).data as { name?: unknown; experimental?: { cacheTtl?: unknown } };
      const ttl = data.experimental?.cacheTtl;
      if (ttl !== undefined && ttl !== null)
        out.push({ name: typeof data.name === 'string' ? data.name : file.replace(/\.md$/, ''), ttl: String(ttl) });
    } catch {
      // an unreadable agent file is not a TTL source
    }
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

function claudeVersion(probe: Probe): string | undefined {
  const out = probe('claude --version');
  return out ? (semver.coerce(out)?.version ?? undefined) : undefined;
}

/** The finding for the prompt-cache TTL of Claude Code, resolved the way Claude Code does (D1). Read only. */
export function cacheFindings(
  root: string,
  home: string,
  env: Record<string, string | undefined>,
  probe: Probe,
  harnesses: string[] = ['claude'],
): Finding[] {
  if (!harnesses.includes('claude')) return [];
  const { found, skipped } = readSettings(root, home, env);
  const version = claudeVersion(probe);
  const supported = version === undefined || semver.gte(version, MIN_SETTINGS);
  const warns: Finding[] = [];
  const valid = (r: Resolved | undefined, what: string): Resolved | undefined => {
    if (!r) return undefined;
    if (VALID.includes(r.ttl)) return r;
    warns.push({
      level: 'warn',
      message: `${what} is ${r.ttl} (${r.source}), which is not 5m or 1h and is ignored by Claude Code`,
      fix: 'set it to 5m or 1h, or remove it',
    });
    return undefined;
  };
  const force = variable('FORCE_PROMPT_CACHING_5M', found, env)?.ttl === '1';
  const enable = variable('ENABLE_PROMPT_CACHING_1H', found, env)?.ttl === '1';
  const forced: Resolved = { ttl: '5m', source: 'FORCE_PROMPT_CACHING_5M' };
  const enabled: Resolved = { ttl: '1h', source: 'ENABLE_PROMPT_CACHING_1H' };
  const agents = version === undefined || semver.gte(version, MIN_FRONTMATTER) ? agentOverrides(root) : [];

  const resolve = (b: Bucket): string => {
    const steps: (() => Resolved | undefined)[] = [
      () => (supported && force ? forced : undefined),
      () => (supported ? valid(variable(b.variable, found, env), b.variable) : undefined),
      () => (supported ? valid(key(b.key, found), b.key) : undefined),
      () => (supported && enable ? enabled : undefined),
    ];
    for (const step of steps) {
      const r = step();
      if (r) return `${b.name} ${r.ttl} from ${r.source}`;
    }
    return `${b.name} ${b.fallback}`;
  };

  const main = resolve({ name: 'main', variable: 'CLAUDE_CODE_PROMPT_CACHE_TTL', key: 'promptCacheTtl', fallback: MAIN_DEFAULT });
  const sub = resolve({
    name: 'subagents',
    variable: 'CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL',
    key: 'subagentPromptCacheTtl',
    fallback: 'default 5m',
  });

  const parts = [main, sub];
  const unsetAll = !found.some((s) => s.json.promptCacheTtl !== undefined || s.json.subagentPromptCacheTtl !== undefined);
  if (unsetAll && main.includes('default') && sub.includes('default')) parts.unshift('promptCacheTtl and subagentPromptCacheTtl are unset');
  const subDefault = sub.includes('default');
  for (const a of subDefault ? agents : []) {
    parts.push(`agent ${a.name} overrides the subagent TTL with ${a.ttl} (Claude Code ${MIN_FRONTMATTER}+)`);
  }
  if (version === undefined) parts.push(`Claude Code version not checked (the TTL variables and keys need ${MIN_SETTINGS}+)`);
  else if (!supported)
    parts.push(`Claude Code ${version} ignores the TTL variables and keys (they need ${MIN_SETTINGS}+), so the default applies`);
  if (skipped.length) parts.push(`unreadable settings skipped: ${skipped.join(', ')}`);
  parts.push(
    'managed settings and --settings rank higher but are not read; the Desktop app and self-hosted runners build their own launch environment',
  );

  return [...warns, { level: 'info', message: `prompt-cache TTL: ${parts.join('; ')}`, fix: FIX }];
}

--- /dev/null
+++ b/test/unit/doctor-cache.test.ts (new file)
import { mkdirSync, readFileSync, statSync, utimesSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import type { Finding } from '../../src/engine/doctor.js';
import { cacheFindings } from '../../src/engine/doctor-cache.js';
import type { Probe } from '../../src/engine/tools.js';
import { makeTree, removeTrees } from '../helpers.js';

// MDO-0008 T1 (AC-1): doctor reports the Claude Code prompt-cache TTL and its source (D1).
// ASSUMPTION: cacheFindings(root, home, env, probe) is the unit under test, pure over its inputs.

let root: string;
let home: string;
beforeEach(() => {
  root = makeTree({});
  home = makeTree({});
});
afterEach(removeTrees);

const current: Probe = () => '2.1.250 (Claude Code)';
const put = (file: string, content: string) => {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
  return file;
};
const user = (obj: object) => put(join(home, '.claude/settings.json'), JSON.stringify(obj));
const project = (obj: object) => put(join(root, '.claude/settings.json'), JSON.stringify(obj));
const local = (obj: object) => put(join(root, '.claude/settings.local.json'), JSON.stringify(obj));
const run = (env: Record<string, string> = {}, probe: Probe = current): Finding[] => cacheFindings(root, home, env, probe);
const info = (fs: Finding[]) => fs.find((f) => f.level === 'info');
const text = (f?: Finding) => `${f?.message ?? ''}\n${f?.fix ?? ''}`;

describe('doctor reports the prompt-cache TTL (AC-1)', () => {
  test('S-1.1: nothing set gives an info with both defaults and the ADR 0036 fix', () => {
    const fs = run();
    expect(fs.filter((f) => f.level !== 'info')).toEqual([]);
    const f = info(fs);
    expect(f).toBeDefined();
    expect(f?.message).toMatch(/unset/i);
    expect(f?.message).toMatch(/1h/);
    expect(f?.message).toMatch(/5m/);
    expect(f?.message).toMatch(/subscription/i);
    expect(f?.message).toMatch(/subagents?[^.]*5m/i);
    expect(f?.fix).toBe('ADR 0036 recommends promptCacheTtl: 5m; Mandao never writes Claude Code settings');
  });

  test('S-1.2: the highest file wins for a key and the environment wins for a variable; nothing is touched (C1)', () => {
    const userFile = user({ promptCacheTtl: '1h' });
    const localFile = local({ promptCacheTtl: '5m' });
    const old = new Date('2020-01-01T00:00:00Z');
    for (const f of [userFile, localFile]) utimesSync(f, old, old);
    const before = [userFile, localFile].map((f) => [readFileSync(f, 'utf8'), statSync(f).mtimeMs]);
    const fs = run({ CLAUDE_CODE_SUBAGENT_PROMPT_CACHE_TTL: '1h' });
    const msg = info(fs)?.message ?? '';
    expect(msg).toMatch(/main[^.;]*5m[^.;]*\.claude\/settings\.local\.json/);
    expect(msg).toMatch(/subagents?[^.;]*1h[^.;]*environment/i);
    // S-1.2/C1: content and modification times identical, and no file created
    const after = [userFile, localFile].map((f) => [readFileSync(f, 'utf8'), statSync(f).mtimeMs]);
    expect(after).toEqual(before);
    expect(() => statSync(join(root, '.claude/settings.json'))).toThrow();
  });

  test('S-1.3 and S-1.3/C2: an invalid value warns, is named, and the default stays in effect', () => {
    project({ promptCacheTtl: '10m' });
    const fs = run();
    const warn = fs.find((f) => f.level === 'warn');
    expect(warn).toBeDefined();
    expect(warn?.message).toContain('.claude/settings.json');
    expect(warn?.message).toContain('10m');
    expect(warn?.message).toMatch(/not 5m or 1h/);
    expect(warn?.message).toMatch(/ignored by Claude Code/);
    const main = text(info(fs));
    expect(main).toMatch(/default/i);
    expect(main).not.toMatch(/main[^.;]*10m/i);
    expect(main).not.toMatch(/10m[^.;]*in effect/i);
  });

  test('S-1.3/C2: an ignored value goes on to the next step instead of winning', () => {
    project({ promptCacheTtl: '10m' });
    const fs = run({ ENABLE_PROMPT_CACHING_1H: '1' });
    expect(info(fs)?.message).toMatch(/main[^.;]*1h[^.;]*ENABLE_PROMPT_CACHING_1H/);
    expect(info(fs)?.message ?? '').not.toMatch(/main[^.;]*10m/i);
  });

  test('S-1.4: no cache-TTL finding without Claude Code is a wiring concern, so the unit never runs for it', () => {
    // The harness gate lives in runDoctor: it must call cacheFindings only when `claude` is a harness.
    // Proven here by the exported guard, which returns nothing when claude is absent.
    expect(cacheFindings(root, home, {}, current, ['codex'])).toEqual([]);
    expect(cacheFindings(root, home, {}, current, ['claude']).length).toBeGreaterThan(0);
  });

  test('S-1.5: FORCE_PROMPT_CACHING_5M beats the key for both TTLs', () => {
    user({ promptCacheTtl: '1h' });
    const msg = info(run({ FORCE_PROMPT_CACHING_5M: '1' }))?.message ?? '';
    expect(msg).toMatch(/main[^.;]*5m[^.;]*FORCE_PROMPT_CACHING_5M/);
    expect(msg).toMatch(/subagents?[^.;]*5m[^.;]*FORCE_PROMPT_CACHING_5M/i);
  });

  test('S-1.5: ENABLE_PROMPT_CACHING_1H gives main 1h while the subagent key stays 5m', () => {
    user({ subagentPromptCacheTtl: '5m' });
    const msg = info(run({ ENABLE_PROMPT_CACHING_1H: '1' }))?.message ?? '';
    expect(msg).toMatch(/main[^.;]*1h[^.;]*ENABLE_PROMPT_CACHING_1H/);
    expect(msg).toMatch(/subagents?[^.;]*5m[^.;]*subagentPromptCacheTtl/i);
  });

  test('S-1.6: an agent whose frontmatter sets experimental.cacheTtl is named with its value', () => {
    put(join(root, '.claude/agents/scribe.md'), '---\nname: scribe\nexperimental:\n  cacheTtl: 1h\n---\nBody\n');
    put(join(root, '.claude/agents/plain.md'), '---\nname: plain\n---\nBody\n');
    const msg = info(run())?.message ?? '';
    expect(msg).toContain('scribe');
    expect(msg).toMatch(/scribe[^.;]*1h/);
    expect(msg).toContain('2.1.248');
    expect(msg).not.toContain('plain');
  });

  test('S-1.7: an old Claude Code ignores the TTL settings, so the default is reported', () => {
    local({ promptCacheTtl: '1h' });
    const f = info(run({}, () => '2.1.200 (Claude Code)'));
    const msg = text(f);
    expect(msg).toContain('2.1.242');
    expect(msg).toMatch(/ignores/i);
    expect(msg).toMatch(/default/i);
    expect(f?.message ?? '').not.toMatch(/main[^.;]*1h[^.;]*settings\.local/);
  });

  test('S-1.7: with no version available it says the version was not checked', () => {
    expect(text(info(run({}, () => undefined)))).toMatch(/version[^.;]*not checked/i);
  });
});

--- /dev/null
+++ b/test/unit/session-turns.test.ts (new file)
import { join } from 'node:path';
import { afterAll, describe, expect, test } from 'vitest';
import { measureSessions } from '../../src/scripts/session-turns.js';
import { makeTree, removeTrees } from '../helpers.js';

afterAll(removeTrees);

/**
 * API under test (MDO-0008 T2, D2 and D3), as the tests below fix it:
 *   measureSessions({ specDir, commitTimes, home })
 *   - specDir: holds `_log/costs.yml`; home: Claude config dir (`<home>/projects/<slug>/<session>.jsonl`)
 *   - commitTimes: task id -> commit times in ms (what `taskCommitTimes` returns for the spec)
 *   - result: { missing: string[], pauses?: { count, medianMinutes, atMost5, between5And60, over60 },
 *               tasks: Record<task, number>, unmeasured: string[], verify?: number,
 *               close: number | 'not recorded', afterTasks?: number }
 * Fixtures are synthetic: made-up ids, no prompt text of any real person.
 */

const T0 = Date.parse('2026-01-05T10:00:00.000Z');
const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();
const j = (o: object) => JSON.stringify(o);

const usage = { input_tokens: 2, cache_read_input_tokens: 1000, cache_creation_input_tokens: 10, output_tokens: 5 };
const reply = (id: string, minutes: number, extra: object = {}) =>
  j({ type: 'assistant', timestamp: at(minutes), message: { id, model: 'claude-opus-5-5', usage }, ...extra });
const prompt = (minutes: number, content: unknown = 'synthetic prompt') =>
  j({ type: 'user', timestamp: at(minutes), message: { role: 'user', content } });

const costRecord = (command: string, minutes: number, session: string, harness = 'claude') =>
  `  - at: ${at(minutes)}\n    command: ${command}\n    harness: ${harness}\n    session: ${session}\n    usd: 0.5\n    source: claude-code\n`;
const costsYml = (...records: string[]) => `costs:\n${records.join('')}`;

/** A spec folder with its cost log, and a Claude home with each session's transcript. */
function fixture(costs: string, transcripts: Record<string, string>, subagents: Record<string, string> = {}, cuts?: string) {
  const files: Record<string, string> = { 'spec/_log/costs.yml': costs, 'home/projects/-synthetic-repo/': '' };
  if (cuts !== undefined) files['spec/_log/session-cuts.md'] = cuts;
  for (const [id, body] of Object.entries(transcripts)) files[`home/projects/-synthetic-repo/${id}.jsonl`] = body;
  for (const [path, body] of Object.entries(subagents)) files[`home/projects/-synthetic-repo/${path}`] = body;
  const root = makeTree(files);
  return { specDir: join(root, 'spec'), home: join(root, 'home') };
}

describe('the pauses before each user turn (S-2.1)', () => {
  // Prompts 1, 7 and 75 minutes after the previous main response, plus lines that are not user turns.
  const transcript = [
    prompt(0), // the session's first prompt: no previous response, not a pause
    reply('r1', 0.5),
    j({ type: 'user', timestamp: at(1.5), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: 'ok' }] } }),
    prompt(1.5, [{ type: 'text', text: 'a prompt as a text block' }]), // 1 minute after r1
    reply('r2', 2),
    j({ type: 'user', isMeta: true, timestamp: at(8), message: { role: 'user', content: 'synthetic meta line' } }),
    j({ type: 'user', timestamp: at(8), message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't2', content: 'ok' }] } }),
    prompt(9), // 7 minutes after r2
    reply('r3', 9.5),
    prompt(84.5), // 75 minutes after r3
    reply('r4', 85),
  ].join('\n');

  test('three pauses: median 7 minutes, one at most 5, one between 5 and 60, one over 60', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 90, 'sess-pauses')), { 'sess-pauses': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.pauses).toEqual({ count: 3, medianMinutes: 7, atMost5: 1, between5And60: 1, over60: 1 });
  });

  test('S-2.1/C1: the first prompt, tool results and meta lines are left out', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 90, 'sess-pauses')), { 'sess-pauses': transcript });
    const { pauses } = measureSessions({ specDir, home, commitTimes: new Map() });
    // Counting the first prompt, the two tool results or the meta line would make more than three pauses.
    expect(pauses?.count).toBe(3);
  });
});

describe('the main turns of each task, verify and close (S-2.2)', () => {
  // Minutes: T1 commits at 2.5 (an earlier commit at 1.2 too), T2 at 4.5, implement recorded at 6.5,
  // verify at 8.5, close at 11.5. Streamed responses repeat their id on several lines.
  const transcript = [
    reply('a1', 0.5),
    reply('a2', 1.0),
    reply('a2', 1.0), // same response id, written again as it streams
    reply('a3', 2.0),
    reply('a4', 3.0),
    reply('a5', 4.0),
    reply('a5', 4.0),
    reply('a5', 4.0),
    reply('a6', 5.0),
    reply('a7', 6.0),
    reply('a8', 7.0),
    reply('a9', 8.0),
    reply('b1', 9.0),
    reply('b2', 10.0),
    reply('b3', 11.0),
  ].join('\n');
  const records = costsYml(
    costRecord('implement', 6.5, 'sess-turns'),
    costRecord('verify', 8.5, 'sess-turns'),
    costRecord('close', 11.5, 'sess-turns'),
  );
  const commitTimes = new Map([
    ['T1', [T0 + 1.2 * 60_000, T0 + 2.5 * 60_000]],
    ['T2', [T0 + 4.5 * 60_000]],
  ]);

  test('each task, verify and close get the responses of their windows; after tasks is tail + verify + close', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const result = measureSessions({ specDir, home, commitTimes });
    expect(result.missing).toEqual([]);
    expect(result.tasks).toEqual({ T1: 3, T2: 2 }); // a1-a3 up to T1's last commit; a4-a5 up to T2's
    expect(result.verify).toBe(2); // a8 and a9: (6.5, 8.5]
    expect(result.close).toBe(3); // b1-b3: (8.5, 11.5]
    expect(result.afterTasks).toBe(2 + 2 + 3); // implement tail a6-a7, verify, close
    expect(result.unmeasured).toEqual([]);
  });

  test('S-2.2/C1: a response written on several lines is one turn', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const result = measureSessions({ specDir, home, commitTimes });
    // 8 transcript lines fall in T1 and T2's windows; only 5 distinct response ids do.
    expect(result.tasks?.T2).toBe(2);
    expect(Object.values(result.tasks ?? {}).reduce((a, b) => a + b, 0)).toBe(5);
  });

  test('a task committed outside every implement window is listed as unmeasured', () => {
    const { specDir, home } = fixture(records, { 'sess-turns': transcript });
    const late = new Map([...commitTimes, ['T3', [T0 + 40 * 60_000]]]);
    const result = measureSessions({ specDir, home, commitTimes: late });
    expect(result.unmeasured).toEqual(['T3']);
    expect(result.tasks).toEqual({ T1: 3, T2: 2 });
  });
});

describe('missing data is named, never zero (S-2.3)', () => {
  const records = costsYml(
    costRecord('specify', 5, 'sess-gone'),
    costRecord('implement', 30, 'sess-gone'),
    costRecord('implement', 31, 'sess-other-harness', 'codex'),
  );

  test('S-2.3/C1: a session without a transcript is listed as missing, with no counts, and close is not recorded', () => {
    const { specDir, home } = fixture(records, {});
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.missing).toEqual(['sess-gone']); // the codex record is not a Claude Code session
    expect(result.tasks).toEqual({});
    expect(result.verify).toBeUndefined();
    expect(result.afterTasks).toBeUndefined();
    expect(result.pauses).toBeUndefined(); // not zero pauses
    expect(result.close).toBe('not recorded');
  });

  test('S-2.3: the measured session still counts while the missing one is named', () => {
    const both = costsYml(costRecord('implement', 6.5, 'sess-gone'), costRecord('implement', 20, 'sess-here'));
    const transcript = [reply('m1', 10), reply('m2', 11)].join('\n');
    const { specDir, home } = fixture(both, { 'sess-here': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map([['T1', [T0 + 12 * 60_000]]]) });
    expect(result.missing).toEqual(['sess-gone']);
    expect(result.tasks).toEqual({ T1: 2 });
  });
});

describe('subagents are not main turns (S-2.4)', () => {
  test('S-2.4/C2: sidechain lines and the subagents folder add no main-session turn', () => {
    const main = [
      reply('m1', 0.5),
      reply('s1', 0.6, { isSidechain: true }),
      reply('s2', 0.7, { isSidechain: true }),
      reply('m2', 1.0),
    ].join('\n');
    const sub = [reply('x1', 0.8), reply('x2', 0.9), reply('x3', 1.1)].join('\n');
    const { specDir, home } = fixture(
      costsYml(costRecord('implement', 3, 'sess-sub')),
      { 'sess-sub': main },
      { 'sess-sub/subagents/agent-synthetic.jsonl': sub, 'sess-sub/subagents/agent-synthetic.meta.json': j({ agentType: 'mandao-reviewer' }) },
    );
    const result = measureSessions({ specDir, home, commitTimes: new Map([['T1', [T0 + 2 * 60_000]]]) });
    expect(result.tasks).toEqual({ T1: 2 }); // m1 and m2 only
    expect(result.afterTasks).toBe(0);
  });
});

/** A main response with its own usage, optionally calling a tool (a subagent is called through `Agent`). */
const sized = (id: string, minutes: number, u: { input: number; read: number; write: number }, tool?: string, extra: object = {}) =>
  j({
    type: 'assistant',
    timestamp: at(minutes),
    message: {
      id,
      model: 'claude-opus-5-5',
      usage: { input_tokens: u.input, cache_read_input_tokens: u.read, cache_creation_input_tokens: u.write, output_tokens: 5 },
      content: tool ? [{ type: 'tool_use', id: `tu-${id}`, name: tool, input: {} }] : [{ type: 'text', text: 'synthetic' }],
    },
    ...extra,
  });

describe('what a new session reloads (D3)', () => {
  // First response 0 + 0 + 6_000 tokens; the first subagent call 2 + 9_000 + 3_000 = 12_002.
  const transcript = [
    sized('r1', 0.5, { input: 0, read: 0, write: 6_000 }),
    sized('r2', 1, { input: 1, read: 6_000, write: 100 }, 'Bash'), // a tool, not a subagent
    sized('s1', 1.5, { input: 1, read: 90_000, write: 0 }, 'Agent', { isSidechain: true }), // not a main response
    sized('r3', 2, { input: 2, read: 9_000, write: 3_000 }, 'Agent'), // the first main response that calls a subagent
    sized('r4', 3, { input: 2, read: 50_000, write: 4_000 }, 'Agent'), // later calls do not matter
  ].join('\n');

  test('the prompt size of the first subagent call minus that of the first response', () => {
    const { specDir, home } = fixture(costsYml(costRecord('implement', 5, 'sess-reload')), { 'sess-reload': transcript });
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.reload).toBe(12_002 - 6_000);
  });

  test('a session that starts with verify has a reload too', () => {
    const { specDir, home } = fixture(costsYml(costRecord('verify', 5, 'sess-reload')), { 'sess-reload': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).reload).toBe(6_002);
  });

  test('a session whose first record is another command has no reload, and never a zero', () => {
    const records = costsYml(costRecord('specify', 1, 'sess-reload'), costRecord('implement', 5, 'sess-reload'));
    const { specDir, home } = fixture(records, { 'sess-reload': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).reload).toBeUndefined();
  });

  test('no subagent call, or no transcript, gives no reload', () => {
    const calls = [sized('r1', 0.5, { input: 0, read: 0, write: 6_000 }), sized('r2', 1, { input: 1, read: 6_000, write: 0 }, 'Bash')].join('\n');
    const noCall = fixture(costsYml(costRecord('implement', 5, 'sess-a')), { 'sess-a': calls });
    expect(measureSessions({ ...noCall, commitTimes: new Map() }).reload).toBeUndefined();
    const gone = fixture(costsYml(costRecord('implement', 5, 'sess-b')), {});
    expect(measureSessions({ ...gone, commitTimes: new Map() }).reload).toBeUndefined();
  });
});

describe('the turns that followed each logged cut estimate (D4 actuals, from D2 and D3)', () => {
  // After the boundary at 4.5 the main responses a6..a9 and b1..b3 are 7 turns up to the close record at
  // 11.5; a7 is written twice, x1 is a sidechain line, `late` comes after the close record.
  const transcript = [
    reply('a1', 0.5),
    reply('a3', 2.0),
    reply('a5', 4.0),
    reply('a6', 5.0),
    reply('a7', 6.0),
    reply('a7', 6.0),
    reply('a8', 7.0),
    reply('a9', 8.0),
    reply('x1', 9.0, { isSidechain: true }),
    reply('b1', 9.5),
    reply('b2', 10.0),
    reply('b3', 11.0),
    reply('late', 12.0),
  ].join('\n');
  const header = '# Session cut estimates (ADR 0038)\n\n| At | Task | Context | Base | Turns left | Savings (USD) | Decision |\n|---|---|---|---|---|---|---|\n';
  const row = `| ${at(4.5)} | T2 | 125542 | 43865 | 43 | 0.35 | cut |\n`;
  const withClose = costsYml(costRecord('implement', 6.5, 'sess-est'), costRecord('close', 11.5, 'sess-est'));

  test('a row shows its estimate and the main turns after its time up to the close record', () => {
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript }, {}, header + row);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([{ at: at(4.5), task: 'T2', estimated: 43, actual: 7 }]);
  });

  test('the header is not a row, and each row gets its own actual', () => {
    const later = `| ${at(8.2)} | T3 | 90000 | 40000 | 28 | -0.10 | stay |\n`;
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript }, {}, header + row + later);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([
      { at: at(4.5), task: 'T2', estimated: 43, actual: 7 },
      { at: at(8.2), task: 'T3', estimated: 28, actual: 3 }, // b1, b2, b3 after 8.2 and before 11.5
    ]);
  });

  test('without a close record the actual is not known, never zero', () => {
    const open = costsYml(costRecord('implement', 6.5, 'sess-est'));
    const { specDir, home } = fixture(open, { 'sess-est': transcript }, {}, header + row);
    const result = measureSessions({ specDir, home, commitTimes: new Map() });
    expect(result.estimates).toEqual([{ at: at(4.5), task: 'T2', estimated: 43, actual: undefined }]);
  });

  test('no session-cuts.md gives no estimates', () => {
    const { specDir, home } = fixture(withClose, { 'sess-est': transcript });
    expect(measureSessions({ specDir, home, commitTimes: new Map() }).estimates).toEqual([]);
  });
});

```
