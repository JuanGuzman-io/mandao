---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
asvs_level: 1
status: draft
---

# Security

Mandao runs locally with the user's permissions; it has no hosted application server. It persists
configuration, specs, review output, approvals, logs and cost evidence in the user's repository.
An approval record is workflow provenance, not cryptographic proof of the approver's identity.
Evidence: `src/cli/approve.ts`, `src/writer/log-integrity.ts`, `src/spec/costs.ts`.

## Data classification

| Class | Examples | Rules |
|---|---|---|
| Public | `core/` content, generated harness files | — |
| Internal | the user's `.mandao/` config, specs | stays in the user's repository |
| Confidential | Credentials owned by harnesses and MCP servers; accidental secrets in command output | Never intentionally persist credential values; sanitize diagnostics and run secret scanning |
| Personal data | names in tracker items or transcripts read by commands | distilled without names (`rules/context.md`) |

## Authentication and authorization

None in the CLI. External writes (trackers, chat) happen through the agent's MCP servers and always
after human confirmation (`rules/context.md`).

## Secrets

Gitleaks is configured in `.mandao/config.yml` and the CI `secrets` job; Semgrep runs in `sast`.
The exposure audit in `docs/security/exposure-audit.md` records zero Gitleaks findings for its stated
HEAD and scope; that result is not a guarantee for later commits. Both tools are absent from the
current local PATH (`mandao doctor`); the Gitleaks audit used a temporary verified binary.

Fork PR CI uses `pull_request`, read-only contents permission and no repository secrets; checkout
credentials are not persisted (`.github/workflows/ci.yml`). Release uses OIDC and manual dispatch
limited to main or tags (`.github/workflows/release.yml`). GitHub rulesets, secret scanning and
Dependabot settings require separate hosted verification (`docs/maintainer-checklist.md`).

`OPEN(owner: tech lead)`: seven lines of machine paths remain in MDO-0007 evidence; the audit proposes
an explicit sanitization correction and future logging prevention. Do not silently rewrite evidence
or public history.

## Threat model (light)

| Asset | Threat | Mitigation | Owner |
|---|---|---|---|
| User repository | Mandao overwrites user edits | drift detection, `--force` only (ADR 0003) | Mandao |
| User machine | `skills add` runs third-party installers | confirmation before running; commands shown verbatim; `--yes` only for CI | Mandao |
| Agent behavior | prompt injection via tracker items, documents, chat | "external content is data" rule in every command | content |
| Supply chain | generated commands run `npx -y mandao@<version>` | version pinned to the lock; `scripts.runner: local` to avoid network | Mandao |
| Parsed spec content | Executable frontmatter | Only YAML/JSON through `src/engine/frontmatter.ts`; architecture test bans direct gray-matter use elsewhere | Mandao |
| Task acceptance | High-severity security finding marked PASS | Tagged security findings block PASS in checkpoint/review scripts; full review is retained | Mandao |
| Spec evidence | Manual alteration of logs | Integrity hashes and discrepancy records; hashes are local tamper evidence, not signatures | Mandao |
