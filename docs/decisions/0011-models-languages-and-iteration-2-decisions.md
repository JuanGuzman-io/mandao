# 0011 — Models per role, profiles vs presets, skill installs, quick review, hooks, spec states, languages

**Status:** Accepted · 2026-10-20 · supersedes point 6 of ADR 0010 and the tier-based `models.yml`

## Context
Review of iteration 1 left eight decisions to the user. This ADR records them as decided.

## Decisions

1. **Models per role.** `.mandao/models.yml` maps role → model per harness: `leader`, `reviewer`,
   `reviewer_alt`, `implementer` (per tier: fast / standard / strong) and `tester`.
   - Modes: `simple` (one model to implement, another to review) and `routed` (the Implementer follows
     each task's tier).
   - `init` asks per role, showing the recommendation with the option to type another;
     `mandao models set <role> <model>` changes it and `mandao models mode` switches mode.
   - Precedence: flag > spec frontmatter > project `models.yml` > workspace `models.yml` > recommendation.
     Generated agents carry the workspace resolution; the Leader resolves per task at run time with
     `mandao run models --project … --spec … --set role=model`.
   - Recommendations live in `core/models/recommendations.yml`, per harness, with `reviewed` date and
     official `sources`. Initial entries come from the Claude Code model-config docs and GitHub's
     supported-models list (2026-10-20). `update` never changes choices; it offers the new
     recommendation once per review date (the lock records which were offered).
   - `reviewer_alt` reviews when the Implementer equals the Reviewer. Without a different model:
     warn, review in a clean context, record `reduced independence`; never block.
   - `doctor` errors on roles without a model and warns on models outside the recommendations and on
     reduced independence. This replaces the earlier `must_differ_from` warning.
   - Generated agents: `mandao-implementer-<tier>` (routed) or `mandao-implementer` (simple),
     `mandao-reviewer` and `mandao-reviewer-alt`. Commands no longer pin a model: they run on the
     session's model, so the `tier` field was removed from commands and personas.
2. **Profile per project**, with a workspace `default_profile` asked by `init`.
3. **Terms.** Profile = Mandao template variant chosen per project. Preset = team customization layer
   in the resolution stack.
4. **Skill installs.** `skills add` runs the ecosystem installer after confirmation (`--yes` for CI),
   verifies (a `verify` command, or a `SKILL.md` in the harness or plugin folders) and pins only
   verified skills. Missing tools and agent-side installs (`/plugin install …`) are printed instead.
   Catalog sources gained `command` and `plugin` types.
5. **Quick review** always runs in a separate context, on a different model when available. Lite = core
   Reviewer on the diff, no lenses.
6. **Hooks.** Adapters generate hooks only where the harness supports them, merging with the user's
   configuration. Tools with their own installer (Graphify) are delegated to; `doctor` checks the hooks
   exist. Harnesses without hooks get the instruction in `AGENTS.md`. Mandao has no hook of its own
   yet, so no adapter emits one in this iteration.
7. **Spec states:** `draft → approved → in-progress → blocked → verified → closed | abandoned`.
8. **Languages.** `language.business` and `language.technical` in `config.yml`, asked by `init` and
   exposed to content as `{{language.business}}` / `{{language.technical}}`. Headings, keywords and
   markers stay in English; code and commits are always English.

## Consequences
- The token language gains two tokens (ADR 0002 stays closed otherwise).
- The design document is updated in §3, §5.2, §5.4, §8, §9, §14.2, §14.3, §17.2, §21 and §23.
