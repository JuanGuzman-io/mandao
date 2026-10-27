# 0062 — Commands documented from their source

**Status:** Accepted (Phase 19). Extends ADR 0059's derived `docs/cli.md` to the agent commands and the README.

## Context

In the beta trial a hand-over suggested `--depth lite` and the user could not tell what `--depth` did or which
values it took: the command pages listed arguments loosely (`depth: lite | standard | full` while every hand-over
wrote `--depth lite`), `story` hid `--from` and `--intake` inside another argument's description, and the project
itself got one line per command with no arguments. The README, the most visible page, had drifted from the product:
it said every spec works in its own worktree and that delivery is a terminal step (both changed in phase 16),
described an epic path that does not exist, showed no command's arguments, and mixed implementation detail into
the front page.

## Decision

1. **One syntax.** An argument declares how it is typed: `flag: true` makes it `--kebab-name`, `value` adds what
   it takes (`--depth <lite|standard|full>`); a positional `value` lists its values. A flag has no position:
   `{{arg:x}}` on it is refused and Claude's positional `arguments` and OpenCode's `$n` count only positional
   ones. Each command adds `examples` (`run`, `does`) and a short `summary`.
2. **Derived everywhere.** The argument hint of every harness, the command pages (usage line, argument table,
   examples), the command index, the installed guide (arguments and two examples per command) and two blocks
   of the README (the agent command table and the paths) are generated from the frontmatter and the process
   map (`npm run diagrams`); `diagrams:check` fails when any of them is stale.
3. **Docs that cannot lie.** A test reads the README, `docs/cli.md`, `docs/quality.md` and the command index and
   fails on a `mandao` command or flag the CLI does not have, a `/mandao-` command or flag core does not
   declare, a broken local link, or a retired flow statement.
4. **README** (PE decisions): the banner first; quick start in three steps; the flow as it is; the agent
   commands at the center; only the six terminal commands a person types, the rest in `docs/cli.md`, which gains
   a section with examples per user command; the quality detail in `docs/quality.md`; English.

## Consequences

- Changing a command's arguments changes its hint, page, guide entry and README row in one `npm run diagrams`.
- A stable command with arguments must carry an example that uses only its declared flags.
