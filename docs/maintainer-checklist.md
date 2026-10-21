# Public repository maintainer checklist

Owner: **@JuanGuzman-io**. Apply these settings on GitHub after the CI workflow reaches `main`.
The files in this PR prepare the repository; they do not change hosted settings.

## Merge methods — Settings → General → Pull Requests

- [ ] Enable **Allow merge commits** and **Allow rebase merging**.
- [ ] Disable **Allow squash merging** to preserve per-commit Mandao trailers.
- [ ] Do not squash locally before merging either.

## Protect main — Settings → Rules → Rulesets → New branch ruleset

- [ ] Name: `main`; enforcement: **Active**; target branch: `main` (`refs/heads/main`).
- [ ] Enable **Require a pull request before merging**.
- [ ] Require **1 approval**, **review from Code Owners**, and dismiss stale approvals after changes.
- [ ] Require conversations to be resolved.
- [ ] Enable **Require status checks to pass**, select GitHub Actions as the source, and require the
      branch to be up to date. Select these exact check names after their first PR run:

  | Required check | Job id | Runs |
  |---|---|---|
  | `check (22)` | `check` | lint, typecheck, tests, build, smoke on Node 22 |
  | `check (24)` | `check` | lint, typecheck, tests, build, smoke on Node 24 |
  | `commitlint` | `commitlint` | all commits introduced by the PR |
  | `secrets` | `secrets` | gitleaks |
  | `sast` | `sast` | Semgrep |

- [ ] Add the owner **@JuanGuzman-io** to the bypass path with **For pull requests only**, so the owner
      can merge their own PR (authors cannot approve their own PR). GitHub's ruleset UI uses roles,
      teams or apps rather than an arbitrary individual user: for this personal repository select
      **Repository admin**, and ensure @JuanGuzman-io is its only admin. In an organization use a
      dedicated one-person team instead. Do not grant bypass to all write collaborators.
- [ ] Enable **Block force pushes** and **Restrict deletions**. Keep the bypass limited to PRs;
      an **Always** bypass would also exempt its holder from these protections.
- [ ] Leave **Require linear history** disabled so merge commits remain available.
- [ ] Leave merge queue disabled unless CI is extended to handle `merge_group` events.

## Actions and release

- [ ] Settings → Actions → General: allow fork PR workflows; require approval for outside
      contributors according to your preferred policy. Keep write tokens and secrets unavailable
      to fork PRs; default workflow permissions should be read-only.
- [ ] Confirm a real fork PR reports all five required checks above. PR CI uses `pull_request`,
      read-only contents permission and no secrets; never replace it with `pull_request_target`
      when running contributor code.
- [ ] Keep Release manual. Its job accepts only `workflow_dispatch` on `main` or tags; other branches
      and PR refs are skipped. Main uses Changesets to version/publish; tags publish the checked-out
      package version and must already contain the intended release version.
- [ ] If Changesets creates version PRs, enable **Allow GitHub Actions to create and approve pull
      requests**. Review those PRs with the same required checks; do not squash them.
- [ ] Configure npm trusted publishing as described in [CONTRIBUTING.md](../CONTRIBUTING.md).

References: [GitHub ruleset rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets),
[creating rulesets and bypass permissions](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/creating-rulesets).
