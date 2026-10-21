---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
audience: developers
language: en
---

# Technical notes — Recommend each command's skills at init

`init` now lists the four skills the commands use: graphify, software-architect,
product-manager-toolkit and brainstorming. It installs only the ones the person selects. A `git`
source is copied at its pinned commit into each harness's skills folder, with its scripts left out
unless the person passes `--with-scripts`. `doctor` names the commands that lose a missing skill.
Before you start, know that the catalog schema now requires a 40-hex `commit` on every `git` source.

## What was built

| Commit | Task | Module | What |
|---|---|---|---|
| `62e39f9` | T1 | Content, Schemas, Skills | `commandSkills(catalog)` (`src/skills/command-skills.ts`): bootstrap ∩ `binding: core` ∩ not bundled ∩ `phases`. `git` sources need `commit`; `fallback` on the four core skills; optional lock `commit`. product-manager-toolkit and brainstorming move from `plugin` to pinned `git` sources. Guidance paragraph in `core/commands/story.md` and `specify.md`, for every harness. |
| `e777726` | T2 | CLI, Skills, Writer, Schemas | `offerSkills` in `src/cli/init-skills.ts`, after sync: lists the skills, then a multiselect with nothing selected. `--yes` only lists. `installAndPin` is shared with `skills add`. `src/skills/git-copy.ts`: fetch the tag, check `rev-parse` against `commit`, copy into `skillFolders(harnesses)`, never overwrite, leave scripts out unless `--with-scripts`, remove the temp clone. `copyNewFile` and `makeScratchDir` in `src/writer/files.ts`. Lock `scripts`. `--with-scripts` on `init` and `skills add`. `writeInitFiles` moved to `src/cli/init-files.ts`. |
| `aadc1b9` | T3 | Engine, Skills | `skillFindings` in `src/engine/doctor-skills.ts`, wired in `runDoctor` through `catalogFindings`: `warn` for a pinned skill that is gone, `info` for one never installed, with harnesses, commands, fallback and the `mandao skills add <id>` fix. `readableSkillFolders(harness)` in `src/skills/install.ts`. |

**Security of the git copy:**
- git runs from an argument array, with `--` before the URL.
- `protocol.ext.allow=never`; only `https`, `http`, `ssh`, `git` and `file` URLs are accepted.
- A 120-second timeout per call, and `GIT_SSH_COMMAND='ssh -o BatchMode=yes'`.
- The path must be relative, cannot contain `..` and cannot start with `-`, and it must resolve inside the clone.
- Symlinks are skipped; files are copied with `COPYFILE_EXCL`.
- A copy error returns `failed` and removes only the targets this call created.
- When every target already exists, the result is `pending`: "not verified", left as is and not pinned.

## Decisions and pivots

- No pivots. Each task failed review once and passed on attempt 2; the reasons are in `_log/execution.md`.
- **Approval:** an earlier session recorded the spec approval by inference. The maintainer approved
  explicitly at 03:54:15Z (`_log/approvals.yml`), and work continued from T1's review.
- **Deviations accepted at review:**
  - `REPORTED_AS_TOOLS = ['graphify']` in `doctor-skills.ts` duplicates `OPTIONAL_TOOLS`.
  - The `brainstorming` "local server" warning is a constant in `git-copy.ts`, not a catalog field.
  - `doctor-skills.ts` takes no injectable runner (D4), only the filesystem (CC-5).

## Contract changes

- **Catalog** (`src/schemas/catalog.ts`): `source.type: git` requires `commit` (40 hex); new optional `fallback`.
- **Lock** (`src/schemas/lock.ts`): optional `commit` (40 hex) and `scripts` on a skill entry.
- **CLI:** `mandao init --with-scripts` and `mandao skills add --with-scripts`. `init` asks a new
  skills question after sync; `init --yes` prints the list and `mandao skills add <ids>`.
- **`mandao doctor`:** new findings `<id> is missing: <commands> lose it (<fallback>); not found for <harnesses>`.
- `docs/schemas.md` and `docs/cli.md` document all of the above.

## Diagram and drift

`mandao run diagram-drift MDO-0009` reports: "design.md has no diagram with a structured graph". The
spec has no approved diagram, so drift could not be derived.

Structural change seen in the commits: a new dependency, Engine → Skills (`doctor-skills.ts` imports
`commandSkills` and `readableSkillFolders`). This is the first time `src/engine` imports `src/skills`.
D4 designs it; the constitution proposal below records it in `architecture.md`.

## How to test

- Unit tests: `npx vitest run test/unit/command-skills.test.ts test/unit/skills.test.ts test/unit/git-copy.test.ts test/unit/doctor-skills.test.ts test/unit/content.test.ts`.
- Integration tests: `npx vitest run test/integration/init-skills.test.ts test/integration/engine.test.ts`.
- By hand: follow `specs/MDO-0009-…/quickstart.md`, which needs network access to GitHub for step 2.

## Open items

- **`mandao run commit` drops reviewed files outside the task's `files`.** T2 had to be amended. See
  Kaizen [L1](../../kaizen/MDO-0009.md#l1).
- **The `test` gate is labelled NOT_INSTALLED when a passing run prints "command not found".** One
  test's output does this on purpose (`src/scripts/gates.ts`).
- **The Kaizen `reducedIndependence` metric** reports 0 although T2's log rows record reduced independence.
- **Gaps the Reviewers left open:**
  - no test for undoing a half-written copy;
  - no direct test of `readableSkillFolders` for OpenCode or Copilot;
  - no command-line test of `skills add --with-scripts`;
  - no test that `runDoctor` emits exactly one graphify finding;
  - home skills folders are assumed (CC-7);
  - `.opencode/skills` is not checked.
- **Security:**
  - `http:` and `file:` are still in the URL allow-list.
  - `GIT_SSH_COMMAND` replaces a person's own ssh command.
  - secrets (gitleaks) and SAST (semgrep) are not installed, so they never ran.
- **Consistency findings** CC-5, CC-6 and CC-7 are in `verify-report.md`.

## Links

- Spec, story and quickstart: `specs/MDO-0009-recommend-each-command-s-skills-at-init-and-use/`.
- Verify report: `specs/MDO-0009-…/verify-report.md`.
- Kaizen: `docs/kaizen/MDO-0009.md`.

## Evidence

- Commits found by the trailers `Refs: MDO-0009` and `Mandao-Task: T1|T2|T3`: `62e39f9`, `e777726`, `aadc1b9`.
- `release-status`: AC-1 to AC-5 met.
- Verify: 523 unit tests and 45 e2e tests passed, plus a smoke test of the built `dist/cli.js` (`verify-report.md`).
- Close sync: `node dist/cli.js sync` updated 7 generated files; the next dry run showed 133 unchanged.
