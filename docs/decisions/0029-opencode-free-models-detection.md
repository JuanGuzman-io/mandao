# 0029 — OpenCode: providers from the models it lists

**Status:** Accepted · 2026-10-20

OpenCode 2.1.1 ships OpenCode Zen's free models usable without any login: `opencode auth list` is
empty, yet `opencode models` lists `opencode/glm-5.3-flash-free`, `opencode/beam-free` and others.
Mandao's detection (ADR 0025) only read credentials, so it reported "no provider" and never offered the
optional `opencode-zen` set (ADR 0027).

**Decision.** `opencode models` is the first source: every listed `provider/model` makes its provider
available, with or without credentials. Credentials (`opencode auth list --format json`, `auth.json`),
provider environment variables and `enabled_providers` / `disabled_providers` still apply. `doctor` now
also warns when a role's model is not among the listed models. The command lists models only, never
secrets.

## Acceptance run (2026-10-20)

All seven checks pass with the fixes listed in `docs/acceptance/2b-opencode-results.md`. OpenCode 2's
`opencode run` does not parse slash commands, so mandaos are invoked from the TUI (or the server API);
agents (`--agent`) and `mandao run review --via opencode` work non-interactively.
