// Packs Mandao, installs the tarball in a fresh git repository and checks that `init` and `doctor`
// work from the installed package, as a user would run them. Used in CI and before a release.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

const root = resolve(import.meta.dirname, '..');
const work = mkdtempSync(join(realpathSync(tmpdir()), 'mandao-smoke-'));
// On Windows npm is `npm.cmd`, which Node only runs through a shell; arguments are quoted for it.
const windows = process.platform === 'win32';
const quote = (arg) => (windows && /[\s&()^%!]/.test(arg) ? `"${arg}"` : arg);
const run = (cmd, args, cwd) => {
  const shell = windows && cmd === 'npm';
  try {
    return execFileSync(cmd, shell ? args.map(quote) : args, {
      cwd,
      shell,
      stdio: ['ignore', 'pipe', 'inherit'],
      encoding: 'utf8',
    });
  } catch (error) {
    // stderr is inherited; show the captured stdout too so a failing command is diagnosable.
    if (error.stdout) console.error(`stdout of \`${cmd} ${args.join(' ')}\`:\n${error.stdout}`);
    throw error;
  }
};

const app = join(work, 'app');
// Runs the installed package's bin with node, so no npx/.cmd shim is involved on any platform.
const mandao = (...args) => run(process.execPath, [join(app, 'node_modules', 'mandao', 'dist', 'cli.js'), ...args], app);

try {
  // SMOKE_TARBALL: install this already-packed tarball (CI packs once and shares it across the OS matrix).
  const given = process.env.SMOKE_TARBALL ? resolve(process.env.SMOKE_TARBALL) : undefined;
  const tarball = given ?? join(work, run('npm', ['pack', '--silent', '--pack-destination', work], root).trim().split('\n').at(-1));
  mkdirSync(app, { recursive: true });
  writeFileSync(join(app, 'package.json'), JSON.stringify({ name: 'smoke-app', private: true, devDependencies: {} }, null, 2));
  run('git', ['init', '-q'], app);
  run('npm', ['install', '--silent', '--no-audit', '--no-fund', tarball], app);
  mandao('init', '--yes', '--harness', 'claude');
  // This smoke workspace doesn't install optional tools; choose the explicit Mermaid renderer before doctor.
  const configFile = join(app, '.mandao/config.yml');
  const config = parseYaml(readFileSync(configFile, 'utf8'));
  config.diagrams = { ...config.diagrams, engine: 'mermaid' };
  writeFileSync(configFile, stringifyYaml(config));
  mandao('sync');
  const doctor = mandao('doctor');
  if (/\berror\b/.test(doctor)) throw new Error(`doctor reported errors:\n${doctor}`);
  console.log(`smoke: ${basename(tarball)} installs, init and doctor pass`);
} finally {
  try {
    rmSync(work, { recursive: true, force: true, maxRetries: 5 });
  } catch (error) {
    // Windows may hold files briefly; cleanup must never mask the original failure.
    console.warn(`smoke: could not remove ${work}: ${error.message}`);
  }
}
