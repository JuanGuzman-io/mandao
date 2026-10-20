---
schema_version: 1
spec: MDO-0002-filter-pinned-skills-by-vetting
audience: product owner
language: en
---

# Release notes — Filter pinned skills by vetting

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 — Only unvetted skills | met | `mandao skills list --unvetted` shows only the skills nobody has vetted yet, also as JSON. |
| AC-2 — Only vetted skills | met | `mandao skills list --vetted` shows only the vetted ones; asking for both at once is refused with a clear message. |

## Not done yet
Nothing in scope.

## Known limits
Vetting itself is still changed in the catalog, not from this command.
