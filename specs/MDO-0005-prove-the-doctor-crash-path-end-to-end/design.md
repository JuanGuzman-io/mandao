---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
depth: lite
projects: [mandao]
status: approved
---

# Design — Prove that a crashing doctor never sends garbage to CI

How we build it: one new test file builds the real CLI with tsup inside the repository and runs
`doctor --json` as a separate process in throwaway workspaces, checking exit code, stdout and stderr.
No source file under `src/` changes.

## Summary
A new test file, `test/integration/doctor-process.test.ts`, builds the CLI entry point
`src/cli/index.ts` once per run with tsup's programmatic API into a unique directory under the
git-ignored `node_modules/.cache/`, then starts it with `process.execPath` as a separate process
(`spawnSync`) in throwaway workspaces. Each case checks the process's exit code, stdout and stderr.

- **Lock cases (FR-1)** prove what the in-process test in `doctor-cli.test.ts` (S-2.2) cannot see: the
  stderr message and exit code 1 set by the `catch` in `src/cli/index.ts`.
- **Models cases (FR-2)** prove the other side of the boundary: an invalid `models.yml` is an `error`
  finding in the JSON report, not a crash ([P3](#p3--an-invalid-modelsyml-is-a-finding-not-a-crash);
  [requirements C-1](requirements.md#c-1--modelsyml-does-not-take-the-crash-path)).

## Diagram
None. The depth is lite (`mandao run diagram MDO-0005` says a diagram is optional) and there is no new
runtime flow to draw.

## Decisions

| # | Decision | Rejected alternative |
|---|---|---|
| D1 | Build the CLI inside the test with tsup | spawn `dist/cli.js`, type stripping, `tsx`, smoke |
| D2 | A new test file | add cases to `doctor-cli.test.ts` |
| D3 | Check the word `error` and the file path | snapshots, parser wording |
| D4 | `makeTree` workspaces and `spawnSync` | `execFileSync` |
| D5 | `afterAll` removes only the build directory | also clean the workspaces |
| D6 | Point the old S-2.2 comment to the new test | leave it |

### D1 — Build the CLI inside the test with tsup
- **Decision:** in `beforeAll`, build `src/cli/index.ts` with tsup's `build()` (`config: false`, the
  same `entry`, `format`, `target` and `platform` as `tsup.config.ts`) into
  `mkdtemp(node_modules/.cache/mandao-cli-)`, and spawn `<out>/cli.js` with `process.execPath`.
- **Why:** tsup is already a direct dev dependency and builds the same artifact shape as the release;
  it takes about 70 ms ([P6](#p6--tsups-build-api-produces-a-runnable-bundle)); the output stays inside
  the repository so `core/` resolves ([P5](#p5--a-bundle-inside-the-repository-finds-core)).
- **Alternatives rejected:**
  - (a) Spawn `dist/cli.js`: it does not exist when CI runs `npm test` ([P4](#p4--ci-runs-the-tests-before-the-build)).
  - (b) Node's built-in type stripping on `src/cli/index.ts`: the `.js` import specifiers do not
    resolve to `.ts` files, and `ConfigError`'s `readonly issues` constructor parameter is not
    erasable syntax.
  - (c) Add `tsx` as a dev dependency: a new dependency for one test file.
  - (d) Extend `npm run smoke`: it runs after the build but is not part of `npm test`, so AC-1/C2
    fails, and it costs an `npm pack` + install.

### D2 — A new test file
- **Decision:** a new file `test/integration/doctor-process.test.ts` rather than new cases in
  `doctor-cli.test.ts`.
- **Why:** `doctor-cli.test.ts` mocks `runDoctor` module-wide and spies on `console.log` and
  `process.stdout.write` (MDO-0004 D3); a process-level test needs neither and would only be confused
  by them.

### D3 — Check the word `error` and the file path
- **Decision, lock cases (FR-1):** `status === 1`; `stdout === ''` (exact, so even a lone newline
  fails, AC-1/C1); `stderr` matches `/\berror\b/` and contains `join('.mandao', 'mandao.lock')`.
- **Decision, models cases (FR-2):** `status === 1`; `stderr === ''` (exact, AC-2/C1);
  `JSON.parse(stdout)` succeeds and has `schema_version === 1`; some finding has `level === 'error'`
  and a `message` containing `join('.mandao', 'models.yml')`.
- **Why:** the story ([confirmed at approval](story.md#assumptions-and-open-questions)) asks for the
  word `error` and the file path, never the parser's wording or the header, so a YAML library upgrade
  does not break the test. Parsing the whole stdout proves "one readable report" without pinning other
  findings.
- **Alternative rejected:** snapshot the whole stderr or report, or match `invalid configuration:` or
  the finding's full message.

### D4 — `makeTree` workspaces and `spawnSync`
- **Decision:** workspaces from `makeTree` (`test/helpers.ts`) with the minimal valid config already
  used by `doctor-cli.test.ts` S-4.2 (`schema_version: 1`, `workspace: single`, one project at `.`,
  `harnesses: [claude]`), plus one broken file per case:
  - lock: broken YAML, schema-invalid YAML;
  - `models.yml`: broken YAML, schema-invalid YAML.
- **Process:** `env: { ...process.env, MANDAO_HOME: makeTree({}) }`; `spawnSync` with
  `encoding: 'utf8'` and a 20 s `timeout`.
- **Why:** `spawnSync` returns status, stdout and stderr directly; `MANDAO_HOME` isolates the global
  lock ([P7](#p7--mandao_home-isolates-the-global-lock)); the timeout keeps a hang from blocking CI.
- **Alternative rejected:** `execFileSync`, which throws on exit 1 and hides stdout and stderr in the
  error.

### D5 — `afterAll` removes only the build directory
- **Decision:** `afterAll` removes the build directory; the workspaces stay in the OS temp directory
  like every other `makeTree` test.
- **Why:** it matches the existing tests; the build directory is the only thing written inside the
  repository.

### D6 — Point the old S-2.2 comment to the new test
- **Decision:** update the comment above the S-2.2 test in `doctor-cli.test.ts` so it points to the
  new process-level test; no assertion changes.
- **Why:** the comment says `index.ts` "turns the rejection into stderr output and exit code 1"; with
  this spec that claim has a test, and the pointer closes CC-V1 of MDO-0004 for the reader.

## Changes by project and module

| Project | Module | Change | Exemplar |
|---|---|---|---|
| mandao | `test/integration/` | ADDED `doctor-process.test.ts` | `test/unit/launcher.test.ts` |
| mandao | `test/integration/` | MODIFIED comment in `doctor-cli.test.ts` (D6) | `doctor-cli.test.ts` |

- **`doctor-process.test.ts`:** build in `beforeAll` (D1); FR-1 cases S-1.1 and S-1.2 in one
  `test.each`; FR-2 cases S-2.1 and S-2.2 in a second `test.each`.
- **Exemplars:** `test/unit/launcher.test.ts` spawns `process.execPath` against a `makeTree`
  workspace; `test/integration/doctor-cli.test.ts` has the doctor fixtures and `MANDAO_HOME`.
- No change under `src/`, `core/`, `docs/schemas.md` or the CI workflow.

## Contract
Not applicable: one project, no interface changes. The contract under test is the existing crash path
of `src/cli/index.ts`, recorded in MDO-0004 S-2.2.

## Risks and risk tags

Risk tags: none. The change is test-only; it touches no input handling, public API or infrastructure.

| Risk | Mitigation |
|---|---|
| tsup's programmatic API changes in a later major | Pinned by the lock file; a break fails loudly at `beforeAll` |
| Parallel test files or worktrees build into the same directory | `mkdtemp` gives each run its own directory (D1) |
| The test's tsup options drift from `tsup.config.ts` | Same four options side by side; the release smoke covers the real `dist/` |
| `node_modules/.cache/` is missing after a fresh `npm ci` | `mkdirSync(…, { recursive: true })` before `mkdtemp` |

## Constitution Impact
Applied at `/mandao-close` with approval (see `docs/constitution/CHANGELOG.md`):
`docs/constitution/standards.md`, exemplar table, row "Process-level CLI test |
`test/integration/doctor-process.test.ts`", so the next test that needs the real entry point reuses D1
instead of adding a runner.

## Product Impact
None. The claim that an invalid `models.yml` crashes the doctor appears only in the closed MDO-0004
documents (`story.md:49`, `design.md:69`), which this story does not edit
([story, Out of scope](story.md#out-of-scope)); `docs/schemas.md` makes no claim about it. The
correction is [requirements C-1](requirements.md#c-1--modelsyml-does-not-take-the-crash-path), and the
release notes carry it (`docs/releases/MDO-0005/release-notes.md`, Known limits).

## Module Docs Impact
None. `test/` has no `AGENTS.md`, and no module guide describes the doctor's crash path.

## Premise Ledger

Each premise was run on `main` at `ea98793` (a prototype script that built the CLI with tsup into
`node_modules/.cache/` and spawned it, removed afterwards) or read at source at the same SHA. Evidence
sits in the collapsed block under each premise.

| # | Premise | If false | Impact |
|---|---|---|---|
| P1 | An invalid lock reaches the CLI `catch` | FR-1 proves a path that does not exist | High |
| P2 | The lock crash precedes the shell probes | the test is slow and environment-dependent (NFR-1) | Low |
| P3 | An invalid `models.yml` is a finding, not a crash | FR-2 proves a behavior the doctor lacks | High |
| P4 | CI runs the tests before the build | D1 could just spawn `dist/cli.js` | Low |
| P5 | A bundle inside the repository finds `core/` | D1 needs another output location | High |
| P6 | tsup's `build()` API produces a runnable bundle | D1 needs esbuild directly or another runner | High |
| P7 | `MANDAO_HOME` isolates the global lock | a broken global lock on a dev machine changes the result | Low |

### P1 — An invalid lock reaches the CLI `catch`
An invalid lock (broken YAML **or** schema mismatch) throws out of `runDoctor` and reaches the `catch`
in `src/cli/index.ts`: exit 1, stdout empty, stderr `error invalid configuration:` followed by
`  <abs path>/.mandao/mandao.lock: <reason>`.

<details>
<summary>Evidence (as run and at source, <code>ea98793</code>)</summary>

- As run: both variants gave status 1, stdout length 0, stderr as described.
- At source: `readLock` at `src/engine/doctor.ts:138` sits outside any `try`; `readYamlFile` throws
  `ConfigError` with the file path (`src/engine/files.ts:32-42`).

</details>

### P2 — The lock crash precedes the shell probes
The lock crash happens before the doctor's shell probes, so the test runs no external tools and needs
no network.

<details>
<summary>Evidence (as run and at source, <code>ea98793</code>)</summary>

- At source: `readLock` at `doctor.ts:138` runs before `harnessFindings`/`toolVersionFindings`
  (`doctor.ts:150-157`).
- As run: about 100 ms per doctor process.

</details>

### P3 — An invalid `models.yml` is a finding, not a crash
An invalid `models.yml` does **not** take the crash path: it becomes an `error` finding in the JSON
report, with exit 1 and an empty stderr. This premise is the source of CC-1, and AC-2 rests on it
([requirements C-1](requirements.md#c-1--modelsyml-does-not-take-the-crash-path)).

<details>
<summary>Evidence (as run and at source, <code>ea98793</code>)</summary>

- As run: a broken-YAML and a schema-invalid `models.yml` both gave status 1, a parseable report on
  stdout with an `error` finding naming `.mandao/models.yml`, and stderr `""`.
- At source: `buildProject` calls `resolveWorkspaceModels` (`src/engine/sync.ts:79-82`) inside the
  `try` at `doctor.ts:140-148`, which turns non-`ResolveError` errors into a finding.

</details>

### P4 — CI runs the tests before the build
CI runs `npm test` before `npm run build`, so `dist/cli.js` does not exist when the tests run.

<details>
<summary>Evidence (at source, <code>ea98793</code>)</summary>

- `.github/workflows/ci.yml` steps: `npm ci` → `lint` → `typecheck` → `test` → `build` → `smoke`.

</details>

### P5 — A bundle inside the repository finds `core/`
`packageInfo()` finds the package root by walking up from the running module to the first
`package.json` named `mandao`, so a bundle inside the repository (`node_modules/.cache/…`) finds
`core/`; a bundle in the OS temp directory would not.

<details>
<summary>Evidence (as run and at source, <code>ea98793</code>)</summary>

- At source: `src/util/package-root.ts:8-23`.
- As run: the bundle in `node_modules/.cache/mdo5-proto/` ran the full doctor (the P3 output lists the
  config and gate findings).

</details>

### P6 — tsup's `build()` API produces a runnable bundle
tsup 9.0.0 exposes `build(options)` and, with `config: false`, ignores `tsup.config.ts` (so it never
cleans `dist/`) and bundles `src/cli/index.ts` into `<outDir>/cli.js`.

<details>
<summary>Evidence (as run, <code>ea98793</code>)</summary>

- `build({ entry: { cli }, format: ['esm'], target: 'node22', platform: 'node', outDir, config: false, silent: true })`
  took about 70 ms and produced a runnable `cli.js`.

</details>

### P7 — `MANDAO_HOME` isolates the global lock
`MANDAO_HOME` redirects the global home, so the developer's own global lock and settings never affect
the test.

<details>
<summary>Evidence (at source, <code>ea98793</code>)</summary>

- `src/engine/global.ts:6`: `home = () => process.env.MANDAO_HOME ?? homedir()`.
- The existing doctor tests set it the same way (`test/integration/doctor-cli.test.ts:26`).

</details>
