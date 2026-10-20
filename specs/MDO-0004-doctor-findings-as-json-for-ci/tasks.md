---
schema_version: 1
spec: MDO-0004-doctor-findings-as-json-for-ci
status: approved
---

# Tasks — Read the doctor's findings from CI as JSON

<!--
No code graph in this worktree (graphify-out/graph.json missing); files and modules come from
design.md § Changes by project and module. src/cli has no AGENTS.md (design § Module Docs Impact),
so no module guide is due. Constitution and product impacts are applied at /mandao-close.
Tasks with the `public-api` tag get their red tests from the Tester (test-policy.md, ADR 0022).
-->

### [x] T1 — Pure `doctorReport(findings)` in `src/cli/output.ts`

```yaml
project: mandao
tier: standard
files: [src/cli/output.ts, test/unit/doctor-report.test.ts]
exemplar: src/cli/skills.ts
risk_tags: [public-api]
ac: [AC-1, AC-1/C1]
scenarios: [S-1.1, S-1.1/C1, S-1.2]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: ["S-1.1: four findings keep their order; only the warn entry has fix; counts are 1/1/1/1 and schema_version is 1", "S-1.2: only ok findings give counts error 0, warn 0, info 0, ok n", "NFR-2: top-level keys are exactly schema_version, counts, findings; finding keys are a subset of level, message, fix; counts keys are exactly error, warn, info, ok"], e2e: [] }
dod: ["red evidence recorded with mandao run red before the implementation", "doctorReport is pure and typed by Finding (D1, D2); printFindings untouched", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/unit/doctor-report.test.ts
depends_on: []
parallel_safe: false
```

### [ ] T2 — `mandao doctor --json` with the shared exit-code rule

```yaml
project: mandao
tier: standard
files: [src/cli/setup.ts, test/integration/doctor-cli.test.ts]
exemplar: src/cli/skills.ts
risk_tags: [public-api]
ac: [AC-1, AC-1/C2, AC-2, AC-2/C1, AC-3, AC-3/C1, AC-4]
scenarios: [S-2.1, S-2.1/C1, S-2.2, S-2.2/C1, S-3.1, S-3.2, S-3.2/C1, S-4.1, S-4.1/C1, S-4.2, S-4.2/C1, S-5.1, S-5.1/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: [], e2e: ["S-2.1: with stdout.isTTY true and NO_COLOR unset, --json makes exactly one console.log whose JSON.parse equals doctorReport of the mocked findings, with no ANSI escapes, no arrow and no other line", "S-2.2: when runDoctor throws, --json writes nothing to stdout, the error reaches stderr and the exit code is 1", "S-3.1: mocked findings with one error give exit code 1 under --json", "S-3.2: warn, info and ok only give exit code 0 under --json", "S-4.1: real runDoctor in a dir without .mandao/config.yml gives a parseable report with the npx mandao init fix and exit code 1", "S-4.2: real runDoctor with workspace galaxy and with broken YAML gives parseable error findings naming the file and field path, no fix, exit code 1", "S-5.1: without --json and non-TTY stdout gets exactly the ok, warn and arrow lines and exit code 0; adding an error finding gives exit code 1"] }
dod: ["red evidence recorded with mandao run red before the implementation", "vi.mock of src/engine/doctor.js is file-scoped to doctor-cli.test.ts (D3); AC-3 cases use the real runDoctor", "exit-code rule is one line shared by both modes (D5); one console.log for the JSON document, 2-space indent (D4)", "JSON path changes only how runDoctor's result is printed (NFR-3)", "process.exitCode, isTTY and NO_COLOR are restored after each test", "npm run lint and npm run typecheck are green"]
verify: npx vitest run test/integration/doctor-cli.test.ts test/integration/cli.test.ts test/integration/engine.test.ts
depends_on: [T1]
parallel_safe: false
```

### [ ] T3 — Document `--json` and the report contract

```yaml
project: mandao
tier: fast
files: [README.md, docs/schemas.md]
exemplar: docs/schemas.md
risk_tags: []
ac: [AC-1]
scenarios: [S-1.1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: [], e2e: [] }
dod: ["README.md command table mentions mandao doctor --json", "docs/schemas.md has a mandao doctor --json report section with the D1 shape, fix omitted when absent, counts always with four levels and the schema_version bump rule (NFR-2)", "npx biome format . reports no changes"]
verify: npx biome format .
depends_on: [T1]
parallel_safe: true
```
