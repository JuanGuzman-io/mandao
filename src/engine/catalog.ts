import { join } from 'node:path';
import { type Catalog, catalogSchema } from '../schemas/index.js';
import { coreDir } from '../util/package-root.js';
import { readYamlFile } from './files.js';

export const readCatalog = (): Catalog => readYamlFile(join(coreDir(), 'catalog', 'skills.yml'), catalogSchema);
