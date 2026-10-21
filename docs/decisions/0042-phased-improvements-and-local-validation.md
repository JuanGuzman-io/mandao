# 0042 — Phased improvements and local validation

**Status:** Accepted · 2026-10-21 · maintainer-approved Phase 0 plan

## Context

The design document still described the initial MVP and the pre-MDO-0011 spec layout. The maintainer
approved an improvement program from the latency diagnosis and backlog, with a separate plan approval
and pull request per phase. Running the full suite repeatedly on the development machine adds work
that belongs in PR CI.

## Decision

- `docs/backlog.md` is the single execution list for phases 0–10. Preserve the more detailed existing
  requirements. MDO-0012, MDO-0013 and MDO-0014 remain historical references, implemented through these
  phases without opening Mandao specs. Migration of MDO-0008–0010 remains outside the phases until
  layout v2 has been proven on a real spec; this phase does not authorize that migration.
- Execute this program without Mandao workflow commands or skills. Each phase starts with a plan and
  the maintainer's OK, on `perf/<phase>` from updated `main`. Use small emoji + conventional commits
  without spec trailers. Each phase updates the design, README and relevant documentation.
- After each change run lint, typecheck and only impacted tests, with limited workers. Before push
  also build. Select related tests from changed files and explicitly include tests that read changed
  documents or fixtures by path; report when there are no related tests. Two workers is the ceiling
  for this program, reduced when resources require it. Do not run `npm run check` locally: it includes
  the full suite. Existing commands suffice; no `check:local` wrapper is needed for this docs phase.
- The full suite runs only in PR CI. Merge only after all required CI checks pass, using a merge
  commit, never squash. Fix and push failed checks before merging. After merge, pull and build in
  the principal checkout. Test local CLI behavior using `node dist/cli.js` after building, never a
  global installation.
- TDD, independent Reviewer and gates stay required. Reversible technical choices covered by the
  constitution are decided and recorded by the agent. Product, scope, security, external and
  irreversible actions retain human approval; ADR 0040 still controls approval by running the next
  command. This autonomy policy is accepted; propagation to every command is Phase 4 work.
- Archify is required for diagrams. Mermaid is an explicit project choice
  (`diagrams.engine: mermaid`), never an automatic fallback. This supersedes the automatic-fallback
  clauses of ADR 0022 and design principle 3, and preserves ADR 0034's Archify support for ERD.
  Installer, configuration and enforcement are
  Phase 4 work; this documentation phase does not claim they already exist.
- Phase 6 delivery will default `delivery.pre_push` to `impacted` (lint, typecheck, build and impacted
  tests). `full` requires explicit user configuration; `none` remains configurable. Full PR CI stays
  a merge requirement regardless of the local policy. Docker or `act` remains optional.

## Consequences

The design distinguishes accepted pending work from implemented behavior. No product code changes
in Phase 0. Independent review, meaningful test selection and green PR CI remain quality controls;
repeated full local suites are removed from the development procedure. Read-by-path dependencies
need explicit selection until tooling can derive them reliably. Later phases add tests for every
behavior change and enforce portable test fixtures (local git identity and safe process exit).
