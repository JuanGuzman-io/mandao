# 0012 — Corrections from the first dogfooding run

**Status:** Accepted · 2026-10-20

## Context
Running `/mandao-constitution` on Mandao itself (iteration 2) exposed gaps: scripts that could not run
before publishing, a code graph polluted by generated files, module guides invisible to Claude Code,
ambiguous approval steps, unchecked tool versions, and model defaults that some plans cannot use.

## Decisions

1. **Single writer.** Every write goes through `src/writer/` (ADR 0007, amended).
2. **Graphify hooks**, in order: exclusions first (decision 5), then the tool's own installers
   (`graphify claude install`, `graphify hook install`), which merge with `.claude/settings.json` and
   existing git hooks; Mandao's constitution step snapshots both before and checks nothing was lost.
   `doctor` checks the hooks exist.
3. **Gates** for this repository are declared in `projects[].gates`. CI adds secret scanning (gitleaks
   8.30.1) and light SAST (semgrep 1.181.0). Clean-code thresholds use Biome: cognitive complexity 15,
   60 lines per function, 350 per file. Files over a limit when it was introduced are pinned at their
   current maximum in `biome.json` overrides and may only go down (a ratchet).
4. **Project skill.** A technology without a catalog entry gets a project skill generated with
   skill-creator from `standards.md` and `architecture.md` (`.claude/skills/codebase-conventions`,
   binding `stack`, listed in the Skill Map). No catalog entries for zod/commander/vitest yet.
5. **Model recommendations** default only to models available on every plan of the harness. Plan- or
   admin-dependent models are listed under `optional` with the note "requires availability on your
   plan". Claude Code: `reviewer_alt` defaults to `sonnet`; Fable is optional. Copilot: defaults come
   from models included on Pro, Pro+, Max, Business and Enterprise and supported in VS Code; Copilot
   Free and Student only get auto model selection, so they ignore model fields.
6. **Script runner.** Generated commands call `node .mandao/bin/mandao.mjs`, a generated launcher that
   resolves local `node_modules/.bin` → a global install → `npx -y mandao@<lock version>`.
   `scripts.runner` (`auto | local | global | npx`) forces one. `doctor` asks the launcher what it
   would run and, for npx, whether that version exists on the registry. Before publishing, use
   `npm link`. A new token `{{mandao}}` renders the launcher (ADR 0002 extension).
7. **Graph exclusions** are derived from the adapters' generated paths plus conventional build outputs
   and written as a managed block in `.graphifyignore`; `graphify-out/` goes in a managed block of
   `.gitignore`. Nothing is maintained by hand.
8. **Module pointers.** With Claude Code active, every module `AGENTS.md` gets a `CLAUDE.md` with
   `@AGENTS.md`; `sync` creates missing ones and removes orphans. The Implementer's DoD and the
   Reviewer's checklist include the pointer.
9. **Constitution command.** `skills add` runs through the launcher at the catalog's pinned version;
   the hint is `[mode] [--product]` (arguments may be `flag: true`); in new and legacy mode documents
   are written as `status: draft`, the user reviews them in the files, approval moves them to
   `approved`, and nothing is committed before approval.
10. **Tool versions.** Catalog sources may declare `version_command`; `doctor` compares the installed
    version with the pin and offers `mandao skills add <id>`, which asks before running anything.

## Consequences
- A pinned version cannot be enforced for `skills`-type sources until the skills CLI documents a
  version syntax; the catalog version is recorded but the installer takes the latest.
- Changing graph exclusions requires a full graph rebuild (graphify keeps nodes of newly excluded
  files and refuses to shrink the graph without `--force`).
