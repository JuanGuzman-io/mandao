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
| `close-summary.md` | What shipped? (version 2: outcome, notes for the PO and for developers, Kaizen, delivery) | close |

Where each fact lives:
- **Clarifications** live only in `requirements.md` (`## Clarifications`); story and design link there.
- **Premises** live only in `design.md` (`## Premise Ledger`).
- **Test results** live only in `verify-report.md`; the release notes take the status from
  `release-status`.

How each document is written lives in its own rule (`doc-<document>.md`); a command loads only the ones it writes.
