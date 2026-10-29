# 0067 — The spec ID stays local; the tracker item travels as a reference

**Status:** Accepted (PE, 2026-10-29). Found on a ClickUp trial with 0.1.0-beta.2.

## Context

A story's `id` must look like `PROJ-123` (`STORY_ID`): it names the spec folder, the branch and the cache folder under
`.mandao/cache/`, and several readers take the ID back from those names. ClickUp and Monday are supported trackers, but
their own IDs (`86e3w5954`, a number) never fit. `run spec-new --id 86e3w5954 --create` did not validate the ID: it
created the branch and folder `86e3w5954-…`, and then `story.md` failed validation, so `mock-offer`, `specify` and every
reader of the story failed.

Commitlint's branch pattern also never read the ID from the default `{prefix}{id}-{slug}` template, because `{prefix}`
was left as a literal. The `Refs` trailer rule only fired with `MANDAO_SPEC_ID` set.

## Decision

1. The spec ID is always a story ID and names the folder, as before. A new spec takes the next local ID, whatever
   the tracker. An explicit `--id` that is not a story ID is refused before anything is created, and the message
   names `--tracker-id`. IDs that already fit (Jira, Linear) still work with `--id`.
2. The tracker's own item ID goes in a new `story.md` field, `tracker_id`. It allows letters, digits, `-` and `_`,
   because it ends up in branch names.
3. The reference is `CU-<id>` for ClickUp, which is the form of ClickUp's own branch names, and the ID as is for every
   other tracker (`VZ-12`, `ENG-123`). This reference travels with the spec:
   - **Branch:** `spec.branch` gains a `{ref}` token. The default becomes `{prefix}{id}-{ref}-{slug}`. Without a
     reference, `{ref}` is dropped together with its following separator, so existing branch names do not change.
     `run spec-new --tracker-id <item>` reads the tracker kind from `sources.yml`.
   - **Commits:** every spec commit carries a `Tracker: <ref>` trailer after `Refs: <ID>` (`commits.trailers.tracker`).
     This covers task commits, `commit-spec`, approvals, mock installs and the delivery record. `--trailer` cannot add
     its own `Tracker` line.
   - **Pull request:** the body starts with the reference, linked to the story's `url` when there is one.
   - **Content:** `story`, `specify`, the commit rules and the guide say where each one goes.
4. `branchIdPattern` handles `{prefix}` and `{ref}`, so commitlint finds the spec ID on default branch names again.

## Consequences

- ClickUp, Jira and Linear link branches, commits and PRs by the item ID they contain. `Refs` keeps the spec ID, so
  `trace`, `version-notes` and the commit ledger are unchanged.
- `expectedPlace` builds the branch from the story's `tracker_id`, so `where` and `next` agree with `spec-new`.
- A spec opened with an invalid ID before this change has to be discarded with `run spec-new <id> --discard --yes`
  and opened again with `--tracker-id`.
