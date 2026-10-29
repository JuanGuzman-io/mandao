# mandao

## 0.1.0-beta.3

### Patch Changes

- Teams can choose whether to commit installed catalog skills or restore missing copies from the lock at their pinned commits.
- Skills installed before 0.1.0-beta.3 become restorable too: `sync` records their recipe from the copy on disk when the catalog pins the same commit.
- Specs opened from ClickUp, Monday, Jira or Linear keep a local ID; the tracker item's reference goes in the branch, every commit (`Tracker` trailer) and the PR. `run spec-new` refuses an `--id` that is not a story ID and takes `--tracker-id`.

## 0.1.0-beta.2

### Patch Changes

- 0bd0cb3: `/mandao-implement` no longer stops at the first task commit: the `in-progress` status is written by
  `mandao run status <spec> in-progress --apply` and committed on its own by `mandao run commit-spec <spec> implement`.
  A spec whose status was already set by hand gets the command that unblocks it.

## 0.1.0-beta.1

### Minor Changes

- 01d80e8: Post-beta fixes from the first trial (phases 15–20):
  
  - Blocking bugs and false evidence fixed.
  - The flow continues from command to command with no manual git, and every stop names the full next step.
  - Gates and commits stay scoped to each task.
  - The constitution checks every stack choice on the project's runtime.
  - Every command documents its arguments as you type them, and the README is generated from the commands.
  - The skills catalog offers only skills verified at their source, pinned by commit, with trust and license.
  - `init` explains the profile question.
  - Copilot no longer asks a value for every flag.
  - Records come from git and the review records: quick-log hashes, PR size without lockfiles, open findings of any
    severity, tasks closed on evidence alone, and `mandao run rename-ref` for reference fixes across a spec.

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
