# 0030 — init in a new folder, shadow mode, hotfix lane, other SDD frameworks

**Status:** Accepted · 2026-10-20

1. **`mandao init [dir]`** creates the folder when missing and runs `git init` when it is not inside a
   repository. Without `dir`, the current folder as before.
2. **Shadow mode** (`init --shadow`, `shadow: true` in `config.yml`), for pilots: a managed block in
   `.git/info/exclude` (resolved with `git rev-parse --git-path`, so it covers every worktree) lists
   `.mandao/`, every generated folder, the untracked managed-block files, the constitution and the specs.
   Managed blocks are **never written into files git tracks** (the team's `AGENTS.md`, `CLAUDE.md`,
   `.gitignore`). `sync` and `doctor` share the same build, so shadow mode is not drift; `doctor` reports
   it as info with the tracked files it leaves alone. A backup of what is excluded is the pilot's to
   keep (pilot plan).
3. **Hotfix lane.** `specify --hotfix` proposes the branch from `branching.hotfix.from` with the hotfix
   prefix and marks the story `lane: hotfix` (so `where` expects that branch). `close` lists the
   back-merges `branching.hotfix.merge_to` requires as open items; Mandao never merges or pushes them.
4. **Other SDD frameworks.** `doctor` looks, by directory name only, for commands and skills of AKILI,
   GitHub Spec Kit, BMAD, OpenSpec, Kiro and Agent OS at project and user level, in every harness folder
   (OpenCode also reads `.claude/skills` and `.agents/skills`). It warns where they are and how to keep
   them out of the way. It never modifies or removes them. Found in the OpenCode acceptance run, where a
   user-level AKILI skill answered a plain-text `/mandao-resume`.
5. **OpenCode status:** live-tested in the TUI; non-interactive invocation of mandaos needs OpenCode 2's
   server API (`session.command`) and stays OPEN. `doctor` and the README say so.
