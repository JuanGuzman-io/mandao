VERDICT: PASS

I found no blocking issues. One thing needs a fix anyway: the ADR reference in the new comment is wrong (finding 1).

Review of T7 / MDO-0011, attempt 1 ("Drift says 'not applicable' for lite specs"). I read the pack, the design decisions D1 and D7 in `specs/MDO-0011-one-fixed-layout-for-every-spec-folder/design.md`, ADRs 0026 and 0041, `src/scripts/spec.ts`, `src/spec/layout.ts`, `test/integration/close.test.ts` and the MDO-0001 fixture. Test status comes only from the gate table in the pack: format, lint, typecheck, test, build and metrics PASS; secrets and sast NOT_INSTALLED; audit SKIPPED. I ran nothing myself.

## Blocking findings
None.

## Spec conformance
- **AC-6 / S-6.1:** met. `src/cli/run-diagram.ts:105-109` returns `{ applicable: false, reason: 'lite specs have no diagram' }` with exit 0. It returns before reading `design.md`, so it writes no `implemented.graph.json`. This matches D7 ("returns … and exits 0 when the depth is lite"). The test at `test/integration/close-drift.test.ts` (S-6.1) checks the exit code, the exact payload and that no implemented graph exists, so it is meaningful.
- **AC-6/C1 / S-6.2 / S-6.2/C1:** met. The standard path is unchanged: the stamp check and the error are as before. S-6.2 checks the drift payload; S-6.2/C1 checks the "no diagram with a structured graph" error. Both pin existing behaviour, which is consistent with red showing only S-6.1 failing.
- **How lite is decided (your question):** reading `readLayout(spec.dir).depth` is correct. D7 says "when the depth is lite". D1 defines depth as the `depth:` frontmatter of `spec.md` / `requirements.md` / `design.md`, falling back to lite when `spec.md` exists (`src/spec/layout.ts:143-150`). D1 explicitly replaces the old "lite means spec.md exists" rule, so using `SpecFolder.lite` would have contradicted the design.
- **TDD:** `loop.tdd.red` is true with red evidence, so it is satisfied. `redTests.changed` lists `close.test.ts`; see the next section.

## The changed existing test (`test/integration/close.test.ts:85-87`)
This is correct and does not weaken anything. The fixture's `requirements.md:4` says `depth: lite`, but the test also writes a `design.md` with `depth: standard`, a proposed graph and a stamp, so it is a standard spec. Under D1, `depthOf` checks `requirements.md` before `design.md`, so before this change the fixture would have resolved to lite: the fixture contradicted itself. The edit only makes the two documents agree. No assertion changed: drift, missingNodes, addedNodes, the implemented path and the built node ids are all still checked (`:121-129`). The standard path is still fully exercised, which is what AC-6/C1 asks for.

## Advisories
1. [core/low] **The ADR reference in the comment is wrong** (`src/cli/run-diagram.ts:105`, "(ADR 0026, D7)"). `docs/decisions/0026-verify-and-close.md` has no numbered decisions; its "Diagram drift" section (`:28-34`) does not mention lite. D7 is a decision of MDO-0011's `design.md:109-114`. The layout ADR, `docs/decisions/0041-spec-folder-layout-v2.md`, does not mention drift either. The rule against inventing rules ("Never invent rules: if a rule is not written down…", reviewer persona) is the reason a citation should point at the text that actually holds the rule. Advisory, because standards.md does not make comment citations blocking. Fix: change it to "(MDO-0011 design D7)", or to "(design D7)" like the other D-references in this spec's code.
2. [core/low] **The task's verify command no longer covers the AC.** `verify` in the brief and the checkpoint in `tasks.md:54` run only `npx vitest run test/integration/close.test.ts`. The S-6.x tests now live in `test/integration/close-drift.test.ts`, so that checkpoint "confirms AC-6" without running them. The full `npm test` gate did pass, which includes the new file. Fix: point the T7 verify and the checkpoint at `test/integration/close-drift.test.ts`, or at both files.
3. [core/low] **A new file outside the task's list.** Moving the tests to `close-drift.test.ts` to stay under the 350-line limit is reasonable, and the diff shows nothing else added to `close.test.ts`. Record the deviation in the execution notes, and stage the file before `mandao run commit`, since commit stages only the task's files.
4. [core/low] **A new way for drift to fail.** `diagram-drift` now calls `readLayout` for every spec, which throws when the story's `schema_version` is not 1 or 2 (`src/spec/layout.ts:154-155`). Valid specs are not affected. The only change is that a malformed story now fails with the layout error instead of reaching the stamp check. No action needed beyond being aware of it.
5. [core/low] **Docs do not mention the lite case.** The close command text (`core/commands/close.md:96` and its rendered copies) still describes drift only as deriving `implemented.graph.json`. T5 and T6 own `core/commands/close.md`, so this is not T7's scope; consider adding a line there saying lite reports "not applicable".
6. [security/low] **Security scans did not run.** secrets (gitleaks) and sast (semgrep) are NOT_INSTALLED, so neither ran. The task has no risk tags and the change has no security surface; this is noted only so nobody counts those scans as having run.

## Module boundaries and guides
- The CLI calls `readLayout`, the public helper exported from `src/scripts/spec.ts`. No module's internals are reached into, and `architecture.md` is not violated.
- `src/cli/` has no AGENTS.md. Nothing in `src/spec/AGENTS.md` needs updating for this change; its "Lite is `spec.md` existing" line is about `next.ts`, which this task did not touch.

VERDICT: PASS
