---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
---

# Quickstart — Guide the next step and keep the session in the spec worktree

**Before you start:** this branch built (`npm run build`), Claude Code, and a repository with Mandao
initialized.

1. In Claude Code, from the main checkout, run `/mandao-quick fix a typo in the README`.
   You should see: the worktree created, the session entering it on its own (one approval prompt at
   most), and the quick going on with no "open a new session" step.
2. Finish the quick, then run `git show --stat HEAD`.
   You should see: `specs/quick/_log/costs.yml` in the commit, with an amount for the quick only, not
   for the earlier work of the session.
3. In a spec whose `spec.md` has a `[NEEDS CLARIFICATION]`, run `node dist/cli.js run next <ID>`.
   You should see: `/mandao-clarify` recommended, with that item as the reason, and no implement option.
4. Approve a lite spec with `node dist/cli.js approve <ID> spec`, when the session is long enough for a
   cut. You should see: `/clear`, then `/mandao-implement <ID>`, with the worktree command as the
   fallback.
5. Type `/clear`, then run that command.
   You should see: the command running in the spec's worktree, or entering it first. This step also
   checks premise P2.

**Expected result:** every command ends with the step that fits the spec, and the work stays in one
session, inside the spec's worktree.
