# Mandao

> *mandao*: Cali slang for an errand you send someone to run.

Spec-Driven Development for AI coding agents, across harnesses. Every command is a *mandao* given to
the agent: a clear list, done exactly as asked, with a receipt at the end.

Mandao is mostly content (commands, templates, personas and a skills catalog in neutral Markdown and
YAML) plus a thin CLI that installs it, resolves overrides and renders it for each harness.

## Quick start

```bash
npx mandao init            # or: pnpm dlx mandao init · bunx mandao init
```

`init` detects the workspace (single repo, monorepo or polyrepo), asks which harnesses to generate
for, and writes `.mandao/` plus the harness folders. Then, in your agent:

```
/mandao-constitution       # foundation: technical constitution, product context, AGENTS.md, skills
/mandao-specify PROJ-123   # requirements + design for one story
/mandao-quick "fix the checkout button label"
```

To get `/mandao-init` in every repository: `npx mandao init --scope global`.

## Flow

```
constitution → story → specify → [clarify] → tasks → implement → verify → close
```

Utilities: `quick`, `perf`, `audit`, `resume`. Implemented: `constitution`, `story`, `specify`,
`clarify`, `tasks`, `implement`, `quick` and `resume`; `verify`, `close`, `perf` and `audit` are declared
with their contracts and say so when invoked. Work can move between harnesses mid-spec: every Leader
step is checkpointed in the spec folder and `/mandao-resume <ID>` continues it anywhere.

At `lite` depth `/mandao-specify` writes the story, a single `spec.md` and up to three tasks in one
session, with one approval.

### Approving without a model session

`mandao approve <spec> <step>` (`story`, `design`, `spec`, `tasks`, `close`) checks the same gates the
command would, sets the status, records who approved and when in `_log/approvals.yml`, and makes the
spec commit. No model runs, so it costs no tokens. For `close` it records which proposals you approved;
`/mandao-close` applies them.

After approving, continue with the next command **in the same session**: its context is already loaded
and the provider's prompt cache is warm, so the next step costs less than a new session.

## Harnesses

| Harness | Commands | Personas | Verified | Tested |
|---|---|---|---|---|
| Claude Code | `.claude/skills/mandao-*/SKILL.md` | `.claude/agents/mandao-*.md` | 2026-10-19 | live |
| GitHub Copilot (VS Code) | `.github/prompts/mandao-*.prompt.md` | `.github/agents/mandao-*.agent.md` | 2026-10-19 | snapshots |
| Codex (OpenAI) | `.agents/skills/mandao-*/SKILL.md` (`$mandao-<id>`) | `.codex/agents/mandao-*.toml` | 2026-10-20 | live |
| OpenCode (2.1.1 – 2.x) | `.opencode/commands/mandao-*.md` | `.opencode/agents/mandao-*.md` | 2026-10-20 | **live-tested (TUI)**; non-interactive invocation needs OpenCode 2's server API (OPEN) |
| Antigravity (Google) — **experimental** | `.agents/skills/mandao-*/SKILL.md`, shared with Codex | `.agents/agents/mandao-*.md` | 2026-10-20 | **not live-tested**: snapshots only |
| Any other agent | `AGENTS.md` (managed block) | — | — | — |

Supported versions per harness are checked by `mandao doctor` (ADR 0025).

## CLI

| Command | What it does |
|---|---|
| `mandao init` | Set up the workspace (or `--scope global` for `/mandao-init`) |
| `mandao sync` | Regenerate harness files from `.mandao/config.yml`; never overwrites hand edits without `--force` |
| `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks |
| `mandao doctor --json` | Same findings as one JSON document for CI (`counts` per level, `findings`); nothing else on stdout. See [`docs/schemas.md`](docs/schemas.md) |
| `mandao update` | Re-resolve with the installed version; overrides are never touched |
| `mandao harness add <id>` | Generate files for another harness |
| `mandao models` · `models set <role> <model>` · `models mode <simple\|routed>` · `models profile <peak\|balanced\|economy>` | Show and choose the model per role (leader, reviewer, reviewer_alt, implementer, tester); a profile switches every role at once and keeps your own choices |
| `mandao skills add <id\|pack>` | Install catalog skills with their ecosystem tool (after confirmation), verify and pin them |
| `mandao skills list` | List skills pinned in the workspace lock |
| `mandao approve <spec> <step>` | Approve a step from the terminal, without a model session |
| `mandao run cost <spec>` | Spend per command and role against `budget.per_spec`; commands record their own spend (Claude Code reads its session record at official prices) |
| `mandao run …` | Helper scripts the commands call, compact JSON on stdout: `spec-new`, `trace`, `tasks`, `brief`, `loop`, `commit-msg`, `status`, `where`, `checkpoint`, `impact`, `resources`, `tests`, `models`, `quick-check`, `fingerprint` |

## Customizing

Files in `.mandao/overrides/` win over presets and core:

- `commands/<id>.md` replaces a command; `commands/<id>.patch.yml` changes only its frontmatter.
- `templates/<shared|app|ai|data>/<path>` replaces a template, e.g. `templates/shared/rules/review.md`.
- `personas/<id>.md` or `personas/<id>.patch.yml` for the Leader, Implementer, Reviewer and Tester.

## Docs

- [Design document](MANDAO-DESIGN.md): the source of truth
- [Command format](docs/command-format.md) and [schemas](docs/schemas.md)
- [Decisions](docs/decisions/)

## Development

```bash
npm install
npm run check      # typecheck, Biome (lint, format, complexity) and tests
npm run build
npm link           # expose this checkout as the global `mandao` until it is published
```

Generated commands call `node .mandao/bin/mandao.mjs`, which runs Mandao from local
`node_modules/.bin`, then a global install (such as `npm link`), then `npx mandao@<locked version>`.
Force one with `scripts.runner` in `.mandao/config.yml`; `mandao doctor` shows which one it uses.
Undo the link with `npm rm -g mandao`.

Contributing and releasing (trusted publishing with OIDC, no npm token): [CONTRIBUTING.md](CONTRIBUTING.md).

Requires Node ≥ 22.18. Commits follow the format in `core/templates/shared/rules/commits.md`.

Planned: work types for ML, infrastructure, DevOps and security.
