---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
status: draft
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

## Dependencies

Runtime dependencies stay minimal (6 today). A new runtime dependency needs a reason in the PR and a
license compatible with MIT.

## Clean-code thresholds (level 0 gates, blocking)

| Metric | Threshold | Tool |
|---|---|---|
| Cyclomatic complexity per function | `OPEN(owner: tech lead)`: proposal 15 | Biome `noExcessiveCognitiveComplexity` (not enabled yet) |
| Function length (lines) | `OPEN`: proposal 80 | — |
| File length (lines) | `OPEN`: proposal 400 (largest today: `src/cli/init.ts`, 353) | — |
| Duplication | `OPEN` | — |
| Layer-violating imports | none (see architecture.md) | `OPEN`: no tool yet |
| Dead code | none | Biome `noUnusedImports` / `noUnusedVariables` |

## Gates

Proposed for `projects[].gates` (pending approval):

| Gate | Command |
|---|---|
| format | `npx biome format .` |
| lint | `npm run lint` |
| typecheck | `npm run typecheck` |
| test | `npm test` |
| audit | `npm audit --omit=dev` |
| secrets | `OPEN`: no scanner configured |
| sast | `OPEN`: no scanner configured |
| metrics | `OPEN`: depends on the thresholds above |
