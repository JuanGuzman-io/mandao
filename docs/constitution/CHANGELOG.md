---
schema_version: 1
---

# Constitution changelog

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
