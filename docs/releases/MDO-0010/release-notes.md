---
schema_version: 1
spec: MDO-0010-guide-the-next-step-and-keep-the-session-in-the
audience: product owner
language: en
---

# Release notes — Guide the next step and keep the session in the spec worktree

Every Mandao command now ends by telling you which command fits next for your spec, and why. In
Claude Code you stay in one session: it moves into the spec's workspace by itself, and a fresh start is
a `/clear` in the same window. Running the next command counts as your approval unless something is
still open. A quick change records only its own cost.

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 | met | Each command ends with the commands that can follow, the recommended one and a one-line reason. It never suggests building while a decision is still open, and it never runs anything itself. |
| AC-2 | met | In Claude Code, the session moves into the new spec workspace and carries on. Other assistants, or a refused move, print the exact command to continue there. |
| AC-3 | met | When a fresh start is advised, it is your assistant's own "new conversation" action (in Claude Code, `/clear`) followed by the next command. Opening a new session is only the fallback. |
| AC-4 | met | A quick change records only what it cost, and that record is saved with the change. |
| AC-5 | met | Running the next command on a draft spec approves it, and the approval is recorded. If something is open, or the spec changed since you last saw it, you get one question first. Nothing is approved while a critical question is open. |

## Not done yet

Nothing in this story's scope. Pushing, opening the PR, merging and cleaning up the workspace come in
a later story (MDO-0012).

## Known limits

- Whether Claude Code stays in the spec workspace after `/clear` has not been checked in a live session.
  If it does not, the next command moves back in first.
- For Copilot and Antigravity, the "new conversation" shortcut comes from their documentation, not
  from a run.
- The first cost record of this spec also counts earlier work from the same session. The fix applies
  from now on, and that record is left as it was.
