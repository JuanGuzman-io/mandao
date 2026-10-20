# 0001 — Content over code

**Status:** Accepted

## Context
Mandao is a methodology first. Spec Kit and AKILI-SPECS both show that the value lives in the prompts,
templates and personas, while the tooling around them tends to grow until it hides the methodology.

## Decision
- Commands, templates, personas and the skill catalog live in `core/` as neutral Markdown and YAML.
- The CLI only installs, resolves layers, transforms content per harness and validates. It never
  contains methodology rules that are not also visible in `core/`.
- Helper logic that commands need at runtime (diff stats, stack fingerprint) is a Node script exposed
  through `mandao run <script>`. There are no duplicated bash and PowerShell scripts.

## Consequences
- A methodology change is a Markdown change, reviewable by non-developers.
- The CLI stays small enough that adding a harness means adding one pure adapter.
