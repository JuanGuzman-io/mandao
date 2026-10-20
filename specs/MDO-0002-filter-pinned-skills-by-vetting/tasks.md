---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
status: approved
---

# Tasks — Filter pinned skills by vetting

### [ ] T1 — Filter `skills list` by vetting

```yaml
project: mandao
tier: standard
files: [src/cli/skills.ts, src/cli/extensions.ts, test/integration/cli.test.ts]
exemplar: src/cli/skills.ts
risk_tags: []
ac: [AC-1, AC-2, AC-2/C1]
scenarios: [S-1.1, S-1.2, S-1.2/C1]
# Free text goes in double quotes: an unquoted comma splits the entry in two.
tests: { unit: ["--unvetted prints only unvetted skills, in text and JSON", "--vetted prints only vetted skills", "--vetted with --unvetted fails with exit code 1"], e2e: [] }
dod: ["npm run check is green"]
verify: npx vitest run test/integration/cli.test.ts
depends_on: []
parallel_safe: false
```
