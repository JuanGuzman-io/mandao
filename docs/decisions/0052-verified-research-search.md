# 0052 — Verified search for research approval

**Status:** Accepted (Phase 8)

## Context

Some harnesses document native web search, but its availability depends on provider, account or policy.
Treating that possibility as available could let high-impact evidence pass without a configured search
integration. Also, `research.max_questions` bounds one dispatch batch; it must not cap the evidence retained
after multiple batches.

## Decision

- Research approval treats a repository-configured search MCP as available. Documented native capability
  remains informational and conditional until its availability can be verified.
- MCP discovery for approval and `next` uses the workspace root, where repository configuration lives.
- `research.max_questions` limits each dispatch batch only. Evidence may accumulate across batches, and the
  gate still requires a matching record for every `[NEEDS RESEARCH]` marker.
- Specify creates one delegated research task per uncovered question; independent tasks may run in parallel.

## Consequences

High-impact claims remain blocked when no configured search integration is available. Large research sets
can be completed in prioritized batches without invalidating earlier evidence.
