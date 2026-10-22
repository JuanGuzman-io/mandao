// Packs Mandao, installs the tarball in a fresh git repository and checks that `init` and `doctor`
// work from the installed package, as a user would run them. Used in CI and before a release.
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(tmpdir(), 'mandao-smoke-'));
const run = (cmd, args, cwd) => execFileSync(cmd, args, { cwd, stdio: ['ignore', 'pipe', 'inherit'], encoding: 'utf8' });

try {
  const tarball = run('npm', ['pack', '--silent', '--pack-destination', work], root).trim().split('\n').at(-1);
  const app = join(work, 'app');
  run('mkdir', ['-p', app], work);
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true, devDependencies: {} }, null, 2));
  run('git', ['init', '-q'], app);
  run('npm', ['install', '--silent', '--no-audit', '--no-fund', join(work, tarball)], app);
  run('npx', ['--no-install', 'mandao', 'init', '--yes', '--harness', 'claude'], app);
  // This smoke workspace doesn't install optional tools; choose the explicit Mermaid renderer before doctor.
  const configFile = join(app, '.mandao/config.yml');
  const config = parseYaml(readFileSync(configFile, 'utf8'));
  config.diagrams = { ...config.diagrams, engine: 'mermaid' };
  writeFileSync(configFile, stringifyYaml(config));
  run('npx', ['--no-install', 'mandao', 'sync'], app);
  const doctor = run('npx', ['--no-install', 'mandao', 'doctor'], app);
  if (/\berror\b/.test(doctor)) throw new Error(`doctor reported errors:\n${doctor}`);
  console.log(`smoke: ${tarball} installs, init and doctor pass`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
