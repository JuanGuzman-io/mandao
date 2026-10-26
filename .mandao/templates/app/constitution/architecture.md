---
schema_version: 1
level: workspace
last_reviewed:
owner: PE
---

# Architecture (TRD)

## Stack
| Project | Language | Runtime (pinned in) | Frameworks (versions) | Style-defining libraries | Checks |
|---|---|---|---|---|---|

## Stack verification
<!-- One check per stack choice, proven on the project's runtime: `mandao run stack-check S<n> -- <command>`
(install or import it) records the command, the runtime version, the exit and the output in `_log/stack.md`.
A choice that cannot be checked here says `UNVERIFIED: <why>`; a spec that relies on it proves it as a High
premise. When the project must run on other machines (teammates, CI), check those runtimes too. -->

### S1 — <choice> works on <runtime and version>

## Chosen architecture
<!-- Name the architecture the team chose; do not infer it from a framework. -->

## Layers and allowed dependencies

## Module boundaries
<!-- ADR 0022, verified by the core Reviewer: one responsibility per module; modules talk only through
their public contracts (exports, APIs, events); no module reaches into another's internals. List each
module with its responsibility and its public contract. -->
## Patterns and conventions
## Integrations
## Quality attributes
<!-- Measurable NFRs: availability, scalability, latency. -->
