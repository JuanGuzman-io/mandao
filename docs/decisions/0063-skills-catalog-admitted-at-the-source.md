# 0063 — Skills catalog admitted at the source

**Status:** Accepted (Phase 20). Refines MANDAO-DESIGN §17.2 and ADR 0012.

## Context

In the real-state trial, `run fingerprint` proposed `react-best-practices` on a Next.js project and
`/mandao-constitution` asked to install "the version pinned by Mandao"; only after the person said yes did the agent
find the entry was an `UNVERIFIED` seed with no source. Nine catalog skills were seeds, and every technology mapping
pointed at one. The same trial showed `init`'s profile question was not understood: bare options `app`, `ai`, `data`,
no word on what a profile changes or why one was preselected, and `data` offered although it adds nothing yet.
Copilot also turned every flag into a free-text `${input:…}` question (phase 19 review F12).

## Decision

1. **Only installable entries.** No catalog entry carries an `UNVERIFIED` placeholder (a test enforces it).
   `skills add` refuses one before any question and `run fingerprint` drops it with the reason; the constitution
   offers to install only what `matches` lists.
2. **Admission at the source** (docs/audits/2026-10-skills-for-app.md): repository, path, frontmatter name and
   license read upstream; no Warn or Fail on skills.sh's scanners; trusted publishers. Every entry is a `git` source
   pinned to the commit its tag resolves to (the peeled commit, never an annotated tag object). Each entry records
   `trust` (`official`, `vendor`, `community`), `audit.checked` (re-checked by hand on every pin bump; doctor does not
   query skills.sh) and `license_from: frontmatter` when no LICENSE file backs the license, shown as
   `MIT (frontmatter)` by `skills add` and `skills list`. Entries stay `vetted: false` until tried on a real project.
3. **Project skill where none passes.** A technology names either a `primary` skill or `project_skill` (why none
   passes: shadcn, NestJS, Express, Hono, Drizzle); `run fingerprint` lists it under `projectSkills` and the
   constitution proposes the skill generated from `standards.md` (ADR 0012). `binding: profile` skills are proposed
   for their profile (`llm-evaluation` for `ai`).
4. **The profile question says what it decides** ("What kind of project is this? It changes the spec templates, not
   the commands"), each option has a hint (`ai` keeps everything `app` does, so an app with AI features picks `ai`),
   and the preselected one names its evidence (`openai in pyproject.toml`). `data` is not offered until it has
   templates; `--profile data` and the config still accept it, and a detected `data` project starts as `app`.
5. **Copilot asks only positional arguments**; flags are read from what was typed after the command.

## Consequences

- Of the nine seeds: `systematic-debugging`, `error-handling-patterns` and `api-design-principles` resolved to their
  upstream sources under the same id; `react-best-practices` became `vercel-react-best-practices` (Vercel) and
  `angular-developer` points at angular/skills; `nestjs-best-practices`, `flutter-bloc`, `flutter-riverpod` and
  `ai-agent-development` left the catalog (NestJS is a `project_skill`; `llm-evaluation` covers `ai` evals).
- A profile-neutral skill (language, database, security, cross-cutting) has no `profiles` key, so `data` projects get it
  too; frontend and mobile skills are `[app, ai]`.
- A pin bump is a maintainer step: re-read the source, re-check the audit, update `audit.checked`.
