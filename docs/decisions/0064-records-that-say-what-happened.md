# 0064 — Records that say what happened

**Status:** Accepted (Phase 20b). Five fixes from the beta trial (MDO-0001, MDO-0002), each read from the record or git
instead of from what the agent remembers.

## Decision

1. **Quick log commit.** A row cannot hold the hash of the commit it is written in. It says `pending`; the next
   `run quick-log` fills every `pending` (and pre-phase-20 `this commit`) cell with the commit that added that line
   (`git blame`). An uncommitted row stays `pending`.
2. **PR size without lockfiles.** `run pr-plan` leaves dependency lockfiles out of the changed lines and files
   (`isLockfile`: npm, pnpm, yarn, bun, poetry, uv, Pipenv, Cargo, Go, Bundler, Composer, pub, CocoaPods, Gradle, NuGet), as it
   already did for spec folders, diagrams and the files Mandao generates. MDO-0002's plan proposed four stacked PRs from
   4,766 lines, most of them `package-lock.json`.
3. **Open findings of any severity.** `run implement-summary` (`openFindings`) and the close record (`open_findings`,
   one `Open finding:` line under Delivery) list every finding still open in each task's last review, read from the
   validated `Findings (JSON)` of the review records; a later attempt replaces an earlier one. Low findings no longer
   depend on the Leader writing an advisory.
4. **A task closed by evidence alone.** `--implementer none` records `no code (evidence only)` and the note
   `closed on evidence alone: no code written`, instead of `self` ("implemented in the Leader context"). `none` is
   refused as a reviewer, in a task row, a test review and the quick log.
5. **Reference fixes apply to the whole spec.** `mandao run rename-ref <spec> <old> <new>` replaces a whole reference
   (`AC-n` with its clauses, `FR-n`, `NFR-n`, `S-n.m`) in story, requirements, design, data model, tasks, quickstart and
   `spec.md`; `clarify` and `close` use it. `trace` reports `STALE_REF` for a document that cites a reference the spec
   does not define. It is not blocking: it names the document, and the agent renames it everywhere.

## Consequences

- `STALE_REF` cannot see two defined IDs swapped with each other (both still exist); `rename-ref` through a free ID is
  the way to swap them, and `clarify` says so.
- A quick-log row's hash appears one quick later; `git log -- specs/quick/quick-log.md` gives it at any time. It is the
  last commit that changed the line (`git blame -w`, so a whitespace-only reformat does not count); a row filled on a
  branch that is later squash-merged names a commit that only the branch had.
- `rename-ref` refuses a target the spec already defines (two references would merge) unless `--force`. `STALE_REF`
  skips fenced examples, another spec's references (`MDO-0003 FR-2`) and removed AC, which keep their record. A
  constitution ID right before a reference (`DP-1: FR-9`) has a story ID's shape, so that reference is skipped too: a
  known false negative of an advisory check.
- `--implementer none` is refused with `--pending-commit`: a task with code to commit names its implementer.
