# Customizing

## Overrides

Files in `.mandao/overrides/` win over presets and core (ADR 0004):

- `commands/<id>.md` replaces a command; `commands/<id>.patch.yml` changes only its frontmatter.
- `templates/<shared|app|ai|data>/<path>` replaces a template, e.g. `templates/shared/rules/review.md`.
- `personas/<id>.md` or `personas/<id>.patch.yml` for the Leader, Implementer, Reviewer and Tester.

`mandao update` re-resolves core and presets and never writes in `overrides/`. Run `mandao sync` after
editing an override.

## How generated commands run Mandao

Generated commands call `node .mandao/bin/mandao.mjs`. It runs Mandao from the local
`node_modules/.bin`, then from a global install (such as `npm link`), then with
`npx mandao@<locked version>`. Force one of them with `scripts.runner` in `.mandao/config.yml`;
`mandao doctor` shows which one it uses.

## Models and budget

- `mandao models` shows the model per role and where it comes from. Change one role with
  `mandao models set <role> <model>`, all of them with `mandao models profile <peak|balanced|economy>`.
- `budget.per_spec` in `.mandao/config.yml` is optional and off by default. See [Cost](cli.md#cost).

The full configuration schema: [schemas.md](schemas.md).
