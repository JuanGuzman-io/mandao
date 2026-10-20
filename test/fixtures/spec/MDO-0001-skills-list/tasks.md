---
schema_version: 1
spec: MDO-0001-skills-list
status: approved
---

# Tasks — List the skills pinned in a workspace

### [x] T1 — Format pinned skills

```yaml
project: mandao
tier: fast
files: [src/cli/skills.ts]
exemplar: src/cli/skills.ts
risk_tags: []
ac: [AC-1, AC-1/C1]
scenarios: [S-1.1, S-1.1/C1]
tests: { unit: [lists pinned skills with version, vetted flag and source] }
dod: [module AGENTS.md updated]
verify: npx vitest run test/unit/skills.test.ts
depends_on: []
parallel_safe: true
```

### [ ] T2 — Register `skills list`

```yaml
project: mandao
tier: standard
files: [src/cli/extensions.ts, src/cli/skills.ts]
exemplar: src/cli/extensions.ts
ac: [AC-2, AC-2/C1]
scenarios: [S-2.1, S-2.1/C1]
tests: { unit: [prints the add hint when nothing is pinned] }
verify: npx vitest run test/integration/cli.test.ts
depends_on: [T1]
```
