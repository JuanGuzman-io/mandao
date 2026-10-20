---
schema_version: 1
spec: MDO-0005-prove-the-doctor-crash-path-end-to-end
---

# Quickstart — Check the doctor's crash behavior by hand

How a PO can check it: run the automated check once, then break a Mandao workspace on purpose and look
at what `mandao doctor --json` prints. A broken lock file must give an error and no report; a broken
models file must give one JSON report with an error in it.

## Before you start

- A terminal on macOS or Linux (the commands below are for those; Windows is not covered, see the
  [verify report notes](verify-report.md#notes-non-blocking)).
- Node.js 22.18 or later.
- A copy of the Mandao repository. Every step starts from its root folder.

## Part 1 — Run the automated check

1. Install the dependencies:

   ```sh
   npm ci
   ```

2. Run the check this story added:

   ```sh
   npx vitest run test/integration/doctor-process.test.ts
   ```

   **You should see** `Test Files 1 passed (1)` and `Tests 4 passed (4)`, and a duration well under
   5 seconds (about 0.7 s when verified). The four tests are the two broken-lock cases and the two
   broken-models cases.

3. Optional: run the whole suite with `npm test`. **You should see** `doctor-process.test.ts` among
   the passing files. This is what makes CI fail if the behavior ever breaks.

## Part 2 — See it for yourself

4. Build Mandao and prepare an empty test workspace with a valid configuration:

   ```sh
   npm run build
   REPO="$(pwd)"
   WS="$(mktemp -d)"; OUT="$(mktemp -d)"
   mkdir -p "$WS/.mandao"
   printf 'schema_version: 1\nworkspace: single\nprojects:\n  - name: a\n    path: .\nharnesses: [claude]\n' > "$WS/.mandao/config.yml"
   ```

   **You should see** no output. `WS` is a throwaway workspace; `OUT` keeps what the doctor prints.

5. Break the lock file and run the doctor:

   ```sh
   printf 'schema_version: 1\nworkspace: [unclosed\n  : :\n' > "$WS/.mandao/mandao.lock"
   (cd "$WS" && MANDAO_HOME="$(mktemp -d)" node "$REPO/dist/cli.js" doctor --json > "$OUT/stdout.txt" 2> "$OUT/stderr.txt"); echo "exit code: $?"
   echo "characters on stdout: $(wc -c < "$OUT/stdout.txt")"
   cat "$OUT/stderr.txt"
   ```

   **You should see:**
   - `exit code: 1`
   - `characters on stdout:` followed by `0` (nothing a CI job could mistake for a report)
   - an error message that contains the word `error` and the path of `.mandao/mandao.lock`. The exact
     wording does not matter; the check does not depend on it.

   `MANDAO_HOME` points the doctor to an empty home folder, so your own Mandao settings do not affect
   the result.

6. Replace the broken lock with a broken models file and run the doctor again:

   ```sh
   rm "$WS/.mandao/mandao.lock"
   printf 'schema_version: 1\nworkspace: [unclosed\n  : :\n' > "$WS/.mandao/models.yml"
   (cd "$WS" && MANDAO_HOME="$(mktemp -d)" node "$REPO/dist/cli.js" doctor --json > "$OUT/stdout.txt" 2> "$OUT/stderr.txt"); echo "exit code: $?"
   echo "characters on stderr: $(wc -c < "$OUT/stderr.txt")"
   node -e 'const r = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8")); console.log("schema_version:", r.schema_version); for (const f of r.findings) if (f.level === "error") console.log("error finding:", f.message)' "$OUT/stdout.txt"
   ```

   **You should see:**
   - `exit code: 1` (the CI job still fails)
   - `characters on stderr:` followed by `0`
   - `schema_version: 1`, which means the whole output is one valid JSON report
   - at least one `error finding:` line that mentions `.mandao/models.yml`

7. Optional: try a models file that is valid YAML but has the wrong content. It must behave like
   step 6:

   ```sh
   printf 'schema_version: 1\nmode: galaxy\n' > "$WS/.mandao/models.yml"
   ```

   Then repeat the run and the two check lines of step 6.

8. Clean up:

   ```sh
   rm -rf "$WS" "$OUT"
   ```

## What this proves

| Check | Criterion |
|---|---|
| Steps 2 and 5 | [AC-1](story.md#ac-1--invalid-lock-error-on-stderr-empty-stdout-exit-1): broken lock gives an error, empty output, exit 1 |
| Step 3 | AC-1/C2: the check runs in `npm test`, so CI catches a regression |
| Steps 2, 6 and 7 | [AC-2](story.md#ac-2--invalid-models-file-reported-as-a-finding-not-a-crash): broken models file is an error in one JSON report |
