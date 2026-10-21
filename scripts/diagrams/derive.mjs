// Derives the Archify specifications of Mandao's diagrams from the real sources: command frontmatter
// and bodies, the status transitions and the Leader loop in src/, and docs/process-map.md. Nothing here
// is drawn by hand: change a source and the derived specification changes (`npm run diagrams:check`).
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse as parseYaml } from 'yaml';

/** One look for every diagram: what a node is decides its Archify type. */
export const STYLE = {
  command: 'backend', // an agent command: a model session, tokens
  approval: 'security', // a person approves
  script: 'messagebus', // a `mandao` script: no tokens
  file: 'database', // what Mandao writes
  person: 'external', // you, or your harness
};

/** The legend every workflow diagram shows: our names for Archify's node types. */
export const LEGEND = {
  mode: 'auto',
  entries: {
    backend: { label: 'Agent command: a model session' },
    security: { label: 'A person approves or decides' },
    messagebus: { label: 'mandao script: no tokens' },
    database: { label: 'Files Mandao writes' },
    external: { label: 'You, your situation' },
  },
};

export function sources(root) {
  const used = new Map();
  const read = (rel) => {
    const text = readFileSync(join(root, rel), 'utf8');
    // process-map.md is the source in its frontmatter and generated below it: only the source counts.
    const source = rel === 'docs/process-map.md' ? (/^---\n[\s\S]*?\n---\n/.exec(text)?.[0] ?? text) : text;
    used.set(rel, createHash('sha256').update(source).digest('hex'));
    return text;
  };
  return { read, derivedFrom: () => [...used].map(([path, sha256]) => ({ path, sha256 })).sort((a, b) => a.path.localeCompare(b.path)) };
}

/** Box width from its longest line, so Archify never has to shrink or clip a label. */
export const fit = (...lines) => Math.max(132, Math.ceil(Math.max(...lines.filter(Boolean).map((l) => l.length)) * 7) + 24);

const frontmatter = (text) => parseYaml(/^---\n([\s\S]*?)\n---/.exec(text)?.[1] ?? '') ?? {};

function must(value, what) {
  if (value === undefined || value === null || (Array.isArray(value) && !value.length)) throw new Error(`diagrams: cannot derive ${what}; the source changed shape`);
  return value;
}

export function commands(read) {
  const ids = ['init', 'constitution', 'story', 'specify', 'clarify', 'tasks', 'implement', 'verify', 'close', 'quick', 'resume', 'audit', 'perf'];
  return Object.fromEntries(
    ids.map((id) => {
      const text = read(`core/commands/${id}.md`);
      const meta = frontmatter(text);
      return [id, { id, meta, body: text.slice(text.indexOf('\n---', 3) + 4) }];
    }),
  );
}

const cmd = (id) => `/mandao-${id}`;

