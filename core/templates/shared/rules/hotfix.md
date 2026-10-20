---
schema_version: 1
rule: hotfix
---

# Hotfix lane

Loaded by `specify` only with `--hotfix` (ADR 0030).

- The branch starts from `branching.hotfix.from` with the hotfix prefix (`mandao run spec-new … --hotfix`).
- Set `lane: hotfix` and `type: bug` in `story.md`; depth `lite` unless the risk calls for more.
- Say at once where it must be merged back: `branching.hotfix.merge_to`, from `mandao run branching`.
  `close` repeats it as an open item until the user confirms each back-merge.
