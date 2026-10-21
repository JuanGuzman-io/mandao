VERDICT: PASS

I'm passing T5 attempt 2. The one blocking finding from attempt 1 (the wrong scans marker) is fixed, and so are the advisories you asked the implementer to address. Every "Done when" item in the T5 task text is met. Four advisories remain, none blocking.

What I relied on:
- **Tests:** your verbose verify output, `/private/tmp/claude-501/-Users-jguzman-orca-projects-mandao-worktrees-MDO-0010-guide-the-next-step-and-keep-the-session-in-the/2eec1cdd-b9c5-47e8-9c10-c3a47923de8f/scratchpad/verify-t5-2.txt`, shows 53 of 53 passing in `test/unit/next.test.ts` and `test/integration/approve.test.ts`.
- **Gates (from the pack):** scan-markers, format, lint, typecheck, test, build and metrics PASS. Secrets and sast were NOT_INSTALLED (exit 127) and audit was SKIPPED, so I make no claim about them.
- **TDD:** `loop.tdd.required` is false. The brief records `red: true` and `redTests.changed` is empty, so there are no weakened red tests to judge. You report 4 failed before the code; that output is not in the pack, so I take it as recorded but have not seen it.

## Attempt-1 findings, rechecked
- **Scans marker (was blocking): fixed.** Line 1 now reads `// mandao-scans: core/templates/shared/rules/ specs/ — ...`. Both tokens contain `/`, so `findScanners` will select this test when the rule or the spec folders change. This meets `core/templates/shared/rules/test-policy.md` ("Mark them with a first-line comment `mandao-scans: <folder>/ …`").
- **`deliveryOf` checks the wrong branch: fixed.**
  - It now checks the spec's own branch from `expectedPlace`, verified first with a guarded `rev-parse --verify --quiet refs/heads/<branch>`.
  - Only `origin/<base>` counts as merged.
  - The integration test "read from the spec branch, not from the checked-out one" would have failed on the old HEAD-based code, so it is meaningful.
  - The local-only merge case (`git branch main` with no push) is asserted to stay not delivered.
- **Unguarded `rev-parse`: fixed.** It now goes through `gitOk`, and a failure gives no delivery fact.
- **`resolved` regex: fixed.** It is now `/^resolved/i`, matching "starts with `resolved`". A test pins `**resolved**` as open, along with the rule text.
- **Backtick exemption in the rule: fixed.** It is now scoped to prose: "Table rows are read by their cells; a backticked Type still counts", plus the inline `CONFLICT` "resolved word in backticks does not count" edge case. The code agrees: `withoutCode` runs before the `\bresolved\b` filter.
- **MDO-0010 test: fixed.** It now asserts the folder exists, with a message, before using it.
- **`kind` discriminator on `recommended`:** deliberately deferred to MDO-0012. That is acceptable, since no written rule requires it now.

## Conformance (T5 "Done when", D1/D6, AC-1/C1, AC-5/C1)
- **Markers in code:** all three markers and pending decisions are ignored in inline code and fenced blocks, and still count in prose.
- **MDO-0010 itself:** it does not recommend clarify.
- **Failed verify:** `verdict: blocked` leads to `/mandao-implement`, covered by unit and integration tests.
- **Closed spec:** the outcome is push, PR and merge, or `none` with no options. It never offers story or clarify, whatever markers remain.
- **Rule and code agree:** the rule states the row shape and the statuses, and a test reads the statuses from the rule text.
- **Read only:** `nextStep` stays pure. `nextFor` and `deliveryOf` only read, and "run next on a closed spec writes nothing" is asserted.
- **AGENTS.md:** `src/spec/AGENTS.md` reflects the change, including the branch, `origin/<base>` and no-fact behaviour.
- **Generated copies:** `.mandao/templates/app/rules/consistency-check.md` matches the core diff. The lock and diagram hashes changed only for the edited sources.
- **Module boundaries:** respected. `approve.ts` uses the public `expectedPlace`, `branchingFor` and `repoRoot`.

## Findings
[core/low] Advisory. A closed spec with no delivery fact is told to push, which can be wrong once it has been delivered.
- **Where:** `delivery()` in `src/spec/next.ts` returns `push the branch` whenever `facts.delivery` is not `pushed` or `merged`, which includes undefined.
- **Cases where this misleads:**
  - The local branch was deleted after a merge, so `deliveryOf` returns undefined.
  - The PR was squash-merged, so the branch is never an ancestor of `origin/<base>`. That gives `unpushed` once the remote branch is gone, or `pushed` forever.
- **Rule:** the T5 text asks for "nothing once delivered". `src/spec/AGENTS.md` says "without git or the branch there is no delivery fact", but the next step then still names push.
- **Remediation:** for undefined, say the delivery state is unknown rather than recommending push. Treat squash merges in MDO-0012.

[core/low] Advisory. The branch name and the base can come from different project scopes.
- **Where:** `deliveryOf` resolves the base with `branchingFor(config, spec.story?.meta.projects[0])`, but `expectedPlace` builds the branch name from `branchingFor(config)` with no project.
- **When it matters:** in a multi-project config with per-project branching, the two can disagree.
- **Remediation:** use one scope for both.

[core/low] Advisory. One failure path in `deliveryOf` is not guarded.
- **Where:** `repoRoot(spec.dir)` in `deliveryOf` is not wrapped in `gitOk`, so it throws outside a git repo.
- **Why it is low:** `nextFor` already calls `commitState`, which needs git, so this is not a new failure mode. Still, the docstring says "No fact when ... git is missing".
- **Remediation:** wrap the call, or reword the docstring.
- **Untested:** as you noted, a git failure inside `deliveryOf` is not tested directly.

[security/low] Advisory, no issue found. Git is called through `execFileSync` with an argument array and no shell. The refs come from config and the spec name. The commands (`rev-parse`, `merge-base --is-ancestor`) are read only, and nothing fetches or pushes, so the "naming performs nothing (MDO-0012)" line holds.

Model identity: Opus 5.5 (claude-opus-5-5).

VERDICT: PASS
