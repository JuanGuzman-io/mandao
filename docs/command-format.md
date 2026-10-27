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
summary: "Requirements, design and a diagram for your approval"   # one short line for the README and guide tables
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
    description: How much to write before the tasks
    flag: true                # typed as --depth
    value: "lite|standard|full"   # shown as --depth <lite|standard|full>
    default: standard
examples:                   # real invocations: the command page, the guide and the README show them
  - { run: "/mandao-specify MDO-0003 --depth lite", does: "a small spec and its tasks in one session" }
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
| `summary` | no | At most 110 characters; the README's and the guide's command tables use it. |
| `status` | yes | A `stub` declares its contract but is not implemented yet. |
| `flow` | no | Used by the diagrams and the `AGENTS.md` flow summary. The next command comes from the spec's state (`mandao run next`). |
| `profiles` | no | Defaults to every profile. |
| `arguments` | no | Order matters among the positional ones. A `flag` is typed `--kebab-name` (with `value`, `--name <value>`), has no position, and the body names it as written instead of `{{arg:x}}` (refused). A positional `value` lists its values. One syntax everywhere: hints, pages, the guide, the README (phase 19). |
| `examples` | no | `{ run, does }` pairs. A stable command with arguments needs at least one; a test checks that each uses only declared flags. |
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
| `{{harness}}` | The id of the harness the file is rendered for (`claude`, `codex`, …), for `--harness`. Shared templates are not rendered per harness and list the ids instead. |
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
| `{{harness}}` | `claude` | `copilot` |

## Conditional blocks

```markdown
<!-- mandao:if profile=ai -->
Only rendered when at least one project uses the `ai` profile.
<!-- mandao:endif -->
```

Supported conditions:

- `profile=<app|ai|data>`: true when any project in the workspace uses that profile.
- `harness=<id>`: true when rendering for that harness. The `.agents/skills` files are shared by Codex and Antigravity and are rendered once, with Codex as the harness when both are active: keep them neutral, and read per-harness facts from a script output (e.g. the `resume` field of `mandao run where`).
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
