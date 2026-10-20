---
schema_version: 1
---

# Quick log

| Date | Name | Project | Files | Lines changed (measured by quick-check) | Gates | Review (reviewer model; `reduced independence` if any) | Commit |
|---|---|---|---|---|---|---|---|
| 2026-10-20 | config-error-example | mandao | `docs/schemas.md` | 6 (+4/-2) | format, lint, typecheck, test, build, metrics pass; secrets (gitleaks) and sast (semgrep) not installed; audit n/a (no dependency change) | PASS, mandao-reviewer (model not confirmed; reduced independence) | this commit |
| 2026-10-20 | restore-mandao-home | mandao | `test/integration/doctor-cli.test.ts` | 3 (+3/-0) | format, lint, typecheck, test, build, metrics pass; secrets (gitleaks) and sast (semgrep) not installed; audit n/a (no dependency change) | PASS, mandao-reviewer on sonnet (implementer on opus) | this commit |
