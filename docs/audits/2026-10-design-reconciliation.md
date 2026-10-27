# Design reconciliation — October 2026

Phase 0 compares the pre-reconciliation design with ADRs 0001–0041 and the current canonical commands,
templates and TypeScript implementation. ADR 0042 records the maintainer-approved improvement program.
This is a documentation audit: no Mandao workflow command or skill was invoked, and no product behavior
is changed here. The separate [latency audit](2026-10-latency.md) supplies measurements and their limits.

## Meaning of status

- **DECIDED, implemented:** an accepted decision supported by the present source; no claim of new live acceptance.
- **DECIDED, pending:** the maintainer accepted the requirement, but a later phase must implement/test it.
- **PROPOSED:** still unapproved; **OPEN:** unresolved contract or policy. Phase 0 does not invent decisions.

## Discrepancies corrected

Every row names the old design statement or omission, the evidence used, and the correction in
`MANDAO-DESIGN.md`. Source references are repository paths with line numbers as inspected in this phase.

| Design section | Difference | Status | Evidence | Correction |
|---|---|---|---|---|
| Status / §24 | MVP scope implied only two adapters and three implemented commands. | DECIDED, implemented | `src/adapters/index.ts:1`; `core/commands/implement.md:6`; `docs/decisions/0035-readable-specs-and-cost-levers.md:65` | Replace MVP with current baseline, experimental/live limitations and phase roadmap. |
| §2.3 / §10.3 / §17.1 / §18.3 | Archify optional and Mermaid an automatic fallback. | DECIDED, enforcement pending Phase 4 | `docs/decisions/0042-phased-improvements-and-local-validation.md:34`; `core/templates/shared/rules/diagram.md:45`; `core/commands/close.md:98` | State mandatory Archify and explicit Mermaid configuration; disclose current implementation gap. |
| §2.5 / §10.4 / §12.2 / §23.2 | Technical questions always routed to a human; approval modes were still grouped as OPEN. | DECIDED; approval implemented, autonomy propagation pending Phase 4 | `docs/decisions/0040-approval-by-running-the-next-command.md:11`; `src/cli/approve.ts:190`; `docs/decisions/0042-phased-improvements-and-local-validation.md:30` | Document by-running approval guard and reversible technical autonomy, preserving product/security/publication boundaries. |
| §4.1 | Node >=22 and CLI library choice still unresolved; package-manager wording did not describe repo. | DECIDED, implemented | `package.json:24`; `package.json:60`; `package-lock.json:4` | Pin documented runtime floor, commander and current npm checkout. |
| §4.5 / §13 | Schema version statement did not distinguish layout version from future migration. | DECIDED, implemented | `src/spec/layout.ts:11`; `docs/decisions/0041-spec-folder-layout-v2.md:11` | Explain story schema_version 1/2, unsupported-version error and separate OPEN migration policy. |
| §5.4 | npm link was advised for checkout development, although a stale global can resolve. | DECIDED, pending Phase 4 | `src/engine/launcher.ts:10`; `docs/decisions/0042-phased-improvements-and-local-validation.md:28` | Name current resolution and accepted local-build/version-match behavior separately. |
| §10 | research absent; perf/audit listed without planned status. | DECIDED, planned | `docs/decisions/0032-mdo-0004-command-run-and-statuses.md:35`; `core/commands/perf.md:6`; `core/commands/audit.md:6` | Add research planned and mark perf/audit planned; keep standalone research contract OPEN. |
| §10.3 / §13 | One requirements/design pair was shown for every depth. | DECIDED, implemented | `src/spec/layout.ts:77`; `core/commands/tasks.md:32` | Lite has spec.md plus its own tasks.md; standard/full have requirements.md and design.md. |
| §10.3 / §13 | quickstart/data-model content conditionals were missing from layout and specify summary. | DECIDED, implemented | `src/spec/layout.ts:30`; `docs/decisions/0034-specify-data-model-and-diagram-by-change.md:3` | Add content-based conditionals and links to manifest-derived anatomy. |
| §10.3 / §18.3 | Required diagrams described only new flow / multi-project. | DECIDED, implemented selection | `core/templates/shared/rules/diagram.md:13`; `docs/decisions/0034-specify-data-model-and-diagram-by-change.md:37` | Include services/integrations, LLM pipeline, data changes/state machines, 2–3 maximum and ERD. |
| §10.5 | Task example used legacy tests/dod fields, omitted kind and modern narrative structure. | DECIDED, implemented | `src/spec/tasks.ts:22`; `core/commands/tasks.md:50`; `core/commands/tasks.md:59` | Show Overview/Details, kind/test_levels/evidence and legacy compatibility; task brief completeness stays pending Phase 3. |
| §11.2 | Spec status comment referred to OPEN decision. | DECIDED, implemented | `docs/decisions/0011-models-languages-and-iteration-2-decisions.md:43` | Reference decided lifecycle; retain terminal closed/abandoned states. |
| §12.3 / §14.7 | Recorded premise execution and doc-readability mechanics were not explained as a coherent implemented workflow. | DECIDED, implemented | `core/templates/shared/rules/doc-design.md:22`; `core/templates/shared/rules/spec-docs.md:16`; `docs/decisions/0035-readable-specs-and-cost-levers.md:1` | Describe script-owned premise proof, lean commands and readable evidence-linked documents. |
| §13 | Root execution log / fixed per-spec release and Kaizen folders shown as current layout. | DECIDED, implemented | `src/spec/layout.ts:27`; `src/spec/state.ts:44`; `docs/spec-anatomy.md:24` | Replace with depth tables and six-file _log, state sections and version-1 compatibility. |
| §13 / §14.8 | Cache, logs.level and integrity location were omitted. | DECIDED, implemented v2; legacy policy pending Phase 5 | `src/scripts/spec-log.ts:143`; `src/schemas/config.ts:176`; `src/writer/log-integrity.ts:71` | Document ignored .mandao/cache/ID and summary/full retention; avoid claiming v1 policy resolved. |
| §14.1 / §23.2 | Parallel-looking task example did not distinguish dependency planning from isolated parallel execution. | DECIDED, parallel task execution pending Phase 9 | `core/commands/tasks.md:62`; `docs/decisions/0042-phased-improvements-and-local-validation.md:14` | Preserve dependency example; explicitly schedule isolation, eligibility and integration queue rather than claim execution exists. |
| §14.3 | Sonnet listed as default reviewer_alt for Claude despite tier floor. | DECIDED, implemented | `docs/decisions/0020-iteration-2a-execution-rules.md:38`; `core/models/recommendations.yml:23` | Remove lower-tier default and preserve clean-context / cross-harness fallback. |
| §14.3 | All-plan defaults phrased as universal despite accepted Codex/provider-specific exceptions. | DECIDED, implemented | `docs/decisions/0016-codex-adapter.md:61`; `docs/decisions/0020-iteration-2a-execution-rules.md:1`; `docs/decisions/0029-opencode-free-models-detection.md:10` | Explain per-harness availability and paid/API, admin and provider caveats. |
| §14.3 / §14.6 | Review files and checkpoint references used legacy reviews/ and progress.yml without layout version. | DECIDED, implemented | `src/scripts/spec-log.ts:36`; `src/scripts/spec-log.ts:152`; `src/spec/state.ts:47` | Name v2 reviews.md/state.progress and v1 storage; Leader calls scripts rather than hand-editing logs. |
| §14.4 | Non-author rerun stated without accepted reuse policy. | DECIDED, receipt implementation pending Phase 4 | `docs/decisions/0042-phased-improvements-and-local-validation.md:30`; `src/scripts/gates.ts:5` | Keep gates mandatory and label exact receipt reuse pending; no claim the gate can already be skipped. |
| §14.5 | Release association still marked waiting for close. | DECIDED, implemented | `src/scripts/close.ts:42`; `core/commands/close.md:125` | Remove obsolete pending claim, keep environment inference/delivery limitations explicit. |
| §14.5 / §18 / §23.1 | Never pushes / never automates promotion read as permanent despite newly authorized delivery design. | DECIDED, pending Phase 6 | `core/commands/close.md:130`; `docs/decisions/0042-phased-improvements-and-local-validation.md:39` | Distinguish current local-only behavior from future one-confirmation delivery and confirmed promotion. |
| §14.7 / §23.6 | Profiles, cost basis, cache diagnosis, budget defaults and session cuts were absent or still OPEN. | DECIDED, implemented | `src/cli/models.ts:141`; `src/spec/costs.ts:21`; `src/engine/doctor-cache.ts:11`; `src/scripts/session-cut.ts:110`; `docs/decisions/0036-cost-conscious-by-design.md:44` | Add lean execution section; mark repeated-boundary fix and script timing events pending, never infer waits from timestamp gaps. |
| §14.8 | ADR0039 script enforcement missing from design account of the loop. | DECIDED, implemented with known gaps | `src/spec/review-findings.ts:15`; `src/scripts/red.ts:52`; `src/writer/log-integrity.ts:11` | Describe current tagged security, derived attempts, red names/integrity; structured findings and diff-scoped red remain pending. |
| §16.1 | characterization:true presented as current task field; red evidence written by Implementer. | DECIDED, implemented | `src/spec/tasks.ts:18`; `src/scripts/red.ts:25`; `docs/decisions/0035-readable-specs-and-cost-levers.md:22` | Use evidence: mutation and script-recorded red evidence; retain legacy aliases and TDD. |
| §16.5 / §24 | Initial program required full local check; maintainer correction now makes full CI-only. | DECIDED, program policy now; product delivery pending Phase 6 | `package.json:38`; `docs/decisions/0042-phased-improvements-and-local-validation.md:26` | Record impacted-only local procedure, limited workers, build pre-push and CI full suite; no local npm run check. |
| §18.1 / §18.2 | Close always created separate technical/release/Kaizen outputs. | DECIDED, implemented | `core/commands/close.md:80`; `src/spec/close-summary.ts:73`; `src/spec/close-summary.ts:112` | Document the five close-summary sections, script/prose ownership and conditional omission of empty sections. |
| §18.1 | Per-spec docs/CHANGELOG line missing from design. | DECIDED, implemented | `src/spec/close-summary.ts:136`; `core/commands/close.md:156` | Document one upserted line per v2 closed spec; no post-merge protected-branch bookkeeping. |
| §18.2 / §18.3 | No-MCP publication and interactive diagram location fixed to releases/. | DECIDED, implemented for v2; Archify enforcement pending | `core/commands/close.md:145`; `core/templates/shared/rules/diagram.md:42` | Use For the PO publication plus spec diagrams; releases/ outputs only for v1. |
| §19 / §22 / §24 | Detailed perf/audit designs could be mistaken for working commands. | DECIDED intended design, not implemented | `core/commands/perf.md:6`; `core/commands/audit.md:6` | Mark section headings planned and explicitly separate roadmap from implemented baseline. |
| §23.1 / §23.6 | Hotfix, shadow/new-folder adoption and SDD conflict detection remained OPEN or absent. | DECIDED, implemented | `docs/decisions/0030-init-dir-shadow-hotfix-and-sdd-conflicts.md:14`; `src/cli/init-target.ts:18`; `src/engine/shadow.ts:17`; `src/engine/doctor-sdd.ts:43` | Close resolved parts, retaining OPEN import/postmortem/deployment questions. |
| §23 / §24 | No single execution list or distinction for accepted 0–10 program versus proposed work types. | DECIDED phases; ADR0031 remains PROPOSED | `docs/decisions/0042-phased-improvements-and-local-validation.md:15`; `docs/decisions/0031-work-types.md:3`; `docs/decisions/0041-spec-folder-layout-v2.md:30` | Link backlog; keep v1 migration outside phases; standalone research contract and work-type details unresolved. |
| §7.3 | An apply-capable branch rule kept impacts pending on all spec branches, contrary to close committing approved impacts there. | DECIDED, implemented | `core/commands/close.md:79`; `core/commands/close.md:81` | Describe approved close writes on the unprotected spec worktree branch; never direct protected-branch writes. |
| §16.5 | Resource budget omitted operation-specific memory floors and forced-run recording. | DECIDED, implemented | `src/schemas/config.ts:40`; `docs/decisions/0024-resource-floors-and-verified-suggestions.md:16`; `src/scripts/close.ts:57` | Document per-operation floors, lower-worker/defer thresholds, and forced-run evidence. |
| §16.5 | Only tests helper claimed to execute, despite build, premise/mutation and external review processes. | DECIDED, implemented | `src/cli/run-premise.ts:83`; `src/scripts/review.ts:12`; `docs/decisions/0027-iteration-3-decisions.md:13` | Describe central test executor plus later documented scoped process helpers and writer controls. |
| §23 | Untagged open questions inherited global DECIDED default. | OPEN except explicit accepted items | `MANDAO-DESIGN.md:1049` | Give section23 its explicit OPEN default; preserve specific resolved and pending decisions. |

