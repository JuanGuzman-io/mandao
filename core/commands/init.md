---
schema_version: 1
id: init
title: Init
description: "Set up Mandao in the current workspace by running the Mandao CLI, then suggest the constitution."
summary: "Sets up Mandao in this repository from inside your agent"
status: stable
flow: { after: [], next: [constitution] }
inputs: []
outputs:
  - { path: .mandao/ }
  - { path: AGENTS.md }
capabilities: [read, shell]
scope: both
---

# /mandao-init

Set up Mandao here. The CLI does the work; this mandao only drives it.

1. Check whether `.mandao/config.yml` exists. If it does, run `npx mandao doctor` instead and report.
2. Run `npx mandao init --scope project` in a terminal the user can interact with. It detects the
   workspace (single, monorepo or polyrepo), asks for harnesses and profiles, and writes `.mandao/`
   and the harness folders. If the terminal is not interactive, show the detected defaults and ask
   the user to confirm before running `npx mandao init --scope project --yes`.
3. Show what was created, then suggest {{command:constitution}} as the next mandao.
