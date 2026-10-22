# ADR 0050 — Per-type security-scan evidence and verification gates

**Status:** Accepted (Phase 7)

## Context

Security coverage may be split across local tools, CI workflows and provider-managed features. A single
`local | ci | none` value loses which category is covered, while empty files or an API permission error
do not prove that no scanner exists. Security-tagged tasks must not reach verified by treating missing
evidence as a successful scan.

## Decision

- Record secret scanning and SAST independently in `infrastructure.md`, each with `local`, `ci` and
  `provider` sources. Keep discovered scanners separate from `declared` scanners, and keep
  unverifiable sources in `unknown`. Empty arrays mean `none` only when all locations were checked.
- Detect local gates and CI definitions deterministically. When a GitHub remote and `gh` are available,
  make read-only API requests for repository security settings and code-scanning analyses. API denial,
  omission or unavailable third-party integration is `unknown`, never `none`.
- `doctor` reports coverage, provenance, unknowns and recorded evidence that is no longer discovered.
  Manual declarations remain visible as declarations and are not presented as machine verification.
- A task tagged `security` requires a confirmed local or remote scanner. CI-only coverage remains
  pending until PR CI is confirmed. Without verified coverage, `mandao approve <spec> security-gaps`
  requires and records a human reason; the spec may then proceed with that accepted gap.
- On security-tagged tasks, run configured local scanner gates; if Gitleaks or Semgrep is installed
  but not configured, use the safe built-in command. Delivery warns after green PR checks if no check
  name or workflow identifies secret scanning or SAST. A missing scan is never reported as PASS.

## Consequences

Coverage is auditable by type, location and provenance. Unknown provider state can remain visible even
when another scanner provides coverage. Human approval is explicit and append-only, while provider
check names are advisory evidence and do not replace the PR's normal green-check requirement.
