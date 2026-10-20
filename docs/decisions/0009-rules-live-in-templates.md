# 0009 — Methodology rules live in templates, commands stay lean

**Status:** Accepted

## Context
AKILI's constitution command grew to ~1,500 lines of embedded lessons. The design doc (principle 6)
asks for lean commands.

## Decision
- Cross-cutting rules are templates under `core/templates/<shared|profile>/rules/`: context markers,
  traceability, consistency check, review levels and lenses, clean code, test policy, commits and the
  quick gate. Commands and personas reference them; they do not restate them.
- Profiles change templates, not commands: `ai` overrides `rules/test-policy.md`, `spec/requirements.md`
  and `spec/design.md`, and adds `constitution/model-registry.md`.
- Templates are authored as `shared/` plus per-profile deltas (the design doc shows
  `templates/{app,ai,data}/`); `sync` installs one resolved copy per profile in use under
  `.mandao/templates/<profile>/`, so the installed layout matches the doc.
- Project lessons (Kaizen) are written into the project's constitution, never into Mandao commands.

## Consequences
- A team tunes a rule by overriding one template, not by forking a command.
- Commands render `.mandao/templates/<profile>/…`; with a single profile the path is concrete.
