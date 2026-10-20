# Schemas

All files are YAML validated with zod (`src/schemas/`). `mandao doctor` reports every violation with its path.

## `.mandao/config.yml` — intent, edited by humans

```yaml
version: 1
workspace:
  mode: monorepo            # single | monorepo | polyrepo
  home: .                   # where canonical specs and the workspace constitution live
projects:                   # always a list; a simple repo is one project with path: .
  - { name: api, path: services/api, profile: app }
  - { name: web, path: apps/web, profile: app }
harnesses: [claude, copilot]
presets: []
skillPacks: []
paths: { specs: specs, constitution: docs/constitution, releases: docs/releases }
spec: { id: tracker, branch: "{id}-{slug}" }   # tracker | sequential
models:
  claude: { fast: haiku, standard: sonnet, strong: opus }
commits:
  emoji: { feat: ✨, fix: 🐛, docs: 📝, style: 🎨, refactor: ♻️, test: ✅, chore: 🔧,
           perf: ⚡️, build: 📦️, ci: 👷, revert: ⏪️, breaking: 💥 }
  maxSubjectLength: 72
  trailers: { refs: Refs, task: Mandao-Task, acs: Mandao-AC, quick: Mandao-Quick }
scripts: { runner: npx }    # npx | local
```

Cross-field rules: unique project names and paths, `single` has exactly one project, `polyrepo`
projects cannot sit at the root, paths are relative and never escape the workspace, and every
commit type has a distinct emoji.

## `.mandao/mandao.lock` — resolution, written by the CLI only

Mandao version, config hash, resolved layers, installed skills, and every generated file with its
harness, origin (`command:specify`, `persona:reviewer`, `template:design.md`, `block:mandao`),
ownership (`owned` or `managed-block`) and content hash. See ADR 0003.

## `.mandao/sources.yml` — where business context lives

```yaml
version: 1
tracker: { kind: jira, project: PROJ, mcp: atlassian }  # jira|linear|clickup|monday|github|none
docs: [{ kind: sharepoint, ref: "https://…", mcp: microsoft-365 }]
chat: [{ kind: slack, channels: ["#team-checkout"] }]
design: [{ kind: figma, ref: "https://figma.com/…" }]
transcripts: [{ kind: local, path: docs/transcripts }]
```

## `core/catalog/skills.yml` — curated skills

```yaml
version: 1
skills:
  - id: nestjs-best-practices
    technology: nestjs
    role: primary             # one primary per technology and profile
    description: …
    match: { packages: ["@nestjs/core"], versions: ">=10" }
    profiles: [app]
    source: { type: git, url: https://github.com/…, ref: v1.2.0, path: skills/nestjs }
    version: 1.2.0
    author: …
    license: MIT
    vetted: true              # false → proposed as `unvetted`
    bootstrap: false          # bootstrap skills do not count toward the cap of 10
```

Third-party skills are referenced, never bundled.
