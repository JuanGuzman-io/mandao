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
| CLI | `src/cli/` | `program.ts` assembles command groups (`setup`, `extensions`, `models-command`, `run`, `start`, `approve`, `worktree`, `hook`); prompts and printing | everything below |
| Engine | `src/engine/` | Sync pipeline (`buildProject`, shared with doctor), doctor, launcher, graph exclusions, config/lock reads | adapters, resolver, writer, models, render, schemas, skills |
| Adapters | `src/adapters/` | **Pure** canonical → harness files (ADR 0007) | render, resolver types, models types, schemas |
| Render | `src/render/` | Token and conditional rendering, template install (ADR 0002) | schemas |
| Resolver | `src/resolver/` | overrides > presets > core (ADR 0004) | schemas |
| Writer | `src/writer/` | Change plan, drift, orphans, applying files (ADR 0003) | schemas |
| Models | `src/models/` | Role → model resolution and offers (ADR 0011) | schemas |
| Skills | `src/skills/` | Catalog installs and verification | schemas |
| Scripts | `src/scripts/` | `mandao run` helpers, JSON out (ADR 0006) | schemas, workspace |
| Workspace | `src/workspace/` | Read-only layout detection (ADR 0005) | schemas |
| Spec domain | `src/spec/` | Task planning, TDD/review loop, checkpoints, costs, traceability and closure | models, schemas, pure helpers from scripts and engine/frontmatter; IO belongs in scripts/writer |
| Commit policy | `src/commits/` | Generated commitlint configuration | schemas |
| Utilities | `src/util/` | Package roots, hashing and shared primitives | Node APIs, schemas as needed |
| Schemas | `src/schemas/` | zod schemas, single source of types | zod, semver |

All filesystem writes go through `src/writer/` (ADR 0007, amended 2026-10-20): generated files via the
change plan, and user-intent files (`config.yml`, `models.yml`, the lock, `.gitignore` blocks) via
`writeText`, `createIfMissing` and `editYaml`, which are idempotent and refuse to overwrite a file that
changed on disk mid-edit. `test/unit/architecture.test.ts` fails on any write elsewhere. The
`CONFLICT` raised by the first constitution run is resolved.

## Patterns and conventions

- **Pure core, impure edges**: adapters, render, resolver, models resolution and `analyzeDiff` /
  `proposeSkills` take data and return data; IO lives in engine, writer, cli and the `collect*` /
  `read*` functions.
- **Content over code** (ADR 0001): methodology rules live in `core/templates/**/rules/`, not in TypeScript.
- **Closed token language** (ADR 0002): unknown tokens and conditions fail validation.
- **Config is intent, lock is resolution** (ADR 0003).

## Harnesses and derived documentation

`src/adapters/index.ts` registers Claude Code, GitHub Copilot, Codex, OpenCode and experimental
Antigravity. This workspace enables Claude, Copilot and Codex (`.mandao/config.yml`). Codex commands
live in `.agents/skills/mandao-*/`; roles and permissions live in `.codex/agents/` and `.codex/rules/`.
Trust and model availability are checked by doctor; rendering does not prove a live harness run.

`scripts/diagrams/derive.mjs` derives JSON diagram specifications from command content, process-map
and selected code. `build.mjs` renders light/dark SVG with Archify; `check.mjs` verifies source hashes,
specification hashes and generated command pages without requiring Archify. This development tooling
is separate from the packaged `src/` runtime. Evidence: `package.json`, `scripts/diagrams/check.mjs`.

## Integrations

| Integration | Where | How |
|---|---|---|
| git | `src/scripts/quick-check.ts`, `src/cli/start.ts`, `src/scripts/commits.ts` | `execFileSync('git', …)` |
| npm registry | `{{script:x}}` rendering in `src/render/render.ts` | `npx -y mandao@<version>` |
| Skill ecosystems | `src/skills/install.ts` | shell installers after confirmation |
| Skill repositories | `src/skills/git-copy.ts` | `git` fetch of a pinned commit after confirmation; argument arrays, timeout, no prompts |
| graphify | `src/engine/doctor.ts`, `src/cli/hook.ts` | graph checks and graph-first guards; locally installed git hook refreshes the graph |
| External tracker | `src/scripts/publish.ts`, `core/commands/close.md` | CLI prepares an idempotent payload; the agent uses MCP only after approval |

## Quality attributes

| Attribute | Scenario | Measure |
|---|---|---|
| Idempotence | `mandao sync` twice | second run reports only `unchanged` (test: `test/integration/engine.test.ts`) |
| Safety | a generated file edited by hand | never overwritten without `--force` (test: `test/unit/writer.test.ts`) |
| Portability | every core command renders for every profile × mode × harness | no unrendered token leaks (test: `test/unit/content.test.ts`) |

CONFLICT(a: the earlier layer diagram omits src/spec, b: src/spec/commit.ts and verify.ts import scripts/impact.ts while markdown.ts imports engine/frontmatter.ts, decides: tech lead): these IO-free helpers cross the old layer boundaries. This proposal records the existing dependencies; extracting shared helpers is a separate design decision.
