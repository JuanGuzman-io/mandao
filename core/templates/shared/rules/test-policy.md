---
schema_version: 1
rule: test-policy
---

# Test policy

Risk-based. Tests are declared per task in `tasks.md`; each scenario is proven at the **cheapest
level that demonstrates it**. Coverage percentages are not a goal.

## Unit tests

| Always | Never |
|---|---|
| Business rules, validations, calculations | DTOs, types, config |
| Authorization decisions | Dependency-injection wiring |
| State transitions | Generated code |
| Mappers and parsers with logic | Purely visual components |
| `BUT it must NOT` / `AND IT MUST` edge cases | Pass-throughs, trivial getters |
| Regression of every fixed bug | |

The Reviewer fails a task with a missing mandatory test and flags unnecessary tests as noise.

## E2E

- `critical-flows.md` in the constitution lists the critical flows; AC that touch them carry
  `critical: true`.
- E2E is required for: critical AC, multi-project features, and regressions of past incidents.
- `verify` always runs the existing critical suite as a smoke test.
