---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
status: approved
---

# Tasks — Prove that a crashing doctor never sends garbage to CI

<!--
The code graph (graphify-out/graph.json) only holds the spec documents of this worktree, so files and
modules come from design.md § Changes by project and module. Test-only spec: no change under src/,
core/, docs/ or CI. test/ has no AGENTS.md (design § Module Docs Impact), so no module guide is due.
The constitution impact (exemplar row) is applied at /mandao-close.
ASSUMPTION (test-policy.md, TDD): the new tests characterize behavior that already exists (P1, P3),
so they pass on their first run and cannot give red evidence against unchanged code. Instead the
Implementer shows each assertion can fail with a local, uncommitted mutation and records it in
execution.md; the Leader confirms or overrides this at /mandao-implement.
-->

### [x] T1 — Process-level doctor test in `test/integration/doctor-process.test.ts`

```yaml
project: mandao
tier: standard
files: [test/integration/doctor-process.test.ts, test/integration/doctor-cli.test.ts]
exemplar: test/unit/launcher.test.ts
risk_tags: []
ac: [AC-1, AC-1/C1, AC-1/C2, AC-2, AC-2/C1]
scenarios: [S-1.1, S-1.1/C1, S-1.1/C2, S-1.2, S-1.2/C1, S-2.1, S-2.1/C1, S-2.2, S-2.2/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: [], e2e: ["S-1.1: a lock with broken YAML gives status 1, stdout exactly '' and stderr matching /\\berror\\b/ and containing join('.mandao', 'mandao.lock')", "S-1.2: a lock that is valid YAML but fails the lock schema gives the same outcome as S-1.1", "S-1.1/C2: the file matches test/**/*.test.ts, so npm test and the CI check job run it", "S-2.1: a models.yml with broken YAML gives status 1, stderr exactly '', JSON.parse of the whole stdout with schema_version 1 and an error finding whose message contains join('.mandao', 'models.yml')", "S-2.2: a models.yml that is valid YAML but fails the models schema gives the same outcome as S-2.1", "NFR-1: npx vitest run on the file, build included, reports under 5 s"] }
dod: ["beforeAll builds src/cli/index.ts with tsup build() and config false, using the same entry, format, target and platform as tsup.config.ts, into mkdtemp under node_modules/.cache/ created with recursive mkdirSync (D1)", "spawnSync of process.execPath on <out>/cli.js with encoding utf8, a 20 s timeout and MANDAO_HOME set to a fresh makeTree (D4, P7)", "workspaces from makeTree with the minimal valid config of doctor-cli.test.ts S-4.2 plus one broken file per case; lock cases and models cases each in one test.each (D4)", "assertions exactly as D3: no snapshot, no parser wording, no 'invalid configuration:' header", "afterAll removes the build directory only (D5)", "no vi.mock and no console or stdout spies (D2)", "each assertion shown to fail once by a local uncommitted mutation, recorded in execution.md (see ASSUMPTION above)", "the comment above the S-2.2 test in doctor-cli.test.ts points to doctor-process.test.ts as the proof of the stderr output and exit code 1 set by src/cli/index.ts; no assertion changes there (D6)", "no change under src/, core/, docs/ or .github/", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/integration/doctor-process.test.ts test/integration/doctor-cli.test.ts
depends_on: []
parallel_safe: false
```

