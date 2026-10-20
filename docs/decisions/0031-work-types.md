# 0031 — Work types beyond software and AI

**Status:** Proposed · 2026-10-20 · the direction is decided; the design is proposed, to implement after
the pilot

## Direction (decided)

Mandao aims to serve every kind of engineering work that changes a system: software (web, API, mobile),
AI engineering (applications built on LLMs), ML (training and data), infrastructure (IaC, cloud),
DevOps (CI/CD, platform) and security.

## Proposed design

Profiles (design §9) evolve into **work types**. A project declares the types it uses — a monorepo can
have `app` and `infra` — and each spec declares its type, or it is inferred from the paths it touches
(`terraform/` → `infra`). The type changes the templates (the form of acceptance criteria), the verify
gates, the review lenses and the quick rules; skills bring each domain's knowledge.

| Type | Acceptance criterion | Verification | Particular risk |
|---|---|---|---|
| `app` | Given/When/Then | unit + e2e | — |
| `ai` | eval thresholds | evals against a baseline | silent model regression |
| `ml` | metrics on a versioned dataset | reproducibility, baseline | unversioned data, expensive runs |
| `infra` | desired state, cost within budget | plan / dry-run, policy-as-code, apply in an ephemeral environment | blast radius, state, rollback |
| `devops` | an idempotent pipeline that does X | run the pipeline on the branch | breaking the team's pipeline |
| `security` | control verified, finding closed with evidence | scanners, control verification, threat model | exposing a vulnerability's details |

## Safety rules per type (proposed; decided when the types are implemented)

- **`infra` and `devops`:** the agent never applies to a real environment — only plan, dry-run or
  ephemeral environments. A rollback plan is mandatory in the design. An infrastructure change is never
  quick.
- **`security`:** exploitable details of a vulnerability never go into tracker comments, release notes
  or visible PRs. `close` publishes a version without them; the full detail stays in a restricted place
  the team defines.

## Not yet

No code, template or schema changes until after the pilot (design §23.6).
