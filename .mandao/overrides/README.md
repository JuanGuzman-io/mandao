# Overrides

Files here win over presets and Mandao core. `mandao update` never touches this folder.

- Replace a whole command: `commands/<id>.md`
- Patch only its frontmatter: `commands/<id>.patch.yml` (objects merge, arrays replace, `null` deletes)
- Replace a template: `templates/<shared|app|ai|data>/<name>`
- Replace or patch a persona: `personas/<id>.md` or `personas/<id>.patch.yml`

Run `mandao sync` after editing.
