# 0034 — specify: a conditional data model, and the diagram chosen by what is built

**Status:** Proposed · 2026-10-20 · implementation waits for approval, together with the readability
pass of the spec documents

## 1. `data-model.md`, only when data changes

`specify` writes `data-model.md` only when the spec adds or changes entities, fields, relationships or
states. It decides from `requirements.md` and the code graph.

- **A delta against the real schema.** Read the current schema from the code (Prisma, SQL, migrations or
  the detected ORM) and document only what is ADDED, MODIFIED or REMOVED: entities; fields with type and
  constraints; relationships; indexes; permissions (RLS or equivalent); state transitions.
- **Migration plan.** Expand/contract, a backfill when data exists, and a rollback.
- **Data classification.** Fields with personal data are marked and add the `pii` risk tag. A migration
  adds the `migration` tag, which is never quick.
- **No duplication.** Validation rules live in `requirements.md`; the data model links to them.
- **Consistency Check.** Every field the requirements need exists in the data model (`GAP`), and every
  new field in the data model has a requirement that justifies it (`ORPHAN`).

## 2. The diagram follows what is built

| What is built | Diagram |
|---|---|
| Front end | User flow across screens, plus components |
| API / back end | Sequence: client → API → services → data |
| Front + back | End-to-end sequence with the contract marked |
| Microservice | Architecture: boundaries, sync/async calls, queues |
| LLM / RAG | Data flow: ingest → chunks → embeddings → retrieval → prompt → model → guardrails |
| Chatbot / agent | Sequence of one turn with tool calls, plus the conversation lifecycle |
| Data change | Entities and relationships (ERD) |
| Job / ETL / pipeline | Data flow |
| Entity with states | Lifecycle |

Rules:
- Required at standard and full depth when there is a new flow, several projects, a new service or
  integration, an LLM pipeline, a data change or a state machine. Optional at lite. At most 2–3 diagrams
  per spec.
- In every diagram: new elements highlighted, modified ones marked, unchanged ones in grey as context.
- Derived from `design.md` and `data-model.md`, never drawn by hand; `close` compares them with what was
  built (drift).

## 3. Archify supports entity-relationship diagrams

Checked before implementing: Archify's documentation lists an **ERD** type ("Database schemas: tables,
columns, keys, cardinality"; new in 3.1, present in 3.2) and the Archify bundle probed during the
mandatory-Archify research contains the `erd` type. "Always Archify" therefore holds for data changes too; no exception is
needed.

## Consequences

- `specify` gains a data step, and the Consistency Check two finding sources (`GAP`, `ORPHAN` against the
  data model).
- `mandao run diagram` reports the required type(s) from the spec's kind of change, not only from depth
  and project count.
- The diagram freshness stamp covers `data-model.md` as well as `design.md`.
