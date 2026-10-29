# Schemas

Every file is YAML validated with zod (`src/schemas/`) and carries `schema_version: 1`.
`mandao doctor` reports each violation with its field path. User-facing keys are snake_case.

## `.mandao/config.yml` — intent, edited by humans

```yaml
schema_version: 1
workspace: monorepo            # single | monorepo | polyrepo
default_profile: app           # for projects that do not set one
language: { business: es, technical: en }   # content only; headings, keywords and markers stay English
home: .                        # holds canonical specs, workspace constitution, root AGENTS.md
local_only: false              # polyrepo: accept unversioned workspace artifacts
paths: { specs: specs, constitution: docs/constitution, releases: docs/releases }
projects:                      # always a list; a simple repo is one project with path: .
  - name: api
    path: apps/api
    profile: app               # app | ai | data (defaults to default_profile)
    tracker_key: API
    ui: true                   # optional: true forces and false excludes the UI surface that `run mock-offer` otherwise detects
    repo: git@github.com:acme/api.git   # required in polyrepo ("local" without a remote)
    gates:                     # level 0 gates, run from the project folder (projects[].path): paths are relative to it
      format: npm run format:check
      lint: npm run lint
      typecheck: npm run typecheck
      test: npm test --
      build: npm run build        # or the literal `none` (case-sensitive): no build step by choice
      secrets: gitleaks detect
      audit: npm audit --omit=dev
      sast: semgrep --config auto
      metrics: npx eslint --rule 'complexity: [error, 10]'
presets: []                    # bundled ids or ./paths, lowest precedence first
skill_packs: []
harnesses: [claude, copilot]  # claude | copilot | codex | opencode | antigravity (experimental)
spec: { branch: "{prefix}{id}-{ref}-{slug}", local_prefix: MDO }   # {prefix} from branching.prefixes; {ref}: tracker item (ADR 0067)
branching:                     # ADR 0023: a preset plus only the fields that differ
  model: gitflow               # trunk | feature-branch (default) | gitflow | env-branches
  # base: develop              # where spec branches start and where PRs target
  # promotion: [develop, main] # recorded, never automated
  # production: main
  # prefixes: { feature: feature/, fix: bugfix/, hotfix: hotfix/, release: release/ }
  # hotfix: { from: main, merge_to: [main, develop] }
  # protected: [main, develop] # Mandao never commits or pushes here
  # max_branch_age_days: 2     # trunk only
commits:
  emoji: { feat: ✨, fix: 🐛, docs: 📝, style: 🎨, refactor: ♻️, test: ✅, chore: 🔧,
           perf: ⚡️, build: 📦️, ci: 👷, revert: ⏪️, breaking: 💥 }
  # emoji: false             # plain Conventional Commits: no emoji in generated subjects, no emoji rule in commitlint (ADR 0055)
  max_subject_length: 72
  trailers: { refs: Refs, task: Mandao-Task, acs: Mandao-AC, quick: Mandao-Quick }
scripts: { runner: npx }       # npx (pinned version) | local (devDependency)
research:
  max_questions: 5             # prioritized per dispatch; evidence can accumulate across batches
  web_search_servers:           # a search MCP per harness, validated against its config; Claude Code, Codex and Antigravity native search also counts (ADR 0058)
    - claude:.mcp.json:web_search
budget: { per_spec: 10 }        # ADR 0036: USD per spec; a warning at 80%, a confirmation to go on at 100%
session: { cut_min_savings: 1 } # ADR 0038: mid-implement stop only above this USD saving (default $1 or 15% of per_spec, the lower)
size_limits:                   # ADR 0028: measured on the real diff only, never estimated; projects override
  quick: { max_files: 3, max_changed_lines: 100 }   # quick post-check (git diff --numstat)
  pr:    { max_files: 25, max_changed_lines: 400 }  # pr-plan proposes splitting above these
deliveries: { propose_above_tasks: 8 }  # ADR 0053: tasks proposes deliveries inside a spec above this many tasks
resources:                     # ADR 0013 / 0024; projects[].resources overrides any key
  max_workers: auto            # half the cores
  priority: low
  timeout_s: 900
  e2e_workers: 1
  operations:                  # memory floor per operation (MB); defaults build 1024, tests 2048, e2e 3072
    build: { min_free_memory_mb: 1024 }
    tests: { min_free_memory_mb: 2048 }
    e2e:   { min_free_memory_mb: 3072 }
  # Under the floor: one worker; under half of it: deferred. --force, MANDAO_FORCE=1 or RG_FORCE=1 run it
  # anyway and are recorded in .mandao/cli.log and in the active spec's execution.md (## Forced runs).
```

Cross-field rules: unique project names and paths; `single` has exactly one project; polyrepo
projects need `repo` and cannot sit at the root; paths are relative, never escape the workspace, and
lose trailing slashes; every commit type has a distinct emoji.

