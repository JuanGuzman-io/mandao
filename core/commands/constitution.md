---
schema_version: 1
id: constitution
title: Constitution
description: "Establish or update the project foundation (technical constitution and product context), the AGENTS.md hierarchy and the project skills."
summary: "The project's foundation: technical rules, product context, AGENTS.md and skills"
status: stable
flow: { after: [], next: [story, specify] }
arguments:
  - name: mode
    description: "How to start: new (no code yet), legacy (code, no constitution), active (update an existing one)"
    value: "auto|new|legacy|active"
    default: auto
  - name: product
    description: "Also distill business sources from .mandao/sources.yml (or `ingest <source>`)"
    flag: true
examples:
  - { run: "/mandao-constitution", does: "detects the mode and builds or updates the constitution" }
  - { run: "/mandao-constitution active", does: "proposes changes to an existing constitution, one diff per file" }
  - { run: "/mandao-constitution --product", does: "adds the product context from your tracker and documents" }
inputs:
  - { path: .mandao/config.yml, required: true }
  - { path: .mandao/sources.yml }
  - { path: "{{paths.constitution}}/" }
outputs:
  - { path: "{{paths.constitution}}/*.md", description: workspace constitution and product context }
  - { path: "<project>/{{paths.constitution}}/*.md", description: project level, only what differs }
  - { path: AGENTS.md, description: root, project and module levels; root holds the module index and the Skill Map }
capabilities: [read, search, edit, shell, mcp, agents]
templates:
  - rules/context.md
  - constitution/product.md
  - constitution/business-rules.md
  - constitution/glossary.md
  - constitution/critical-flows.md
  - constitution/architecture.md
  - constitution/standards.md
  - constitution/security.md
  - constitution/performance.md
  - constitution/ux.md
  - constitution/infrastructure.md
  - constitution/CHANGELOG.md
scripts: [fingerprint, branching, security-scanning, stack-check]
approval: required
---

# /mandao-constitution

Arguments: {{args}}

Build the foundation every other mandao relies on: how the system is built (technical constitution,
owned by the {{roles.tech_lead}}) and what it does and for whom (product context, owned by the {{roles.po}}). Keep them in
separate files: different people approve them.

For a new or legacy constitution, propose stack-specific design principles in `standards.md` for user
approval: stable `DP-*` IDs, concrete SRP/DIP rules (especially single responsibility and dependency
inversion where required), ACID rules where relevant, and simplicity / anti-
abstraction as the counterweight. Record architecture as an explicit team choice in `architecture.md`;
never infer it from the framework. State precedence: chosen project architecture, then documented
framework conventions, then generic principles only where the first two are silent. In active mode,
show this as a per-file proposal and do not add it unless the user approves.

Follow `{{template:rules/context.md}}` throughout. Product context is written in
`{{language.business}}`; the technical constitution in `{{language.technical}}`. Headings, keywords and
markers stay in English.

## 1. Read the workspace

1. Read `.mandao/config.yml`: workspace mode, `home`, projects with their paths and profiles.
2. Read `.mandao/sources.yml` if it exists.
3. Detect the mode unless one was given:
   - **new**: no meaningful code yet → elicit intent (use the brainstorming skill if available).
   - **legacy**: code exists, `{{paths.constitution}}/` does not → discover from code.
   - **active**: the constitution exists → safe update; only propose changes, never rewrite.
4. Tell the user the mode and the plan in three lines, then continue.

**Approval flow.** In **new** and **legacy** mode every document is written with `status: draft`. The
user reviews the files themselves; their approval moves each one to `status: approved`. Nothing is
committed before that approval. In **active** mode nothing is written until the user approves a diff
per file.

## 2. Map the code

- If a graph engine is available (graphify skill or CLI, or CodeGraph), build or refresh the graph
  following that tool's own instructions. It is mandatory in legacy mode when available.
