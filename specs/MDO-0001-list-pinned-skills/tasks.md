---
schema_version: 1
spec: MDO-0001-list-pinned-skills
status: approved
---

# Tasks — List the skills pinned in a workspace

### [x] T1 — Format pinned skills

```yaml
project: mandao
tier: fast
files: [src/cli/skills.ts, test/unit/skills-list.test.ts]
exemplar: src/cli/skills.ts
risk_tags: []
ac: [AC-1, AC-1/C1]
scenarios: [S-1.1, S-1.1/C1]
tests: { unit: [formats pinned skills sorted by id with badge, version and source] }
dod: [npm run check is green]
verify: npx vitest run test/unit/skills-list.test.ts
depends_on: []
parallel_safe: false
```

### [x] T2 — Register `skills list`

```yaml
project: mandao
tier: standard
files: [src/cli/extensions.ts, src/cli/skills.ts, test/integration/cli.test.ts]
exemplar: src/cli/extensions.ts
risk_tags: []
ac: [AC-2, AC-2/C1]
scenarios: [S-2.1, S-2.1/C1]
tests: { unit: [prints the add hint and exits 0 when nothing is pinned] }
dod: [npm run check is green, README CLI table lists skills list]
verify: npx vitest run test/integration/cli.test.ts
depends_on: [T1]
parallel_safe: false
```

### [ ] T3 — `skills list --json`

```yaml
project: mandao
tier: standard
files: [src/cli/extensions.ts, src/cli/skills.ts, test/integration/cli.test.ts]
exemplar: src/cli/run.ts
risk_tags: []
ac: [AC-3]
scenarios: [S-3.1]
tests: { unit: [prints a JSON array of id, version, vetted and source] }
dod: [npm run check is green]
verify: npx vitest run test/integration/cli.test.ts
depends_on: [T2]
parallel_safe: false
```
