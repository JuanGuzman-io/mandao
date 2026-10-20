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

Utilities: `quick`, `perf`, `audit`, `resume`. In this version `constitution`, `specify` and `quick`
are implemented; the others are declared with their contracts and say so when invoked.

## Harnesses

| Harness | Commands | Personas | Verified |
|---|---|---|---|
| Claude Code | `.claude/skills/mandao-*/SKILL.md` | `.claude/agents/mandao-*.md` | 2026-10-19 |
| GitHub Copilot (VS Code) | `.github/prompts/mandao-*.prompt.md` | `.github/agents/mandao-*.agent.md` | 2026-10-19 |
| Any other agent | `AGENTS.md` (managed block) | — | — |

## CLI

| Command | What it does |
|---|---|
| `mandao init` | Set up the workspace (or `--scope global` for `/mandao-init`) |
| `mandao sync` | Regenerate harness files from `.mandao/config.yml`; never overwrites hand edits without `--force` |
| `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks |
| `mandao update` | Re-resolve with the installed version; overrides are never touched |
| `mandao harness add <id>` | Generate files for another harness |
| `mandao models` · `models set <role> <model>` · `models mode <simple\|routed>` | Show and choose the model per role (leader, reviewer, reviewer_alt, implementer, tester) |
| `mandao skills add <id\|pack>` | Install catalog skills with their ecosystem tool (after confirmation), verify and pin them |
| `mandao run quick-check \| fingerprint \| models` | Helper scripts used by the commands (JSON output) |

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
npm run check      # typecheck + tests
npm run build
```

Requires Node ≥ 22.18. Commits follow the format in `core/templates/shared/rules/commits.md`.
