---
id: specify
title: Specify
description: Turn an approved story into requirements and design.
status: stable
flow: { after: [], next: [tasks] }
arguments:
  - name: spec
    description: "Spec id, e.g. PROJ-1-login"
    required: true
  - name: depth
    description: lite | standard | full
    default: standard
inputs:
  - { path: "{{paths.specs}}/<spec>/story.md", required: true }
outputs:
  - { path: "{{paths.specs}}/<spec>/design.md" }
tier: strong
capabilities: [read, search, edit, shell]
templates: [design.md]
scripts: [quick-check]
approval: required
harness:
  claude: { effort: high }
---

# /mandao-specify

Input: {{args}}

Write `{{paths.specs}}/{{arg:spec}}/design.md` from `{{template:design.md}}`.
<!-- mandao:if profile=ai -->
Criteria are eval thresholds.
<!-- mandao:endif -->
<!-- mandao:if multiProject -->
Add a `## Contract` section.
<!-- mandao:endif -->
Run `{{script:quick-check}}` and continue with {{command:tasks}}.
