import type { ResolvedModels } from '../models/resolve.js';
import type { Resolution } from '../resolver/resolve.js';
import type { Config, HarnessId } from '../schemas/index.js';

export type InstallScope = 'project' | 'global';

export interface AdapterInput {
  resolution: Resolution;
  config: Config;
  /** Resolved role → model per harness (recommendation < workspace models.yml). */
  models: Partial<Record<HarnessId, ResolvedModels>>;
  version: string;
  scope: InstallScope;
  /** Folders below projects that hold an `AGENTS.md` (module guides), found by the engine. */
  moduleDirs?: string[];
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

/** Per-harness session facts; `newConversation` is the in-place action, absent when there is none; `resume` opens it in a worktree. */
export interface HarnessSession {
  enterWorktree: boolean;
  newConversation?: string;
  /** Pure: the exact command that opens the harness in the worktree with the first mandao; `launch` when `--open` can run it. */
  resume(worktree: string, first: string): { text: string; launch?: string[] };
  /** How a person or the agent types a mandao in this harness: `mandao-implement MDO-1` → `/mandao-implement MDO-1`. */
  invoke(command: string): string;
}

/** A pure function from resolved canonical content to harness files. No I/O. */
export interface Adapter {
  id: HarnessId;
  name: string;
  /** When the target format was last checked against the official docs, and where. */
  verified: { date: string; docs: string[] };
  /** Why the adapter is experimental, when it is: `init` and `doctor` say so. */
  experimental?: string;
  /** How far it was tested live, when that limits how it is used: `doctor` shows it. */
  testedNote?: string;
  /** What the harness offers for a session: entering a worktree in place and its new-conversation action (spec D2). */
  session: HarnessSession;
  render(input: AdapterInput): AdapterOutput;
}