## ADR coverage

All ADRs through 0041 were read. Not every ADR required a change: an already-correct design statement
is retained. This index makes the comparison scope explicit rather than claiming only the latest ADRs
were checked.

| ADRs | Design areas checked | Result |
|---|---|---|
| 0001–0010 | Content, canonical tokens, config/lock, resolution, workspace, helpers, writer, Copilot, templates, IDs | Existing architecture retained; stack/runtime and layout-version clarification updated. |
| 0011–0015 | Languages, roles, skills/hooks, states, local tests, recommendations, tasks, settings | Task format updated using later ADR0035; current defaults and runner policy corrected. |
| 0016–0021 | Codex/OpenCode/Antigravity, switching, tier/effort, worktrees, deterministic identity, trailer trace | Adapters retained with caveats; availability and reviewer_alt corrected; v2 state paths applied. |
| 0022–0024 | TDD, diagrams, branching, resource floors, forced runs | TDD preserved; broadened diagram criteria and modern evidence; implemented close association reflected. |
| 0025–0030 | OpenCode2/providers/free models, verify/close, release gates, diff-size policy, shadow/hotfix | Verified-format statements retained; stale OPEN and close/publication descriptions corrected. |
| 0031 | Proposed work types | Direction remains DECIDED, detailed work types remain PROPOSED; no implementation claim. |
| 0032–0034 | Stable/planned commands, kind/mutation evidence, data models and diagram selection | Status, current task fields, data conditionals and diagram criteria corrected. |
| 0035–0038 | Readable/lite specs, scripts/approval, costs/profiles/cache, start/worktrees, cuts | Modern lite/tasks split follows superseding ADR0041; omitted mechanisms added; cut dedup pending. |
| 0039–0041 | Script guards, approval by running, layout v2 | Enforcement section, approval distinction and complete layout/close/cache documentation added. |
| 0042 | Approved phased program and amended local validation/Archify policy | Referenced as DECIDED pending work; does not pretend Phase0 implements future behavior. |