/** 1. Every command and how they connect: frontmatter `flow`, `approval` and the terminal steps around them. */
export function panorama(read) {
  const c = commands(read);
  const nextSrc = read('src/spec/next.ts');
  const startSrc = read('src/cli/start.ts');
  must(/rec\('\/mandao-implement'/.test(nextSrc) || undefined, 'approve → implement');
  must(/mandao-specify/.test(startSrc) || undefined, 'start → specify');
  const tag = (id) => (c[id]?.meta.approval === 'required' ? 'you approve' : undefined);
  const node = (id, lane, col, type, label, sublabel) => ({
    id,
    lane,
    col,
    type,
    label,
    ...(sublabel ? { sublabel } : {}),
    ...(tag(id.replace(/^cli-/, '')) && type === STYLE.command ? { tag: tag(id.replace(/^cli-/, '')) } : {}),
    width: fit(label, sublabel),
  });
  const nodes = [
    node('cli-init', 'setup', 0, STYLE.script, 'mandao init', 'no tokens'),
    node('constitution', 'setup', 1, STYLE.command, cmd('constitution')),
    node('cli-start', 'terminal', 0, STYLE.script, 'mandao start', 'branch + worktree'),
    node('cli-approve', 'terminal', 3, STYLE.approval, 'mandao approve', 'you approve'),
    node('story', 'flow', 0, STYLE.command, cmd('story')),
    node('specify', 'flow', 1, STYLE.command, cmd('specify')),
    node('tasks', 'flow', 2, STYLE.command, cmd('tasks')),
    node('implement', 'flow', 3, STYLE.command, cmd('implement')),
    node('verify', 'flow', 4, STYLE.command, cmd('verify')),
    node('close', 'flow', 5, STYLE.command, cmd('close')),
    node('quick', 'side', 1, STYLE.command, cmd('quick'), 'small change'),
    node('clarify', 'side', 2, STYLE.command, cmd('clarify')),
    node('resume', 'side', 3, STYLE.command, cmd('resume'), 'any harness'),
  ];
  const ids = new Set(nodes.map((n) => n.id));
  const edges = [];
  const add = (from, to, extra = {}) => {
    if (!edges.some((e) => e.from === from && e.to === to)) edges.push({ id: `${from}-${to}`, from, to, ...extra });
  };
  // The main flow chains its commands; every other command keeps its first `flow.next` that is drawn.
  const main = ['story', 'specify', 'tasks', 'implement', 'verify', 'close'];
  for (let i = 1; i < main.length; i++) {
    must(c[main[i - 1]].meta.flow.next.includes(main[i]) || undefined, `${main[i - 1]} → ${main[i]} in flow.next`);
    add(main[i - 1], main[i], { variant: 'emphasis' });
  }
  for (const id of ['constitution', 'quick', 'resume']) {
    const next = must(c[id].meta.flow, `${id} flow`).next.find((n) => ids.has(n) && n !== id);
    if (next) add(id, next, id === 'quick' ? { label: 'grows: spec', variant: 'dashed' } : {});
  }
  // Secondary arrows leave from the bottom so the main flow keeps its straight right-hand ports.
  add('specify', 'clarify', { label: 'open items', variant: 'dashed', role: 'branch' });
  // The terminal steps: init starts the project, start opens a spec, approve hands over to implement.
  add('cli-init', 'constitution');
  add('cli-start', 'specify');
  add('tasks', 'cli-approve');
  add('cli-approve', 'implement', { label: 'new session', fromSide: 'bottom', toSide: 'top' });
  // What each command writes is in its own diagram (docs/commands/): here only commands and handoffs.
  return {
    schema_version: 2,
    diagram_type: 'workflow',
    meta: { title: 'Mandao: commands and processes', output: 'overview.html', quality_profile: 'showcase', legend: LEGEND },
    lanes: [
      { id: 'setup', label: 'Once per project' },
      { id: 'terminal', label: 'Each spec, in the terminal' },
      { id: 'flow', label: 'Spec flow' },
      { id: 'side', label: 'Around the flow' },
    ],
    mainPath: ['story', 'specify', 'tasks', 'implement', 'verify', 'close'],
    nodes,
    edges,
  };
}

/** 2. Which install do I need: the scenarios in docs/process-map.md. */
export function install(read) {
  const map = frontmatter(read('docs/process-map.md'));
  const scenarios = must(map.install, 'install scenarios');
  // A decision ladder on its side: the questions run left to right (no → the next one); yes goes down
  // to what you run, then to what comes next. Wide and short, so it reads on a desktop screen.
  must(scenarios.length <= 6 || undefined, 'at most six install scenarios (Archify workflow columns)');
  const nodes = [];
  const edges = [];
  const kind = (text) => (text.startsWith('/') ? STYLE.command : text.startsWith('mandao') ? STYLE.script : STYLE.file);
  scenarios.forEach((s, col) => {
    const ask = must(s.ask, `the question for install scenario ${s.id}`);
    nodes.push({ id: `${s.id}-ask`, lane: 'ask', col, type: STYLE.person, label: ask, width: fit(ask) });
    nodes.push({ id: `${s.id}-run`, lane: 'run', col, type: STYLE.script, label: s.run, width: fit(s.run) });
    nodes.push({ id: `${s.id}-then`, lane: 'then', col, type: kind(s.then), label: s.then, width: fit(s.then) });
    edges.push({ id: `${s.id}-yes`, from: `${s.id}-ask`, to: `${s.id}-run`, label: 'yes' });
    edges.push({ id: `${s.id}-then`, from: `${s.id}-run`, to: `${s.id}-then` });
    const next = scenarios[col + 1];
    if (next) edges.push({ id: `${s.id}-no`, from: `${s.id}-ask`, to: `${next.id}-ask`, label: 'no', variant: 'dashed' });
  });
  return {
    schema_version: 2,
    diagram_type: 'workflow',
    meta: { title: 'Which install do I need?', output: 'install.html', quality_profile: 'showcase', legend: LEGEND },
    lanes: [
      { id: 'ask', label: 'Your situation' },
      { id: 'run', label: 'Run' },
      { id: 'then', label: 'Then' },
    ],
    mainPath: scenarios.map((s) => `${s.id}-ask`),
    nodes,
    edges,
  };
}

/** 3. A spec's life: TRANSITIONS in src/scripts/spec.ts, and which command sets each status. */
export function lifecycle(read) {
  const src = read('src/scripts/spec.ts');
  const block = must(/const TRANSITIONS[^=]*=\s*\{([\s\S]*?)\};/.exec(src)?.[1], 'TRANSITIONS');
  const transitions = [...block.matchAll(/'?([a-z-]+)'?:\s*\[([^\]]*)\]/g)].map((m) => ({
    from: m[1],
    to: [...m[2].matchAll(/'([a-z-]+)'/g)].map((t) => t[1]),
  }));
  const c = commands(read);
  // Which command sets a status: `{{script:status}} {{arg:…}} <status>` or `status: <status>` in its body.
  const setters = {};
  for (const { id, body } of Object.values(c)) {
    for (const m of body.matchAll(/\{\{script:status\}\} \{\{arg:\w+\}\} ([a-z-]+)|status: (draft|in-progress|verified|closed)\b/g)) {
      const status = m[1] ?? m[2];
      (setters[status] ??= new Set()).add(id);
    }
  }
  const approveSrc = read('src/cli/approve.ts');
  if (/withStatus\(text, 'approved'\)/.test(approveSrc)) (setters.approved ??= new Set()).add('mandao approve');
  // The terminal command when one sets it, else at most two command names.
  const by = (status) => {
    const all = [...(setters[status] ?? [])];
    if (!all.length) return 'a person';
    return all.find((s) => s.startsWith('mandao')) ?? all.filter((s) => s !== 'constitution').slice(0, 2).join(' / ');
  };
  const statuses = must(/SPEC_STATUSES = \[([^\]]*)\]/.exec(read('src/schemas/common.ts'))?.[1], 'SPEC_STATUSES')
    .split(',')
    .map((s) => s.trim().replace(/'/g, ''))
    .filter(Boolean);
  // The rail: draft to closed through the forward moves; the rest are pauses and exits.
  const rail = ['draft'];
  for (let next; (next = transitions.find((t) => t.from === rail.at(-1))?.to.find((t) => !rail.includes(t) && t !== 'blocked' && t !== 'draft')); ) rail.push(next);
  must(rail.at(-1) === 'closed' || undefined, 'a forward path from draft to closed');
  const type = (s) => (s === 'draft' ? 'start' : s === 'closed' ? 'success' : s === 'abandoned' ? 'failure' : s === 'blocked' || s === 'approved' ? 'waiting' : 'active');
  const states = statuses.map((s) => ({ id: s, type: type(s), label: s, ...(rail.includes(s) ? { step: String(rail.indexOf(s) + 1).padStart(2, '0') } : {}) }));
  const edges = [];
  for (const { from, to } of transitions)
    for (const t of to) {
      const forward = rail.includes(from) && rail.indexOf(t) === rail.indexOf(from) + 1;
      edges.push({ id: `${from}-${t}`, from, to: t, label: forward ? by(t) : 'a person', ...(forward ? { variant: 'emphasis' } : { variant: 'dashed' }) });
    }
  // `abandoned` is reachable from every state but closed (checkTransition): drawn once.
  if (/to === 'abandoned' && from !== 'closed'/.test(src))
    edges.push({ id: 'any-abandoned', from: 'in-progress', to: 'abandoned', label: 'a person, any open state', variant: 'security' });
  return {
    schema_version: 3,
    diagram_type: 'lifecycle',
    meta: { title: 'A spec from draft to closed', output: 'lifecycle.html', quality_profile: 'showcase' },
    mainPath: rail,
    states,
    transitions: edges,
  };
}

/** 4. How a task runs: the Leader loop in src/spec/loop.ts and the steps of implement.md. */
export function taskLoop(read) {
  const loop = read('src/spec/loop.ts');
  const perTier = Number(must(/MAX_FAILS_PER_TIER = (\d+)/.exec(loop)?.[1], 'MAX_FAILS_PER_TIER'));
  const atStrong = Number(must(/MAX_FAILS_AT_STRONG = (\d+)/.exec(loop)?.[1], 'MAX_FAILS_AT_STRONG'));
  const actions = must(/export type LoopAction =([\s\S]*?);/.exec(loop)?.[1], 'LoopAction');
  for (const a of ['write-red-tests', 'implement', 'review', 'rework', 'commit', 'halt']) must(actions.includes(`'${a}'`) || undefined, `loop action ${a}`);
  const impl = commands(read).implement.body;
  for (const step of ['Red tests first', 'Gates and impacted tests', 'Verdict', 'Commit']) must(impl.includes(step) || undefined, `implement step ${step}`);
  const n = (id, lane, col, type, label, sublabel) => ({ id, lane, col, type, label, ...(sublabel ? { sublabel } : {}), width: fit(label, sublabel) });
  return {
    schema_version: 2,
    diagram_type: 'workflow',
    meta: { title: 'How a task runs', output: 'task-loop.html', quality_profile: 'showcase', legend: LEGEND },
    lanes: [
      { id: 'leader', label: 'Leader (your session)' },
      { id: 'agents', label: 'Subagents, clean context' },
      { id: 'scripts', label: 'Scripts (no tokens)' },
      { id: 'stop', label: 'Escalation', variant: 'exception' },
    ],
    mainPath: ['step', 'red', 'implementer', 'gates', 'reviewer', 'commit'],
    nodes: [
      n('step', 'scripts', 0, STYLE.script, 'mandao run step', 'next action + brief'),
      n('red', 'agents', 1, STYLE.command, 'Tester / Implementer', 'red tests first'),
      n('implementer', 'agents', 2, STYLE.command, 'Implementer', 'tier of the task'),
      n('gates', 'scripts', 3, STYLE.script, 'mandao run gates', 'lint, types, impacted tests'),
      n('reviewer', 'agents', 4, STYLE.command, 'Reviewer', 'other model when available'),
      n('commit', 'scripts', 5, STYLE.script, 'mandao run commit', 'one commit, never a push'),
      n('leader', 'leader', 0, STYLE.command, 'Leader', 'checkpoints every step'),
      n('escalate', 'stop', 3, STYLE.script, 'Next tier up', `after ${perTier} FAILs`),
      n('halt', 'stop', 5, STYLE.approval, 'HALT: you decide', `after ${atStrong} FAILs at strong`),
    ],
    edges: [
      { id: 'leader-step', from: 'leader', to: 'step' },
      { id: 'step-red', from: 'step', to: 'red', label: 'RED recorded' },
      { id: 'red-impl', from: 'red', to: 'implementer' },
      { id: 'impl-gates', from: 'implementer', to: 'gates', label: 'REPORTED' },
      { id: 'gates-review', from: 'gates', to: 'reviewer' },
      { id: 'review-commit', from: 'reviewer', to: 'commit', label: 'PASS' },
      { id: 'review-rework', from: 'reviewer', to: 'escalate', label: 'FAIL', variant: 'security', role: 'error' },
      { id: 'escalate-impl', from: 'escalate', to: 'implementer', label: 'rework', variant: 'dashed', role: 'return', toSide: 'bottom' },
      { id: 'escalate-halt', from: 'escalate', to: 'halt', variant: 'security', role: 'error' },
    ],
  };
}

export const README_DIAGRAMS = { overview: panorama, install, lifecycle: lifecycle, 'task-loop': taskLoop };

/** A short title: no parenthetical, at most `max` characters, cut at a word. */
const short = (text, max = 30) => {
  const t = text.replace(/\s*\([^)]*\)/g, '').replace(/[`*]/g, '').trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).replace(/\s+\S*$/, '')}…`;
};

/** A command's steps: its numbered `## N.` headings, else its top-level numbered list. */
export function commandSteps(body) {
  const sections = [...body.matchAll(/^## (\d+[a-z]?)\. (.+)$/gm)];
  const blocks = sections.length >= 2 ? sections : [...body.matchAll(/^(\d+)\. (?:\*\*([^*]+?)\*\*|(.+))/gm)];
  // Tokens read as what they run; a plain step is named by its first sentence.
  const clean = (t) =>
    t
      .replace(/\{\{script:([a-z-]+)\}\}/g, 'mandao run $1')
      .replace(/\{\{command:([a-z-]+)\}\}/g, '/mandao-$1')
      .replace(/\{\{arg:(\w+)\}\}/g, '<$1>')
      .replace(/`/g, '')
      .split(/[.:;,](?:\s|$)/)[0]
      .trim();
  return blocks.map((m, i) => {
    const end = blocks[i + 1]?.index ?? body.length;
    const text = body.slice(m.index, end);
    // A heading is a title already; only a plain list item is cut to its first sentence.
    const title = sections.length >= 2 ? m[2].trim() : m[2] ? clean(m[2]) : clean(m[3]);
    const scripts = [...new Set([...text.matchAll(/\{\{script:([a-z-]+)\}\}/g)].map((s) => s[1]))];
    return { n: m[1], title, scripts, approval: /approv/i.test(title) };
  });
}

/** Where a command writes, from its frontmatter `outputs`, shortened for a box. */
const outputLabel = (path) =>
  path
    .replace(/\{\{paths\.specs\}\}\/<ID>(-<slug>)?/, 'specs/<ID>')
    .replace(/\{\{paths\.(\w+)\}\}/, (_, k) => ({ constitution: 'docs/constitution', releases: 'docs/releases' })[k] ?? k)
    .replace(/^<project>\//, '');

/** 5–15. One diagram per stable command: its steps, scripts, approval pause and what it writes. */
export function commandFlow(id) {
  return (read) => {
    const c = commands(read)[id];
    must(c.meta.status === 'stable' || undefined, `${id} is stable`);
    const steps = must(commandSteps(c.body), `${id} steps`);
    // Rows of four keep the canvas within Archify's 1240px readable width.
    const COLS = 4;
    const row = (i) => (i < COLS ? 'steps' : `steps-${Math.floor(i / COLS) + 1}`);
    must(steps.length <= 3 * COLS || undefined, `${id} has at most ${3 * COLS} steps`);
    const nodes = [];
    const edges = [];
    steps.forEach((s, i) => {
      const lane = row(i);
      const label = `${s.n}. ${short(s.title, 24)}`;
      const sub = s.scripts.length ? `mandao run ${s.scripts[0]}${s.scripts.length > 1 ? ` +${s.scripts.length - 1}` : ''}` : undefined;
      nodes.push({ id: `s${i}`, lane, col: i % COLS, type: s.approval ? STYLE.approval : STYLE.command, label, ...(sub ? { sublabel: sub } : {}), width: fit(label, sub) });
      if (i) edges.push({ id: `s${i - 1}-s${i}`, from: `s${i - 1}`, to: `s${i}` });
    });
    // A command that needs approval and has no approve step pauses after its last step.
    if (c.meta.approval === 'required' && !steps.some((s) => s.approval)) {
      const last = steps.length - 1;
      const lane = steps.length % COLS ? row(steps.length) : 'gate';
      const col = steps.length % COLS ? steps.length % COLS : last % COLS;
      nodes.push({ id: 'approve', lane, col, type: STYLE.approval, label: 'You approve', width: fit('You approve') });
      edges.push({ id: `s${last}-approve`, from: `s${last}`, to: 'approve' });
    }
    const outputs = [...new Set((c.meta.outputs ?? []).map((o) => outputLabel(o.path)).filter((p) => !p.startsWith('(')))].slice(0, COLS);
    const lastStep = `s${steps.length - 1}`;
    outputs.forEach((p, i) => {
      nodes.push({ id: `w${i}`, lane: 'writes', col: i, type: STYLE.file, label: p, width: fit(p) });
      // One arrow, straight down to the file under the last step: the files are a set, not a sequence.
      const below = Math.min((steps.length - 1) % COLS, outputs.length - 1);
      if (i === below) edges.push({ id: `${lastStep}-writes`, from: lastStep, to: `w${i}`, label: 'writes', variant: 'dashed' });
    });
    const rows = [...new Set(nodes.filter((n) => n.lane.startsWith('steps')).map((n) => n.lane))];
    const lanes = [
      ...rows.map((r, i) => ({ id: r, label: i ? 'Steps, continued' : 'Steps' })),
      ...(nodes.some((n) => n.lane === 'gate') ? [{ id: 'gate', label: 'Approval' }] : []),
      ...(outputs.length ? [{ id: 'writes', label: 'Writes' }] : []),
    ];
    return {
      schema_version: 2,
      diagram_type: 'workflow',
      meta: { title: `${cmd(id)}: inside`, output: `command-${id}.html`, quality_profile: 'showcase', legend: LEGEND },
      lanes,
      mainPath: steps.slice(0, Math.min(COLS, steps.length)).map((_, i) => `s${i}`),
      nodes,
      edges,
    };
  };
}

/** 16–22. One diagram per process in docs/process-map.md, with human approvals as their own step. */
export function processFlow(pid) {
  return (read) => {
    const p = must(frontmatter(read('docs/process-map.md')).processes?.find((x) => x.id === pid), `process ${pid}`);
    const known = commands(read);
    const nodes = [];
    const edges = [];
    let col = 0;
    let prev;
    for (const [i, s] of p.steps.entries()) {
      const base = s.command.split(' ')[0];
      must(known[base], `command ${base} in process ${pid}`);
      const label = cmd(s.command);
      const sub = { required: 'required', auto: 'on its own', optional: 'optional' }[s.mark] + (s.note ? ` · ${s.note}` : '');
      const id = `p${i}`;
      if (s.mark === 'auto' && prev) {
        // Triggers on its own: a side branch under the step that raises it.
        nodes.push({ id, lane: 'auto', col: Math.max(0, col - 1), type: STYLE.command, label, sublabel: sub, width: fit(label, sub) });
        edges.push({ id: `${prev}-${id}`, from: prev, to: id, label: 'when needed', variant: 'dashed', role: 'branch' });
        continue;
      }
      must(col < 6 || undefined, `process ${pid} fits six columns`);
      // A human approval is the step's `you approve` tag, as in the panorama.
      nodes.push({ id, lane: 'steps', col, type: STYLE.command, label, sublabel: sub, ...(s.approval ? { tag: 'you approve' } : {}), width: fit(label, sub) });
      if (prev) edges.push({ id: `${prev}-${id}`, from: prev, to: id, ...(s.mark === 'optional' ? { variant: 'dashed' } : {}) });
      prev = id;
      col++;
    }
    // A one-step process shows where it escalates: the command's first `flow.next`.
    if (nodes.length === 1) {
      const esc = must(known[p.steps[0].command.split(' ')[0]].meta.flow?.next?.at(-1), `${pid} escalation`);
      nodes.push({ id: 'esc', lane: 'steps', col: 1, type: STYLE.command, label: cmd(esc), sublabel: 'if it grows', width: fit(cmd(esc), 'if it grows') });
      edges.push({ id: 'p0-esc', from: 'p0', to: 'esc', label: 'escalates', variant: 'dashed' });
    }
    const lanes = [
      { id: 'steps', label: p.title },
      ...(nodes.some((n) => n.lane === 'auto') ? [{ id: 'auto', label: 'Triggers on its own' }] : []),
    ];
    return {
      schema_version: 2,
      diagram_type: 'workflow',
      meta: { title: p.title, output: `process-${pid}.html`, quality_profile: 'showcase', legend: LEGEND },
      lanes,
      mainPath: nodes.filter((n) => n.lane === 'steps').map((n) => n.id),
      nodes,
      edges,
    };
  };
}

export const STABLE_COMMANDS = ['init', 'constitution', 'story', 'specify', 'clarify', 'tasks', 'implement', 'verify', 'close', 'quick', 'resume'];
export const PROCESSES = ['setup', 'feature', 'epic', 'bug', 'hotfix', 'quick', 'maintenance'];

export const ALL_DIAGRAMS = {
  ...README_DIAGRAMS,
  ...Object.fromEntries(PROCESSES.map((p) => [`process-${p}`, processFlow(p)])),
  ...Object.fromEntries(STABLE_COMMANDS.map((c) => [`command-${c}`, commandFlow(c)])),
};
