---
schema_version: 1
level: workspace         # workspace | project
last_reviewed:
---

# Standards

The Reviewer enforces only what is written here (plus the spec, the contract and security.md).

## Design principles
<!-- Constitution proposes stack-specific rules and the user approves them. Keep stable IDs (`DP-*`)
in the table; one row is one declared principle. Include SRP/DIP where relevant, ACID for data writes,
and simplicity/anti-abstraction as the counterweight. -->

| ID | Principle | Concrete rule for this stack |
|---|---|---|

## Principle precedence

1. The architecture explicitly chosen in `architecture.md`.
2. The framework conventions documented by the stack skill.
3. Generic principles only where the first two are silent.

Do not wrap a framework capability in a duplicate abstraction. Record architecture as a team choice;
never infer it from the framework.

## Conventions
<!-- Naming, file layout, formatting tool. Name the exemplar file per kind of module. -->

## Errors
<!-- How errors are raised, wrapped and reported. Swallowed errors are blocking. -->

## Logging
<!-- Levels, structure, what must never be logged (secrets, personal data). -->

## Dependencies
<!-- Who approves new ones, license policy, pinning. -->

## Clean-code thresholds (level 0 gates, blocking)

| Metric | Threshold | Tool |
|---|---|---|
| Cyclomatic complexity per function | | |
| Function length (lines) | | |
| File length (lines) | | |
| Duplication | | |
| Layer-violating imports | none | |
| Dead code | none | |

## Gates
<!-- Mirror of projects[].gates in .mandao/config.yml: format, lint, typecheck, test, secrets, audit, sast, metrics. -->
