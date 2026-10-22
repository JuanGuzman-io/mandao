# 0054 — Version release notes

**Status:** Accepted (Phase 10)

## Context

A version ships many closed specs. Each one already has its business-language text ("For the PO" in
`close-summary.md`, or the legacy `release-notes.md` of layout v1), but nobody assembled them per version, so
the PO had to read the specs one by one. Writing the summary with a model would add cost and invent text.

## Decision

`mandao run version-notes <version> [--from <tag>] [--to <ref>] [--write] [--force]`. Deterministic: no model.
`<version>` must be semver, checked on every run; a leading `v` is accepted and stripped.

- **Range:** `<previous tag>..<to>`. `to` is `origin/<base>` when it exists, else `HEAD`. The previous tag is
  the nearest version tag (`git describe --tags --abbrev=0 --match 'v[0-9]*' --match '[0-9]*'`; other tags
  such as `deploy-prod` are ignored), skipping `v<version>` itself when that tag sits on `to`. No tags means the
  whole history. `--from` and `--to` override both ends.
- **Specs:** the IDs in the Refs trailers of the commits in the range (the key is `commits.trailers.refs`,
  default `Refs`); a value that is not a story ID is ignored. A spec is kept when closed: a line in
  `docs/CHANGELOG.md` or story `status: closed`. A spec referenced but not closed is not listed.
- **Read at `to`:** the CHANGELOG, each spec's folder, story and PO text are read with `git show <to>:<path>`,
  never from the working tree, so the notes describe the version as it is at `to`: a spec closed after `to`,
  or closed locally but not merged, is not in them.
- **Text:** the "For the PO" section of `close-summary.md` (v2) or the legacy `release-notes.md` (v1), copied
  verbatim and grouped by spec type. Nothing is rewritten or summarized.
- **Headings:** from a per-language template installed by `sync` under `.mandao/templates/<profile>/release/`
  (`version-notes.<lang>.md`), overridable through `.mandao/overrides`. The language is `language.business`,
  its primary subtag, then `en` as fallback. If `sync` has not installed a template, the copy in core is used
  and the output reports `template: core:<path>`. The template is read from the working tree, not at `to`:
  it is presentation, not a record, so a run with an older `--to` uses today's headings.
- **Output:** JSON with `markdown`, `missing` (specs without a PO text) and `straddling` (specs also referenced
  by commits before the range, reachable from `from`), plus the range, file and template used.
- **`--write`:** writes `<paths.releases>/v<version>.md` (default `docs/releases`). If the file exists and
  differs: a warning and the diff, exit code 1, the file is kept unless `--force`. Identical content is
  reported as unchanged.
- It never commits, tags or publishes.

## Three records, three jobs

Proposal for the maintainer; nothing here is enforced. The records divide the work so they never say the
same thing:

| Record | Audience | Content | Written by |
|---|---|---|---|
| Changesets `CHANGELOG.md` (root) | npm consumers | Package versions, technical | `changeset version` |
| `docs/CHANGELOG.md` | The team | Index of closed specs: one line per spec, no prose | `close` |
| `<paths.releases>/v<version>.md` (default `docs/releases`) | The PO | PO-facing notes for the closed specs referenced by the version's commits, from their "For the PO" sections | `run version-notes --write`, never hand-edited |

Proposed links, so one record points to another instead of repeating it: the version notes link to the
`docs/CHANGELOG.md` index rather than copy it, and a version's changeset entry links to its notes. A
correction goes to the spec's "For the PO" and the notes are regenerated.

## Consequences

The PO gets one page per version from text already approved at close, with no model cost and no drift.
A spec without a "For the PO" text shows up in `missing` instead of being invented. The command is a
generator: the release itself (changeset, tag, publish) stays with the maintainer.
