---
schema_version: 1
entries: []
---

# Research

One entry per `[NEEDS RESEARCH]` question. Use the configured expiry for its topic type. Cite the source
for each claim, including URL, access date, source tier (`official`, `manufacturer`, `technical`) and the
value it supports. Check version and API claims directly against official or manufacturer documentation.
If sources disagree, list every conflicting value and record the resolution. Reused evidence must set
`reused_from` to the earlier spec and entry; only current, resolved, exact-topic evidence may be reused.

For a question that cannot be verified on the web, record a claim with no sources and state
`unverified (model knowledge)`. This evidence must not support a high-impact decision: architecture, data,
security, public contracts, or a decision linked to a High premise.

Each entry records its question, status (`open` or `resolved`), decision, rationale, alternatives,
premise IDs, `checked_on`, `expires`, claims, and any contradictions. Keep the YAML frontmatter valid.

Example entry shape (copy into the `entries` frontmatter list and replace every value):

```yaml
- id: R1
  topic: "Auth.js sessions"
  topic_type: api
  question: "Which session API does this project use?"
  status: resolved
  decision: "Use the documented API."
  rationale: "The official API documentation matches the pinned version."
  alternatives: ["Keep the legacy API"]
  premise_ids: []
  checked_on: "2026-10-22"
  expires: "2027-04-22"
  claims:
    - id: C1
      key: "session API"
      kind: api
      value: "current API"
      sources:
        - tier: official
          url: "https://example.invalid/docs"
          checked_on: "2026-10-22"
          value: "current API"
  contradictions: []
  # reused_from: "specs/MDO-0001-example/research.md#R1" # only when this entry reuses evidence
```
