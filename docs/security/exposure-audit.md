# Public exposure audit

Audited at 2026-10-21T02:34:06+00:00, before the beta release.
Repository HEAD: `72f533f5054c3b386bbb70358cfef3176cd199db`. This report records a new audit; it does not assert a pre-push audit occurred.

## Secret scan

- Tool: Gitleaks **8.30.1**, downloaded from its official release; archive SHA-256 checked against
  the release checksum list.
- Ref preparation: `git fetch origin --prune --tags`; the clone is not shallow. The origin fetch
  refspec covers all branches. The remote advertised no pull-request refs at scan time.
- Scope: all locally reachable history after fetching remote branches and tags, including merges.
  Git reports **275 reachable commits**; Gitleaks reports **273 scanned commits** with merge diffs
  enabled (21.34 MB of scanned patch data).
- Command: `gitleaks git . --log-opts="--all --full-history -m" --redact=100 --no-banner --report-format=json`.
- Result: **exit 0, zero findings**. A second `gitleaks dir . --redact=100` scan of current files
  also returned exit 0 and zero findings. No custom Gitleaks ignore file is tracked.
- Reports are empty finding arrays. No credentials or credential values are included in this report.

This is a pattern-based scan of reachable Git content and current files, not proof that a credential
could never have been exposed. Deleted unreachable commits and other people's clones are outside
its scope. No public history was rewritten, and no credentials were used or tested against providers.

## Paths and personal information

Reviewed the **275 tracked files** under `specs/`, `docs/` and `.mandao/`, plus a search including
hidden working-tree files. Found seven lines with machine-specific absolute paths, in five files:

| File under `specs/MDO-0007-catch-every-way-a-test-can-climb-out-of-its-work/` | Lines | Proposed replacement |
|---|---|---|
| `_log/premises/P1.md` | 3 | Replace the workspace root with `<worktree>` and the probe folder with `<probe-dir>` |
| `_log/premises/P2.md` | 3 | Replace the probe folder with `<probe-dir>` |
| `_log/premises/P3.md` | 3 | Replace the workspace root with `<worktree>` and the probe folder with `<probe-dir>` |
| `_log/gates/T1-1.md` | 47, 67 | Replace the workspace root with `<worktree>` |
| `_log/gates/T2-1.md` | 47, 67 | Replace the workspace root with `<worktree>` |

`_log/approvals.yml` in the same spec contains the maintainer's name in two approval records
(lines 4 and 8). This is attribution, not a secret. Prefer retaining it for accountability; if the
maintainer wants pseudonymization, use the public GitHub handle with an explicit correction note.

No machine-specific absolute path was found in `docs/` or `.mandao/`. The email-shaped match in
`docs/schemas.md:21` is a sample SSH Git URL, not a personal email address. Public owner handles and
repository URLs are intentional metadata. Outside these three directories, the code-of-conduct
contact email was explicitly approved by the maintainer for publication.

## Proposed new commits

1. `📝 docs(security): redact machine paths from MDO-0007 evidence`
   Replace only the seven path-bearing lines above, retain commands, filenames, timestamps and
   verdicts, and record that the evidence was sanitized after publication. Use an explicit
   correction mechanism so the `_log/` integrity checks remain meaningful; do not silently edit
   script-owned evidence or fabricate a new approval. This correction is **proposed, not applied**.
2. `🐛 fix(logging): sanitize machine paths in persisted evidence`
   After agreeing on scope in an issue, normalize machine paths before future gate/probe output is
   persisted, with regression tests showing that verdicts and useful diagnostics are preserved.
   This prevention work is **proposed, not implemented**.

Removing paths in a new commit improves the current tree; earlier public commits remain available.
Rotation would be the first action for a real secret finding. This audit found none.
