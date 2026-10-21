import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { CONFIG_FILE, MODELS_FILE, SOURCES_FILE, writeYaml } from '../engine/files.js';
import type { ConfigInput, Models } from '../schemas/index.js';
import { createIfMissing } from '../writer/files.js';

const OVERRIDES_README = `# Overrides

Files here win over presets and Mandao core. \`mandao update\` never touches this folder.

- Replace a whole command: \`commands/<id>.md\`
- Patch only its frontmatter: \`commands/<id>.patch.yml\` (objects merge, arrays replace, \`null\` deletes)
- Replace a template: \`templates/<shared|app|ai|data>/<name>\`
- Replace or patch a persona: \`personas/<id>.md\` or \`personas/<id>.patch.yml\`

Run \`mandao sync\` after editing.
`;

const SOURCES_TEMPLATE = {
  schema_version: 1,
  tracker: 'none',
  docs: [],
  meetings: [],
  chat: [],
  design: [],
};

/** The config, and the models, sources and overrides files when they are missing. */
export function writeInitFiles(root: string, config: ConfigInput, models: Models) {
  writeYaml(join(root, CONFIG_FILE), config, '# Mandao configuration. Run `mandao sync` after editing. Schema: docs/schemas.md');
  if (!existsSync(join(root, MODELS_FILE))) {
    writeYaml(
      join(root, MODELS_FILE),
      models,
      '# Model per role and harness. Change with `mandao models set <role> <model>`; see `mandao models`.',
    );
  }
  if (!existsSync(join(root, SOURCES_FILE))) {
    writeYaml(join(root, SOURCES_FILE), SOURCES_TEMPLATE, '# Where business context lives: tracker, docs, chat, design, transcripts.');
  }
  const overrides = join(root, '.mandao', 'overrides');
  createIfMissing(join(overrides, 'README.md'), OVERRIDES_README);
}
