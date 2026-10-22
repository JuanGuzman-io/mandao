---
schema_version: 1
level: workspace
last_reviewed:
security_scanning:
  secrets:
    local: []
    ci: []
    provider: []
    declared:
      local: []
      ci: []
      provider: []
    unknown: []
    checked:
      local: false
      ci: false
      provider: false
  sast:
    local: []
    ci: []
    provider: []
    declared:
      local: []
      ci: []
      provider: []
    unknown: []
    checked:
      local: false
      ci: false
      provider: false
---

# Infrastructure

## Branching
<!-- Model (trunk | feature-branch | gitflow | env-branches), base and PR target, promotion between
environments, production branch, hotfix lane (from → merge to), protected branches, prefixes. Must match
`branching` in .mandao/config.yml (ADR 0023). Mandao never commits or pushes to protected branches and
never automates promotion; it records the environment reached when CI or the tracker reports it. -->

## Environments
## CI/CD
## Security scanning
`security_scanning` in this document's frontmatter records secrets and SAST independently.
`local`, `ci` and `provider` list evidence detected from project gates, CI files and provider APIs;
`declared` uses the same locations for tools the user reports manually and is not presented as
detected evidence. `unknown` names sources that could not be verified. Empty lists mean `none` only
when all corresponding `checked` locations are true; otherwise the state is `unknown`.
## Cloud and services
## Observability
