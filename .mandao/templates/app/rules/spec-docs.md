---
schema_version: 1
rule: spec-docs
---

# Spec documents

Mandao's rigor, presented so a person can read it. Every spec document follows these rules; the
templates are skeletons and this file says what goes in each section.

## Principles

1. **One question per document**, fixed headings, and a 2–3 line summary right under the title. The
   summary is the only summary: no `## Summary` section repeats it.
2. **Evidence at the end.** SHAs, line numbers, command outputs and probe results go in an
   `## Evidence` section or in `<details>` blocks, never in the middle of the main text.
3. **Short table cells.** A cell that needs more than a phrase becomes a subsection. An index table only
   when there are 5 or more items, and the subsections never repeat its cells.
4. **Each fact in one document.** The others link to it with a short anchor (`<a id="p3"></a>` above the
   heading, linked as `design.md#p3`).
5. **No history.** No "was X, now Y", no superseded text: git keeps it. No HTML comments with content.
6. **Machine files in `_log/`**: `progress.yml`, `execution.md`, `reviews/`, `mutations/`. People read
   the spec root; scripts read the log.
7. **Cut words, not facts.** No boilerplate ("This document describes…"), no restating the frontmatter.

## The documents

| Document | Question it answers | Written by |
|---|---|---|
| `story.md` | What does the user need, and how do we know it is done? | story |
| `spec.md` (lite only) | What must be true, and how is it built? | specify |
| `requirements.md` | What must be true? | specify; clarify adds answers |
| `design.md` | How do we build it? | specify |
| `data-model.md` | What data changes? (only when data changes; ADR 0034) | specify |
| `quickstart.md` | How can a PO check it by hand? (only when it has visible behavior) | specify; verify updates |
| `tasks.md` | What work, in what order? | tasks |
| `verify-report.md` | Does it do what was asked? | verify |
| `close-summary.md` | What shipped? (generated record and links) | close |

Where each fact lives:
- **Clarifications** live only in `requirements.md` (`## Clarifications`); story and design link there.
- **Premises** live only in `design.md` (`## Premise Ledger`).
- **Test results** live only in `verify-report.md`; the release notes take the status from
  `release-status`.

## story.md

- **Who / Problem / Value:** short paragraphs in the product's own words (`glossary.md`).
- **Scope / Out of scope:** bullets.
- **Acceptance criteria:** one `### AC-n — <short name>` block per criterion, numbers stable,
  `critical: true` when it touches a flow in `critical-flows.md`; GIVEN / WHEN / THEN, with `BUT it must
  NOT` / `AND IT MUST` clauses for the edges that matter (C1, C2…).
- **Assumptions and open questions:** `ASSUMPTION`, `OPEN` or `CONFLICT`, each with its source. A
  critical `OPEN` blocks specify.

## requirements.md

- **FR-n** with `Serves:` and `Projects:` lines, the requirement in one or two sentences, then its
  scenarios `#### S-n.m` (Given / When / Then and the clauses).
- **NFR-n:** a number and how it is measured, never an adjective.
- **AC → FR matrix:** short cells (`main`, `C1: nothing on stdout`).
- **Clarifications:** `### C-n — <question> (date)` with Answer, Answered by and Effect bullets.
- **Consistency Check:** a short table (ID, type, severity, owner, status) and a subsection per finding
  whose sides need more than a phrase. "No findings" when empty.
- **Open items:** `[NEEDS CLARIFICATION]`, `ASSUMPTION`, `OPEN`, `CONFLICT`.

## design.md

- The summary says how the requirements are met. The body starts with the decisions.
- **Decisions:** `### Dn — <decision>` with why and the alternatives rejected in one compact list.
- **Changes by project and module:** project, module, change and an exemplar file to mimic.
- **Contract:** mandatory when the spec touches more than one project.
- **Risks and risk tags:** `auth`, `input`, `pii`, `payments`, `migration`, `public-api`, `infra`,
  `ai-prompt`, `ui`, `perf`.
