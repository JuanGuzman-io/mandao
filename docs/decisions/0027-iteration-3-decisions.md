# 0027 — Iteration 3 decisions: release, gates, diagram freshness, free models, Antigravity status

**Status:** Accepted · 2026-10-20

1. **npm trusted publishing (OIDC).** No npm token secret. The release workflow has `id-token: write`,
   Node 22.14 or later and npm 11.5.1 or later, and publishes with provenance. The first version is
   published by hand by the maintainer (`npm publish --tag next`, 2FA); then GitHub Actions is
   registered as trusted publisher for `JuanGuzman-io/mandao`, workflow `release.yml`. Steps in
   `CONTRIBUTING.md`. Source: https://docs.npmjs.com/trusted-publishers (checked 2026-10-20).
2. **Pre-commit hook in the Mandao repository**: Biome on staged files and a typecheck, installed by
   `npm ci` (`prepare`), shared by worktrees, never replacing a hook that is not Mandao's. The agent's
   own commits cannot skip the gates.
3. **verify rebuilds before testing a built artifact** (Kaizen of MDO-0002): a `build` gate and
   `mandao run build <project>`, under the `build` memory floor and the test queue; deferred unless
   forced, forced runs recorded (ADR 0024).
4. **Diagram freshness by subgraph.** The stamp records `graphHash`: a hash of the spec graph's node ids,
   kinds, roles and the edges between them, sorted. Regenerating or reformatting the graph keeps the
   diagram current; adding or removing a module or an edge makes it stale.
5. **OpenCode Zen as an optional set.** `opencode-zen` pairs two different free models
   (`opencode/glm-5.3-flash-free` implements, `opencode/beam-free` reviews) with the note "free for a
   limited time; free models may use data for training" and its source
   (https://opencode.ai/docs/zen/, reviewed 2026-10-20). Optional sets are never chosen by provider
   detection; `doctor` offers them. Acceptance runs on the Mandao repository only. The Anthropic and
   OpenAI sets stay unverified live until keys exist.
6. **Antigravity stays experimental and not live-tested** (no account): covered by snapshot tests only,
   and said so in the README, `harness add` / `init` and `doctor`.
7. **Jira publication** stays at payloads until the maintainer validates it.