## Open questions and remaining implementation gaps

These are retained as open or scheduled, rather than silently changing the product:

- Standalone `research` has no canonical command contract yet. Phase 8 research inside specify does not
  implicitly implement the standalone command. `perf` and `audit` retain planned designs and stub content.
- Mandatory Archify is a decided policy, but core diagram/close rules still permit automatic Mermaid;
  Phase 4 must add configuration, installer, invocation and enforcement together.
- V2 integrity hashes already use ignored cache. The explicit cross-version tracking policy (particularly
  legacy `.integrity.json`) remains a Phase 5 decision; no history is rewritten.
- V2 storage is implemented. Some shared template prose still names v1 log paths; code follows the
  layout version. This audit updates design references; it does not claim every generated harness copy
  or shared rule was rewritten in Phase 0.
- Script-owned command/question timing and active/user/agent breakdowns remain Phase 2 work. Existing
  approval dates or long gaps do not measure human waiting. No new latency improvement is claimed here.
- Exact gate receipts, review manifests, structured findings, delivery, research and task parallelism
  remain their assigned phases in the single backlog.
- Organization-specific approval authority, deployment/rollback behavior, local-service isolation,
  disk limits, generic migrations and detailed work types remain OPEN/PROPOSED as documented.
- Migration of MDO-0008–0010 remains outside these phases until layout v2 is proven on a real spec.

## Verification boundary

Phase 0 is documentation-only. Parent-phase validation records lint, typecheck, build, related tests,
diagram freshness and the full PR CI result. This audit does not substitute static source inspection
for a runtime acceptance run, nor treat a future requirement as implemented.