- **Constitution / Product / Module Docs Impact:** proposals only; close applies them with approval.
- **Diagram:** written by `mandao run diagram --stamp` from this design; regenerated when it changes.
- **Premise Ledger** (at the end): one `### Pn — <claim> (High|Low)` per claim about the existing
  system whose falsity would change a decision, task or scope item, with what changes if false. A High
  premise counts as verified only with an executed command and an excerpt of its output (read-only, in
  the worktree or a sandbox, with a timeout, through the resource guard); a search or a read is not
  enough. The run is recorded with `mandao run premise <spec> <Pn> -- <command>`; without a recorded
  run it is `UNVERIFIED`, and `trace` reports `PREMISE_UNPROVEN` otherwise. The outputs go in the
  evidence block.

## spec.md (lite depth)

At lite depth one session writes `story.md` and `spec.md`, which replaces `requirements.md`,
`design.md` and, with 3 tasks or fewer, `tasks.md`. Same ids and the same rules as the documents it
replaces: FRs and scenarios, the AC → FR matrix, decisions, changes with exemplars, the Consistency
Check, clarifications, and a Premise Ledger with **High premises only**. Tasks go inline under
`## Tasks` in the Details format, without an Overview; a fourth task means a separate `tasks.md`.
Parsers, the Consistency Check and traceability read the same sections from `spec.md`.

## quickstart.md

Only when the spec has behavior a user or a PO can see. Not for test-only specs, refactors or internal
infrastructure. At most about 400 tokens: prerequisites in one line, 3–6 numbered steps with the exact
command or click, and the expected result. No implementation detail.

## tasks.md

- **`## Overview`**, generated from the details by `mandao run tasks <spec> --index --write` (the
  validator fails when they differ): grouped by acceptance criteria, one line per task —
  `- [ ] T2 [AC-1] [P] <result in plain words> — <main file>` (`[P]` only when `parallel_safe`) — and a
  checkpoint per group: what to run to confirm those criteria before the next group.
- **`## Details`**, one `### [ ] Tn — <result>` per task, never repeating the title or the index:
  - **What:** 1–2 sentences on what it does and why, linking the design for the how.
  - **Done when:** 3–5 bullets of behavior. Cite scenarios by id and add only what requirements do not
    say; never repeat design decisions.
  - **Notes** (only when needed): a visible exception, e.g. "no TDD red: mutation evidence".
  - The YAML block, no prose: `project`, `kind`, `tier`, `files`, `exemplar`, `ac`, `scenarios`,
    `test_levels` (`unit | e2e | eval | none` per scenario), `evidence` (`tdd | mutation | none`),
    `risk_tags`, `depends_on`, `parallel_safe`, `verify`.
- The title is the result, never a file path. Concrete test names are chosen by whoever writes the
  tests; the declared level per scenario is what the Reviewer checks.

## verify-report.md

- The summary is the verdict and why.
- **Acceptance criteria → tests** first: bare `AC-n` / `AC-n/Cn` in the first column (`release-status`
  reads it), the result in the last; one short subsection per criterion when the proof needs words.
- Then Suites, TDD evidence, Product bugs, Deferred to CI, Blockers; commands and outputs in
  `## Evidence`.

## Close documents

- **Kaizen** (`docs/kaizen/<ID>.md`): Measure from `mandao run kaizen` (rework, Reviewer FAILs,
  escalations, pivots, HALTs, independence, forced runs, TDD practice, bugs after merge with its note);
  TDD comparison from `mandao run kaizen-compare` with both sample sizes ("insufficient data" below the
  minimum, and no conclusion); Learn: 0–3 root-cause lessons with evidence; Standardize: 1–3 one-line
  edits, each pending approval.
- **Release notes:** business language, no code names; one row per criterion with the status from
  `mandao run release-status` (met, partial, pending; never upgraded by hand); partial and pending say
  what is missing and what happens next.
- **Technical notes:** what was built per project and module, with the commits found by their trailers;
  decisions and pivots; contract changes; the built diagram against the approved one, explaining every
  node or edge `mandao run diagram-drift` reports; how to test; links.
