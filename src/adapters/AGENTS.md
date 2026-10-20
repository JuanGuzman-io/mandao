# src/adapters — canonical → harness files

Purpose: pure functions `render(input) → { files, warnings }` (ADR 0007). No filesystem access.

- Contract: `types.ts` (`Adapter`, `AdapterInput`, `GeneratedFile`). Each adapter records `verified`
  (date + official docs) for its target format.
- Shared helpers in `shared.ts`: capability mapping, persona variants per role/tier, body rendering.
- `agents-md.ts` writes managed blocks only (`<!-- mandao:begin/end -->`).

Conventions: follow `copilot.ts` as the exemplar; add snapshots in `test/adapters/` for every mode.
Gotcha: a format change in a harness shows up as a snapshot diff; review it, then `vitest -u`.