- In this order, with approval:
  1. **Exclusions first.** `mandao sync` keeps `.graphifyignore` (generated files and build outputs,
     derived from the adapters) and `graphify-out/` in `.gitignore`. Check both exist before building.
  2. **Hooks**, through the tool's own installer, never written by hand: `graphify claude install`
     (agent hooks, merged into `.claude/settings.json`) and `graphify hook install` (git hooks, merged
     with existing ones). Before running them, note what `.claude/settings.json` and the git hooks
     contain; afterwards confirm nothing was lost, and restore it if it was.
  3. **Verify** with `{{mandao}} doctor`, which also flags an outdated graph tool.
- Otherwise map with search and glob: entry points, modules, layers, data models, integrations, tests.
  State "graph engine unavailable: lower confidence" in the summary.
- Do not commit the graph. Commit only distilled outputs.

## 3. Technical constitution

Write the workspace level in `{{paths.constitution}}/` from the templates, and a project level in
`<project>/{{paths.constitution}}/` only for what differs (stack, TRD details, profile):

| Document | Template |
|---|---|
| `architecture.md` | `{{template:constitution/architecture.md}}` |
| `standards.md` | `{{template:constitution/standards.md}}` |
| `security.md` | `{{template:constitution/security.md}}` |
| `performance.md` | `{{template:constitution/performance.md}}` |
| `ux.md` | `{{template:constitution/ux.md}}` |
| `infrastructure.md` | `{{template:constitution/infrastructure.md}}` |
| `critical-flows.md` | `{{template:constitution/critical-flows.md}}` |
| `CHANGELOG.md` | `{{template:constitution/CHANGELOG.md}}` |
<!-- mandao:if profile=ai -->
| `model-registry.md` (ai projects) | `.mandao/templates/ai/constitution/model-registry.md` |
<!-- mandao:endif -->

- Derive conventions and thresholds from what the code actually does; cite files. Where the code is
  inconsistent, write the dominant convention and record the exceptions as `CONFLICT`.
- **Verify every stack choice on the runtime** (phase 18), never only against a registry: for each row of
  `## Stack` write a `### S<n>` check in `## Stack verification` and prove it with
  `{{script:stack-check}} S<n> -- <command>` (install or import the library on the project's runtime; the
  command is read-only beyond the project's own environment; when it starts with a launcher such as `uv run` or
  `npx`, add `--runtime "<command that prints the runtime version>"`). A failing run is the answer: change the choice
  before the user approves it. A choice that cannot be checked here (a paid service, credentials, production
  only) says `UNVERIFIED: <why>`, shown in the approval summary. Pin the runtime the checks ran on
  (`.python-version`, `.nvmrc`, `engines`, `requires-python`…) and name the file in the Runtime column; when
  teammates or CI run the project, check their runtimes too. `{{mandao}} doctor` warns on an unchecked choice.
- Name one **exemplar file** per kind of module (controller, service, component…) in `standards.md`.
- **Gates, every one in one approval** (phase 17): propose per project format, lint, typecheck, test,
  `build` (or `none` when nothing builds), secrets, sast and audit, plus `eval` when the project evaluates a
  model or a quality metric (verify runs it, never the task gates) and `metrics` when it measures performance.
  Take them from existing scripts, else from the stack in `standards.md` (e.g. `uv run ruff check`,
  `uv run pytest`, `pip-audit`). Ask about everything a later command needs in this same approval: `run commit`
  needs `build` or `build: none`, and security-tagged tasks need `secrets` and `sast`. The user approves them
  into `projects[].gates` in `.mandao/config.yml`. **No manifest yet** (no `package.json`, `pyproject.toml`…):
  write the approved commands in the `## Gates` section of `standards.md` as proposed; the task that creates the
  manifest declares `.mandao/config.yml` in its files and sets them (`approve tasks` refuses a plan where no
  task does). A gate command runs from the project folder (`projects[].path`), so write its paths relative to
  that folder.
