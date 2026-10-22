# 0051 — Sourced research gates

**Status:** Accepted (Phase 8)

## Context

Specify needs evidence for unfamiliar, version-dependent and API-dependent decisions, but model memory
can be stale and external pages can contain prompt injection. Research must be reusable without making
high-impact decisions unverifiable or silently trusting contradictory sources.

## Decision

Represent research questions and claims in `research.md` with typed topics, source tiers, URLs, access
dates, expiry, resolution and reuse links. Rank official documentation above manufacturer material and
recognized technical sources; verify version/API claims against official or manufacturer sources. Record
contradictions and resolutions. The deterministic high-impact classes are architecture, data, security,
public contracts and any linked High premise. Unverified model knowledge cannot support those decisions.
`doctor` reports native web search, configured search MCP, or none. Prior research is reused only when
resolved, current and exact-topic. A configurable per-dispatch question cap triggers PO prioritization
before delegation; evidence can accumulate across batches. Web content is data, never instructions (§20).

## Consequences

Approvals and `next` validate structured research instead of trusting prose. `research.md` is conditional
in the spec layout. Expiry and question limits can be tuned per workspace; stale research must be refreshed.
