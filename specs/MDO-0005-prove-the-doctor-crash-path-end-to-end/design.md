---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: approved
---

# Design — Prove that a crashing doctor never sends garbage to CI

One new test file builds the real CLI with tsup inside the repository and runs `doctor --json` as a
separate process in throwaway workspaces, checking exit code, stdout and stderr. `src/` is unchanged.

- Lock cases (FR-1) prove what the in-process S-2.2 test in `doctor-cli.test.ts` cannot see: the stderr
  message and exit code 1 set by the `catch` in `src/cli/index.ts`.
- Models cases (FR-2) prove an invalid `models.yml` is an `error` finding, not a crash ([P3](#p3),
  [C-1](requirements.md#c1)).
- Diagram: none (lite depth, `mandao run diagram` says optional; no new runtime flow).

## Decisions

<a id="d1"></a>
### D1 — Build the CLI in `beforeAll` with tsup and spawn it
tsup `build()` with `config: false` and the same `entry`, `format`, `target` and `platform` as
`tsup.config.ts`, into `mkdtemp(node_modules/.cache/mandao-cli-)`; spawn `<out>/cli.js` with
`process.execPath`. tsup is already a direct dev dependency, builds the release's artifact shape in
about 70 ms ([P6](#p6)), and an in-repo output finds `core/` ([P5](#p5)). Rejected:
- spawn `dist/cli.js`: missing when CI runs `npm test` ([P4](#p4));
- Node type stripping on `src/cli/index.ts`: `.js` specifiers do not resolve to `.ts`, and
  `ConfigError`'s `readonly issues` constructor parameter is not erasable syntax;
- add `tsx`: a new dependency for one test file;
- extend `npm run smoke`: not part of `npm test` (fails AC-1/C2) and costs an `npm pack` + install.

### D2 — A new file `test/integration/doctor-process.test.ts`
Not new cases in `doctor-cli.test.ts`: that file mocks `runDoctor` module-wide and spies on
`console.log` and `process.stdout.write` (MDO-0004 D3), which a process-level test does not need and
would be confused by.

### D3 — Assert the word `error` and the file path, never parser wording
- Lock (FR-1): `status === 1`; `stdout === ''` exact, so a lone newline fails (AC-1/C1); `stderr`
  matches `/\berror\b/` and contains `join('.mandao', 'mandao.lock')`.
- Models (FR-2): `status === 1`; `stderr === ''` exact (AC-2/C1); `JSON.parse(stdout)` succeeds with
  `schema_version === 1`; some finding has `level === 'error'` and a `message` containing
  `join('.mandao', 'models.yml')`.

Per the [story](story.md#assumptions), a YAML library upgrade must not break the test; parsing the
whole stdout proves "one readable report" without pinning other findings. Rejected: snapshots of
stderr or the report, matching `invalid configuration:` or a finding's full message.

### D4 — `makeTree` workspaces, `spawnSync`
Workspaces from `makeTree` (`test/helpers.ts`) with the minimal config of `doctor-cli.test.ts` S-4.2
(`schema_version: 1`, `workspace: single`, one project at `.`, `harnesses: [claude]`) plus one broken
file per case: lock and `models.yml`, each as broken YAML and as schema-invalid YAML.
`env: { ...process.env, MANDAO_HOME: makeTree({}) }` isolates the global lock ([P7](#p7));
`spawnSync` (`encoding: 'utf8'`, 20 s `timeout` so a hang cannot block CI) returns status, stdout and
stderr directly. Rejected: `execFileSync`, which throws on exit 1 and hides both streams in the error.

### D5 — `afterAll` removes only the build directory
Workspaces stay in the OS temp directory like every other `makeTree` test; the build directory is the
only thing written inside the repository.

### D6 — Point the S-2.2 comment in `doctor-cli.test.ts` to the new test
No assertion changes. The comment claims `index.ts` "turns the rejection into stderr output and exit
code 1"; the pointer shows where that is tested and closes MDO-0004 CC-V1 for the reader.

## Changes by project and module

| Project | Module | Change | Exemplar |
|---|---|---|---|
| mandao | `test/integration/` | ADDED `doctor-process.test.ts` | `test/unit/launcher.test.ts` |
| mandao | `test/integration/` | MODIFIED comment in `doctor-cli.test.ts` (D6) | same file |

The new file: build in `beforeAll` (D1); S-1.1 and S-1.2 in one `test.each`, S-2.1 and S-2.2 in a
second. `launcher.test.ts` spawns `process.execPath` against a `makeTree` workspace;
`doctor-cli.test.ts` has the doctor fixtures and `MANDAO_HOME`. Nothing changes under `src/`, `core/`,
`docs/schemas.md` or the CI workflow.

## Contract
Not applicable: one project, no interface changes. Under test is the existing crash path of
`src/cli/index.ts` (MDO-0004 S-2.2).

## Risks and risk tags
Risk tags: none (test-only; no input handling, public API or infrastructure).

| Risk | Mitigation |
|---|---|
| tsup's programmatic API changes in a major | Pinned by the lock file; fails loudly at `beforeAll` |
| Parallel files or worktrees share a build directory | `mkdtemp` per run (D1) |
| Test tsup options drift from `tsup.config.ts` | Same four options side by side; release smoke covers `dist/` |
| `node_modules/.cache/` missing after `npm ci` | `mkdirSync(…, { recursive: true })` first |

## Constitution Impact
Applied at `/mandao-close` (`docs/constitution/CHANGELOG.md`): exemplar row "Process-level CLI test |
`test/integration/doctor-process.test.ts`" in `docs/constitution/standards.md`, so the next test that
needs the real entry point reuses D1.

## Product Impact
None. The wrong claim that `models.yml` crashes stays only in the closed MDO-0004 documents
(`story.md:49`, `design.md:69`), which this story does not edit; `docs/schemas.md` makes no claim. The
correction is [C-1](requirements.md#c1), carried by the release notes.

## Module Docs Impact
None. `test/` has no `AGENTS.md`, and no module guide describes the doctor's crash path.

## Premise Ledger
Run on `main` at `ea98793` with a prototype that built the CLI with tsup into `node_modules/.cache/`
and spawned it (removed afterwards), or read at source at that SHA.

<a id="p1"></a>
### P1 — An invalid lock reaches the CLI `catch` (High)
Broken YAML or a schema mismatch throws out of `runDoctor`: exit 1, stdout empty, stderr
`error invalid configuration:` then `  <abs path>/.mandao/mandao.lock: <reason>`. If false, FR-1
proves a path that does not exist.

<a id="p2"></a>
### P2 — The lock crash precedes the shell probes (Low)
So the test runs no external tools and needs no network. If false, the test gets slow and
environment-dependent (NFR-1).

<a id="p3"></a>
### P3 — An invalid `models.yml` is a finding, not a crash (High)
Exit 1, an `error` finding in the JSON report, empty stderr. Source of CC-1; AC-2 rests on it. If
false, FR-2 proves a behavior the doctor lacks.

<a id="p4"></a>
### P4 — CI runs `npm test` before `npm run build` (Low)
So `dist/cli.js` does not exist when the tests run. If false, D1 could spawn `dist/cli.js`.

<a id="p5"></a>
### P5 — A bundle inside the repository finds `core/` (High)
`packageInfo()` walks up from the running module to the first `package.json` named `mandao`; a bundle
in the OS temp directory would not find it. If false, D1 needs another output location.

<a id="p6"></a>
### P6 — tsup's `build()` produces a runnable bundle (High)
tsup 9.0.0 exposes `build(options)`; with `config: false` it ignores `tsup.config.ts` (never cleans
`dist/`) and bundles `src/cli/index.ts` into `<outDir>/cli.js`. If false, D1 needs esbuild or another
runner.

<a id="p7"></a>
### P7 — `MANDAO_HOME` isolates the global lock (Low)
The developer's own global lock and settings never affect the test. If false, a broken global lock on
a dev machine changes the result.

<details>
<summary>Premise evidence (<code>ea98793</code>)</summary>

- P1: as run, both variants gave status 1, stdout length 0, stderr as described. `readLock` at
  `src/engine/doctor.ts:138` is outside any `try`; `readYamlFile` throws `ConfigError` with the path
  (`src/engine/files.ts:32-42`).
- P2: `readLock` (`doctor.ts:138`) runs before `harnessFindings`/`toolVersionFindings`
  (`doctor.ts:150-157`); as run, about 100 ms per process.
- P3: as run, broken-YAML and schema-invalid `models.yml` both gave status 1, a parseable report with
  an `error` finding naming `.mandao/models.yml`, stderr `""`. `buildProject` calls
  `resolveWorkspaceModels` (`src/engine/sync.ts:79-82`) inside the `try` at `doctor.ts:140-148`, which
  turns non-`ResolveError` errors into a finding.
- P4: `.github/workflows/ci.yml`: `npm ci` → `lint` → `typecheck` → `test` → `build` → `smoke`.
- P5: `src/util/package-root.ts:8-23`; the bundle in `node_modules/.cache/mdo5-proto/` ran the full
  doctor (P3's output lists the config and gate findings).
- P6: `build({ entry: { cli }, format: ['esm'], target: 'node22', platform: 'node', outDir, config: false, silent: true })`
  took about 70 ms and produced a runnable `cli.js`.
- P7: `src/engine/global.ts:6` `home = () => process.env.MANDAO_HOME ?? homedir()`; the doctor tests
  set it the same way (`test/integration/doctor-cli.test.ts:26`).

</details>
