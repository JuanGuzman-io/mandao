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
