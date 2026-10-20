import * as p from '@clack/prompts';

function parseBudget(value: string): number {
  const n = Number(value);
  if (!(n > 0)) throw new Error(`--budget must be a positive number of USD or "none", got "${value}"`);
  return n;
}

/**
 * The spend cap per spec, as a config fragment, asked with no suggested number: Mandao records every
 * command's spend either way, and only a person sets the cap (ADR 0036). Empty, `none`, or `--yes`
 * without `--budget`: no cap.
 */
export async function chooseBudget(given: string | undefined, yes: boolean | undefined): Promise<{ budget?: { per_spec: number } }> {
  const fragment = (value: string) => (value === '' || value === 'none' ? {} : { budget: { per_spec: parseBudget(value) } });
  if (given !== undefined) return fragment(given.trim());
  if (yes) return {};
  const typed = await p.text({
    message: 'Budget per spec in USD (empty: no cap; spend is recorded and reported either way)',
    validate: (v) => (!v?.trim() || Number(v) > 0 ? undefined : 'A positive number, or empty for no cap'),
  });
  if (p.isCancel(typed)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
  return fragment(String(typed ?? '').trim());
}
