---
schema_version: 1
---

# Constitution changelog

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
