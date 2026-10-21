---
schema_version: 1
level: workspace
last_synced: 2026-10-20
owner: PO
status: draft
---

# Business rules

Every rule has a source and a date. Sources here are code and the design document (no business
documents are configured).

| ID | Rule | Implemented in | Source | Date | Status |
|---|---|---|---|---|---|
| BR-1 | A quick change touches one project, ≤ 3 files and ~≤ 100 lines, with no new dependencies, migrations or public contracts | `src/scripts/quick-check.ts` (`DEFAULT_LIMITS`, `analyzeDiff`) | MANDAO-DESIGN §21 | 2026-10-20 | implemented |
| BR-2 | `auth`, `payments`, `pii`, `migration` never go through quick | `QUICK_FORBIDDEN_TAGS` in `src/schemas/common.ts` | §15.1 | 2026-10-20 | implemented |
| BR-3 | At most ~10 project skills on top of the bootstrap | `MAX_PROJECT_SKILLS` in `src/schemas/catalog.ts`; `skills add` | §17.2 | 2026-10-20 | implemented |
| BR-4 | One primary skill per technology | catalog shape (`technologies.<t>.primary`) | §17.2 | 2026-10-20 | implemented |
| BR-5 | The Reviewer runs on a different model than the Implementer when one is available; otherwise `reduced independence` is recorded, never blocking | `src/models/resolve.ts` (`independence`), Leader persona | §14.3, ADR 0011 | 2026-10-20 | implemented: `src/spec/loop.ts` selects the reviewer; `src/scripts/review.ts` launches cross-harness review when selected |
| BR-6 | Model precedence: flag > spec > project > workspace > recommendation | `resolveModels` | ADR 0011 | 2026-10-20 | implemented |
| BR-7 | Commit headers start with the type's emoji and stay ≤ 72 characters without it | `src/commits/commitlint.ts` | §16.4 | 2026-10-20 | implemented |
| BR-8 | Third-party skills are referenced, never vendored; a `git` source is copied into the person's project at install, never into the package | `src/skills/install.ts`, `src/skills/git-copy.ts` | §17.2, MDO-0009 D3 | 2026-10-21 | implemented |
| BR-9 | A task with declared TDD tests needs recorded RED evidence before implementation; characterization uses mutation evidence instead | `src/spec/loop.ts`, `src/scripts/red.ts`, `src/scripts/mutation.ts` | ADR 0022, 0039 | 2026-10-20 | implemented |
| BR-10 | Two FAILs at a tier escalate; three FAILs at strong halt; PASS precedes a local task commit | `src/spec/loop.ts`, `src/scripts/commits.ts` | `core/commands/implement.md` | 2026-10-20 | implemented |
| BR-11 | Tagged security/high or security/critical findings block PASS; review evidence and log discrepancies are retained | `src/cli/checkpoint-guards.ts`, `src/spec/review-findings.ts`, `src/writer/log-integrity.ts` | ADR 0039 | 2026-10-20 | implemented |
| BR-12 | No default spending cap; when a configured cap is exceeded, delegation waits for human budget approval | `src/spec/costs.ts`, `src/cli/approve.ts` | ADR 0036, 0039 | 2026-10-20 | implemented |
| BR-13 | External publication requires a preview and human approval; an unchanged payload is skipped | `src/scripts/publish.ts`, `core/commands/close.md` | ADR 0026 | 2026-10-20 | implemented payload planning; external write depends on MCP |
| BR-14 | Contributions arrive as PRs; preserve per-task trailers using merge commit or rebase, never squash | `CONTRIBUTING.md`, `docs/maintainer-checklist.md` | Maintainer instructions, 2026-10-20 | 2026-10-20 | documented policy; hosted rules must be verified separately |
| BR-15 | `init` never preselects or installs a skill without the person's selection; `--yes` only lists them (as for the budget) | `src/cli/init-skills.ts` | MDO-0009 AC-1, AC-2 | 2026-10-21 | implemented |
