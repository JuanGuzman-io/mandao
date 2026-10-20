# 0026 — Iteration 3: verify and close

**Status:** Accepted · 2026-10-20

## Verify

`mandao run verify-plan` derives the suites from the **files the spec's own commits touched** (found by
trailers, so rebases and unrelated work on the branch do not leak in) plus uncommitted work, never the
whole branch diff against `base`. It reports tasks with mandatory tests and no RED row, runs deferred
to CI, and the blockers for `verified`: open tasks, GAP / BROKEN_REF / UNCOMMITTED / E2E_MISSING
findings, unconfirmed deferred runs. One Tester per suite runs the tests; verify writes
`verify-report.md` with the evidence as run. Missing red evidence on a spec started before TDD
(ADR 0022) is reported, not blocking.

## Kaizen

- `mandao run kaizen` measures a spec from its execution log only: rework rate, Reviewer FAILs,
  escalations, pivots, HALTs, reduced and provider independence, forced runs, TDD practice (`tdd` when
  every task with mandatory tests has a RED row, `no-tdd` when none, `partial` otherwise).
- **TDD comparison:** `kaizen-compare` always shows the sample size of each group and says
  `insufficient data` below `kaizen.min_specs_per_group` (default 5). Partial specs are left out. It
  reports differences, never causes. MDO-0001 and MDO-0002 validate the mechanism, not the hypothesis.
- **Bugs after merge:** `fix` commits on any branch whose `Refs` trailer names the spec, dated after
  `closed_at`, plus — when a tracker MCP is available — the bugs the tracker links to the story after
  the close (`--tracker-bugs`). The metric is only as good as the references: a fix without `Refs`, or a
  bug not linked to the story, is invisible. The report says so.

## Diagram drift

Each diagram has a structured source (`diagrams/*.graph.json`). A node's identity is its **module path**
or **contract identifier**, never its label. The built graph is derived from the spec's commits and the
code graph (module per changed source folder, edges from dependencies); the agent may add contract nodes
with evidence. Drift is added or missing nodes and edges by identity; a relabelled box is listed, never
drift; approved contracts the built graph cannot check are `unverified`, not missing.

## Release notes and documents

`release-status` gives each AC as met (every covering task done, PASS and committed, and verify PASS),
partial or pending, with the reason; release notes never upgrade it by hand. Release notes are written
in `language.business`, the technical notes in `language.technical`.

## Constitution and product impacts

`impacts` lists the bullet items under `## Constitution Impact` and `## Product Impact` in design.md.
Close shows each as a diff, applies only what is approved, and adds a CHANGELOG entry: the single writer
after the constitution's creation.

## Release branch and environments

gitflow: close detects the one `release/*` branch that contains every commit of the spec, or records
the one the team names; it never creates release branches. Environments are recorded only as CI or the
tracker reports them (`--source ci|tracker`).

## Publication

`publish-plan` builds the exact payload (text and attachments with sizes and hashes) and compares its
hash with `close-summary.md`: `create`, `update` or `unchanged`. Before a spec's **first** publication
the whole payload is shown as a preview; every publication asks for confirmation. The id and hash are
recorded, so re-running close updates instead of duplicating. Without a tracker MCP the files in
`docs/releases/<ID>/` are the publication, plus a block to paste. Real Jira publication waits for a
sandbox project or issue; until then only payloads.

## npm

MIT license, repository metadata, `publishConfig.provenance`, `prepublishOnly` running the full check,
`npm run smoke` (pack, install the tarball in a fresh repository, `init`, `doctor`) in CI, and a release
workflow that runs only when a maintainer starts it. Publishing is the maintainer's act.
