# Pilot plan — Mandao on a real project with front, back and tracker

**Status:** approved 2026-10-20 · no code changes for the pilot until a project is chosen.

## 1. Project

- Front and back, in a monorepo or two repositories (a polyrepo also exercises contracts across
  projects).
- Jira, with a product owner who answers clarifications within a day.
- CI with existing tests (unit; e2e if possible).
- Two or three volunteer developers. Claude Code is the main harness (live-tested). Codex reviews across
  harnesses **only if the pilot developers have access to it**; otherwise cross-harness review stays
  optional and the execution log records `reduced independence`.
- Private code: paid models under no-training terms only. Never free models.

## 2. Entry conditions (F0) — without both, the pilot does not start

1. **Written confirmation that the organization allows the chosen harnesses and providers on the
   project's code.**
2. **A cost cap as numbers: per spec and per month.** Crossing either stops the pilot until the sponsor
   decides.

## 3. Install without interfering with the team (shadow mode)

- Nothing generated reaches the shared repository during the pilot: `.mandao/`, `.claude/skills/mandao-*`,
  the managed blocks of `AGENTS.md` / `CLAUDE.md` and `docs/constitution/` are listed in
  `.git/info/exclude` on the pilot developers' clones. Only each spec's code goes through the team's
  normal PRs (plus `specs/<ID>/` if the tech lead agrees).
- **Backup:** what is excluded is backed up outside the team's repository, at a location the pilot
  defines (for example a private repository or a shared drive), so deleting a clone does not lose it.
- Branching: the team's real model, detected by `constitution` and confirmed; worktrees in a sibling
  folder.
- CI and the team's hooks are untouched; Mandao's hooks (graphify, pre-commit) are local to the pilot
  clones.
- Jira: read through MCP from the start; writes only after a full preview and confirmation, as comments
  marked "Mandao pilot"; no status transitions; the maintainer validates the first real publication.
- Constitution in `legacy` mode, reviewed by the tech lead before it is relied on.

## 4. Specs, in order

1. A `quick` change (copy or style): installation and gates, with no risk.
2. A real bug: the fix flow, a red regression test first.
3. A story that touches front and back: 3–6 tasks, an API contract, at least one critical AC (e2e),
   risk tags such as `input` or `public-api` but not `auth`, `payments` or `migration`; off the sprint's
   critical path; product owner available.
4. Control: 2–3 comparable stories the team builds without Mandao in the same period.

## 5. Metrics — five

| Metric | Source |
|---|---|
| Lead time: story approved → merged | Jira, git |
| Reviewer FAILs with real findings that the human PR review did not catch | `execution.md`, PR review |
| Bugs after merge, within 30 days | Kaizen (fix commits with `Refs`, bugs linked in Jira) |
| Cost per spec | harness usage, against the cap |
| Short survey after each spec (5 questions, developer; release-notes usefulness, product owner) | survey |

Logging hours by hand is optional. The baseline comes from the last ~10 comparable stories in Jira.
With three pilot specs the TDD comparison reports insufficient data: the pilot validates use and
mechanism, not the hypothesis.

## 6. Phases and go / no-go

- **F0 — 1 day:** both entry conditions; `doctor` on a clone; constitution in shadow mode; backup
  location; baseline from Jira; Jira read access.
- **F1 — week 1:** the quick change and the bug. Any interference with the team stops the pilot.
- **F2 — weeks 2–3:** the front + back story end to end, including the first real Jira publication.
- **F3 — retrospective and decision:**
  - lead time no more than 20% worse, **judged on F2 specs only** (F1 carries the learning curve);
  - the Reviewer caught at least one real issue the PR review did not;
  - zero interference incidents;
  - survey ≥ 4/5;
  - cost within the caps.

## 6.1 Reference costs from dogfooding

What real runs on the Mandao repository cost, as reported by each Claude Code session
(`total_cost_usd`). Use them to size the caps in F0; they are not a forecast for another codebase.

| Run | Spec | Commands | Cost (USD) | Notes |
|---|---|---|---|---|
| 2026-10-20 | MDO-0004 (3 tasks, standard depth, public-api) | specify 1.64 · clarify 1.63 · tasks 1.16 · implement 9.88 · verify 0.94 · close 1.92 | **17.18** | Leader on Opus 5.5; implementers on Sonnet and Haiku; reviews on Opus. `story` not measured (no JSON output). Implement includes one FAIL and rework. |

## 7. Risks

Private code and data terms; harness versions on the developers' machines (`doctor` checks the
supported range); graphify on a large repository; the resource guard on modest machines; specs seen as
bureaucracy (hence `quick` and `lite` first); other SDD skills in a developer's global harness folders
competing with Mandao's commands (seen in the OpenCode acceptance run).

## 8. To start

The maintainer provides the project, 2–3 candidate stories, Jira read access, the team's agreement to
shadow mode, the organization's confirmation and the cost caps.
