# src/skills — catalog installs

Purpose: say how a catalog skill installs, run or copy it after the person confirms, verify it, and
pin it in the lock (`installSkills`, `pinSkills` in `install.ts`; `commandSkills` in `command-skills.ts`).

- `installSkills(ids, catalog, root, home, runner, { harnesses, withScripts, warn })` is the one path
  `mandao skills add` and `init` share (through `installAndPin` in `src/cli/skills.ts`).
- A `ref` that is hex must be the full lowercase 40-hex `commit` (schema; short or uppercase is refused): upstreams
  without tags are fetched with `init` + `fetch --depth 1 --filter=blob:none origin -- <commit>` + checkout
  of `FETCH_HEAD`, sparse as a clone; a tag or branch keeps `clone --branch`. The `HEAD == commit` check applies to both.
- A `git` source is copied, not run (`git-copy.ts`, MDO-0009 D3): shallow sparse clone of `ref` into
  a scratch folder under `os.tmpdir()`, `HEAD` must equal the catalog `commit`, then `path` is copied
  as `<folder>/<id>/` into each folder of `skillFolders(harnesses)`. The scratch folder is removed in
  every outcome. An existing `<folder>/<id>/` is never overwritten. When every target already exists
  (or there is none), nothing is fetched and the skill is `pending` ("already exists, not verified"),
  never pinned with a commit nobody checked. A copy that fails midway removes the targets this call
  created and returns `failed`. Each git call has a timeout and runs ssh in `BatchMode` (no prompt can
  block init); a timeout is `pending`.
- `readableSkillFolders(harness)` is the folder map for detection (`src/engine/doctor-skills.ts`):
  the harness's own folder, plus `.claude/skills` and `.agents/skills` for OpenCode and Copilot.
  Copy targets stay `skillFolders`.
- Scripts (executable bit, script extension, or under `scripts/`) are left out and named unless
  `withScripts`; then `warn` is called before any copy and the lock records `scripts: true`.
- Phase 13: a catalog skill with `install_on: mock-accepted` cannot be bootstrap, in a pack or a technology
  match (schema), so init, doctor, sync and `run fingerprint` never offer it; `mockSkills` (`on-demand.ts`)
  lists it as `node .mandao/bin/mandao.mjs skills add <id> --yes` for `run mock-offer --record accepted`, which installs nothing.
  `model_invocation: false` (git sources only) makes the copy write `disable-model-invocation: true` into each
  SKILL.md (literal edit, BOM and CRLF kept) and, under `.agents/skills`, set `policy.allow_implicit_invocation:
  false` in `agents/openai.yaml` (Codex; an upstream file is merged, not replaced); the lock
  pins the commit only (no file hash), so the edit causes no drift.
- `pending` means the person must act (tool missing, fetch failed: the detail is the manual step);
  `failed` means something was wrong (moved tag, unsafe path, installer error). Neither throws.

Security: catalog repository URLs must use `https:`; `http:`, `file:`, `ssh:` and `git:` are refused
by both catalog validation and the runtime guard. Git runs with an argument array (never a shell
string) and `protocol.ext.allow=never`. It preserves the user's `GIT_SSH_COMMAND`; if unset, it uses
`ssh -o BatchMode=yes`, and if set without an explicit `BatchMode=yes|no`, it appends `BatchMode=yes`.
A user's explicit setting takes precedence. A `path` with
`..`, a leading `-` or an absolute path is refused, the resolved folder must stay inside the clone,
and symlinks are never followed nor copied. Writes go through `src/writer` (`makeScratchDir`,
`copyNewFile`, `removeScratchDir`, ADR 0007).

Gotcha: tests copy from a local tagged repository through a test-scoped Git URL rewrite from an
HTTPS fixture URL to `file://`; this exercises the HTTPS catalog policy without network access.
Fixtures need `uploadpack.allowFilter` for the `--filter=blob:none` clone.
