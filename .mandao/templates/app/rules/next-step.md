# Next step

Every mandao of the spec flow ends here, after its own last step. Run the `run next` call the command names
(`mandao run next <ID> --harness <id>`, with `--shown` when it says so) and act on its JSON:

- `recommended.invocation` is the next step, complete: the spec ID and only the arguments that change
  something, written the way this harness invokes it. `invocations` lists every option the same way.
- **`autoContinue: true`:** the step needs no decision of the PE. Invoke `recommended.invocation` now, in this
  same session (Claude Code: the Skill tool with that mandao and its argument), without asking whether to go
  on. When the chain stops, report together everything that ran.
- **No `autoContinue`:** the step waits for the PE (an approval, a product or scope question, push or merge) or
  for a new session. Stop and close with:
  1. One line saying what finished, with the spec ID and its story, e.g. "Specify is done for MDO-0003
     (story I-2)."
  2. `recommended.invocation` alone in a code block, so it can be copied.
  3. The other `invocations`, one per line, each complete.
  4. When a new session is advised (`newSession` from `mandao approve`, `session.cut`, a delivery
     checkpoint), the new-conversation action first (`/clear` in Claude Code), then the invocation.
- Never write a mandao without its spec ID, never a default argument (`--depth standard`), and never a step
  `run next` did not name. `flow.chain: false` in `.mandao/config.yml` turns the chaining off.
