---
schema_version: 1
spec: <ID>-<slug>
depth: standard
projects: []
status: draft           # draft | approved | in-progress | blocked | verified | closed | abandoned
---

# Design — <title>

## Summary
<!-- How the requirements will be met, in a few sentences. -->

## Premise Ledger

<!--
One row per claim about the EXISTING system that this design depends on, only when its falsity
would change a decision, task or scope item. Cite as run, with the commit SHA, or write
UNVERIFIED — confirm at source before relying on it. If there are none, say so explicitly.
-->

| # | Claim | Evidence (as run, SHA) or UNVERIFIED | If false | Impact |
|---|---|---|---|---|
| P1 | | | | High / Low |

## Diagram
<!-- Written by `mandao run diagram --stamp` (ADR 0022): the approval diagram derived from this design,
with the hash of the design it came from. Required at standard and full depth across projects or for
a new flow. Regenerated whenever this design changes; `close` compares it with what was built. -->

## Decisions

| # | Decision | Alternatives | Why |
|---|---|---|---|

## Changes by project and module

| Project | Module | Change | Exemplar file |
|---|---|---|---|

## Contract
<!--
Mandatory when the spec touches more than one project: OpenAPI, shared types or schema, stored in
contract/ and referenced here. Front and back are built against it; a change mid-way is a Pivot Record.
-->

## Risks and risk tags
<!-- auth, input, pii, payments, migration, public-api, infra, ai-prompt, ui, perf -->

## Constitution Impact
<!-- Proposed changes to docs/constitution/*. Applied only by /mandao-close, with approval. -->

## Product Impact
<!-- Changes to product.md, business-rules.md, glossary.md. Applied only by /mandao-close. -->

## Module Docs Impact
<!-- AGENTS.md files to create or update, per module. -->
