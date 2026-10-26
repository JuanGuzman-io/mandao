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

/**
 * The saving (USD) above which implement stops to suggest a new session, as a config fragment. Empty, `none`
 * or `--yes` without the flag: no key, so the default follows the cost basis (none on a subscription, where the
 * saving is a list-price equivalent; $1 on a paid API). Phase 16.
 */
export async function chooseCutThreshold(
  given: string | undefined,
  yes: boolean | undefined,
): Promise<{ session?: { cut_min_savings: number } }> {
  const fragment = (value: string) => {
    if (value === '' || value === 'none') return {};
    const n = Number(value);
    if (!(n >= 0)) throw new Error(`--cut-min-savings must be a number of USD or "none", got "${value}"`);
    return { session: { cut_min_savings: n } };
  };
  if (given !== undefined) return fragment(given.trim());
  if (yes) return {};
  const typed = await p.text({
    message:
      'Stop inside implement to suggest a new session when it saves at least (USD; empty: never on a subscription, $1 on a paid API)',
    validate: (v) => (!v?.trim() || Number(v) >= 0 ? undefined : 'A number of USD, or empty'),
  });
  if (p.isCancel(typed)) {
    p.cancel('Cancelled.');
    process.exit(1);
  }
  return fragment(String(typed ?? '').trim());
}
