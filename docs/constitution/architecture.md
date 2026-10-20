---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
owner: tech lead
status: draft
---

# Architecture (TRD)

Mandao is a Node CLI that installs neutral Markdown/YAML content into the formats of several coding
agents. Evidence: `package.json` (`bin.mandao → dist/cli.js`), `src/cli/index.ts`, `core/`.

## Stack

| Project | Language | Frameworks (versions) | Style-defining libraries |
|---|---|---|---|
| mandao | TypeScript (`~6.0.3`, strict, `noUncheckedIndexedAccess`), ESM, Node ≥ 22.18 | commander `^15`, @clack/prompts `^1.8` | zod `^4` (all schemas), yaml `^2`, gray-matter `^4`; build tsup `^9`; tests vitest `^5`; lint/format Biome `2.5.15` |

## Layers and allowed dependencies

```
cli ──▶ engine ──▶ adapters ──▶ render ──▶ schemas
         │  └────▶ resolver ───────────────▶ schemas
         ├────▶ writer
         └────▶ models, skills, scripts, workspace ──▶ schemas
```

| Layer | Path | Role | May depend on |
|---|---|---|---|
| CLI | `src/cli/` | Commands, prompts, printing | everything below |
| Engine | `src/engine/` | Sync pipeline, doctor, config/lock IO | adapters, resolver, writer, models, render, schemas |
| Adapters | `src/adapters/` | **Pure** canonical → harness files (ADR 0007) | render, resolver types, models types, schemas |
| Render | `src/render/` | Token and conditional rendering, template install (ADR 0002) | schemas |
| Resolver | `src/resolver/` | overrides > presets > core (ADR 0004) | schemas |
| Writer | `src/writer/` | Change plan, drift, orphans, applying files (ADR 0003) | schemas |
| Models | `src/models/` | Role → model resolution and offers (ADR 0011) | schemas |
| Skills | `src/skills/` | Catalog installs and verification | schemas |
| Scripts | `src/scripts/` | `mandao run` helpers, JSON out (ADR 0006) | schemas, workspace |
| Workspace | `src/workspace/` | Read-only layout detection (ADR 0005) | schemas |
| Schemas | `src/schemas/` | zod schemas, single source of types | zod, semver |

`CONFLICT(a: ADR 0007 "only src/writer/ touches the filesystem", b: src/engine/files.ts, src/cli/init.ts,
src/cli/index.ts, src/cli/models.ts write config.yml, models.yml, sources.yml and the lock; decides: tech lead)`.
The writer owns *generated* files only; user-intent files are written elsewhere. Proposed resolution:
amend ADR 0007 to say "generated files", or route those writes through one module.

## Patterns and conventions

- **Pure core, impure edges**: adapters, render, resolver, models resolution and `analyzeDiff` /
  `proposeSkills` take data and return data; IO lives in engine, writer, cli and the `collect*` /
  `read*` functions.
- **Content over code** (ADR 0001): methodology rules live in `core/templates/**/rules/`, not in TypeScript.
- **Closed token language** (ADR 0002): unknown tokens and conditions fail validation.
- **Config is intent, lock is resolution** (ADR 0003).

## Integrations

| Integration | Where | How |
|---|---|---|
| git | `src/scripts/quick-check.ts`, `src/cli/init.ts` | `execFileSync('git', …)` |
| npm registry | `{{script:x}}` rendering in `src/render/render.ts` | `npx -y mandao@<version>` |
| Skill ecosystems | `src/skills/install.ts` | shell installers after confirmation |
| graphify | `src/engine/doctor.ts` | PATH detection and hook checks only |

## Quality attributes

| Attribute | Scenario | Measure |
|---|---|---|
| Idempotence | `mandao sync` twice | second run reports only `unchanged` (test: `test/integration/engine.test.ts`) |
| Safety | a generated file edited by hand | never overwritten without `--force` (test: `test/unit/writer.test.ts`) |
| Portability | every core command renders for every profile × mode × harness | no unrendered token leaks (test: `test/unit/content.test.ts`) |
