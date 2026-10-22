# Spec anatomy

What a spec folder holds at layout version 2, per depth. The tables below come from the manifest in
`src/spec/layout.ts` (`anatomyTables`), the same one `mandao run layout <ID>` and the close gate use; a test
compares them. The layout version is the story's `schema_version`: 2 for new specs, 1 for older ones, which
stay readable in their own format. The depth is the `depth:` frontmatter of the spec documents, or lite when
it is missing and `spec.md` exists. Decision: [ADR 0041](decisions/0041-spec-folder-layout-v2.md).

A file is required from the stage its table row names. The stage comes from the story status, as the first
table shows: `approved` is set before specify runs, so it is still the draft stage, and no status maps to the
specified stage, so the spec documents are required from `in-progress` on. Any other file in the folder is
reported as unexpected. `diagrams/` and `_log/` are allowed at every depth.

### Stages

| Stage | Story status |
|---|---|
| draft | `draft`, `approved`, `abandoned` |
| specified | none: no status maps here, so its files are required from the next stage reached |
| planned | `in-progress`, `blocked` |
| verified | `verified` |
| closed | `closed` |

### lite

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `spec.md` | Requirements, design and decisions of a lite spec in one document | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### standard

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `requirements.md` | Functional requirements and scenarios | from the specified stage |
| `design.md` | Decisions, changes by module and risks | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### full

| File | What it is for | When |
|---|---|---|
| `story.md` | The request and its acceptance criteria | from the draft stage |
| `requirements.md` | Functional requirements and scenarios | from the specified stage |
| `design.md` | Decisions, changes by module and risks | from the specified stage |
| `tasks.md` | The task plan and its details | from the planned stage |
| `verify-report.md` | The result of verify | from the verified stage |
| `close-summary.md` | The record of the close | from the closed stage |

### Conditional files

| File | What it is for | When |
|---|---|---|
| `quickstart.md` | How a PO checks the behavior by hand | only when the spec has behavior a user or PO can see |
| `data-model.md` | The data the spec changes | only when the spec changes data |
| `contract/` | The contract between projects | only when the spec spans several projects |
| `research.md` | Dated evidence and decisions for research questions | only when the spec contains NEEDS RESEARCH questions |

### The six log files (`_log/`)

| File | What it is for | When |
|---|---|---|
| `state.yml` | Start request, baseline, progress, approvals and session-cut estimates | always, in `_log/` |
| `execution.md` | One row per execution event | always, in `_log/` |
| `reviews.md` | Verdict and findings per task and attempt | always, in `_log/` |
| `gates.md` | Gate status per attempt, with output only for failing gates | always, in `_log/` |
| `premises.md` | Per premise: claim, command, exit code and excerpt | always, in `_log/` |
| `costs.yml` | Spend per role | always, in `_log/` |
