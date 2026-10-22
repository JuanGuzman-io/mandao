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
    repo: git@github.com:acme/api.git   # required in polyrepo ("local" without a remote)
    gates:                     # level 0 gates, run from the project path
      format: npm run format:check
      lint: npm run lint
      typecheck: npm run typecheck
      test: npm test --
      secrets: gitleaks detect
      audit: npm audit --omit=dev
      sast: semgrep --config auto
      metrics: npx eslint --rule 'complexity: [error, 10]'
presets: []                    # bundled ids or ./paths, lowest precedence first
skill_packs: []
harnesses: [claude, copilot]  # claude | copilot | codex | opencode | antigravity (experimental)
spec: { branch: "{prefix}{id}-{slug}", local_prefix: MDO }   # {prefix} from branching.prefixes
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
  max_subject_length: 72
  trailers: { refs: Refs, task: Mandao-Task, acs: Mandao-AC, quick: Mandao-Quick }
scripts: { runner: npx }       # npx (pinned version) | local (devDependency)
research:
  max_questions: 5             # prioritized per dispatch; evidence can accumulate across batches
  web_search_servers:           # explicit capability declaration, validated against the harness config
    - claude:.mcp.json:web_search
budget: { per_spec: 10 }        # ADR 0036: USD per spec; a warning at 80%, a confirmation to go on at 100%
session: { cut_min_savings: 1 } # ADR 0038: mid-implement stop only above this USD saving (default $1 or 15% of per_spec, the lower)
size_limits:                   # ADR 0028: measured on the real diff only, never estimated; projects override
  quick: { max_files: 3, max_changed_lines: 100 }   # quick post-check (git diff --numstat)
  pr:    { max_files: 25, max_changed_lines: 400 }  # pr-plan proposes splitting above these
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
  flutter-bloc:
    description: …
    source: { type: skills, ref: owner/repo }   # git | npm | skills | command | plugin | bundled; referenced, never vendored
    version: 1.2.0
    author: …
    license: MIT
    vetted: true                                 # false → proposed as unvetted
    binding: stack                               # core | profile | stack | conditional
    phases: [specify, implement]               # the commands that use the skill
    profiles: [app]
    fallback: What the commands do without the skill.   # optional
technologies:
  flutter:
    match: { files: [pubspec.yaml] }
    primary: flutter-bloc
    when: { state: bloc }
    alt: [{ skill: flutter-riverpod, when: { state: riverpod } }]
facets:                                          # style-defining libraries
  state:
    bloc: { packages: [flutter_bloc] }
    riverpod: { packages: [flutter_riverpod] }
packs:
  dev-flutter: [flutter-bloc, flutter-riverpod]
```

Source types: `skills` (`npx skills add <ref>`), `npm`, `command` (a documented shell installer,
e.g. `uv tool install …`), `plugin` (an agent-side install such as `/plugin install …`, printed for the
user), `git` (fetched at `ref`, checked against `commit`, and its `path` folder copied into each harness
skills folder; see [cli.md](cli.md#skills-at-init)) and `bundled`. Any source may declare `verify`, a command that proves the
install. A `git` source requires `commit` (40 hex), the commit the `ref` must resolve to; the lock skill entry
records it (optional `commit`), and `scripts: true` when its scripts were copied with `--with-scripts`. `fallback` says what the commands do without the skill.
`commandSkills(catalog)` in `src/skills/command-skills.ts` lists the `bootstrap` skills that are `binding: core`
and not `bundled`, with their commands (`phases`), for every harness. Every referenced skill and facet must exist. At most ~10 project skills on top of the bootstrap.
