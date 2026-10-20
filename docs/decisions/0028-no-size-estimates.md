# 0028 — No size estimates: measure the real diff

**Status:** Accepted · 2026-10-20

## Decision

Mandao never estimates the size of a change in lines or files, and no size number is stored in a spec
document, `tasks.md` or `progress.yml`, nor re-estimated later.

- **Quick pre-check:** structural criteria from the graph only — the number of files to touch, one
  module and one project, no public contracts, shared libraries, migrations, new dependencies or risk
  tags. No line estimate.
- **Quick post-check:** `quick-check` measures the real diff with `git diff --numstat` (the
  machine-readable form of `--stat`; deterministic, no tokens) against `size_limits.quick`
  (`max_files`, `max_changed_lines`) in `config.yml`, overridable per project. Over a threshold, the
  change escalates to `story` / `specify` as before.
- **Splitting PRs:** `mandao run pr-plan` decides from the task dependency structure, the projects
  touched and the real size of each task's commits (found by trailers) against `size_limits.pr`: one PR,
  one per repository in a polyrepo, or stacked PRs along the dependency waves (or per project). Over the
  limit with no structure to split along, one PR, said so to the reviewers.
- **General rule:** crossing a threshold only triggers its action — escalate, propose splitting —
  never an update of documents. `quick-log.md` keeps the measured lines of a quick change, as measured.

Defaults: `quick` 3 files and 100 changed lines; `pr` 25 files and 400 changed lines.
