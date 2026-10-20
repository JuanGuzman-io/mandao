---
schema_version: 1
rule: clean-code
---

# Clean code

Three levels. Only what `standards.md` states is enforced; a generic skill informs judgment but is
not a rule.

1. **Measurable**: level 0 gates with thresholds in `standards.md` (cyclomatic complexity,
   function and file length, duplication, layer-violating imports, dead code). **Blocking.**
2. **Semantic**: core Reviewer. **Blocking only for:**
   - names that contradict `glossary.md`;
   - duplicated business logic;
   - violations of `architecture.md`;
   - swallowed errors;
   - magic numbers in business rules;
   - not following the exemplar file named in the task brief.
3. **Everything else**: advisory, swept as readability / reliability / resilience / risk. Recorded,
   never reopens the loop.

## Scope discipline

No refactors outside the task. Opportunities are reported as advisory and become separate tasks or
quick changes.
