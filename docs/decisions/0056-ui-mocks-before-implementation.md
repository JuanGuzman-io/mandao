# 0056 — UI mocks before implementation

**Status:** Accepted (Phase 13)

## Context

A spec that touches a front end went from requirements to tasks with nothing the PO could see, and the
Implementer decided alone how a form looks (phase 11 trial, 2026-10-22). Mandao needs an optional visual
step that costs nothing when declined.

## Sources (read 2026-10-22)

- `/design`: <https://code.claude.com/docs/en/whats-new/2026-w34>. Research preview, Claude Code v2.1.234 or
  later, plans Pro, Max, Team and Enterprise; it publishes an artifact canvas, prints a link, and the user
  picks an artboard in the browser.
- `/design-sync` and export: <https://support.claude.com/en/articles/14604416-get-started-with-claude-design>.
  Exports are standalone HTML, a `.zip`, PDF and others; "Use /design-sync to pull in your design system".
  Image export is not verified.
- Claude Code changelog, entry 2.1.302 (2026-10-16): <https://code.claude.com/docs/en/changelog>. It mentions
  `/design-sync` and `/design-login`, so `/design-sync` exists in Claude Code; the changelog gives no version
  that introduced it, so Mandao states no minimum version for it. The same entry says standalone Claude
  Design (claude.ai/design) closes by December 14, 2026 (dated fact, read 2026-10-22).

**Not documented:** whether a Claude Code session can invoke `/design` itself, and the format of the
handoff bundle. Mandao therefore never assumes either: the command invokes the skill only if the session
can, otherwise it gives the user `/design <brief>` to run. The only artifact Mandao relies on is an export
the user places in `mockups/`: standalone HTML or PDF, a `.zip` unzipped there (the `.zip` is not kept).
Accepted extensions are `.html`, `.htm`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg` and `.pdf`; images are allowed because
screenshots serve the HTML way, not because `/design` is claimed to export them.

## Decision

- **Only on acceptance.** `mandao run mock-offer <spec>` decides deterministically (a project with a UI
  surface, overridable with `projects[].ui`, and a story without UX references) and records the answer
  (`--record accepted|declined`, `--source design|html`) once per spec. `story` (after `story.md` is written, because it reads `## UX references`) or `specify` asks once, with
  the phase 2 `asked`/`answered` events (class product). Declined loads nothing. Rules live in
  `rules/mockups.md`.
- **Two ways.** Claude Code: `/design` or a static HTML mock, chosen by the user. Other harnesses: HTML mock only, recorded as `--source html` without asking.
- **Private-link rule.** The claude.ai link is private: the team, the PO and subagents cannot open it. With
  `/design` the export into `mockups/` is mandatory; the link lives only in the frontmatter `link:` of
  `mockups/README.md`, never in a brief, a review pack or the README body; the artboard name may appear in the brief. `mandao approve <spec> design` refuses an accepted
  mock without a README, with a listed file missing, with a listed entry that is not a regular file (a folder or a symlink), with a
  `.zip` under `mockups/` (it must be unzipped and removed), with a claude.ai address in the README body, or with
  `source: design` and no export file.
- **Start from what exists:** `ux.md`, project styles and, when connected, Figma (official remote MCP
  server `https://mcp.figma.com/mcp`). Never a new style on an existing product.
- **Approved with the design** (lite: with the spec); approval hashes include `mockups/`. The brief of UI
  tasks carries `mockup: { readme, files, source, artboard? }`; the Reviewer fails an unjustified deviation.
- **Skills.** Only `elayadesign/ai-design-skills` enters the catalog (MIT, commit `1c1e97c`, path
  `skills/landing-page-design`, no scripts), `vetted: false` because admission (design doc 17.2) asks for a
  real-project trial that has not happened. Upstream auto-triggers on any web UI, against "only on
  acceptance", so the install must disable automatic model invocation and happen only after acceptance.
  The catalog entry carries `install_on: mock-accepted` (init, sync and matching never install it; only
  `node .mandao/bin/mandao.mjs skills add <id> --yes` after acceptance) and `model_invocation: false` (the
  copied `SKILL.md` gets `disable-model-invocation: true` and Codex `agents/openai.yaml` gets
  `allow_implicit_invocation: false`). `mock-offer --record accepted` returns `skills[].install`. The consent
  question names these skills as unvetted third-party content.
  `Leonxlnx/taste-skill` is not added: its scripts launch Chrome and download assets from public sites.

## Consequences

Declining costs one question. The mock is reviewable by everyone from a file in the repo. The skill is
installed only after an explicit, informed yes and never invokes itself. Standalone Claude Design closing
(December 14, 2026) may change the `/design` path; the HTML mock does not depend on it. A `/design` export is only as good as the user's
export step, which approval enforces by file presence, not content.
