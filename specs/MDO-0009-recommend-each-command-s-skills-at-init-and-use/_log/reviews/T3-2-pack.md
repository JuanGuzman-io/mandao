# Review pack — T3, attempt 2

Review exactly this task. The Leader already ran the gates and the impacted tests; their full output is in
`_log/gates/T3-2.md`.

## Brief

```json
{
  "spec": "MDO-0009-recommend-each-command-s-skills-at-init-and-use",
  "task": {
    "project": "mandao",
    "kind": "feat",
    "tier": "standard",
    "files": [
      "src/engine/doctor-skills.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-skills.test.ts",
      "test/integration/engine.test.ts"
    ],
    "exemplar": "src/engine/doctor-codex.ts",
    "ac": [
      "AC-5",
      "AC-5/C1"
    ],
    "scenarios": [
      "S-6.1",
      "S-6.2",
      "S-6.2/C1"
    ],
    "test_levels": {
      "S-6.1": "unit",
      "S-6.2": "unit",
      "S-6.2/C1": "e2e"
    },
    "evidence": "tdd",
    "risk_tags": [],
    "depends_on": [
      "T1",
      "T2"
    ],
    "parallel_safe": false,
    "verify": "npx vitest run test/unit/doctor-skills.test.ts test/integration/engine.test.ts test/integration/doctor-cli.test.ts",
    "tests": {
      "unit": [
        "S-6.1",
        "S-6.2"
      ],
      "e2e": [
        "S-6.2/C1"
      ]
    },
    "dod": [],
    "characterization": false,
    "id": "T3",
    "title": "doctor names the commands that lose a missing skill",
    "done": false,
    "line": 441
  },
  "acceptance": [
    {
      "ref": "AC-5",
      "text": "**GIVEN** a workspace where a skill used by a command is not installed · **WHEN** the person runs `mandao doctor` · **THEN** doctor reports the skill, the commands that lose it, what they do without it, and how to install it · **BUT it must NOT** turn the doctor of a freshly initialized workspace into a failing one"
    },
    {
      "ref": "AC-5/C1",
      "text": "**BUT it must NOT** turn the doctor of a freshly initialized workspace into a failing one"
    }
  ],
  "scenarios": [
    {
      "ref": "S-6.1",
      "text": "**Given** brainstorming pinned in the lock and not found · **When** `mandao doctor` runs · **Then** a `warn` finding reads like `brainstorming is missing: constitution, story, specify lose it (<fallback>)` with the fix `mandao skills add brainstorming`"
    },
    {
      "ref": "S-6.2",
      "text": "**Given** a freshly initialized workspace where no skill was installed · **When** `mandao doctor` runs · **Then** each missing skill gives an `info` finding with the same content as S-6.1 · **BUT it must NOT** add any `warn` or `error` finding, so the critical flow stays clean"
    },
    {
      "ref": "S-6.2/C1",
      "text": "**BUT it must NOT** add any `warn` or `error` finding, so the critical flow stays clean"
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
    "| codebase-conventions | stack | specify, implement, verify | `src/`, `test/`, `core/` | project skill in `.claude/skills/codebase-conventions/`; Codex copy in `.agents/skills/codebase-conventions/`; generated with skill-creator from `docs/constitution/standards.md` and `architecture.md` |"
  ],
  "lenses": [],
  "loop": {
    "task": "T3",
    "tier": "standard",
    "attempt": 2,
    "failsAtTier": 1,
    "tdd": {
      "required": true,
      "testsBy": "implementer",
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
      "test/integration/enforced-rules.test.ts",
      "test/integration/init-skills.test.ts",
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
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/schemas.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "files": [
      "src/engine/doctor-skills.ts",
      "src/engine/doctor.ts",
      "test/unit/doctor-skills.test.ts",
      "test/integration/engine.test.ts",
      "test/integration/approve.test.ts",
      "test/integration/branching.test.ts",
      "test/integration/characterization.test.ts",
      "test/integration/cli.test.ts",
      "test/integration/close.test.ts",
      "test/integration/costs.test.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/enforced-rules.test.ts",
      "test/integration/init-skills.test.ts",
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
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-codex.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/doctor-sdd.test.ts",
      "test/unit/model-profiles.test.ts",
      "test/unit/models.test.ts",
      "test/unit/providers.test.ts",
      "test/unit/schemas.test.ts",
      "test/unit/skills-list.test.ts",
      "test/unit/tools.test.ts"
    ],
    "command": "npx vitest related {files} --run --maxWorkers={workers}",
    "confidence": "high",
    "notes": [],
    "commandForBudget": "npx vitest related src/engine/doctor-skills.ts src/engine/doctor.ts test/unit/doctor-skills.test.ts test/integration/engine.test.ts test/integration/approve.test.ts test/integration/branching.test.ts test/integration/characterization.test.ts test/integration/cli.test.ts test/integration/close.test.ts test/integration/costs.test.ts test/integration/doctor-cli.test.ts test/integration/enforced-rules.test.ts test/integration/init-skills.test.ts test/integration/leader-scripts.test.ts test/integration/lite-spec.test.ts test/integration/mdo-0004-defects.test.ts test/integration/mdo-0005-defects.test.ts test/integration/mdo-0006-defects.test.ts test/integration/premise.test.ts test/integration/shadow.test.ts test/integration/spec-log.test.ts test/integration/start.test.ts test/integration/tdd.test.ts test/unit/doctor-cache.test.ts test/unit/doctor-codex.test.ts test/unit/doctor-report.test.ts test/unit/doctor-sdd.test.ts test/unit/model-profiles.test.ts test/unit/models.test.ts test/unit/providers.test.ts test/unit/schemas.test.ts test/unit/skills-list.test.ts test/unit/tools.test.ts --run --maxWorkers=1"
  },
  "graph": {
    "source": "graphify",
    "dependents": [
      "src/cli/output.ts",
      "src/cli/setup.ts",
      "src/engine/doctor-cache.ts",
      "src/engine/doctor-codex.ts",
      "src/engine/doctor-harness.ts",
      "src/engine/doctor-models.ts",
      "src/engine/doctor-opencode.ts",
      "src/engine/doctor-sdd.ts",
      "src/engine/doctor-specs.ts",
      "src/engine/tools.ts",
      "test/integration/doctor-cli.test.ts",
      "test/integration/shadow.test.ts",
      "test/unit/doctor-cache.test.ts",
      "test/unit/doctor-report.test.ts",
      "test/unit/schemas.test.ts"
    ]
  },
  "redTests": {
    "files": [
      "test/unit/doctor-skills.test.ts",
      "test/integration/engine.test.ts"
    ],
    "changed": []
  }
}
```

