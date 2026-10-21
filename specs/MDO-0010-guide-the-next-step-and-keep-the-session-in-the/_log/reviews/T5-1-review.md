VERDICT: FAIL

I'm failing this on one blocking finding: the `mandao-scans: none` marker in `test/unit/next.test.ts` is wrong. The marker is one line to fix. The rest of T5 matches the task text, D1 and FR-1, and the other findings are advisory.

Scope: spec MDO-0010, task T5, attempt 1, risk tag public-api. The only active lens is security.

What I relied on:
- **Tests:** the Leader's verify output (`/private/tmp/claude-501/-Users-jguzman-orca-projects-mandao-worktrees-MDO-0010-guide-the-next-step-and-keep-the-session-in-the/2eec1cdd-b9c5-47e8-9c10-c3a47923de8f/scratchpad/verify-t5-1.txt`) shows 50 of 50 tests passing in `test/unit/next.test.ts` and `test/integration/approve.test.ts`.
- **Gates:** the pack reports scan-markers, format, lint, typecheck, test, build and metrics as PASS.
- **Not run:** secrets and sast were NOT_INSTALLED (exit 127) and audit was SKIPPED. I make no claim about them.
- **Red evidence:** `loop.tdd.required` is false and T5 declares no scenarios, so no red row is needed. The implementer's claim that each new test failed first is not backed by output in the pack. I take it as unverified, and it does not block.

## Findings

[core/medium] **Blocking.** The `mandao-scans:` marker in `test/unit/next.test.ts` is inaccurate.
- **Where:** line 1 reads `// mandao-scans: none — reads one named spec folder, lists nothing.`
- **What the test actually does:**
  - "MDO-0010 itself" calls `readdirSync(specs)` on the real `specs/` folder and reads `specs/MDO-0010-*`.
  - The consistency-check describe reads `core/templates/shared/rules/consistency-check.md` by path.
  - So the comment's own claim "lists nothing" is false.
- **Rule broken:** `core/templates/shared/rules/test-policy.md` lines 71-73: "Tests that scan the tree by path ... Mark them with a first-line comment `mandao-scans: <folder>/ …`; impact selection runs them whenever a file under one of those folders changes. A test that lists only its own temporary folders says `mandao-scans: none`."
- **Effect:** `findScanners` (`src/scripts/impact.ts:58-66`) only keeps tokens containing `/`, so `none` means impact selection never reruns this test when the rule file or the MDO-0010 folder changes. That defeats the T5 requirement "a test pins the code to the statuses it names" for future rule-only edits; only the full CI suite would catch drift.
- **Fix:** declare what it reads, e.g. `// mandao-scans: core/templates/shared/rules/ specs/ — reads the consistency-check rule and the MDO-0010 spec by path.` A narrower option: drop `readdirSync`, use the exact folder `specs/MDO-0010-guide-the-next-step-and-keep-the-session-in-the/`, and list that path.

[core/medium] **Advisory.** `deliveryOf` (`src/cli/approve.ts:145-155`) checks the current `HEAD`, not the spec's branch, and counts a merge into local `<base>` as delivered.
- **What happens:** `[base, origin/base].some(... '--is-ancestor', 'HEAD', b)` returns `merged`, so the answer is `none`, whenever HEAD is contained in local `main`. Three cases:
  - running from the base checkout;
  - running from any branch already in base;
  - merging locally without pushing `main`.
- **Why it matters:** the task asks for "nothing once delivered", and a local-only merge is not delivered. There is no written rule on this, so it is advisory.
- **Fix:** resolve the spec branch with `specBranch(config, branching, {id, slug, type})` and check that branch. Count only `origin/<base>` as merged, or report "merged locally, push the base" for the local-only case.

[core/low] **Advisory.** The `rev-parse --abbrev-ref HEAD` call in `deliveryOf` is not guarded, unlike `gitOk`.
- **When it throws:** for a closed spec outside a git repo, or with an unborn HEAD.
- **Where that hurts:** in `approve`, `nextFor` runs after the approval and commit are written, so a throw there drops the JSON output of a write that already happened.
- **Fix:** guard it, and map failure to `unpushed` or to no `delivery` fact.

