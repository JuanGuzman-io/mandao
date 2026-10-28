/**
 * Who types each terminal command (phase 16). The agent commands run every other `mandao run` script
 * themselves; `start` stays only for the beta's users. `docs/cli.md` and the installed guide read this list,
 * and a test fails when a command of the CLI is missing from it.
 */
export const USER_COMMANDS: readonly { path: string; summary: string }[] = [
  { path: 'init', summary: 'set up Mandao in a workspace' },
  { path: 'sync', summary: 'regenerate the harness files from `.mandao/config.yml`' },
  { path: 'doctor', summary: 'check the configuration, the generated files and the optional tools' },
  { path: 'update', summary: 'apply the installed Mandao version' },
  { path: 'harness add', summary: 'generate files for another harness' },
  { path: 'skills list', summary: 'list the pinned skills' },
  { path: 'skills add', summary: 'install, verify and pin catalog skills' },
  { path: 'skills restore', summary: 'restore missing skills from the lock' },
  { path: 'models', summary: 'show the model of each role' },
  { path: 'models set', summary: 'choose the model of a role' },
  { path: 'models mode', summary: 'simple or routed models' },
  { path: 'models profile', summary: 'peak, balanced or economy models' },
  { path: 'approve', summary: 'approve a step from the terminal, without a model session' },
  { path: 'deliver', summary: 'push, PR and merge after green CI (the agent runs it in the session too)' },
  { path: 'worktree list', summary: 'the spec worktrees and whether they were merged' },
  { path: 'worktree clean', summary: 'remove merged worktrees that hold no work' },
  { path: 'intake close', summary: 'close an intake proposal' },
  { path: 'intake clean', summary: 'delete the extracted text of closed intakes' },
  { path: 'run cost', summary: 'spend per command and role' },
  { path: 'run version-notes', summary: 'release notes of a version' },
];

/** Tools for whoever maintains a workspace or Mandao itself; no agent command needs them. */
export const MAINTAINER_COMMANDS: readonly string[] = ['run commit-msg', 'run layout', 'run baseline'];

/** Commands kept for compatibility, with what replaces them. */
export const DEPRECATED_COMMANDS: Readonly<Record<string, string>> = {
  start: 'story and specify open the spec, its branch and its setup in the session (`run spec-new --create`)',
};
