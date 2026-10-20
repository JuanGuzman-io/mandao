# Schemas

Every file is YAML validated with zod (`src/schemas/`) and carries `schema_version: 1`.
`mandao doctor` reports each violation with its field path. User-facing keys are snake_case.

## `.mandao/config.yml` — intent, edited by humans

```yaml
schema_version: 1
workspace: monorepo            # single | monorepo | polyrepo
home: .                        # holds canonical specs, workspace constitution, root AGENTS.md
local_only: false              # polyrepo: accept unversioned workspace artifacts
paths: { specs: specs, constitution: docs/constitution, releases: docs/releases }
projects:                      # always a list; a simple repo is one project with path: .
  - name: api
    path: apps/api
    profile: app               # app | ai | data
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
harnesses: [claude, copilot]
presets: []                    # bundled ids or ./paths, lowest precedence first
skill_packs: []
spec: { branch: "{type}/{id}-{slug}", local_prefix: MDO }
commits:
  emoji: { feat: ✨, fix: 🐛, docs: 📝, style: 🎨, refactor: ♻️, test: ✅, chore: 🔧,
           perf: ⚡️, build: 📦️, ci: 👷, revert: ⏪️, breaking: 💥 }
  max_subject_length: 72
  trailers: { refs: Refs, task: Mandao-Task, acs: Mandao-AC, quick: Mandao-Quick }
scripts: { runner: npx }       # npx (pinned version) | local (devDependency)
```

Cross-field rules: unique project names and paths; `single` has exactly one project; polyrepo
projects need `repo` and cannot sit at the root; paths are relative, never escape the workspace, and
lose trailing slashes; every commit type has a distinct emoji.

## `.mandao/models.yml` — tier registry

```yaml
schema_version: 1
harnesses:
  claude: { fast: haiku, standard: sonnet, strong: opus }
  copilot: { fast: …, standard: …, strong: … }   # left to the team; names are not portable
```

## `.mandao/mandao.lock` — resolution, written by the CLI only

`mandao` version, `config_hash` (config.yml + models.yml), resolved layers with hashes, pinned
skills (id, version, source, author, license, vetted), and every generated file with its harness,
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

## `core/catalog/skills.yml` — curated skills

```yaml
schema_version: 1
bootstrap: [graphify, software-architect, product-manager-toolkit, brainstorming, mandao-skills]
skills:
  flutter-bloc:
    description: …
    source: { type: skills, ref: owner/repo }   # git | npm | skills | bundled; referenced, never vendored
    version: 1.2.0
    author: …
    license: MIT
    vetted: true                                 # false → proposed as unvetted
    binding: stack                               # core | profile | stack | conditional
    phases: [specify, implement]
    profiles: [app]
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

Every referenced skill and facet must exist. At most ~10 project skills on top of the bootstrap.
