---
schema_version: 1
rule: doc-data-model
---

# data-model.md

Loaded by `specify` only when the spec adds or changes entities, fields, relationships or states,
decided from the requirements and the code graph (ADR 0034).

- **A delta against the real schema.** Read the current schema from the code (Prisma, SQL, migrations or
  the ORM detected) and document only what is ADDED, MODIFIED or REMOVED: entities; fields with type and
  constraints; relationships; indexes; permissions (RLS or equivalent); state transitions.
- **Migration plan:** expand/contract, a backfill when data exists, and a rollback.
- **Data classification:** a field with personal data is marked `pii` and adds the `pii` risk tag; a
  migration adds the `migration` tag (never quick).
- **No duplication:** validation rules live in the requirements; link them.
- **Consistency Check:** every field the requirements need exists in the data model (`GAP`), and every
  new field has a requirement that justifies it (`ORPHAN`).
- The ERD diagram comes from this document (`rules/diagram.md`).
