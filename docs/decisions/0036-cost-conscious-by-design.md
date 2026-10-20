# 0036 — Cost-conscious by design

**Status:** Accepted · 2026-10-20 · design §2, principle 9

*Spend tokens only where they change the result.* The MDO-0004–0006 runs cost 7–11 USD per small spec;
three quarters of a session's cost was context read again on every turn (cache reads 42%) or written into
a new session's cache (32%), not output (26%).

## Process levers (always on, with any model)

1. **Mechanical work is a script.** Counting, tracing, parsing, validating and measuring diffs never run
   in the model. Done: `trace`, `tasks --index`, `step`, `gates`, `review-pack`, `implement-summary`,
   `approve`, `premise`, `quick-log`, `close-summary` with its links. What the model still does by hand
   and a script could (in order of estimated saving):
   - the AC → FR matrix in `requirements.md`, which `trace` already computes (generate it);
   - the verify report's AC → tests table and suites, from the gate logs and test runs (generate a draft);
   - moving a story into the worktree and installing dependencies (`spec-new` can do both);
   - the release-notes table from `release-status` (generate it; the model writes only the business
     column).
2. **Minimal context.** Briefs from the graph; the Reviewer gets the review pack and the active lenses
   only; each command loads only the document rules it writes (`rules/doc-*.md`); the `AGENTS.md` block
   every session loads is a pointer (1,468 → 169 tokens in a typical project).
3. **Reuse.** Current research, checkpoints and existing artifacts before regenerating; after
   `mandao approve`, continue in the same session.
4. **Prompt cache.** Checked in each harness's documentation (2026-10-20):
   - Claude Code caches automatically on an exact prefix (system, then project context, then the
     conversation); skills and commands are appended as user messages; a subagent starts its own cache;
     a skill whose frontmatter names a `model` is a model switch, a cache miss for that turn. Minimum
     512 tokens on the 5.5 models; 5-minute TTL by default.
   - OpenAI (Codex) caches automatically on the whole rendered prefix, from 1,024 tokens; `AGENTS.md` is
     an early user message built once per session; skills are listed by name and description first.
   - Copilot: provider-dependent; editing instructions or custom agents mid-session breaks reuse.
   - OpenCode: breakpoints on the last tool, the system parts and the conversation tail (Anthropic);
     implicit prefix caching for OpenAI and Gemini.
   - Gemini: implicit prefix caching from 2,048–4,096 tokens. Antigravity documents nothing.
   Rules that follow: command skills never set `model` or `effort`; agent and command files are
   byte-identical across syncs (no dates or run ids); inside every file, stable content first and the
   per-spec variable content last; project instructions stay small because every session loads them.
5. **Depth follows risk.** `quick`, a real `lite` (one session), executed premises only for High impact,
   adversarial review only at `full`.
6. **A budget per spec** (`budget.per_spec` in `.mandao/config.yml`, USD): a warning at 80%; at 100% the
   command asks to continue, inside its grouped confirmation (with external or irreversible actions).

## Model profiles

Per harness in `recommendations.yml`: `peak` (default; the best model per role), `balanced` (implementers
by task tier; a lighter Leader, because scripts do its mechanical work; the Reviewer stays strong) and
`economy` (the cheapest set that keeps a minimum). Chosen at `init` with one question that shows every
profile per harness, changed with `mandao models profile <p>`; the user's own role choices stay on top.
No profile puts the Reviewer below the Implementer's tier (a test checks every harness). No model changes
without the user's explicit command.

## Measurement

Cost is recorded per command and per role in each spec (`_log/costs.yml`). Kaizen shows it and recommends
adjustments with data (for example the first-pass approval rate per tier, the Leader's share) with the
estimated saving; it never changes the profile or a model.