- Inspect local security gates and every project CI definition for secret scanners and SAST. Run
  `{{script:security-scanning}}` for deterministic detection and, when a GitHub remote and `gh` are
  available, read-only provider API evidence. Present each result as detected, user-declared or
  unknown; never turn a missing file, unavailable tool or denied API request into `none`. Put the
  approved per-type result in `security_scanning` frontmatter of `infrastructure.md`, keeping
  `secrets` and `sast` separate and preserving user declarations as declarations.
- A project inherits from the workspace. A contradiction is a `CONFLICT`, never a silent override.
- **Branching model** (ADR 0023): `{{script:branching}}` reports the model in force and what the existing
  branches suggest (`develop` or `release/*` → gitflow; `test`/`staging` → env-branches; only `main` →
  ask between trunk and feature-branch). Always confirm with the user, then write `branching` in
  `.mandao/config.yml` (only `model` plus the fields that differ from the preset; polyrepo projects may
  set their own) and document it in the `## Branching` section of `infrastructure.md`.

## 4. Product context

| Document | Template |
|---|---|
| `product.md` (vision, users, capability map) | `{{template:constitution/product.md}}` |
| `business-rules.md` | `{{template:constitution/business-rules.md}}` |
| `glossary.md` | `{{template:constitution/glossary.md}}` |

- Translate code into business language ("two-level approval flow exists", "discounts capped at
  30%"), each capability with evidence in code.
- With `--product` or `ingest <source>`: read the sources in `.mandao/sources.yml` through their MCP
  servers. Distill rules with link and date; never copy documents or transcripts; strip names and
  personal data. Cross-check documents against code and mark mismatches as `CONFLICT` for the {{roles.po}}.
- Without sources, the product layer contains only what code proves, and says so.

## 5. AGENTS.md hierarchy

- Root `AGENTS.md`: keep Mandao's managed block intact (between `mandao:begin` and `mandao:end`).
  Outside it, add the module index.
- Each project and each meaningful module gets an `AGENTS.md`: purpose, contracts, conventions,
  gotchas. `CLAUDE.md` files only contain `@AGENTS.md`.

## 6. Skills

1. Run `{{script:fingerprint}}` and read its JSON: per-project fingerprint, bootstrap skills, and the
   catalog proposal (`matches`, `dropped`).
2. Present the proposal: skill, technology, projects, evidence, vetted or `unvetted`. For `dropped`
   items, ask the question they carry (e.g. which state-management convention is used).
3. Technologies missing from the catalog: offer `unvetted` candidates or a project-tailored skill
   generated with skill-creator from `standards.md`.
4. After approval, install and pin them with `{{mandao}} skills add <ids>`, which always uses the
   version pinned in the catalog, then write a `## Skill Map` in the root `AGENTS.md` (outside the
   managed block): skill, binding, phase and module. One primary skill per technology, at most ~10
   project skills.

## 7. Clarify and approve

- One round of questions, at most 5, each with a proposed default.
- In **active** mode, show a diff per file and apply only what is approved, with a `CHANGELOG.md` entry
  whose `- Affects:` line names the open specs that relied on what changed. Those specs' approvals recorded the
  constitution as it was: `{{mandao}} run next <ID>` now recommends `/mandao-specify <ID>` to update their
  approved documents, then their approval.
- **From inside a spec** (its branch is checked out): the constitution and `.mandao/config.yml` are shared by
  every spec, so the approved change also needs its own short path to the base: propose a `chore` commit of
  only those files and, after one confirmation, its PR through the same delivery flow (phase 16). Other open
  specs see it once it is merged; until then `run spec-new --create` warns them (`sharedState`).
- Summarize: documents written, confidence level, every `ASSUMPTION` / `OPEN` / `CONFLICT`, and the
  next step: {{command:story}} for a new feature or {{command:quick}} for a trivial change.
