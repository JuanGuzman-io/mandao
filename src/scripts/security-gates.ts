/** Safe default commands used only for security-tagged tasks when a scanner is installed but not configured. */
const DEFAULT_COMMANDS = {
  secrets: { binary: 'gitleaks', command: 'gitleaks git . --redact --no-banner' },
  sast: { binary: 'semgrep', command: 'semgrep scan --config auto --error --metrics=off' },
} as const;

/** Uses an approved project gate first; otherwise, only security-tagged tasks may run installed defaults. */
export function securityGateCommand(
  gate: string,
  configured: string | undefined,
  securityTagged: boolean,
  isAvailable: (binary: string) => boolean,
): string | undefined {
  if (configured) return configured;
  if (!securityTagged || (gate !== 'secrets' && gate !== 'sast')) return undefined;
  const candidate = DEFAULT_COMMANDS[gate];
  return isAvailable(candidate.binary) ? candidate.command : undefined;
}