## Gates — T3, attempt 2

Every configured gate passed.

| Gate | Status | Exit |
|---|---|---|
| scan-markers | PASS | — |
| format | PASS | 0 |
| lint | PASS | 0 |
| typecheck | PASS | 0 |
| test | PASS | 0 |
| build | PASS | 0 |
| secrets | NOT_INSTALLED | 127 |
| audit | SKIPPED | — |
| sast | NOT_INSTALLED | 127 |
| metrics | PASS | 0 |


## Diff

```diff
diff --git a/docs/cli.md b/docs/cli.md
index 8141c02..b276f85 100644
--- a/docs/cli.md
+++ b/docs/cli.md
@@ -6,7 +6,7 @@
 |---|---|
 | `mandao init [dir]` | Set up the workspace (or `[dir]`, created with `git init` if needed). `--harness`, `--profile <app\|ai\|data>` (work type), `--model-profile <peak\|balanced\|economy>`, `--budget <usd\|none>`, `--shadow`, `--with-scripts` (see [Skills at init](#skills-at-init)), `--scope global` for `/mandao-init`, `--yes` for no prompts |
 | `mandao sync` | Regenerate harness files from `.mandao/config.yml`; never overwrites hand edits without `--force`; `--dry-run` shows the changes |
-| `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks |
+| `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks; name each command skill that is not installed for a configured harness, the commands that lose it, its fallback and `mandao skills add <id>` (`warn` when the lock pins it, `info` when it was never installed) |
 | `mandao doctor --json` | Same findings as one JSON document for CI (`counts` per level, `findings`); nothing else on stdout. See [schemas.md](schemas.md) |
 | `mandao update` | Re-resolve with the installed version; overrides and model choices are never touched |
 | `mandao harness add <id...>` | Generate files for more harnesses |
diff --git a/src/engine/doctor.ts b/src/engine/doctor.ts
index 63003ab..04151a4 100644
--- a/src/engine/doctor.ts
+++ b/src/engine/doctor.ts
@@ -15,6 +15,7 @@ import { readCatalog } from './catalog.js';
 import { cacheFindings } from './doctor-cache.js';
 import { harnessFindings } from './doctor-harness.js';
 import { modelFindings } from './doctor-models.js';
+import { skillFindings } from './doctor-skills.js';
 import { branchingFindings, pendingCommitFindings } from './doctor-specs.js';
 import { ConfigError, hasConfig, inputsText, LOCK_FILE, readConfig, readLock, readSources, SOURCES_FILE } from './files.js';
 import { globalLockFile, home } from './global.js';
@@ -107,6 +108,16 @@ function cacheCheck(root: string, probe: Probe, harnesses: string[]): Finding[]
   return cacheFindings(root, home(), process.env, probe, harnesses);
 }
 
+/** Catalog tools (versions) and the skills the commands use, against the lock's pins. */
+function catalogFindings(root: string, config: Config, skills: { id: string }[], probe: Probe): Finding[] {
+  const catalog = readCatalog();
+  const pinned = skills.map((s) => s.id);
+  return [
+    ...skillFindings({ catalog, pinned, harnesses: config.harnesses, root, home: home() }),
+    ...toolVersionFindings(catalog, [...new Set([...catalog.bootstrap, ...pinned])], probe),
+  ];
+}
+
 export function runDoctor(root: string, opts: DoctorOptions = {}): Finding[] {
   const probe = opts.probe ?? shellProbe;
   const findings: Finding[] = [];
@@ -156,10 +167,7 @@ export function runDoctor(root: string, opts: DoctorOptions = {}): Finding[] {
   const recs = readRecommendations();
   findings.push(...modelFindings(root, config, recs), ...cacheCheck(root, probe, config.harnesses));
   findings.push(...harnessFindings(root, config, build.files, lockForTools?.files ?? [], recs, probe));
-  const catalog = readCatalog();
-  findings.push(
-    ...toolVersionFindings(catalog, [...new Set([...catalog.bootstrap, ...(lockForTools?.skills ?? []).map((s) => s.id)])], probe),
-  );
+  findings.push(...catalogFindings(root, config, lockForTools?.skills ?? [], probe));
 
   const lock = readLock(join(root, LOCK_FILE));
   if (!lock) {
diff --git a/src/skills/AGENTS.md b/src/skills/AGENTS.md
index 88b54c4..2af5d66 100644
--- a/src/skills/AGENTS.md
+++ b/src/skills/AGENTS.md
@@ -13,6 +13,9 @@ pin it in the lock (`installSkills`, `pinSkills` in `install.ts`; `commandSkills
   never pinned with a commit nobody checked. A copy that fails midway removes the targets this call
   created and returns `failed`. Each git call has a timeout and runs ssh in `BatchMode` (no prompt can
   block init); a timeout is `pending`.
