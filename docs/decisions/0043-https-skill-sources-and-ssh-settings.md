# 0043 — HTTPS skill sources and SSH settings

**Status:** Accepted · 2026-10-21

## Context

Catalog `git` skill sources accepted local and alternate transports, and the installer replaced a
user's `GIT_SSH_COMMAND` to disable prompts. Skills that provide their own installer also need to
remain distinct from repository copies.

## Decision

- Catalog repository URLs must use HTTPS. Catalog validation and the runtime installer guard enforce
  this, including against mutated or otherwise unvalidated catalog data.
- Git skill copies preserve `GIT_SSH_COMMAND`. When unset, Mandao sets `ssh -o BatchMode=yes`; when
  set, Mandao appends `-o BatchMode=yes` only if no explicit `BatchMode=yes|no` is present. An
  explicit user setting takes precedence.
- Catalog skills with a native installer use their pinned installer; Mandao does not copy a full
  repository as a skill when it has no skill path. Graphify remains installed through its pinned
  `uv`/Graphify commands.

## Consequences

Local git fixture tests rewrite an HTTPS fixture URL to a local repository through a scoped Git
configuration. Users relying on non-HTTPS catalog Git remotes must switch them to HTTPS.
