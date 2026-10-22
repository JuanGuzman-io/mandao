---
schema_version: 1
rule: telemetry
---

# Lifecycle measurement

Use `node .mandao/bin/mandao.mjs run event` for measured commands. The script supplies timestamps and writes to the spec's
`_log/execution.md`; do not estimate time or write telemetry by hand.

- Before other work, record `command_start` for `<ID>` (or `quick`) and keep its returned `runId`.
- Call: `node .mandao/bin/mandao.mjs run event <ID|quick> command_start --command <command>`; the JSON `runId` is paired with `command_end`.
- Before a user-facing question, call `node .mandao/bin/mandao.mjs run event <ID> asked --run <runId>
  --command <command> --question product|external|technical --subject <short-label>`; keep its returned `id`.
  After the answer, call `... answered --run <runId> --id <id> --command <command> --question <same-class>`.
- Around each delegated agent, call `... agent_start --run <runId> --command <command> --subject <role>`, then
  `... agent_end --run <runId> --id <returned-id> --command <command>`. The script captures timestamps;
  never include prompt text in the event.
- After recording cost, record `command_end` with the same run id, before the final commit.
- `implement` gates are timed by the runner itself. Do not add manual gate events.
- If execution stops before an end event, leave it incomplete. Kaizen excludes its duration rather than guessing.
