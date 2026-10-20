# 0010 — Alignment with the design document and resolved contradictions

**Status:** Accepted · 2026-10-19

## Context
`mandao_design_document.md` became the source of truth after the first schemas were written.

## Decision
Adopted from the document: `schema_version` on every artifact; `workspace: <mode>` as a string;
`.mandao/models.yml` as the tier registry; the catalog keyed by technology with `primary`, `when` and
`alt` plus `facets` for style-defining libraries; `repo:` URLs in polyrepo; `{type}/{id}-{slug}`
branches; the `perf` risk tag; `CLAUDE.md` as a pointer to `AGENTS.md`; commitlint requiring `Refs:`
on spec branches; adapter verification dates.

Contradictions and gaps resolved here:
1. **Local ids** (§11.1 `MDO-0001` vs §11.4 `<NNN>-<slug>`): the local id *is* the NNN, prefixed:
   `specs/MDO-0001-<slug>/`. Prefix configurable (`spec.local_prefix`).
2. **Sync "from the lock"** (§5.4): see ADR 0003. Config and models are intent, the lock is the
   resolution used for drift and orphans.
3. **Polyrepo `repo` required** (§6) vs local-only repositories: `repo: local` is accepted for a
   repository without a remote; `doctor` reports it.
4. **Home repo** (§6.2 option 2) had no config field: top-level `home`, to which `paths` are relative.
5. **Gate commands** (§15.1 "tools configurable") had no location: `projects[].gates`.
6. **Model separation** (§14.2) is not portable: personas declare `must_differ_from`; when a harness
   has no models configured the rule is instruction-only and `doctor` warns.

## Consequences
The design document is updated with these points.
