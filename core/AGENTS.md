# core/ — Mandao content

Purpose: the product itself (ADR 0001): neutral Markdown and YAML that adapters render per harness.

- `commands/<id>.md`: canonical commands. Format: `docs/command-format.md`. Keep them lean; rules
  belong in `templates/*/rules/` (ADR 0009).
- `personas/`: leader, implementer, reviewer, tester. Adapters expand them per role and tier (ADR 0011).
- `templates/shared/` + profile deltas in `templates/<profile>/`; installed per profile under
  `.mandao/templates/<profile>/`.
- `catalog/skills.yml`: never invent metadata; unverified entries read `UNVERIFIED` and `vetted: false`.
- `models/recommendations.yml`: only from official docs, with `reviewed` date and `sources`.

Gotchas: frontmatter descriptions containing `: ` must be quoted; every `{{template:x}}` / `{{script:x}}`
must be listed in the frontmatter; `test/unit/content.test.ts` renders everything for every profile,
mode and harness.