## `.mandao/models.yml` — model per role

```yaml
schema_version: 1
mode: routed                    # simple | routed
profile: peak                   # peak | balanced | economy (ADR 0036); `mandao models profile` switches
harnesses:
  claude:
    leader: opus
    reviewer: opus
    reviewer_alt: fable         # reviews when the Implementer ran on the Reviewer's model
    implementer: { fast: haiku, standard: sonnet, strong: opus }   # simple mode: implementer: sonnet
    tester: sonnet
```

A project can override roles in `<project>/.mandao/models.yml`. Precedence: command flag > spec
frontmatter (`models:` in `story.md`) > project > workspace > `core/models/recommendations.yml`.
Missing roles fall back to the next layer. `mandao models` shows each role's model and source.

## `.mandao/mandao.lock` — resolution, written by the CLI only

`mandao` version, `config_hash` (config.yml + models.yml), resolved layers with hashes, the
`reviewed` date of the model recommendations already offered per harness, pinned skills (id, version, source, author, license, vetted), and every generated file with its harness,
origin (`command:specify`, `persona:reviewer`, `template:shared/rules/review.md`, `block:mandao`),
ownership (`owned` or `managed-block`) and content hash. See ADR 0003.

## `.mandao/sources.yml` — where business context lives

Shorthand and full forms are both accepted:

```yaml
schema_version: 1
tracker: linear                                 # jira | linear | clickup | monday | none
docs: sharepoint
meetings: teams
chat: { kind: slack, channels: ["#team-checkout"] }
design: { kind: figma, ref: "https://figma.com/…" }
```

## `mandao doctor --json` — report

`mandao doctor --json` prints the same findings as the text output, as one JSON document on standard
output (2-space indent, no colors, no headers). The exit code is the same as in text mode: `1` when any
`error` finding exists, `0` otherwise.

Example for a workspace with a config but no `.mandao/mandao.lock` (the messages are illustrative, not fixed text):

```json
{
  "schema_version": 1,
  "counts": { "error": 1, "warn": 1, "info": 1, "ok": 2 },
  "findings": [
    { "level": "ok", "message": "Node 22.18.0" },
    { "level": "ok", "message": "config: single, 1 project(s), harnesses claude" },
    { "level": "info", "message": "no .mandao/sources.yml: story and constitution --product will only use local context" },
    { "level": "warn", "message": "project \"api\" is declared as a repository but has no .git" },
    { "level": "error", "message": "no .mandao/mandao.lock", "fix": "run `mandao sync`" }
  ]
}
```

- `findings` lists every finding in the order the text output prints them. Each has `level`
  (`error | warn | info | ok`) and `message`. `fix` is present only when the finding has a suggested fix;
  the key is omitted otherwise, never `null`.
- `counts` always has all four keys, `error`, `warn`, `info` and `ok`, even when a level has no findings
  (then `0`), so CI can read `.counts.error` without a default.
- `schema_version` is `1`. The top-level keys are exactly `schema_version`, `counts` and `findings`; the
  finding keys are only `level`, `message` and `fix`. Any change to that set of keys, or to the meaning of
  a key, bumps `schema_version`. A unit test asserts the exact top-level and `counts` keys and limits
  finding keys to `level`, `message` and `fix`, so the contract cannot change silently.
- A config-validation error names the file, the dot-joined field path and the zod message (for example
  `<root>/.mandao/config.yml: projects.0.path: <zod message>`) and has no `fix`. A YAML syntax error names
  only the file and the parser message. When `config.yml` is invalid the doctor stops there, so no later
  findings are reported.

## `core/catalog/skills.yml` — curated skills

```yaml
schema_version: 1
bootstrap: [graphify, software-architect, product-manager-toolkit, brainstorming, mandao-skills]
skills:
  angular-developer:
    description: …
    source: { type: git, url: https://github.com/angular/skills, ref: <tag or 40-hex>, path: angular-developer, commit: <40-hex> }
                                                 # git | npm | skills | command | plugin | bundled; referenced, never vendored
    version: f0c2fbd
    author: Angular team (Google)
    license: MIT
    license_from: frontmatter                    # file (default) | frontmatter: no LICENSE file; shown as "MIT (frontmatter)"
    trust: official                              # official | vendor | community
    audit: { checked: 2026-10-26, result: pass } # skills.sh scanners on that date; re-checked on every pin bump
    vetted: false                                # false → proposed as unvetted (not yet tried on a real project)
    binding: stack                               # core | profile | stack | conditional
    phases: [specify, implement]               # the commands that use the skill
    profiles: [app]
    fallback: What the commands do without the skill.   # optional
    install_on: mock-accepted                    # optional: never installed by init, sync or matching; only `node .mandao/bin/mandao.mjs skills add <id> --yes` after an accepted UI mock
    model_invocation: true                       # boolean, default true; false: the copied SKILL.md gets `disable-model-invocation: true` and Codex `agents/openai.yaml` gets `allow_implicit_invocation: false`
technologies:
  angular:
    match: { packages: ["@angular/core"], files: [angular.json] }
    primary: angular-developer                   # or alternatives by facet: when: { state: x }, alt: [{ skill, when }]
  nestjs:
    match: { packages: ["@nestjs/core"] }
    project_skill: Why no catalog skill passes.  # instead of primary: the constitution proposes the project skill
facets: {}                                       # style-defining libraries: facet → value → matcher
packs:
  dev-web: [vercel-react-best-practices, next-dev-loop, tailwind-design-system]
```

