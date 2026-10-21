# Review: MDO-0009 T1, attempt 1

The diff is the worktree state left by the stopped run, without the corrections T1 asks for (spec.md "Worktree changes from the stopped run", lines 381-389). The "Keep" items are present; none of the "Change" items were made. Impacted tests pass (55 files, 443 tests) only because the new tests check the behavior C-1 replaced.

## Findings

[core/high] `harnesses` field and harness filtering added, rejected by D1. src/schemas/catalog.ts `harnesses: z.array(harnessId).optional()`; core/catalog/skills.yml lines 51 and 65; docs/schemas.md; src/skills/command-skills.ts filter and parameter. D1: "Rejected: a catalog field naming harnesses"; FR-1: "The set does not depend on the chosen harnesses." Fix: remove everywhere; signature `commandSkills(catalog)`.

[core/high] S-1.2 / AC-3 broken; the S-1.2 test asserts the opposite (codex/opencode get neither product-manager-toolkit nor brainstorming) and uses two harnesses instead of four. S-1.2: "[codex, opencode, copilot, antigravity] ... offers the same four skills as S-1.1." Fix: assert the four non-Claude harnesses give exactly the S-1.1 set.

[core/high] S-5.1 / AC-4 broken: story.md and specify.md wrap the guidance in `<!-- mandao:if harness=claude -->` labelled "(Claude Code)"; the brainstorming hand-off sentence is missing; content.test.ts has an "S-5.2" test the spec does not contain. D5: "no harness conditional". Fix: drop wrapper and label, add the superpowers:writing-plans hand-off sentence, run S-5.1 and S-5.1/C1 over all five harnesses with the no-leftover `{{`/`mandao:if` check.

[core/high] D3/D1 catalog and schema work missing: product-manager-toolkit and brainstorming still `type: plugin`; software-architect has no `commit`; no `fallback`; catalog schema lacks required `commit` on git sources and `fallback`; src/schemas/lock.ts not changed (no lock `commit`). T1 Done when: "The catalog validates with `commit` on every `git` source." Fix: git sources with D3 values (commits bb92a777…, 437f321c…, b04e03f5…), `fallback` on the four core skills, optional `commit` in the lock skill schema, docs/schemas.md updated.

[core/medium] commandSkills ignores FR-1's `bootstrap` condition (reads all catalog.skills). Fix: filter by catalog.bootstrap; unit test with a synthetic catalog holding a core skill outside bootstrap.

[core/high] TDD: red test test/unit/command-skills.test.ts changed after RED and now encodes a rejected decision (persona rule 6). Fix: rewrite tests to the spec and record new RED evidence before implementing.

[core/low] Advisory: S-5.1/C1 regexes /note/i, /missing/i, /own steps/i are checked separately over the whole file; assert a scoped fragment instead.

[security] No security findings. secrets and sast gates NOT_INSTALLED; audit SKIPPED.

Module docs: none required. Boundaries: command-skills.ts imports only schemas/index.js.

VERDICT: FAIL
