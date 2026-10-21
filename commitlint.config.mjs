// Reuse Mandao's generated emoji/type and trailer rules.
import { execFileSync } from 'node:child_process';

const branch = process.env.GITHUB_HEAD_REF || execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
// CI checks out a detached merge commit; infer the active id from the PR branch instead.
process.env.MANDAO_SPEC_ID ??= branch.match(/(?:^|[/-])((?:[A-Z][A-Z0-9_]*|MDO)-\d+)(?:-|$)/)?.[1] ?? '';
const { default: config } = await import('./.mandao/commitlint.config.mjs');
export default config;
