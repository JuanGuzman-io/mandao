/** Whether a person can answer a prompt here: stdin is a terminal. */
export const canPrompt = (): boolean => process.stdin.isTTY === true;

/**
 * A command about to prompt refuses without a terminal, naming the flag that confirms instead, rather than
 * reading the missing answer as "no" (MDO-0001: `worktree clean` from an agent session removed nothing).
 */
export function requireTerminal(action: string, flag?: string): void {
  if (canPrompt()) return;
  throw new Error(
    `${action} asks for confirmation and there is no terminal here: ${flag ? `re-run with ${flag}` : 'run it in a terminal'}`,
  );
}
