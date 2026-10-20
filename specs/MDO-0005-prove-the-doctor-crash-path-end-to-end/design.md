---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: approved
---

# Design — Prove that a crashing doctor never sends garbage to CI

## Summary
No source file under `src/` changes. A new test file, `test/integration/doctor-process.test.ts`,
builds the CLI entry point `src/cli/index.ts` once per run with tsup's programmatic API into a unique
directory under the git-ignored `node_modules/.cache/`, then starts it with `process.execPath` as a
separate process (`spawnSync`) in throwaway workspaces. Each case asserts the process's exit code,
stdout and stderr. This proves the part of the crash contract that the in-process test in
`doctor-cli.test.ts` (S-2.2) cannot see: the stderr message and exit code 1 set by the `catch` in
`src/cli/index.ts`. The `models.yml` cases (FR-2) prove the other side of the boundary: an invalid
`models.yml` is reported as an `error` finding in the JSON report, not as a crash (P3; CC-1 resolved
as option a on 2026-10-20).

## Premise Ledger

Evidence as run on `main` at `ea98793` (a prototype script that built the CLI with tsup into
`node_modules/.cache/` and spawned it; removed afterwards), or read at source at the same SHA.

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | An invalid lock (broken YAML **or** schema mismatch) throws out of `runDoctor` and reaches the `catch` in `src/cli/index.ts`: exit 1, stdout empty, stderr `error invalid configuration:` followed by `  <abs path>/.mandao/mandao.lock: <reason>` | As run (`ea98793`): both variants gave status 1, stdout length 0, stderr as described. At source: `readLock` at `src/engine/doctor.ts:138` sits outside any `try`; `readYamlFile` throws `ConfigError` with the file path (`src/engine/files.ts:32-42`) | FR-1 would prove a path that does not exist | High |
| P2 | The lock crash happens before the doctor's shell probes, so the test runs no external tools and needs no network | At source (`ea98793`): `readLock` at `doctor.ts:138` runs before `harnessFindings`/`toolVersionFindings` (`doctor.ts:150-157`). As run: about 100 ms per process | the test becomes slow and environment-dependent (NFR-1) | Low |
| P3 | An invalid `models.yml` does **not** take the crash path: it becomes an `error` finding in the JSON report, exit 1, stderr empty | As run (`ea98793`): broken YAML and schema-invalid `models.yml` both gave status 1, a parseable report on stdout with an `error` finding naming `.mandao/models.yml`, stderr `""`. At source: `buildProject` calls `resolveWorkspaceModels` (`src/engine/sync.ts:79-82`) inside the `try` at `doctor.ts:140-148`, which turns non-`ResolveError` errors into a finding | FR-2 would prove a behavior the doctor does not have | High (source of CC-1; AC-2 now rests on it) |
| P4 | CI runs `npm test` before `npm run build`, so `dist/cli.js` does not exist when the tests run | At source: `.github/workflows/ci.yml` steps `npm ci` → `lint` → `typecheck` → `test` → `build` → `smoke` (`ea98793`) | D1 could just spawn `dist/cli.js` | Low |
| P5 | `packageInfo()` finds the package root by walking up from the running module to the first `package.json` named `mandao`, so a bundle placed inside the repository (`node_modules/.cache/…`) finds `core/`; a bundle in the OS temp directory would not | At source: `src/util/package-root.ts:8-23` (`ea98793`). As run: the bundle in `node_modules/.cache/mdo5-proto/` ran the full doctor (P3 output lists the config and gate findings) | D1 needs another output location | High |
| P6 | tsup 9.0.0 exposes `build(options)` and, with `config: false`, ignores `tsup.config.ts` (so it never cleans `dist/`) and bundles `src/cli/index.ts` into `<outDir>/cli.js` | As run (`ea98793`): `build({ entry: { cli }, format: ['esm'], target: 'node22', platform: 'node', outDir, config: false, silent: true })` took about 70 ms and produced a runnable `cli.js` | D1 needs esbuild directly or another runner | High |
| P7 | `MANDAO_HOME` redirects the global home, so the developer's own global lock and settings never affect the test | At source: `src/engine/global.ts:6` `home = () => process.env.MANDAO_HOME ?? homedir()` (`ea98793`); the existing doctor tests set it the same way (`test/integration/doctor-cli.test.ts:26`) | a broken global lock on a dev machine changes the result | Low |

