# 0052 — Verified search for research approval

**Status:** Accepted (Phase 8); amended by [ADR 0058](0058-native-web-search-counts.md): the native web search of Claude Code, Codex and Antigravity counts.

## Context

Some harnesses document native web search, but its availability depends on provider, account or policy.
Treating that possibility as available could let high-impact evidence pass without a configured search
integration. Also, `research.max_questions` bounds one dispatch batch; it must not cap the evidence retained
after multiple batches.

## Decision

- A search MCP counts only when `research.web_search_servers` explicitly lists its harness, config path
  and server name, and that server exists in the matching repository MCP file. A server name or config
  string that happens to contain "search" is not evidence of web search.
- MCP discovery for approval, `next` and `specify` uses the workspace root and associates each config
  file with its harness. Native search remains conditional and does not count as configured availability.
- This declaration proves repository configuration, not runtime health. The agent must still use the tool
  and cite the sources it actually consulted.
- Current, resolved, exact-topic evidence reused from an earlier spec remains valid without a search MCP
  in the active harness; the entry must retain its sources and set `reused_from`.
- `research.max_questions` limits each dispatch batch only. Evidence may accumulate across batches, and the
  gate still requires a matching record for every `[NEEDS RESEARCH]` marker.
- Specify creates one delegated research task per uncovered question; independent tasks may run in parallel.

## Consequences

New high-impact claims remain blocked when no search MCP is explicitly declared and present in the
repository configuration. Valid reused evidence keeps its original sources and expiry. Large research sets
can be completed in prioritized batches without invalidating earlier evidence; bad IDs and over-limit
selections return no dispatchable tasks.
