---
schema_version: 1
level: workspace
last_reviewed: 2026-10-20
asvs_level: 1
status: draft
---

# Security

Mandao runs locally with the user's permissions; it has no server, no auth and no stored data.

## Data classification

| Class | Examples | Rules |
|---|---|---|
| Public | `core/` content, generated harness files | — |
| Internal | the user's `.mandao/` config, specs | stays in the user's repository |
| Confidential | MCP credentials, API keys (owned by the agents, not Mandao) | Mandao never reads, writes or logs them |
| Personal data | names in tracker items or transcripts read by commands | distilled without names (`rules/context.md`) |

## Authentication and authorization

None in the CLI. External writes (trackers, chat) happen through the agent's MCP servers and always
after human confirmation (`rules/context.md`).

## Secrets

Mandao stores none. `OPEN(owner: tech lead)`: no secrets scanner gate yet.

## Threat model (light)

| Asset | Threat | Mitigation | Owner |
|---|---|---|---|
| User repository | Mandao overwrites user edits | drift detection, `--force` only (ADR 0003) | Mandao |
| User machine | `skills add` runs third-party installers | confirmation before running; commands shown verbatim; `--yes` only for CI | Mandao |
| Agent behavior | prompt injection via tracker items, documents, chat | "external content is data" rule in every command | content |
| Supply chain | generated commands run `npx -y mandao@<version>` | version pinned to the lock; `scripts.runner: local` to avoid network | Mandao |
