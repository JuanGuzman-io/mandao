---
schema_version: 1
rule: diagram
---

# Diagram for approval

Loaded by `specify` only when `mandao run diagram <ID>` says a diagram is needed, or the spec changes
data (ADR 0022, ADR 0034).

## When

Required at standard and full depth when there is a new flow, several projects, a new service or
integration, an LLM pipeline, a data change or a state machine; optional at lite. At most 2–3 diagrams
per spec.

## Which type

| What is built | Diagram (Archify type) |
|---|---|
| Front end | User flow across screens, plus components (`workflow`) |
| API / back end | Client → API → services → data (`sequence`) |
| Front + back | End-to-end, with the contract marked (`sequence`) |
| Microservice | Boundaries, sync/async calls, queues (`architecture`) |
| LLM / RAG | Ingest → chunks → embeddings → retrieval → prompt → model → guardrails (`data-flow`) |
| Chatbot / agent | One turn with tool calls (`sequence`) plus the conversation `lifecycle` |
| Data change | Entities and relationships (`erd`, from `data-model.md`) |
| Job / ETL / pipeline | `data-flow` |
| Entity with states | `lifecycle` |

In every diagram: new elements highlighted, modified ones marked, unchanged ones in grey as context.

## How

- **Derive it from `design.md` and `data-model.md`, never draw it from memory.**
- First write its structured source, `diagrams/proposed.graph.json` (`schema_version: 1`, `nodes` with
  `id`, `label`, `kind` module | contract | external | actor, `role` changed | context, and `edges` with
  `from`, `to`). `changed` nodes are what the spec builds or modifies; `context` nodes are only used
  (close checks they exist, never that they changed). A node's `id` is the **module path**
  (`src/billing`) or the **contract identifier** (`POST /api/tokens`, `event:user.created`), never its
  label: `close` compares diagrams by id, so renaming a box is not drift.
- When `diagrams.engine` is `archify`, render it with Archify through `mandao run archify` into
  `diagrams/proposed.html` (plus a PNG export), then record it:
  `mandao run diagram <ID> --stamp --tool archify --type <type> --file diagrams/proposed.html --graph diagrams/proposed.graph.json`.
  If Archify is missing, stop and ask the user to install it through interactive `mandao init` or
  explicitly configure `diagrams.engine: mermaid`; never switch renderers automatically. When Mermaid
  is explicitly configured, write it to a file and stamp with `--tool mermaid --mermaid <file>` and the
  same `--graph`.
- The stamp records which design it came from. Whenever the design changes, `mandao run diagram`
  reports `stale: true`: regenerate it before asking for approval.
- With a tracker MCP, offer to attach the PNG to the story, only after the user confirms.
