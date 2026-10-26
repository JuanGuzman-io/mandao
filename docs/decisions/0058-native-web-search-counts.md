# 0058 — The harness's native web search counts as research evidence

**Status:** Accepted (Phase 15)

## Context

Phase 8 counted only a search MCP server declared in `research.web_search_servers` as web search; "possible
native support does not count". In MDO-0001 the research gate kept R3 blocked on Claude Code, which has a
built-in web search, although `research.md` cited sqlite.org and a premise run on the machine (P2) had
proved the point. The PE had to type an acceptance by hand, and `run next` kept recommending
`/mandao-specify` after it. The finding named the entry, not the claim, and did not say web search was the
reason. The PE decided (2026-10-26): "any research that Claude Code, Codex or Antigravity does counts".

## Sources (read 2026-10-26)

- **Claude Code**, tools reference (<https://code.claude.com/docs/en/tools-reference#websearch-tool-behavior>):
  `WebSearch` is a built-in tool ("Performs web searches"); permission rules can allow or deny it as a whole.
- **Codex CLI** (<https://learn.chatgpt.com/docs/codex/cli>): "Switch a run to live web search when a task
  depends on current releases, documentation, or external behavior" (`codex --search`).
- **Antigravity** (<https://antigravity.google/docs/ide/browser>): "Google Antigravity can open, read, and
  actuate a local Chrome browser, enabling you to … read documentation sources"; Browser Tools can be turned
  off.

## Decision

1. Web search is available to the research gate when a search MCP is declared for the harness, or the harness
   is Claude Code, Codex or Antigravity (`counts` in `NATIVE_SEARCH`, `src/engine/research-tools.ts`).
   Copilot and OpenCode keep conditional native support (account policy, provider) and do not count.
2. The claim still needs its sources with URL, tier and date; only the "no search available" rule changes.
3. A research entry may be `status: accepted`, with `accepted_by`, `reason` and `evidence` (a premise run
   `P<n>` or a clarification `C-<n>`), when the PO accepts other evidence for what the web could not show.
   Its claims are not checked for sources; an incomplete acceptance is an error.
4. Findings name the claim (`R3/C1`) and the reason (no source, or no web search with how to declare one).
   `run next` applies the same design gates as `approve design|spec` (premises included) and says how many
   issues block.

## Consequences

- On Claude Code, Codex and Antigravity a cited claim no longer blocks only because no MCP is declared.
- `doctor` reports native search that counts as "native (counts, ADR 0058 …)", with no fix to make.
- If a harness's native search is turned off (a deny rule, Browser Tools off), the gate cannot see it; the
  agent then records the claim without sources or asks the PO to accept other evidence.
