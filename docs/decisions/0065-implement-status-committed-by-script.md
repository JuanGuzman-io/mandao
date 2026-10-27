# 0065 — implement's status is written and committed by script

**Status:** Accepted (hotfix 0.1.0-beta.2). Found on a real project trial with 0.1.0-beta.1.

## Context

`implement` step 0.3 told the agent to set `status: in-progress` in `story.md` by hand before the first task.
Since the Reviewer-approved manifests, a task commit carries only its approved files, the script-owned ledger and
the task's own bookkeeping, so `run commit` refused T1: "unreviewed spec files would enter the task commit:
story.md". No command could record the change: `commit-spec` had no `implement` step. The agent had to stop and
ask the person, who chose a separate status commit made by hand.

## Decision

1. `mandao run status <spec> <to> --apply` writes `<to>` into `story.md` through the writer when the change is
   allowed, and nothing when it is refused (`applied` in the JSON). A frontmatter it cannot rewrite (CRLF line
   endings) is a problem and exit 1, never `applied: true`.
2. `mandao run commit-spec <spec> implement` commits `story.md` alone (`docs: start the <ID> implementation`,
   `Refs: <ID>`), never the rest of the spec folder, so a pending task's bookkeeping stays for its own commit. It
   refuses a `story.md` that changed beyond a `status` set to `in-progress` (an edit to the body, or a status set by hand
   to anything else).
3. `implement` step 0.3 runs both before the first task; it never edits `story.md` by hand.
4. A task commit that finds only a status change in `story.md` names the command that commits it on its own, so a
   spec started with 0.1.0-beta.1 can go on.

## Consequences

- The approval hash is unchanged: `docHash` already ignores `status`.
- `verify` still edits its status by hand; its own `commit-spec verify` commits it, so it was never blocked.
  Moving it to `--apply` is a later cleanup.
