# Iteration 2b acceptance — Antigravity (experimental), manual in the IDE

Run by a person in the Antigravity IDE. Record each result (✅ / ❌ / note) and the screenshot name in
the last column, then hand the file back. Mandao changes nothing in the main checkout for this run.

## 0. Prepare (terminal)

```sh
git worktree add -b chore/antigravity-acceptance ../mandao.worktrees/antigravity-acceptance
cd ../mandao.worktrees/antigravity-acceptance
npm ci && npm run build
node dist/cli.js harness add antigravity
node dist/cli.js doctor
```

Expected from `doctor`: an `info` line `antigravity is experimental: …`, and a warning that the
antigravity Reviewer has reduced independence (Flash for both roles) with the `pro` suggestion. No
errors. `.agents/skills/mandao-*/SKILL.md` and `.agents/agents/mandao-*.md` exist.

## 1. Checks in the IDE

Open the folder `mandao.worktrees/antigravity-acceptance` (File → Open Folder). Note the Antigravity
version (Help → About) and your plan (Free, Plus, AI Pro, Ultra, Enterprise).

| # | Do | Expected | Result |
|---|---|---|---|
| 1 | Ask the agent: "Which spec-driven workflow does this repository use, and where are its rules?" | It answers from `AGENTS.md`: Mandao, the flow `constitution → … → close`, rules in `docs/constitution/`. | |
| 2 | Type `/` in the agent input | Each `mandao-*` skill appears **exactly once**: clarify, constitution, implement, init, quick, resume, specify, story, tasks. No duplicates, nothing from `.claude/skills`. | |
| 3 | Run `/mandao-resume` | A dashboard of `specs/`: `MDO-0001-list-pinned-skills` with no task in progress, and the next mandao. | |
| 4 | Run `/mandao-resume MDO-0001` | Note whether `MDO-0001` reaches the skill (Antigravity does not document skill arguments). Either it continues that spec, or it asks which spec — both acceptable; record which. | |
| 5 | Open the subagents list (Agent Manager / subagents) | `mandao-leader`, `mandao-implementer`, `mandao-reviewer`, `mandao-tester` are listed with model tier `flash`. | |
| 6 | Ask: "Use the mandao-reviewer subagent to change README.md" | Expected per its prompt: it refuses (it reads, never edits). Mandao cannot enforce this in Antigravity — record what actually happens. | |
| 7 | Ask: "Run `node dist/cli.js run where MDO-0001`" | The agent runs it; JSON says `inWorktree: false` (this worktree is not the spec's). Confirms Mandao scripts run from Antigravity. | |
| 8 | Check the Problems / Rules panel, if shown | No dropped rule warnings (`.agents/rules` is not used by Mandao). | |

## 2. Clean up

```sh
cd ../../mandao
git worktree remove ../mandao.worktrees/antigravity-acceptance
git branch -D chore/antigravity-acceptance
```

## 3. Report

Version, plan, the table above, and anything that surprised you. Rows 4 and 6 decide whether the
adapter can lose its experimental mark.
