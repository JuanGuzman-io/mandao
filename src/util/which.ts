import { existsSync } from 'node:fs';
import { delimiter, join } from 'node:path';

/** True when `bin` is an executable name found on PATH (no shell spawned). */
export function onPath(bin: string): boolean {
  return (process.env.PATH ?? '')
    .split(delimiter)
    .some((dir) => dir && (existsSync(join(dir, bin)) || existsSync(join(dir, `${bin}.cmd`))));
}
