---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
---

# Quickstart — One fixed layout for every spec folder

**Before you start:** this branch built (`npm run build`).

1. Run `node dist/cli.js run layout MDO-0010`.
   You should see: `ok: true` at version 1. An older spec is accepted in its own format.
2. Run `node dist/cli.js run diagram-drift MDO-0010`.
   You should see: `applicable: false`, "lite specs have no diagram".
3. Run `node dist/cli.js run status MDO-0010`.
   You should see: the timeline, with the approvals in date order among the task events.
4. Start the next spec with this build (`node dist/cli.js start "<title>"`), then run `node dist/cli.js run layout <ID>`.
   You should see: a story at `schema_version: 2`, and `ok: true` for the draft stage.
5. When that spec closes, open its folder.
   You should see: `tasks.md`, six files in `_log/`, and one `close-summary.md` with Outcome, For the PO, For developers, Kaizen and Delivery, plus its line in `docs/CHANGELOG.md`.

**Expected result:** new specs read the same way and hold their whole story, while older specs are still read as they are.