+- `readableSkillFolders(harness)` is the folder map for detection (`src/engine/doctor-skills.ts`):
+  the harness's own folder, plus `.claude/skills` and `.agents/skills` for OpenCode and Copilot.
+  Copy targets stay `skillFolders`.
 - Scripts (executable bit, script extension, or under `scripts/`) are left out and named unless
   `withScripts`; then `warn` is called before any copy and the lock records `scripts: true`.
 - `pending` means the person must act (tool missing, fetch failed: the detail is the manual step);
diff --git a/src/skills/install.ts b/src/skills/install.ts
index 6873a10..b3c1124 100644
--- a/src/skills/install.ts
+++ b/src/skills/install.ts
@@ -90,6 +90,11 @@ const HARNESS_FOLDER: Record<HarnessId, string> = {
 const READS_SHARED: readonly HarnessId[] = ['opencode', 'copilot'];
 const SHARED_FOLDERS = ['.claude/skills', '.agents/skills'];
 
+/** Pure: every project skills folder this harness reads, its own first (detection, unlike the copy target). */
+export function readableSkillFolders(harness: HarnessId): string[] {
+  return [...new Set([HARNESS_FOLDER[harness], ...(READS_SHARED.includes(harness) ? SHARED_FOLDERS : [])])];
+}
+
 /** Pure: the folders a skill is copied into for these harnesses, each once. */
 export function skillFolders(harnesses: readonly HarnessId[]): string[] {
   const out: string[] = [];
diff --git a/test/integration/engine.test.ts b/test/integration/engine.test.ts
index 7fdb545..d07aca9 100644
--- a/test/integration/engine.test.ts
+++ b/test/integration/engine.test.ts
@@ -107,6 +107,17 @@ describe('doctor', () => {
     );
   });
 
+  test('S-6.2/C1: a fresh workspace reports the skills it lacks as info, never as warn or error', () => {
+    const root = workspace();
+    syncProject(root);
+    const findings = runDoctor(root, { probe });
+    expect(findings.filter((f) => f.level === 'error' || f.level === 'warn')).toEqual([]);
+    const missing = findings.filter((f) => f.message.includes(' is missing: '));
+    expect(missing.map((f) => f.level)).toEqual(missing.map(() => 'info'));
+    expect(missing.map((f) => f.message.split(' ')[0])).toContain('brainstorming');
+    expect(missing.filter((f) => f.message.includes('graphify'))).toEqual([]);
+  });
+
   test('a task waiting for its commit is a warning with the command that commits it', () => {
     const root = workspace();
     syncProject(root);

--- /dev/null
+++ b/src/engine/doctor-skills.ts (new file)
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Catalog, HarnessId } from '../schemas/index.js';
import { commandSkills } from '../skills/command-skills.js';
import { readableSkillFolders } from '../skills/install.js';
import type { Finding } from './doctor.js';

/** Skills doctor already reports as optional tools: no second finding for them. */
const REPORTED_AS_TOOLS = ['graphify'];

export interface SkillFindingsInput {
  catalog: Catalog;
  /** Ids of the skills pinned in the lock. */
  pinned: readonly string[];
  harnesses: readonly HarnessId[];
  root: string;
  home: string;
}

/**
 * One finding per command skill missing for a configured harness (D4): `warn` when the lock pins it
 * (it disappeared), `info` when it was never installed. Reads the filesystem only.
 */
export function skillFindings({ catalog, pinned, harnesses, root, home }: SkillFindingsInput): Finding[] {
  const found = (h: HarnessId, id: string) =>
    readableSkillFolders(h).some((dir) => [root, home].some((base) => existsSync(join(base, dir, id, 'SKILL.md'))));
  const out: Finding[] = [];
  for (const { id, commands } of commandSkills(catalog)) {
    if (REPORTED_AS_TOOLS.includes(id)) continue;
    const lacking = harnesses.filter((h) => !found(h, id));
    if (lacking.length === 0) continue;
    const fallback = catalog.skills[id]?.fallback;
    out.push({
      level: pinned.includes(id) ? 'warn' : 'info',
      message: `${id} is missing: ${commands.join(', ')} lose it${fallback ? ` (${fallback})` : ''}; not found for ${lacking.join(', ')}`,
      fix: `mandao skills add ${id}`,
    });
  }
  return out;
}

--- /dev/null
+++ b/test/unit/doctor-skills.test.ts (new file)
// mandao-scans: .claude/skills .agents/skills .github/skills
import { beforeEach, describe, expect, test } from 'vitest';
import { readCatalog } from '../../src/engine/catalog.js';
import { skillFindings } from '../../src/engine/doctor-skills.js';
import { makeTree } from '../helpers.js';

const catalog = readCatalog();
const fallback = catalog.skills.brainstorming!.fallback;
const skill = (folder: string, id: string) => ({ [`${folder}/${id}/SKILL.md`]: '# skill\n' });

let home: string;
beforeEach(() => {
  home = makeTree({});
});

const find = (findings: ReturnType<typeof skillFindings>, id: string) => findings.filter((f) => f.message.startsWith(`${id} is missing`));

describe('doctor: skills the commands use', () => {
  test('S-6.1: a pinned skill that is gone warns with its harnesses, the commands that lose it, its fallback and the fix', () => {
    const root = makeTree({ ...skill('.claude/skills', 'product-manager-toolkit') });
    const findings = skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root, home });
    const [f, ...rest] = find(findings, 'brainstorming');
    expect(rest).toEqual([]);
    expect(f!.level).toBe('warn');
    expect(f!.message).toContain('brainstorming is missing: constitution, story, specify lose it');
    expect(f!.message).toContain(fallback);
    expect(f!.message).toMatch(/claude.*codex/);
    expect(f!.fix).toBe('mandao skills add brainstorming');
  });

  test('S-6.1: only the harnesses that lack the skill are named', () => {
    const root = makeTree({ ...skill('.claude/skills', 'brainstorming') });
    const [f] = find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root, home }), 'brainstorming');
    expect(f!.level).toBe('warn');
    expect(f!.message).toContain('codex');
    expect(f!.message).not.toContain('claude');
    const found = makeTree({ ...skill('.claude/skills', 'brainstorming'), ...skill('.agents/skills', 'brainstorming') });
    expect(
      find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude', 'codex'], root: found, home }), 'brainstorming'),
    ).toEqual([]);
  });

  test('S-6.1: a skill in the home folder of the harness counts as found', () => {
    const root = makeTree({});
    const homed = makeTree({ ...skill('.claude/skills', 'brainstorming') });
    expect(find(skillFindings({ catalog, pinned: ['brainstorming'], harnesses: ['claude'], root, home: homed }), 'brainstorming')).toEqual(
      [],
    );
  });

  test('S-6.2: a skill never installed is an info with the same content, and nothing warns or errors', () => {
    const root = makeTree({});
    const findings = skillFindings({ catalog, pinned: [], harnesses: ['claude'], root, home });
    const [f, ...rest] = find(findings, 'brainstorming');
    expect(rest).toEqual([]);
    expect(f!.level).toBe('info');
    expect(f!.message).toContain('brainstorming is missing: constitution, story, specify lose it');
    expect(f!.message).toContain(fallback);
    expect(f!.fix).toBe('mandao skills add brainstorming');
    expect(find(findings, 'product-manager-toolkit')).toHaveLength(1);
    expect(findings.filter((x) => x.level === 'warn' || x.level === 'error')).toEqual([]);
  });

  test('S-6.2: graphify, which doctor reports as an optional tool, gives no skill finding', () => {
    const root = makeTree({});
    for (const pinned of [[], ['graphify']]) {
      const findings = skillFindings({ catalog, pinned, harnesses: ['claude'], root, home });
      expect(findings.filter((x) => x.message.includes('graphify'))).toEqual([]);
    }
  });
});

```
