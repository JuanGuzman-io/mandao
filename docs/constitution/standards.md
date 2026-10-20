---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: approved
---

# Standards

The Reviewer enforces only what is written here (plus the spec, the contract and security.md).

## Conventions

- Formatting and lint: Biome (`biome.json`): 2 spaces, single quotes, semicolons, trailing commas,
  line width 140. `noNonNullAssertion` is off because `noUncheckedIndexedAccess` is on.
- ESM with explicit `.js` import suffixes; `import type` for types (`verbatimModuleSyntax`).
- File names kebab-case; one concept per module; exported functions carry a one-line JSDoc stating
  intent when it is not obvious from the name.
- Schemas first: every file Mandao reads is a zod schema in `src/schemas/`; types are `z.infer`.
- User-facing YAML keys are snake_case (`schema_version`, `default_profile`); TypeScript identifiers
  are camelCase.
- Commits: `.mandao/templates/<profile>/rules/commits.md`.

### Exemplar files

| Kind | Exemplar |
|---|---|
| Pure adapter | `src/adapters/copilot.ts` |
| Schema with cross-field rules | `src/schemas/config.ts` |
| Pure decision + IO wrapper | `src/scripts/quick-check.ts` (`analyzeDiff` / `collectDiff`) |
| CLI command | `src/cli/models.ts` + its registration in `src/cli/index.ts` |
| Canonical command | `core/commands/quick.md` |
| Unit test | `test/unit/models.test.ts` |
| Integration test | `test/integration/engine.test.ts` |
| Process-level CLI test | `test/integration/doctor-process.test.ts` |

## Errors

- Domain errors carry their issues: `ConfigError` and `ResolveError` hold `issues: string[]` and are
  printed by `src/cli/index.ts` without stack traces. Other errors print their message and set exit code 1.
- `catch {}` without rethrow is allowed only for best-effort reads (malformed `package.json`, missing
  git ref) and must say why in a comment. `ASSUMPTION(source: grep "catch {" src, 10 hits): all
  current hits are best-effort reads.`
- Never `process.exit` outside `src/cli/` (prompt cancellation only).

## Logging

The CLI prints to stdout for results and stderr for errors; `run` scripts print JSON only. No secrets
or file contents in output beyond paths.
Commands with `--json` print exactly one JSON document on stdout; errors go to stderr.

## Dependencies

Runtime dependencies stay minimal (6 today). A new runtime dependency needs a reason in the PR and a
license compatible with MIT.

## Clean-code thresholds (level 0 gates, blocking)

Approved 2026-10-20. Enforced by Biome (`biome.json`) through the `lint` and `metrics` gates.

| Metric | Threshold | Tool |
|---|---|---|
| Cognitive complexity per function | 15 | `complexity/noExcessiveCognitiveComplexity` |
| Function length | 60 lines, blank lines not counted (test suites exempt) | `complexity/noExcessiveLinesPerFunction` |
| File length | 350 lines, blank lines not counted | `style/noExcessiveLinesPerFile` |
| Layer-violating imports | none (see architecture.md) | `OPEN(owner: tech lead)`: no tool yet |
| Dead code | none | Biome `noUnusedImports` / `noUnusedVariables` |
| Filesystem writes outside `src/writer/` | none | `test/unit/architecture.test.ts` |

**Ratchet.** Files that exceeded a threshold when it was introduced are pinned in `biome.json`
`overrides` at their maximum at that time. The pin may only go down: lower it when a refactor allows,
remove the entry when the file meets the threshold, never raise it. New files get no entry: split the
code instead (as `src/cli/` was split into `setup.ts`, `extensions.ts`, `models-command.ts`, `run.ts`).

## Gates

Approved 2026-10-20 and declared in `projects[].gates` of `.mandao/config.yml`.

| Gate | Command | CI |
|---|---|---|
| format | `npx biome format .` | via lint |
| lint | `npm run lint` | `check` job |
| typecheck | `npm run typecheck` | `check` job |
| test | `npm test` | `check` job |
| secrets | `gitleaks git . --redact --no-banner` | `secrets` job (gitleaks 8.30.1) |
| audit | `npm audit --omit=dev` | — |
| sast | `semgrep scan --config p/typescript --config p/javascript --error --metrics=off` | `sast` job (semgrep 1.181.0) |
| metrics | `npx biome lint --only=…complexity and length rules` | via lint |
