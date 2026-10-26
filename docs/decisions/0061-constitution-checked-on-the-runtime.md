# 0061 — Constitution checked on the runtime, roles, accepted risks

**Status:** Accepted (Phase 18). Extends ADR 0033 (Premise Ledger) to the constitution.

## Context

The beta trial (MDO-0001) approved `sqlite-vec` as the vector store after checking it only against PyPI; specify
then found that the project's Python could not load SQLite extensions, and the constitution had to be reopened
mid-spec. After the reopening (Qdrant), the spec's approved design, data model and a clarification still described
the old choice, and nothing said so. The templates and commands named a PO, a tech lead and a dev, while the
maintainer works alone and signs as PE. The constitution's license rule ("only MIT, Apache-2.0 or BSD") stopped a
task on the transitive dependencies every Python stack carries, and 35 CVEs accepted as unreachable were recorded
nowhere.

## Decision

1. **Stack checks.** `architecture.md` has a `## Stack verification` section, one `### S<n>` check per stack
   choice. `mandao run stack-check S<n> -- <command>` runs it on the project's runtime (the premise runner:
   timeout, resource queue, scratch kept out of the home) and records claim, command, runtime version, exit and
   output in `<constitution>/_log/stack.md`; a failing run is recorded too. A choice that cannot be checked says
   `UNVERIFIED: <why>`. The runtime is pinned (`.python-version`, `.nvmrc`, `engines`, `requires-python`…).
2. **Warn, not block** (PE decision): the constitution has no approval step to stop. `doctor` warns on a check
   with no run and no mark and on an unpinned runtime, and informs on each `UNVERIFIED` one; a spec that relies on
   an unverified choice proves it as a High premise, which already blocks its design approval.
3. **Constitution drift.** `approve design|spec` records the constitution's hash (every top-level `.md` of the
   workspace and the spec's projects, `status:` ignored, `CHANGELOG.md` and `_log/` left out) with the documents'
   hashes. When it changes, `next` recommends `/mandao-specify <ID>` (PE decision), naming the approved documents
   and the approval to run after the update. An approval without that hash makes no claim. A document changed
   too sends to the approval first. `data-model.md` is approvable. The constitution's CHANGELOG entries name the
   open specs affected (`- Affects:`).
4. **Roles.** `roles: { po, tech_lead, dev }` in `.mandao/config.yml` (defaults `PO`, `tech lead`, `dev`), asked
   at `init` (`--roles team | solo | solo=<name> | po=…,tech_lead=…,dev=…`; solo is `PE`). Commands render
   `{{roles.*}}`; installed templates render only those tokens. The `## For the PO` heading of the close summary
   stays: it names a section the code reads, not who decides.
5. **Dependencies and accepted risks.** The `standards.md` template separates direct dependencies (allow-list)
   from unmodified transitives (weak copyleft and PSF allowed, strong copyleft blocked, missing metadata a
   `CONFLICT` that does not stop the task). An accepted vulnerability is its own approval step (PE decision, not
   `security-gaps`, which means "no scanner"): `mandao approve <spec> vulnerability --package --id --reason
   --review`; close lists each active one under Delivery as an accepted risk.

## Consequences

- Existing constitutions without a `## Stack verification` section get no stack finding.
- Existing approvals stay valid: they carry no constitution hash, so a later constitution change makes no claim
  on them until the spec is approved again.
- A project with the default roles renders exactly as before.
