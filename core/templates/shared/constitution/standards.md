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
<!-- Who approves a new direct dependency ({{roles.tech_lead}} by default) and how versions are pinned. -->

### Licenses
| Dependency | Allowed | Blocked |
|---|---|---|
| Direct (declared in the manifest) | MIT, Apache-2.0, BSD-2-Clause, BSD-3-Clause, ISC | anything else until approved |
| Transitive, unmodified | the above, plus weak copyleft (MPL-2.0, LGPL linked dynamically), PSF-2.0, Unlicense, CC0-1.0 | strong copyleft (GPL, AGPL) |

A transitive dependency with no license metadata is a `CONFLICT` for the {{roles.tech_lead}} (check its
repository), recorded and decided without stopping the task.

### Known vulnerabilities
The `audit` gate reports them. One that cannot be fixed now is accepted only with its reachability reason and
a review trigger: `mandao approve <spec> vulnerability --package <name version> --id <advisory> --reason <why it
is not reachable> --review <when to look again>`. Close carries it to the delivery notes.

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
<!-- Mirror of projects[].gates in .mandao/config.yml: format, lint, typecheck, test, build, secrets, sast, audit, eval, metrics. -->
