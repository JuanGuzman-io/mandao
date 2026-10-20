import { ConfigError } from '../engine/files.js';
import { ResolveError } from '../resolver/resolve.js';
import { c } from './output.js';
import { buildProgram } from './program.js';

try {
  await buildProgram().parseAsync();
} catch (e) {
  if (e instanceof ConfigError || e instanceof ResolveError) {
    console.error(c.red('error'), e instanceof ResolveError ? 'content failed validation:' : 'invalid configuration:');
    for (const issue of e.issues) console.error(`  ${issue}`);
  } else {
    console.error(c.red('error'), (e as Error).message);
  }
  process.exitCode = 1;
}
