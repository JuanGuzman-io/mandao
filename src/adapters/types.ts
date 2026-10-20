import type { Resolution } from '../resolver/resolve.js';
import type { Config, HarnessId } from '../schemas/index.js';

export type InstallScope = 'project' | 'global';

export interface AdapterInput {
  resolution: Resolution;
  config: Config;
  version: string;
  scope: InstallScope;
}

export interface GeneratedFile {
  /** POSIX path relative to the workspace root (project scope) or to the harness home (global scope). */
  path: string;
  content: string;
  ownership: 'owned' | 'managed-block';
  /** Origin recorded in the lock: `command:specify`, `persona:reviewer`, `block:mandao`. */
  from: string;
  harness: HarnessId | 'agents-md' | 'mandao';
  scope: InstallScope;
}

export interface AdapterOutput {
  files: GeneratedFile[];
  warnings: string[];
}

/** A pure function from resolved canonical content to harness files. No I/O. */
export interface Adapter {
  id: HarnessId;
  name: string;
  render(input: AdapterInput): AdapterOutput;
}