[core/low] **Advisory.** The rule text and the code differ slightly on what counts as resolved.
- **Rule text** (`consistency-check.md`): "A row is resolved only when its Status starts with `resolved`".
- **Code:** `/^\W*resolved/i` (`src/spec/next.ts:52`), which also accepts leading markup such as `**resolved**` or `~~resolved`.
- **Fix:** either tighten the regex to `/^resolved/i` or add to the rule that leading formatting is ignored.

[core/low] **Advisory.** The rule ends with "Markers written in backticks or in a fenced block are examples, not open items". Read literally, that also covers the table, but `checkRows` deliberately strips backticks from the Type cell, so a row typed `` `CONFLICT` `` still counts.
- **Judgement:** the code behaviour is right (a row is a finding, read by its cells), but the text should scope the sentence to prose.
- **Fix:** add "Table rows are read by their cells; a backticked Type still counts." Separately, an inline `CONFLICT(...)` whose `resolved` word sits in backticks stays open, because `withoutCode` strips it before the `\bresolved\b` filter. That is a minor edge case worth one line of the same text.

[core/low] **Advisory, public-api.** The `recommended.command` field now carries three kinds of value:
- runnable commands (`/mandao-*`, `mandao ...`);
- free prose (`push the branch`, `open the PR and merge it`);
- a sentinel (`none`) with `options: []`.

Consumers today, checked:
- `run next` and `--shown` (`src/cli/run-spec.ts:110-114`) only print the JSON.
- `approve` embeds it as `next`.
- `core/commands/implement.md:184` relays it ("give it").

None of them breaks on `none` or on prose, so I judge keeping `recommended` required, with `command: 'none'`, as sound for now. FR-1 says "the possible next commands", though, and the delivery entries are not commands.
- **Fix, worth considering before MDO-0012 performs delivery:** add a discriminator (e.g. `kind: 'command' | 'delivery' | 'none'`) or put concrete commands in the field (e.g. `git push -u origin <branch>`).

[core/low] **Advisory.** The "MDO-0010 itself" test is fragile.
- **After this spec is closed:** `nextStep` returns the delivery answer, so `not.toBe('/mandao-clarify')` passes no matter what the marker handling does.
- **If the folder is renamed or archived:** `find(...)!` turns into a TypeError, not a clear failure.
- **Fix:** assert `folder` is defined, and consider pinning the test to the folder as it is at T5 time.

[security/low] **Advisory, no issue found.** Every git call uses `execFileSync` with an argument array and no shell. The branch and base names come from git and config. The calls (`rev-parse`, `merge-base --is-ancestor`) are read-only and nothing fetches or pushes, so the "naming performs nothing (MDO-0012)" boundary holds. A missing remote or base makes `gitOk` return false, which falls through to `pushed` or `unpushed` as intended. The remote refs can be stale until the next fetch; that is acceptable for a read-only hint.

## Leader's questions, answered

- **`none` and its consumers:** handled. See the public-api finding above.
- **Delivery from git:** it stays read-only, handles a missing remote or base, and only names the step. It has the HEAD and local-merge accuracy gap above.
- **Backticked Type cell vs the rule text:** the code is defensible, but the rule text should say so. See the low finding.
- **`mandao-scans: none`:** not accurate. This is the blocking finding.

## Conformance, for the record

- **Markers in code (D1/FR-1):** markers inside code spans and fenced blocks are ignored, and real ones still count. Covered for all three markers and for pending decisions.
- **Failed verify:** `verdict: blocked` leads to `/mandao-implement`.
- **Closed specs:** a closed spec never recommends or offers story or clarify, whatever markers remain.
- **Rule and pinning test:** the rule states the row shape and the resolution rules, and a test derives the statuses from the rule text.
- **Purity:** `nextStep` stays pure, with IO in `nextFor`.
- **AGENTS.md:** `src/spec/AGENTS.md` is updated.
- **Generated files:** `.mandao/templates/app/rules/consistency-check.md` matches core byte for byte (same blob `e252911`). The lock and diagram hash changes match the edited sources.

Model identity: Opus 5.5 (claude-opus-5-5).

VERDICT: FAIL
