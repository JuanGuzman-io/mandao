---
schema_version: 1
---

# Constitution changelog

## 2026-10-21 — MDO-0011 close (one fixed layout for every spec folder)
- critical-flows.md: the "Script-owned logs…" row adds "a version 2 spec commits six log files and the
  rest stays in the local cache" (`log-v2.test.ts`). The "Closure…" row adds "drift does not apply to
  lite specs, and close commits what it recorded" (`close-drift.test.ts`, `close-commit.test.ts`).
- architecture.md: the Spec domain owns the folder layout manifest (`layout.ts`); `.mandao/cache/` is
  local, never committed.
- standards.md: a spec's layout version is its story's `schema_version`; readers support every version
  still in the repo.
- product.md capability map: "Checks every spec folder against one layout per depth", implemented.
- Approved by: maintainer in the MDO-0011 close session, item by item.

## 2026-10-21 — MDO-0010 close (guide the next step and keep the session in the spec worktree)
- critical-flows.md: the "Human approval refuses critical OPENs and records its provenance" row adds
  "running the next command approves, except open items or a changed document" (`approve.test.ts`).
- architecture.md: the Adapters layer owns the per-harness session table (D2).
- product.md capability map: "Recommends the next command from the spec's state", implemented.
- Not applied: the "start creates an isolated spec worktree…" row addition (in Claude Code the session
  enters the worktree it creates); the maintainer did not approve it.
- Approved by: maintainer in the MDO-0010 close session, item by item.

## 2026-10-21 — MDO-0009 close (recommend each command's skills at init)
- critical-flows.md: new flow "`init` runs no skill installer or copy before the person selects it"
  (`test/integration/init-skills.test.ts`); the `skills add` row's `OPEN` is covered by the shared
  `installAndPin` path.
- business-rules.md: BR-8 notes that a `git` source is copied into the person's project, never into the
  package; new BR-15 "init never preselects or installs a skill without the person's selection; `--yes`
  only lists them".
- architecture.md: integration "Skill repositories" (`src/skills/git-copy.ts`, pinned-commit fetch
  after confirmation); Engine may depend on `skills` (resolves the verify finding CC-6).
- product.md capability map: "Recommends the commands' skills at init, for every harness", implemented.
- Approved by: maintainer in the MDO-0009 close session, item by item.

## 2026-10-20 — approved active review after public contribution and execution updates

- Reconcile supported harnesses, task execution, safe frontmatter, evidence integrity, costs and release workflows.
- Add the approved explicit CI diagram freshness step; regenerate source hashes after the integrated MDO-0008 close-command change.
- Expose conventions to Codex and explicitly preserve its currently resolved model choices.
- Reconfirm feature-branch/main; keep existing gates and thresholds.
- Approved by: maintainer in this session, for the reviewed file diffs, Codex model snapshot, CI step and existing feature-branch/main strategy. Existing document status fields are preserved.

## 2026-10-20 — MDO-0007 close (catch every way a test can climb out of its workspace)
- standards.md § Conventions: tests never build a path with a `..` segment through `join` or
  `resolve`, nor take `dirname` of a workspace, except calls named in the guard's `ALLOWED` list;
  enforced by `test/unit/architecture.test.ts`.
- Project skill `codebase-conventions` § Tests: the same rule, for agents writing tests. Approved,
  but not applied: writing `.claude/skills/` was refused by the permission system during close, so
  the maintainer applies it by hand (diff in `docs/releases/MDO-0007/technical.md`).
- Approved by: the maintainer's delegate (MDO-0007 close, `mandao approve MDO-0007 close`).

## 2026-10-20 — MDO-0006 close (leave no temporary folders behind after the test run)
- standards.md § Conventions: tests create temporary folders only through `makeTree`
  (`test/helpers.ts`), which removes them when the test file finishes, and never write next to a
  workspace through `join(<folder>, '..', …)`; enforced by `test/unit/architecture.test.ts`.
- Project skill `codebase-conventions` § Tests: the same rule, for agents writing tests. Approved,
  but not applied: writing `.claude/skills/` was denied by the permission system during close, so
  the maintainer applies it by hand.
- Approved by: the maintainer's delegate (MDO-0006 close).

## 2026-10-20 — MDO-0005 close (prove the doctor crash path end to end)
- standards.md § Exemplar files: "Process-level CLI test | `test/integration/doctor-process.test.ts`",
  so the next test that needs the real entry point reuses its in-test tsup build instead of adding a
  runner.
- Approved by: the maintainer's delegate (MDO-0005 close).

## 2026-10-20 — MDO-0004 close (doctor findings as JSON for CI)
- critical-flows.md: the `init` → `sync` → `doctor` row names `test/integration/doctor-cli.test.ts`
  as CLI-level coverage of the doctor's exit code.
- standards.md § Logging: commands with `--json` print exactly one JSON document on stdout; errors go
  to stderr.
- product.md capability map: "Doctor findings as JSON for CI" (`mandao doctor --json`), implemented.
- Approved by: the maintainer's delegate (MDO-0004 close).

## 2026-10-20 — approvals after the first dogfooding
- standards.md approved: clean-code thresholds (15 / 60 / 350) with a ratchet, gates incl. gitleaks and semgrep.
- architecture.md: the ADR 0007 CONFLICT is resolved by routing every write through src/writer.
- Skill Map: project skill `codebase-conventions` (binding: stack).
- Approved by: tech lead (iteration 2 review).

## 2026-10-20 — initial constitution (legacy mode, dogfooding)
- Created: architecture, standards, security, performance, ux, infrastructure, critical-flows,
  product, business-rules, glossary. All `status: draft` until approved.
- Approved by: pending.
