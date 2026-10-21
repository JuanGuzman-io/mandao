---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
---

# Quickstart — Recommend each command's skills at init

**Before you start:** this branch built (`npm run build`), an empty folder, `git` on PATH and network
access to GitHub.

1. In the empty folder, run `node <worktree>/dist/cli.js init`, choose Claude Code and Codex, and
   answer the questions.
   You should see: a skills step listing brainstorming, product-manager-toolkit, graphify and
   software-architect, each with what it does, source, version, the commands that use it and where it
   would be copied (`.claude/skills`, `.agents/skills`). Nothing is selected.
2. Select only brainstorming and confirm.
   You should see: `installed brainstorming`; `.claude/skills/brainstorming/SKILL.md` and
   `.agents/skills/brainstorming/SKILL.md` exist, and `.mandao/mandao.lock` pins it with commit
   `bb92a77…`.
3. Run `node <worktree>/dist/cli.js doctor`.
   You should see: info lines for the skills you did not install, naming the commands that lose them;
   no warning.
4. In a second empty folder, run `node <worktree>/dist/cli.js init --yes --harness copilot`.
   You should see: the same four skills listed with `mandao skills add …`; nothing installed, no
   `.github/skills/` folder.
5. Open `.agents/skills/mandao-story/SKILL.md` from step 1.
   You should see: when to use brainstorming and product-manager-toolkit, and what to do without them.

**Expected result:** every harness is offered the same skills with their facts, only what you pick is
copied where each harness reads it, and doctor tells you which command works with less help.