## Diagram
<!-- Lite depth: `mandao run diagram MDO-0005` says optional. No new runtime flow; none is drawn. -->

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|
| D1 | Build `src/cli/index.ts` in `beforeAll` with tsup's `build()` (`config: false`, the same `entry`, `format`, `target` and `platform` as `tsup.config.ts`) into `mkdtemp(node_modules/.cache/mandao-cli-)`, and spawn `<out>/cli.js` with `process.execPath` | (a) Spawn `dist/cli.js`: it does not exist when CI runs `npm test` (P4). (b) Node's built-in type stripping on `src/cli/index.ts`: the `.js` import specifiers do not resolve to `.ts` files, and `ConfigError`'s `readonly issues` constructor parameter is not erasable syntax. (c) Add `tsx` as a dev dependency: a new dependency for one test file. (d) Extend `npm run smoke`: it runs after the build but is not part of `npm test`, so AC-1/C2 fails, and it costs an `npm pack` + install | tsup is already a direct dev dependency and builds the same artifact shape as the release; about 70 ms (P6); the output stays inside the repo so `core/` resolves (P5) |
| D2 | A new file `test/integration/doctor-process.test.ts` rather than new cases in `doctor-cli.test.ts` | Add the cases to `doctor-cli.test.ts` | That file mocks `runDoctor` module-wide and spies on `console.log` and `process.stdout.write` (MDO-0004 D3); a process-level test needs neither and would only be confused by them |
| D3 | Assertions. Lock cases (FR-1): `status === 1`; `stdout === ''` (exact, so even a lone newline fails, AC-1/C1); `stderr` matches `/\berror\b/` and contains `join('.mandao', 'mandao.lock')`. Models cases (FR-2): `status === 1`; `stderr === ''` (exact, AC-2/C1); `JSON.parse(stdout)` succeeds and has `schema_version === 1`; some finding has `level === 'error'` and a `message` containing `join('.mandao', 'models.yml')` | Snapshot the whole stderr or report, or match `invalid configuration:` or the finding's full message | Story, confirmed at approval: the word `error` and the file path, never the parser's wording or the header, so a YAML library upgrade does not break the test. Parsing the whole stdout proves "one readable report" without pinning other findings |
| D4 | Workspaces from `makeTree` (`test/helpers.ts`) with the minimal valid config already used by `doctor-cli.test.ts` S-4.2 (`schema_version: 1`, `workspace: single`, one project at `.`, `harnesses: [claude]`), plus one broken file per case (lock: broken YAML, schema-invalid YAML; `models.yml`: broken YAML, schema-invalid YAML); `env: { ...process.env, MANDAO_HOME: makeTree({}) }`; `spawnSync` with `encoding: 'utf8'` and a 20 s `timeout` | `execFileSync` (throws on exit 1 and hides stdout/stderr in the error) | `spawnSync` returns status, stdout and stderr directly; `MANDAO_HOME` isolates the global lock (P7); the timeout keeps a hang from blocking CI |
| D5 | `afterAll` removes the build directory; the workspaces stay in the OS temp directory like every other `makeTree` test | Clean the workspaces too | Matches the existing tests; the build directory is the only thing written inside the repository |
| D6 | Update the comment above the S-2.2 test in `doctor-cli.test.ts` so it points to the new process-level test; no assertion changes | Leave it | The comment says `index.ts` "turns the rejection into stderr output and exit code 1"; after this spec that claim has a test, and the pointer closes CC-V1 of MDO-0004 for the reader |

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|
| mandao | `test/integration/` | ADDED `doctor-process.test.ts`: build in `beforeAll` (D1), FR-1 cases S-1.1 and S-1.2 (one `test.each`), FR-2 cases S-2.1 and S-2.2 (a second `test.each`) | `test/unit/launcher.test.ts` (spawns `process.execPath` against a `makeTree` workspace); `test/integration/doctor-cli.test.ts` (doctor fixtures, `MANDAO_HOME`) |
| mandao | `test/integration/` | MODIFIED: comment above S-2.2 in `doctor-cli.test.ts` (D6) | `test/integration/doctor-cli.test.ts` |

No change under `src/`, `core/`, `docs/schemas.md` or the CI workflow.

## Contract
Not applicable: one project, no interface changes. The contract under test is the existing crash path
of `src/cli/index.ts`, recorded in MDO-0004 S-2.2.

## Risks and risk tags

Risk tags: none. The change is test-only; it touches no input handling, public API or infrastructure.

| Risk | Mitigation |
|---|---|
| tsup's programmatic API changes in a later major | Pinned by the lock file; a break fails the test loudly at `beforeAll`, not silently |
| Parallel test files or concurrent worktrees build into the same directory | `mkdtemp` gives each run its own directory (D1) |
| The test's tsup options drift from `tsup.config.ts` | Same four options, kept next to each other; the release smoke still covers the real `dist/` build |
| `node_modules/.cache/` does not exist on a fresh `npm ci` | Create it with `mkdirSync(…, { recursive: true })` before `mkdtemp` |

## Constitution Impact
Proposed, not applied (applied only by `/mandao-close`, with approval):
- `docs/constitution/standards.md`, exemplar table: add "Process-level CLI test |
  `test/integration/doctor-process.test.ts`", so the next test that needs the real entry point reuses
  D1 instead of adding a runner.

## Product Impact
None. CC-1 resolved as option a. The wrong claim that `models.yml` crashes appears only in the closed
MDO-0004 documents (`story.md:49`, `design.md:69`), which this story does not edit (story, Out of
scope); `docs/schemas.md` makes no claim about it. The correction is recorded in this spec's
Clarifications (C-1), and `/mandao-close` mentions it in the release notes.

## Module Docs Impact
None. `test/` has no `AGENTS.md`, and no module guide describes the doctor's crash path.
