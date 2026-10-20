---
name: codebase-conventions
description: How to write and change code in the Mandao repository (TypeScript CLI that renders spec-driven-development content for coding agents). Use it for any change under src/, test/ or core/ — new CLI commands, adapters, schemas, sync or doctor behavior, scripts, templates or commands — and when reviewing such a change, even if the request does not mention conventions. It tells you which layer the code belongs to, which exemplar file to copy, and which rules the gates and the Reviewer enforce.
metadata:
  binding: stack
  generated-from: docs/constitution/standards.md, docs/constitution/architecture.md
  generated: 2026-10-20
---

# Mandao codebase conventions

The rules live in the constitution; this skill tells you where to look and why the rules exist.
Read the linked section before changing code in that area — the constitution wins if it disagrees
with this file.

- Architecture, layers, integrations: `docs/constitution/architecture.md`
- Conventions, errors, thresholds, gates, exemplar files: `docs/constitution/standards.md`
- Decisions and their reasons: `docs/decisions/` (ADRs) and `MANDAO-DESIGN.md`

## Before you write code

1. **Find the layer.** `architecture.md` has the layer table and who may import whom. Most bugs in this
   repo came from logic living in the wrong layer (e.g. `doctor` rebuilding outputs differently from
   `sync`). If two places need the same computation, share one function — `buildProject` is the model.
2. **Copy the exemplar.** `standards.md` → *Exemplar files* names the file to mimic for each kind of
   module (pure adapter, schema, pure decision + IO wrapper, CLI command group, canonical command,
   tests). Matching an exemplar is checked in review.
3. **Check the content first.** Mandao is content over code (ADR 0001). If the change is a methodology
   rule, it probably belongs in `core/templates/**/rules/` or a `core/commands/*.md` file, not in TypeScript.

## Invariants that tests and gates enforce

These are the ones that are easy to break without noticing:

- **Only `src/writer/` touches the filesystem** (ADR 0007). Use `writeText`, `createIfMissing`,
  `editYaml` or the change plan. `test/unit/architecture.test.ts` fails otherwise. The reason: every
  write must be idempotent and must never clobber a file a person edited.
- **Adapters are pure** (`src/adapters/`): data in, `{ files, warnings }` out, no I/O. Anything that
  needs the disk (module guides, model files) is gathered by the engine and passed in.
- **Schemas first.** Every file Mandao reads has a zod schema in `src/schemas/`; types are `z.infer`.
  YAML keys are snake_case; cross-field rules go in `superRefine` with a readable message.
- **The token language is closed** (ADR 0002). A new `{{token}}` or `<!-- mandao:if -->` condition
  needs a code change, a test in `test/unit/render.test.ts` and an ADR.
- **Complexity has a ratchet.** Biome blocks cognitive complexity > 15, functions > 60 lines and files
  > 350 lines. Files already over a limit are pinned in `biome.json` `overrides`; you may lower a pin,
  never raise one or add one. Split the code instead.
- **CLI options on subcommands** need positional options (see `src/cli/program.ts`), or the parent
  command steals them.

## Tests

Follow `core/templates/shared/rules/test-policy.md`: test decisions, validations, transitions and
regressions at the cheapest level; skip DTOs, wiring and pass-throughs. In this repo that usually means:

- pure logic → `test/unit/*.test.ts` (exemplar: `test/unit/models.test.ts`);
- anything that writes or reads a workspace → `test/integration/*.test.ts` with `makeTree` from
  `test/helpers.ts`, never the real repo; never `mkdtempSync`/`tmpdir()` directly, and nothing
  written outside the workspace (the setup file removes it after each test file): no `..` segment in
  `join`/`resolve` and no `dirname` of a workspace, or `test/unit/architecture.test.ts` fails;
- adapter output → snapshots in `test/adapters/__snapshots__/`; review the diff before `vitest -u`.

A bug fix ships with the test that would have caught it.

## Before you report done

Run `npm run check` (typecheck, Biome, tests). If you changed `core/`, `test/unit/content.test.ts`
already renders every command for every profile, mode and harness. If you changed generated output,
run `npm run build && mandao sync` and `mandao doctor` on this repo. Commits follow
`core/templates/shared/rules/commits.md` (emoji first, `Co-Authored-By` trailer when an agent wrote it).
