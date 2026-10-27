<div align="center">

<img src="docs/assets/banner.webp" alt="Mandao" width="640">

**Spec-Driven Development for AI coding agents. Any harness.**

*mandao* · Cali slang for an errand you send someone to run — and expect done right.

[![npm](https://img.shields.io/npm/v/mandao/beta.svg?label=npm%40beta)](https://www.npmjs.com/package/mandao)
[![CI](https://github.com/JuanGuzman-io/mandao/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/JuanGuzman-io/mandao/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

> **Beta.** The core flow is stable and tested on real specs; some commands are still planned. Feedback welcome.

[Quick start](#quick-start) · [How it works](#how-it-works) · [Agent commands](#agent-commands) · [Choose your path](#choose-your-path) · [Harnesses](#harnesses) · [Terminal](#terminal) · [Docs](#docs)

</div>

---

## Why Mandao

AI agents write code fast. They also guess, skip tests and say "done" when it isn't. Mandao gives every
piece of work a clear errand — a spec — and doesn't sign off until there's a receipt.

- **Specs people can read.** Stories with acceptance criteria, traced to requirements, tasks, tests and commits.
- **A reviewer that isn't the author.** Every task is checked by a separate agent in a clean context — another
  model or another harness when one is available, and the record says when it isn't.
- **Tests before code.** Where tests apply, a failing test from the spec comes first; the record shows it.
- **Evidence, not memory.** Stack choices and design premises are run on your machine; research cites dated sources.
- **One flow, any harness.** Claude Code, Codex, OpenCode, Copilot. Out of tokens mid-spec? Switch tools and
  run `/mandao-resume`.
- **You decide; it learns.** It stops only where a decision is yours, and after every spec it measures rework,
  cost and time and proposes fixes you approve.

## Quick start

**Requirements:** Node ≥ 22.18 · git · a [supported harness](#harnesses). Recommended:
[Archify](https://github.com/tt-a1i/archify) for the diagrams (offered during `init`) and
[Graphify](https://github.com/Graphify-Labs/graphify) to map your code (without it, mapping falls back to plain search).

**1. Install it in your project** (pick one):

```bash
npx mandao@beta init my-project     # a new project: creates the folder and runs git init
npx mandao@beta init                # an existing repository: detects single repo, monorepo or polyrepo
npx mandao@beta sync                # a team repository that already uses Mandao
```

`init` asks which harnesses you use, the models (one profile: `peak`, `balanced` or `economy`) and who decides:
a team (PO, tech lead, dev) or only you (one role, e.g. PE).

**2. In your agent, build the foundation:**

```
/mandao-constitution
```

It reads your code (or asks what you're building), writes the technical rules and the product context as
**draft**, checks every stack choice on your runtime, and waits for your approval.

**3. Build something:**

```
/mandao-story let customers save a cart for later
```

From there the commands chain on their own and stop only for your decisions.
Something small? `/mandao-quick fix the label on the checkout button`.

<details>
<summary><b>Other ways to install</b></summary>

- **Every repository:** `npx mandao@beta init --scope global --harness claude,codex` installs `/mandao-init`,
  which sets Mandao up from inside your agent.
- **Without changing a team repository:** `npx mandao@beta init --shadow` keeps every generated file out of
  git (via `.git/info/exclude`).
- **Monorepo:** each app or package is a project; one workspace constitution, one per project for what differs.
- **Polyrepo:** `init` offers to turn the root into a workspace repo, so a spec that touches several repos is
  versioned in one place.
- Prefer another runner? `pnpm dlx mandao@beta …` and `bunx mandao@beta …` work too.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/diagrams/install-dark.svg">
  <img alt="Which install do I need?" src="docs/diagrams/install-light.svg">
</picture>

</details>

## How it works

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/diagrams/overview-dark.svg">
  <img alt="Mandao overview: commands and how processes connect" src="docs/diagrams/overview-light.svg">
</picture>

<sub>Green: agent commands (a model session) · red: you approve · orange: `mandao` scripts, no tokens. Every diagram is generated from the commands themselves.</sub>

```
constitution → story → specify → [clarify] → tasks → implement → verify → close
```

1. **Constitution** — once per project: the technical rules, the product context and the skills for your stack.
2. **Story** — what to build and why, with acceptance criteria. A long requirements document becomes a
   proposal of stories first (`/mandao-story --from <file>`).
3. **Specify** — requirements and a design with a diagram, for your approval. The command that creates the
   spec also creates its branch, in this checkout (a separate worktree only when another spec is open or you ask).
4. **Tasks** — small tasks, each with its tests. At `--depth lite`, `specify` writes them itself.
5. **Implement** — a Leader hands each task to an Implementer; tests fail first; a Reviewer that isn't the
   author checks it; one local commit per approved task.
6. **Verify** — the impacted tests, e2e on critical flows, and every acceptance criterion traced to its tests.
7. **Close** — the close summary (notes for the business and for developers), Kaizen, the approved
   constitution changes; then it asks once where to deliver and pushes and opens the PR.

**Commands chain.** Each one runs the next and stops only where a decision is yours: an approval, a product
question, push and merge. Every stop names the next command complete, ready to copy
(`/mandao-implement MDO-0003`). `flow.chain: false` in `.mandao/config.yml` turns chaining off. You never
create branches or run git by hand.

How Mandao keeps the quality — TDD, the independent review, gates, evidence and cost: [docs/quality.md](docs/quality.md).

## Agent commands

You type these in your agent's session (`/mandao-<command>`; Codex: `$mandao-<command>`). Each page has every
argument with its values, default and examples.

<!-- mandao:readme-commands:begin — generated by npm run diagrams from core/commands; do not edit -->
| Command | Usage | What it does |
|---|---|---|
| [`/mandao-constitution`](docs/commands/constitution.md) | `/mandao-constitution [auto\|new\|legacy\|active] [--product]` | The project's foundation: technical rules, product context, AGENTS.md and skills |
| [`/mandao-story`](docs/commands/story.md) | `/mandao-story [ref] [--from <file>] [--intake <proposal#I-n>]` | A story with enough context, from your tracker, one line or a requirements document |
| [`/mandao-specify`](docs/commands/specify.md) | `/mandao-specify [ref] [--depth <lite\|standard\|full>] [--hotfix]` | Requirements, design and a diagram you approve; at lite, the tasks too |
| [`/mandao-clarify`](docs/commands/clarify.md) | `/mandao-clarify <spec>` | Resolves open questions and conflicts with whoever owns each decision |
| [`/mandao-tasks`](docs/commands/tasks.md) | `/mandao-tasks <spec>` | Small, traceable tasks with their tests, for your approval |
| [`/mandao-implement`](docs/commands/implement.md) | `/mandao-implement <spec> [task]` | Leader, Implementer and an independent Reviewer per task, red tests first, one commit each |
| [`/mandao-verify`](docs/commands/verify.md) | `/mandao-verify <spec>` | Impacted tests, e2e on critical flows, and every acceptance criterion traced |
| [`/mandao-close`](docs/commands/close.md) | `/mandao-close <spec>` | Close summary, Kaizen, approved constitution changes, then push and PR in the session |
| [`/mandao-quick`](docs/commands/quick.md) | `/mandao-quick <change>` | A small change behind a gate, with review and one commit; escalates to a spec if it grows |
| [`/mandao-resume`](docs/commands/resume.md) | `/mandao-resume [spec]` | Continues a spec from its checkpoint, in any harness; without an id, a dashboard |

Planned: [`/mandao-research`](docs/commands/research.md), [`/mandao-perf`](docs/commands/perf.md), [`/mandao-audit`](docs/commands/audit.md). `/mandao-init` sets Mandao up from inside your agent after `mandao init --scope global`.
<!-- mandao:readme-commands:end -->

## Choose your path

✅ required · ⚙️ triggers on its own · ➕ optional. Each path has its diagram in the [process map](docs/process-map.md).

<!-- mandao:readme-paths:begin — generated by npm run diagrams from docs/process-map.md; do not edit -->
| You want to… | Path |
|---|---|
| **Set up a project** | `init` ✅ → `constitution` ✅ → `constitution --product` ➕ |
| **Build a story** | `story` ➕ → `specify` ✅ → `clarify` ⚙️ → `tasks` ✅ → `implement` ✅ → `verify` ✅ → `close` ✅ |
| **Start from a requirements document** | `story --from` ✅ (proposes epics and stories) → `story --intake` ✅ (opens each story you pick) → `specify` ✅ |
| **Fix a bug** | `specify --depth lite` ✅ (regression test red first) → `implement` ✅ → `verify` ✅ → `close` ✅ |
| **Ship a hotfix** | `specify --hotfix` ✅ → `implement` ✅ → `verify` ✅ → `close` ✅ (reminds the back-merge) |
| **Make a small change** | `quick` ✅ (escalates to a spec if it grows) |
| **Pick up where you left off** | `resume` ✅ → `implement` ✅ |
<!-- mandao:readme-paths:end -->

## Harnesses

| Harness | Status |
|---|---|
| Claude Code | 🟢 live-tested |
| Codex (OpenAI) | 🟢 live-tested |
| OpenCode 2.x (2.1.1+) | 🟢 live-tested in the TUI · non-interactive use pending |
| GitHub Copilot (VS Code) | 🟡 snapshot-tested |
| Antigravity (Google) | 🧪 experimental · not live-tested |
| Any other agent | ⚪ via `AGENTS.md` |

Where files go for each harness: [docs/harnesses.md](docs/harnesses.md).

**Models are your call.** Mandao recommends one per role from each vendor's docs, dated, and never changes a
model without you (`mandao models`).

**Cost in the open.** Every spec records its cost per command and role. On a subscription these are list-price
equivalents, not money billed. No budget cap unless you set `budget.per_spec`. How it is measured:
[docs/cli.md](docs/cli.md#cost).

## Terminal

The agent commands run Mandao's scripts themselves. These are the ones you type:

| Command | When |
|---|---|
| `mandao init` | Set Mandao up in a repository |
| `mandao sync` | Regenerate the harness files after a config change or a `git pull` |
| `mandao doctor` | Check that everything is ready, and what is missing |
| `mandao update` | Bring a project to the installed Mandao version |
| `mandao harness add <id>` | Add a harness to the project |
| `mandao approve <spec> <step>` | Approve a step without a model session (no tokens) |

Every terminal command, with its flags and examples: [docs/cli.md](docs/cli.md).

## Docs

- [Agent commands, one page each](docs/commands/) · [Process map](docs/process-map.md) · [Terminal commands](docs/cli.md)
- [How Mandao keeps the quality](docs/quality.md) · [Spec anatomy](docs/spec-anatomy.md) · [Harnesses](docs/harnesses.md)
- [Customizing with overrides](docs/customizing.md) · [Command format](docs/command-format.md) · [Schemas](docs/schemas.md)
- [Design document](MANDAO-DESIGN.md) · [Decisions](docs/decisions/) · [Backlog](docs/backlog.md)

## Contributing

```bash
npm ci
npm run lint && npm run typecheck
npx --no-install vitest related --run --maxWorkers=2 <changed files>
npm run build && node dist/cli.js --help
```

The full suite runs in PR CI. Commits, releases and trusted publishing: [CONTRIBUTING.md](CONTRIBUTING.md).

## Acknowledgments

Mandao stands on ideas from [GitHub Spec Kit](https://github.com/github/spec-kit) and [AKILI-SPECS](https://github.com/JuankCadavid/akili-specs).

## License

[MIT](LICENSE) © Juan David Delgado Guzmán
