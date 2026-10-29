import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { parseState } from '../spec/state.js';
import { STATE_FILE } from './spec-log.js';

/** The request `spec-new --create` (or `mandao start`) recorded: the branch it really created, among others. */
export type StartRecord = { id?: string; title?: string; lane?: string; branch?: string; base?: string };

const readIf = (file: string) => (existsSync(file) ? readFileSync(file, 'utf8') : undefined);

/** Reads the start record of a spec folder; quick starts retain one file per request. */
export function startRecord(dir: string, quick = false, quickName?: string): StartRecord {
  const file = quick
    ? join(dir, '_log', `start-${quickName}.yml`)
    : [join(dir, '_log', STATE_FILE), join(dir, '_log', 'start.yml'), join(dir, 'start.yml')].find((candidate) => existsSync(candidate));
  if (!file) return {};
  const text = readIf(file);
  if (!text) return {};
  if (!quick && file.endsWith(STATE_FILE)) return parseState(text).start ?? {};
  return parseYaml(text) as StartRecord;
}
