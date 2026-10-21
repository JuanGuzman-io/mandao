---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
---

# Quickstart — Recommend each command's skills at init

**Before you start:** this branch built (`npm run build`), an empty folder, and Claude Code installed.

1. In the empty folder, run `node <worktree>/dist/cli.js init`, choose Claude Code, and answer the
   questions.
   You should see: a skills step listing brainstorming, product-manager-toolkit, graphify and
   software-architect, each with what it does, source, version and the commands that use it. Nothing
   is selected.
2. Select only brainstorming and confirm.
   You should see: only its installer runs (`claude plugin install superpowers@claude-plugins-official`),
   then `installed brainstorming`.
3. Run `node <worktree>/dist/cli.js doctor`.
   You should see: info lines for the skills you did not install, naming the commands that lose them;
   no warning.
4. In a second empty folder, run `node <worktree>/dist/cli.js init --yes --harness codex`.
   You should see: graphify and software-architect listed with `mandao skills add …`; no plugin;
   nothing installed.
5. Open `.claude/skills/mandao-story/SKILL.md` from step 1.
   You should see: when to use brainstorming and product-manager-toolkit, and what to do without them.

**Expected result:** skills are offered with their facts, only what you pick is installed, and doctor
tells you which command works with less help.
