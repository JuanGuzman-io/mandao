# Canonical command format

Every Mandao command is one Markdown file in `core/commands/<id>.md` (or in a preset, or in
`.mandao/overrides/commands/`). Adapters turn it into the native format of each harness.

## Frontmatter

```yaml
---
schema_version: 1
id: specify                 # kebab-case, unique; installed as /mandao-<id>
title: Specify
description: Turn an approved story into requirements and design at the chosen depth.
status: stable              # stable | stub
flow:
  after: [story, clarify]   # commands that usually run before
  next: [clarify, tasks]    # commands to recommend afterwards
profiles: [app, ai, data]   # profiles where the command is installed (default: all)
arguments:
  - name: spec
    description: Spec id or path
    required: true
  - name: depth
    description: lite | standard | full
    default: standard
inputs:                     # contract: what the command reads
  - path: "{{paths.specs}}/<spec>/story.md"
    required: true
outputs:                    # contract: what the command writes
  - path: "{{paths.specs}}/<spec>/requirements.md"
capabilities: [read, edit, search, shell]
templates: [requirements.md, design.md]   # templates the body references
scripts: []                 # scripts the body runs via {{script:x}}
approval: required          # none | required: a human approves before anything is applied
scope: project              # project | global | both (default: project)
harness:                    # optional, per-adapter frontmatter passthrough
  claude: { disable-model-invocation: true }
---
```

| Field | Required | Notes |
|---|---|---|
| `schema_version` | yes | `1`. |
| `id` | yes | Kebab-case. Must match the file name. |
| `title`, `description` | yes | `description` is shown in every harness command picker. |
| `status` | yes | A `stub` declares its contract but is not implemented yet. |
| `flow` | no | Used by `resume` and by `AGENTS.md` to recommend the next mandao. |
| `profiles` | no | Defaults to every profile. |
| `arguments` | no | Order matters: it is the order of positional arguments. |
| `inputs`, `outputs` | yes | May be empty lists. Paths may use `{{paths.*}}`. |
| `capabilities` | yes | `read`, `edit`, `search`, `shell`, `web`, `mcp`, `agents`. |
| `templates`, `scripts` | no | Every `{{template:x}}` and `{{script:x}}` in the body must be listed here. |
| `approval` | no | Defaults to `none`. |
| `scope` | no | `global` commands are also installed by `mandao init --scope global`. |
| `harness` | no | Merged last into the adapter frontmatter. Use sparingly. |

## Body tokens

The token language is closed. An unknown token fails validation.

| Token | Meaning |
|---|---|
| `{{args}}` | All the arguments the user typed. |
| `{{arg:name}}` | One declared argument. |
| `{{template:x}}` | Path to the resolved template `x`, e.g. `rules/review.md`. Installed per profile under `.mandao/templates/<profile>/`; the path is concrete when the workspace uses one profile. |
| `{{script:x}}` | Shell command that runs the Mandao script `x`. |
| `{{paths.specs}}`, `{{paths.constitution}}`, `{{paths.releases}}` | Configured paths. |
| `{{command:x}}` | How to invoke another mandao in this harness, e.g. `/mandao-tasks`. |
| `{{version}}` | Installed Mandao version. |
| `{{language.business}}`, `{{language.technical}}` | Configured content languages (ADR 0011). |

How each harness renders them:

| Token | Claude Code | GitHub Copilot |
|---|---|---|
| `{{args}}` | `$ARGUMENTS` | one `${input:name:description}` per argument |
| `{{arg:spec}}` | `$spec` (declared in `arguments:`) | `${input:spec:...}` |
| `{{template:x}}` | `.mandao/templates/<profile>/x` | same |
| `{{script:x}}` | `npx -y mandao@<version> run x` | same |
| `{{command:x}}` | `/mandao-x` | `/mandao-x` |

## Conditional blocks

```markdown
<!-- mandao:if profile=ai -->
Only rendered when at least one project uses the `ai` profile.
<!-- mandao:endif -->
```

Supported conditions:

- `profile=<app|ai|data>`: true when any project in the workspace uses that profile.
- `harness=<id>`: true when rendering for that harness.
- `multiProject`: true when the workspace declares more than one project.
- `mode=<single|monorepo|polyrepo>`: the workspace mode.
- Prefix any condition with `!` to negate it.

Blocks may nest. An unclosed or unknown condition fails validation.

## Models

Commands do not pin a model: they run on the session's model. Models belong to roles
(`.mandao/models.yml`, ADR 0011), and personas expand into one agent per role variant.

## Personas

`core/personas/<id>.md` uses the same idea with a smaller frontmatter: `id`, `title`, `description`,
`schema_version`, `capabilities`, optionally `scripts` and `must_differ_from` (another persona whose model must differ).
