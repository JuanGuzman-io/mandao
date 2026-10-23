---
schema_version: 1
rule: mockups
---

# UI mocks before implementation

Run `node .mandao/bin/mandao.mjs run mock-offer <ID>`. It returns `{ suggest, reason, uiProjects, uxReferences, decided?, source? }`.
Offer a mock only when `suggest` is true; when `decided` is set, never ask again. Offer it once per spec,
in `story` or `specify`, whichever runs first.

## The question

Ask once, as a `product` question recorded with the telemetry `asked` / `answered` events: *This spec
touches a UI and the story has no UX references. Do you want a visual mock before implementation?* Give
the `reason` and a proposed answer. When `mock-offer` returns `skills`, add to the question: accepting
also installs these skills, named from that list only, which are **unvetted third-party content**
(catalog `vetted: false`) and not reviewed by Mandao.

- **Declined:** `run mock-offer <ID> --record declined`, continue, and load nothing else: no skill, no
  `mockups/`.
- **Accepted:** in Claude Code, ask which way (`/design` or HTML mock) and record with
  `--record accepted --source design|html`; in any other harness do not ask: record `--source html`.

## The two ways

- **Static HTML mock** (every harness): one self-contained `.html` file in `mockups/`, no build step and
  no external assets.
- **`/design`** (Claude Code only; Claude Design, research preview, from Claude Code v2.1.234, plans
  Pro, Max, Team and Enterprise): it publishes a private claude.ai canvas and prints a link; the user
  picks an artboard in the browser. It is not documented whether a session can invoke it itself: invoke
  the skill if the session can, otherwise give the user `/design <brief>` to run and wait for the link.
  Optionally run `/design-sync` first to load the design system.

With `/design`, **the export is mandatory**: the link is private, so the team, the PO and subagents cannot
open it. Ask the user to export the chosen artboard as standalone HTML or PDF into `mockups/`; a `.zip` is
unzipped into `mockups/` and the `.zip` itself is not kept. Image export is not verified: do not claim
`/design` exports images. Accepted extensions are `.html`, `.htm`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg` and `.pdf`
(screenshots are allowed for the HTML way). The claude.ai link goes **only** into the README frontmatter
`link:`, never into the brief, the review pack or the README body; the artboard name may appear in the brief.

## Start from what exists

Build the mock from `ux.md` (tokens and principles), the project's styles and components and, when its MCP
is connected, Figma (official remote server `https://mcp.figma.com/mcp`). Never invent a new style for an
existing product. The brief for `/design` or the HTML mock comes from the story and its AC: screens,
states (empty, loading, error) and the copy the AC name.

Design skills install only for an accepted mock: the question above names them, so a yes covers the install.
`--record accepted` returns `skills: [{ id, install }]`: run each `install` (the form
`node .mandao/bin/mandao.mjs skills add <id> --yes`), then use the skill
for the mock and for the UI tasks. Never install or load one for a declined or unasked mock.

## mockups/README.md

Write it from the template `spec/mockups-readme.md` of the installed profile (`.mandao/templates/<profile>/`): frontmatter `schema_version: 1`, `source: design | html`,
`link` and `artboard` (design only, optional) and `files:` (every file in `mockups/` except the README).
`mandao approve <ID> design` refuses an accepted mock without a README, with a listed file missing, or
with `source: design` and no export file, with a `.zip` under `mockups/` (unzip it and remove the `.zip`),
with a claude.ai address in the README body, or with a listed entry that is not a regular file (a folder
or a symlink).

## Approval

The mock is approved with the design (lite: with the spec); the approval hashes include `mockups/`. After
approval, the Implementer brief of UI tasks carries `mockup: { readme, files, source, artboard? }` and the
Reviewer checks the task against it.
