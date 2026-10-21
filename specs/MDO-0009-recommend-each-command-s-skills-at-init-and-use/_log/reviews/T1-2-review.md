# Review: MDO-0009 T1, attempt 2

All six attempt-1 findings are fixed, the impacted tests pass, and no blocking issue remains.

## Attempt-1 findings

1. harnesses field and harness filter (D1): fixed. No `harnesses` in the catalog schema, skills.yml, docs/schemas.md or commandSkills; `commandSkills(catalog: Catalog)`. No `harness=claude`, `(Claude Code)` or `S-5.2` in touched files. The D1 test checks the schema strips an injected `harnesses` key.
2. S-1.2 test asserted the opposite: fixed. Asserts the same four skills (FOUR), each with commands; `commandSkills.length === 1`, so the result cannot vary by harness (FR-1).
3. Claude-only conditional and missing hand-off (D5): fixed. story.md and specify.md carry a plain paragraph: when to use brainstorming and product-manager-toolkit, the superpowers:writing-plans hand-off ("which is not installed"), the missing-skill steps. content.test.ts checks S-5.1 and S-5.1/C1 over all five harnesses with the no-leftover `{{`/`mandao:if` check.
4. D3/D1 catalog and schema: fixed. brainstorming and product-manager-toolkit are git sources with D3 commits (bb92a777…, 437f321c…), software-architect has b04e03f5…; the catalog schema requires a 40-hex commit on every git source; the lock skill entry has an optional 40-hex commit; fallback optional in schema and present on the four core skills; specify added to both skills' phases; docs/schemas.md updated.
5. commandSkills ignored bootstrap: fixed. Reads catalog.bootstrap, keeps binding core and not bundled; synthetic-catalog test covers a core skill outside bootstrap.
6. Red test changed after RED: accepted. Filter narrowed to /mandao-(story|specify).*\.md$/ is a test-defect fix (codex agents/openai.yaml is a policy file); S-5.1 keeps a files.length >= 2 guard. Biome autofixes do not change what is checked. No assertion weakened. RED evidence exists for attempt 2. ASSUMPTION: RED-time content matched the Leader's description apart from those two changes.

## Spec conformance

S-1.1 and S-1.1/C1 met (mandao-skills dropped as bundled; C1 test confirms excluded kinds exist). S-1.2 met at this layer; init-level offer is a later task. S-5.1 and S-5.1/C1 met for both commands on all five harnesses. AC-3/D3 met within T1 scope. Gates: format, lint, typecheck, build, metrics PASS; test gate labelled NOT_INSTALLED but log shows 57 files / 486 tests passed; secrets and sast NOT_INSTALLED, audit SKIPPED.

## Findings

[core/low] Paragraph placement: story.md line 32 and specify.md line 70 are in the preamble, before `## 1.`; D5 says story.md §2 and specify.md §3. Advisory: move it or amend D5.

[core/low] The paragraph's middle line runs past the surrounding wrap in story.md (32-34) and specify.md (70-72). Advisory: rewrap.

[core/low] The S-1.2 test checks arity rather than computing the set for [codex, opencode, copilot, antigravity]. Advisory: cover S-1.2 again at the init level when init-skills lands.

[core/low] The S-5.1/C1 test has no files.length guard of its own. Advisory: add expect(files.length).toBeGreaterThanOrEqual(2).

[core/low] _log/progress.yml red_tests still lists attempt-1 test names that no longer exist. Advisory: check whether mandao run should replace the list on a new RED.

[security] No findings. Pinning git sources to commits tightens supply-chain control; URLs are https. secrets and sast gates not run.

Module docs: nothing to update. Boundaries: command-skills.ts imports only the Catalog type from ../schemas/index.js; no violation.

VERDICT: PASS
