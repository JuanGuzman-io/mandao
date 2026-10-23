# mandao

## 0.1.0-beta.0

### Minor Changes

- 04b57af: First beta of Mandao, spec-driven development for coding agents across Claude Code, GitHub Copilot
  and Codex. Highlights: security hardening before the beta and security gates detected from the
  user's CI; rules enforced by script, with exact gate receipt reuse and Reviewer-approved commit
  manifests; one-time session-cut advice and lock-aware launching; pinned cross-harness Archify
  installation and invocation; gated design principles with ACID data-write validation; measurement
  of cost and context per run; delivery with confirmed push and PR, plus research in specify;
  deliveries inside a spec; version release notes assembled from closed specs; a doctor check for
  conflicts with a project commitlint, never touching hooks without confirmation; an optional visual
  mock before implementation for UI work (static HTML in every harness, `/design` in Claude Code with
  a mandatory export), with its skills installed only on acceptance in their own verified commit and
  the private claude.ai link kept out of briefs and review packs; and `/mandao-story --from <file>`,
  which turns a Markdown or PDF requirements document into one proposal of epics and stories with
  source references, checked by script.
