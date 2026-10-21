---
schema_version: 1
spec: MDO-0009-recommend-each-command-s-skills-at-init-and-use
audience: product owner
language: en
---

# Release notes — Recommend each command's skills at init

When you set up Mandao, it now tells you which skills its commands use, what each one does, and where
it comes from. It installs only the ones you pick. Every coding assistant you set up gets the same
skills, and the health check tells you which command works with less help when one is missing.

| Criterion | Status | What the user gets now |
|---|---|---|
| AC-1 | met | Setup lists the four skills with what they do, their source, their version and the commands that use them. Nothing is preselected, and nothing is installed until you choose. A skill you choose is copied at a checked version. Its scripts are left out unless you ask for them. |
| AC-2 | met | Setup without questions only lists the skills and the command to add them later. It installs nothing. |
| AC-3 | met | The same skills are offered for every assistant. A skill that cannot be installed never stops setup; you are told the manual step. |
| AC-4 | met | The story and specify commands say when each skill helps. Without it, they follow their own steps and note which skill was missing. |
| AC-5 | met | The health check names the commands that lose a missing skill and how to add it. A fresh setup shows this as information, not as a warning. |

## Not done yet

Nothing in this story's scope.

## Known limits

- Installing a skill needs `git` and network access. Without them, the skill is reported as pending,
  with the step to finish it by hand.
- If a skill's folder already exists, Mandao leaves it alone and does not record it as verified.
- A skill's own scripts are third-party code. They are copied only when you ask for them.