Source types: `skills` (`npx skills add <ref>`), `npm`, `command` (a documented shell installer,
e.g. `uv tool install …`), `plugin` (an agent-side install such as `/plugin install …`, printed for the
user), `git` (fetched at `ref`, checked against `commit`, and its `path` folder copied into each harness
skills folder; see [cli.md](cli.md#skills-at-init)) and `bundled`. Any source may declare `verify`, a command that proves the
install. A `git` source requires `commit` (40 hex), the commit the `ref` must resolve to; the lock skill entry
records it (optional `commit`), and `scripts: true` when its scripts were copied with `--with-scripts`. `fallback` says what the commands do without the skill.
No entry may carry an `UNVERIFIED` placeholder: `skills add` refuses one and `run fingerprint` drops it (ADR 0063).
`run fingerprint` prints `matches`, `dropped` and `projectSkills` (a detected technology with `project_skill`);
`binding: profile` skills are proposed for their profiles. The lock skill entry records the license as shown
(`MIT (frontmatter)`) and `trust`.
`commandSkills(catalog)` in `src/skills/command-skills.ts` lists the `bootstrap` skills that are `binding: core`
and not `bundled`, with their commands (`phases`), for every harness. Every referenced skill and facet must exist. At most ~10 project skills on top of the bootstrap.

## `mockups/README.md` — UI mock of a spec (ADR 0056)

Present only when the user accepted a mock (`mandao run mock-offer <ID> --record accepted`). Frontmatter:

```yaml
schema_version: 1
source: design           # design | html
link: https://claude.ai/...   # optional, design only: private, only here, never in briefs or the README body
artboard: Checkout       # optional, design only
files: [checkout.html]   # every file of mockups/ except the README
```

`mandao approve <ID> design` refuses a missing README, a listed file that is missing, or `source: design`
with no export file (`.html`, `.htm`, `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`, `.pdf`). Approval hashes include `mockups/`.

## `docs/product/intake/<doc>-<YYYY-MM-DD>.md` — requirements document intake (ADR 0057)

Written by `/mandao-story --from <file>` from the template `product/intake-proposal.md`. Frontmatter:

```yaml
schema_version: 1
source: { path: "docs/inbox/rfp.pdf", sha256: "<hex>", extractor: pdftotext }   # pdftotext | markdown | native
doc: rfp                 # slug of the file's base name; its cache is .mandao/cache/intake/<doc>/
date: 2026-10-22
status: proposed         # proposed | closed (mandao intake close)
```

The body sections, parsed by heading by `mandao run intake-check`:

| Section | Shape | IDs |
|---|---|---|
| `## Business context` | table `ID \| Kind \| Proposal \| Target \| Ref \| Status`; Kind `rule \| term \| actor`; Target `business-rules.md \| glossary.md \| product.md`; Status `proposed \| approved \| applied \| rejected \| CONFLICT` | `C-n` |
| `## Epics` | `### E-n — <name>`, one paragraph ending `refs: [p. 3, p. 4]` | `E-n` |
| `## Stories` | `### I-n — <title>`, then bullets `epic`, `refs` (or `inferred: true`), `priority` (MoSCoW or RICE), `depends_on`, `invest`, `opened` (only once opened), then `#### AC-n — <name>` with GIVEN / WHEN / THEN | `I-n` |
| `## Open and conflicts` | table `ID \| Type \| Question or contradiction \| Ref \| Status`; Type `OPEN \| CONFLICT` | `Q-n` |
| `## Coverage` | table `Section \| Ref \| Covered by \| Status`; one row per section; Status `covered \| no requirement \| requires OCR`; Covered by lists IDs, or `—` | — |

Refs are `p. N` (PDF) or `§ A > B` (Markdown) and must exist in the cache's `sections.json`; without the
cache `references-unverified` is a warning, and a sha256 that differs from the cached extraction is the
problem `source-changed` (`intake-extract --force` re-extracts over a cache of another file). IDs must
use their prefix (`C-n`, `E-n`, `I-n`, `Q-n`), and "Covered by" is `—` on `no requirement` and `requires
OCR` rows. The check also refuses missing epics, unknown or cyclic
`depends_on`, reused IDs, an OCR section that is not `requires OCR`, and `status: closed` while a `C-n`
is still `proposed`.
