---
schema_version: 1
---

# Quick log

| Date | Name | Project | Files | Lines changed (measured by quick-check) | Gates | Review (reviewer model; `reduced independence` if any) | Commit |
|---|---|---|---|---|---|---|---|
| 2026-10-20 | config-error-example | mandao | `docs/schemas.md` | 6 (+4/-2) | format, lint, typecheck, test, build, metrics pass; secrets (gitleaks) and sast (semgrep) not installed; audit n/a (no dependency change) | PASS, mandao-reviewer (model not confirmed; reduced independence) | this commit |
| 2026-10-20 | restore-mandao-home | mandao | `test/integration/doctor-cli.test.ts` | 3 (+3/-0) | format, lint, typecheck, test, build, metrics pass; secrets (gitleaks) and sast (semgrep) not installed; audit n/a (no dependency change) | PASS, mandao-reviewer on sonnet (implementer on opus) | this commit |
| 2026-10-20 | pin-vitest-hook-order | mandao | `vitest.config.ts` | 2 (+2/-0) | format PASS, lint PASS, typecheck PASS, test PASS, build PASS, metrics PASS, secrets NOT RUN (gitleaks not installed), sast NOT RUN (semgrep not installed), audit SKIPPED (no dependency change); reduced independence (reviewer shares the author's model, no mandao-reviewer-alt) | PASS, mandao-reviewer on claude-opus-5-5 | this commit |
| 2026-10-21 | kaizen-in-the-readme | mandao | `README.md` | 2 (+1/-1) | format, lint, typecheck, build, metrics pass; diagrams fresh; no impacted tests (no test reads README.md); secrets and sast not installed; audit n/a (no dependency change) | PASS, mandao-reviewer on claude-opus-5-5; reduced independence (the reviewer shares the author model) | this commit |
| 2026-10-21 | readme-tdd | mandao | `README.md` | 19 (+18/-1) | format PASS; lint PASS; typecheck PASS; impacted tests PASS (no affected tests for README.md); diagrams PASS; metrics PASS (13 pre-existing informational test-suite length notes); secrets NOT RUN (gitleaks unavailable); sast NOT RUN (semgrep unavailable); audit N/A (no dependency changes) | PASS, mandao-reviewer on gpt-6-sol (high) | this commit |
