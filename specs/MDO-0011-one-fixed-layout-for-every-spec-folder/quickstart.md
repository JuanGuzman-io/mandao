---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
---

# Quickstart — One fixed layout for every spec folder

**Before you start:** this branch built (`npm run build`), with MDO-0008 to MDO-0010 migrated.

1. Run `node dist/cli.js run layout MDO-0010`.
   You should see: `ok: true`, version 2, depth lite, and no missing or unexpected files.
2. Open `specs/MDO-0009-…/`.
   You should see: `tasks.md`, and in `_log/` exactly six files. The same goes for MDO-0008 and MDO-0010.
3. Open `specs/MDO-0010-…/close-summary.md`.
   You should see: Outcome, For the PO, For developers, Kaizen and Delivery in one page. `docs/releases/MDO-0010/` and `docs/kaizen/MDO-0010.md` are gone, and `docs/CHANGELOG.md` has its line.
4. Run `node dist/cli.js run status MDO-0010`.
   You should see: the timeline with the approvals in date order among the task events.
5. Run `node dist/cli.js run diagram-drift MDO-0010`.
   You should see: `applicable: false`, "lite specs have no diagram".

**Expected result:** every recent spec reads the same way, and its whole story is inside its folder.
