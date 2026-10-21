---
schema_version: 1
spec: MDO-0011-one-fixed-layout-for-every-spec-folder
audience: product owner
language: en
---

# Release notes — One fixed layout for every spec folder

Every new spec now has the same files for its depth and a short log that does not grow with each retry.
Its whole close lives in one document inside the spec. A check enforces the layout, and older specs are
still read as they are.

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 — The folder depends only on depth | partial | Tasks always have their own file, whatever their number, and optional files appear only for their kind of content |
| AC-2 — A check enforces the layout | met | One command names every missing and extra file; close refuses a folder that does not match; older specs pass in their own format |
| AC-3 — The log has six fixed files | met | The committed log stays at six files; the bulky output stays on the machine that produced it, and nothing important is lost |
| AC-4 — The whole close lives in the spec | met | New specs close into one document with the outcome, notes for the PO, notes for developers, lessons and delivery, plus one changelog line |
| AC-5 — Close commits everything it wrote | met | Approved edits made during close, and the files regenerated from them, go into the same commit; anything else is named and left out |
| AC-6 — Lite specs have no diagram | met | Close on a small spec says the diagram check does not apply and goes on |

## Not done yet

- **AC-1:** the rule is in place and tested, but no new small spec has gone through planning with it yet. The next spec, MDO-0012, will be the first.
- **The recent specs MDO-0008 to MDO-0010 keep their old layout.** Moving them is a separate backlog item, planned once the new layout has run on a real spec.

## Known limits

- This spec was started before the new layout, so its own close still uses the older documents.
- Small specs have no diagram, so a future tracker post for one would carry text only. There is no tracker today.
