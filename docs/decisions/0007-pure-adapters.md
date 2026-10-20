# 0007 — Pure adapters, one impure writer

**Status:** Accepted

## Context
Harness formats change often. Adapters must be cheap to write, cheap to test, and safe to run.

## Decision
- An adapter is a pure function `render(input) → { files, warnings }`. It performs no I/O.
- Capabilities and tiers are mapped per adapter. Tools a harness does not know are left out, never
  guessed.
- `AGENTS.md` is a harness-neutral output: a managed block (`<!-- mandao:begin/end -->`) in the root
  and in each project. Content outside the markers is never touched.
- Only `src/writer/` touches the filesystem: it plans changes, hashes, detects drift and removes
  orphans.
- Snapshot tests cover each adapter × workspace mode.

## Consequences
- Adding a harness means one file plus snapshots.
- A harness without model selection per agent turns `must_differ_from` into an instruction plus a
  `doctor` warning.
