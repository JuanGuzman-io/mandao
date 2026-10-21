# CLI reference

`mandao --help` and `mandao <command> --help` list every option.

| Command | What it does |
|---|---|
| `mandao init [dir]` | Set up the workspace (or `[dir]`, created with `git init` if needed). `--harness`, `--profile <app\|ai\|data>` (work type), `--model-profile <peak\|balanced\|economy>`, `--budget <usd\|none>`, `--shadow`, `--with-scripts` (see [Skills at init](#skills-at-init)), `--scope global` for `/mandao-init`, `--yes` for no prompts |
| `mandao sync` | Regenerate harness files from `.mandao/config.yml`; never overwrites hand edits without `--force`; `--dry-run` shows the changes |
| `mandao doctor` | Validate config, content and generated files; report optional tools and their fallbacks; name each command skill that is not installed for a configured harness, the commands that lose it, its fallback and `mandao skills add <id>` (`warn` when the lock pins it, `info` when it was never installed) |
| `mandao doctor --json` | Same findings as one JSON document for CI (`counts` per level, `findings`); nothing else on stdout. See [schemas.md](schemas.md) |
| `mandao update` | Re-resolve with the installed version; overrides and model choices are never touched |
| `mandao harness add <id...>` | Generate files for more harnesses |
| `mandao models` · `models set <role> <model>` · `models mode <simple\|routed>` · `models profile <peak\|balanced\|economy>` | Show and choose the model per role (leader, reviewer, reviewer_alt, implementer, tester); a profile switches every role at once and keeps your own choices |
| `mandao skills add <id\|pack>` | Install catalog skills with their ecosystem tool, or copy a repository skill at its pinned commit (after confirmation), verify and pin them. `--with-scripts` also copies a repository skill's scripts |
| `mandao skills list` | List skills pinned in the workspace lock |
| `mandao start "<description\|ID>"` | Create the spec's branch and worktree and set it up (env files, dependencies, setup hooks, graph, baseline); print or `--open` the harness there. `--quick`, `--hotfix`, `--type` |
| `mandao worktree list \| clean` | Spec worktrees; `clean` removes only merged ones that hold no work, never forced |
| `mandao approve <spec> <step>` | Approve a step from the terminal, without a model session: `story`, `design`, `spec`, `tasks`, `close` (`--items`), `budget` (`--to <usd\|none>`) |
| `mandao run cost <spec>` | Spend per command and role, with its basis (billed or subscription equivalent); see [Cost](#cost) |
| `mandao run …` | Helper scripts the commands call, with compact JSON on stdout (`MANDAO_JSON=pretty` for people). `mandao run --help` lists them all: planning (`spec-new`, `trace`, `tasks`, `brief`), the Leader loop (`step`, `checkpoint`, `gates`, `review-pack`, `review`, `red`, `mutation`, `commit`, `implement-summary`), verify and close (`verify-plan`, `kaizen`, `impacts`, `publish-plan`, `pr-plan`), and tests under the resource budget (`impact`, `tests`, `build`, `resources`) |

## Entering the spec worktree

`mandao run where <spec> [--harness <id>] [--first <command>]` prints `{ inWorktree, cwd, branch?, expected:
{ branch, worktree }, resume, protected, message }`. `resume` is the active harness's command that opens a
session in `expected.worktree` with the first mandao (`--first`, default `/mandao-implement <spec>`), built
from the harness adapter's `session.resume`; an unknown `--harness` is an error and the default is `claude`,
the same rule as the other `run` commands. `mandao run spec-new ... --harness <id> --first <command>` adds the
same `resume` field for the proposed worktree. The commands print that field when `EnterWorktree` is not
available (any other harness) or is refused (Claude Code), so no command text copies a resume command. The
Codex form single-quotes the skill (`codex '$mandao-implement <spec>'`) so a shell does not expand it.

## Skills at init

The commands use a few catalog skills (graphify, brainstorming, product-manager-toolkit,
software-architect). After writing the config and syncing, `init` offers them:

- **What it shows first.** For each skill: what it does, its source, pinned version, vetted state,
  the commands that use it, and how it would be installed (the shell commands, or the repository, tag,
  commit and the folders it would be copied into). Nothing runs before you answer.
- **The question.** A multiselect with nothing selected. Selecting none, or cancelling, finishes init
  and pins no skill.
- **What happens to the selection.** It goes through the same path as `mandao skills add`: install,
  verify, and pin in `.mandao/mandao.lock`. A skill that cannot be installed is reported as pending
  with the manual step; init still finishes.
- **Repository skills** (`git` sources) are fetched with `git` into a temporary folder outside the
  project, at the catalog's tag. The tag must resolve to the pinned `commit`, or nothing is copied and
  the skill is `failed`. The skill folder is then copied as `<folder>/<id>/` into the skills folder of
  each chosen harness. Claude Code uses `.claude/skills`. Codex, Antigravity and OpenCode use
  `.agents/skills`. Copilot uses `.github/skills`. OpenCode and Copilot add no folder when
  `.claude/skills` or `.agents/skills` is already a target. A `<folder>/<id>/` that already exists is
  left as is, and the output says so. The temporary folder is always removed. The lock records the
  commit.
- **Scripts stay out by default.** Only `SKILL.md` and its documents are copied. A script is a file
  with the executable bit, a script extension (`.sh`, `.js`, `.py`, …) or anything under a `scripts/`
  folder. The output names each script left out. `--with-scripts` (on `init` or `skills add`) copies
  them too, after a warning that they are third-party code (brainstorming's start a local server). The
  lock then records `scripts: true`. Symlinks are never copied.
- **`init --yes`** installs nothing. It lists each skill with its version and source, and prints the
  `mandao skills add <ids>` line that installs them later.

## Approving without a model session

`mandao approve <spec> <step>` checks the same gates the command would, sets the status, records who
approved and when in `_log/approvals.yml`, and makes the spec commit. No model runs, so it costs no
tokens.

- `close` records which proposals you approved (`--items`); `/mandao-close` applies them.
- After approving the spec or the tasks, `approve` prints `newSession: { action, then, fallback }`: the
  active harness's own new-conversation action (`/clear` in Claude Code, `/new` in Codex and OpenCode,
  "New chat" in Copilot, Ctrl+N in Antigravity), the command to run then (`/mandao-implement`), and the
  command that opens a session in the worktree (ADR 0038). The harness is `--harness <id>` (an unknown id
  is an error and nothing is approved), else `claude`, the same rule as the `run` commands; never the first
  configured one. `run step` (when it stops to suggest a cut) and `run implement-summary` (when a cut is
  advised) add the same shape as `session.advice`; the latter keeps `session.command`.
- `budget --to <usd|none>` sets or removes this spec's spend cap (ADR 0036).
- `approve` ends with `next`: `{ recommended: { command, reason }, options }`, the commands that can follow
  the spec's state. It only recommends; the person runs the command.
- `--by-running <command> [--words <text>]` approves because the person ran the command that follows. It
  prints `result: go` and approves (the row records "approved by running <command>", the words verbatim,
  the date and the person), or `result: ask` with the open item or the changed document and approves
  nothing. A critical OPEN is refused as always. `ask` fires on a `CONFLICT`, a `[NEEDS CLARIFICATION]`, a
  pending decision (`- **Decision:** pending`), an unresolved critical Consistency Check row, or a document
  changed after `run next --shown`. With no `shown` row, `--by-running` makes no change claim (older specs
  approve without the change check).
- Each approval row records `sha256` for the documents it approved (`tasks.md` excluded).

`mandao run next <spec>` prints the same `{ recommended, options }` from the spec's state (open items,
depth, drafts, a document changed after its approval, pending commits, tasks, verify, close). It writes
nothing; `--shown` records a `shown` row in `approvals.yml` with the hash of each approvable document. A
`shown` row never replaces an approval's hash: "changed after its approval" compares approval rows only.

## Cost

Each command records what its session spent in the spec's `_log/costs.yml`; `mandao run cost <spec>`
shows the total per command and role.

- **How it is measured (Claude Code).**
  - Mandao reads the session's transcript, `~/.claude/projects/<folder>/<session>.jsonl` (or the same
    path under `$CLAUDE_CONFIG_DIR`), plus its `subagents/*.jsonl`.
  - For each response it takes the last line per message id. The fields are `input_tokens`,
    `cache_creation.ephemeral_5m_input_tokens` / `ephemeral_1h_input_tokens`, `cache_read_input_tokens`
    and `output_tokens`.
  - It prices them with the list prices in `core/models/recommendations.yml` (source and review date
    are in the file).
  - Checked against the cost Claude Code itself reports on 29 sessions: a difference of 0.11% overall,
    and at most 0.44% in one session. Claude Code makes some helper requests that it does not write to
    the transcript, so Mandao counts slightly less.
  - Other harnesses record by hand with `--usd` (and `--basis`).
- **Billed or equivalent.**
  - With an API key or a cloud provider, the figure is money billed at those prices (`basis: billed`).
  - With a Claude subscription, it is what the same tokens would cost at API prices, not what you pay
    (`basis: equivalent`). The subscription has its own limits, and usage beyond the plan is charged
    as credits Mandao cannot see.
  - The basis is read from `claude auth status`; billed and equivalent amounts are never added up as one.
- **Budget: off by default.** Spend is recorded and reported, and nothing stops. `budget.per_spec` is
  optional and only you set it: `init` asks, with no suggested number. With a budget, Mandao warns at
  80%, and past 100% `mandao run step` stops delegating until you run
  `mandao approve <spec> budget --to <usd|none>`.
