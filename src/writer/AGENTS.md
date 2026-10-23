# src/writer — the only module that writes generated files

Purpose: plan changes against disk and lock, detect drift and orphans, apply (ADR 0003).

- `plan.ts` is pure over its inputs plus reads; `apply.ts` writes and prunes empty folders.
- Owned files are hashed whole; managed blocks are hashed block-only.
- Never overwrite drift without `force`; keep the old lock entry so drift stays visible.

Gotcha: engine and CLI orchestration writes user-intent files through this module's `writeText`,
`createIfMissing` and `editYaml` helpers; it must not call filesystem writes directly (ADR 0007).
Skill copies (`src/skills/git-copy.ts`) use `makeScratchDir` + `removeScratchDir(dir, tmpdir())` for the
temporary clone and `copyNewFile`, which never overwrites and refuses symlinks.
`log-integrity.ts` tracks script-owned spec evidence; preserve discrepancy detection when changing it.
For a version 2 spec the hashes live in `.mandao/cache/<ID>/integrity.json` (`specCacheDir`: the nearest
folder with `.mandao/config.yml`, then the story's `id`), so `_log/` keeps its six files; version 1 keeps
`_log/.integrity.json`. Writes into the cache are not logs and are not hashed. The version is read from
the front matter here (the writer depends on schemas only; before the story exists, an existing `_log/state.yml` means the current layout, by `effectiveLayoutVersion` in `src/schemas/spec.ts`) and judged by `keepsLogCache` in
`src/schemas/spec.ts`, the same predicate as the spec domain's `specLogInCache`: a quoted or unknown
version is version 1 for both. Security: `specCacheDir` throws unless the ID (story `id`, else the story
id the folder name starts with) matches `STORY_ID`, so no cache write lands outside `.mandao/cache/`, and
a cache removal passes `cacheRoot(specDir)` as `within` to `removeScratchDir`.
