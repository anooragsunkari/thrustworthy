import { loadBuild, check, summarize, missing, traits } from './engine.js';
import { shopping } from './owned.js';
import { stepsFor } from '../data/assembly.js';
import { FW } from '../data/firmware.js';

/** The journey for one build: where it stands and what comes next. */
export function stages(p, logs = [], owned = null) {
  const sel = loadBuild(p);
  const ctx = { firmware: p.firmware, goal: p.goal };
  const n = summarize(check(sel, ctx));
  const configured = missing(sel).length === 0 && n.errors === 0;
  // A part you already own is ready without being ordered.
  const lines = shopping(sel, owned).lines;
  const ready = (l) => l.buy === 0 || !!p.have?.[l.slot];
  const partsDone = lines.length > 0 && lines.every(ready);
  const steps = stepsFor(traits(sel, p.firmware));
  const stepsDone = steps.filter((s) => p.steps?.[s.id]).length;
  const swSteps = FW[p.firmware]?.steps || [];
  const swDone = swSteps.filter((s) => p.software?.[s.id]).length;
  const flights = logs.filter((l) => l.project === p.id).length;

  const list = [
    { key: 'configure', title: 'Configure', detail: 'Pick compatible parts', done: configured, to: `/configure/${p.id}` },
    { key: 'parts', title: 'Get parts', detail: `${lines.filter(ready).length} of ${lines.length} parts ready`, done: partsDone, to: `/p/${p.id}/parts` },
    { key: 'build', title: 'Build', detail: `${stepsDone} of ${steps.length} steps`, done: steps.length > 0 && stepsDone === steps.length, to: `/p/${p.id}/assemble` },
    { key: 'software', title: 'Set up software', detail: `${swDone} of ${swSteps.length} steps`, done: swSteps.length > 0 && swDone === swSteps.length, to: `/p/${p.id}/setup` },
    { key: 'fly', title: 'Fly', detail: flights ? `${flights} flights logged` : 'Pre-flight, then log your first flight', done: flights > 0, to: `/p/${p.id}/fly` },
    { key: 'share', title: 'Share', detail: 'Publish or send your build', done: !!p.shared, to: `/p/${p.id}/share` },
  ];
  const next = list.find((s) => !s.done) || null;
  const pct = Math.round((list.filter((s) => s.done).length / list.length) * 100);
  return { list, next, pct, n };
}

export const BADGES = [
  { id: 'planner', title: 'Planner', text: 'Finished a compatible build' },
  { id: 'gathered', title: 'Parts Ready', text: 'Got every part for a build' },
  { id: 'builder', title: 'First Build Complete', text: 'Finished every assembly step' },
  { id: 'flashed', title: 'Software Set', text: 'Finished firmware setup' },
  { id: 'pilot', title: 'First Flight', text: 'Logged your first flight' },
  { id: 'sharer', title: 'Open Builder', text: 'Shared a build' },
  { id: 'ten', title: 'Ten Flights', text: 'Logged ten flights' },
];

export function earned(state) {
  const set = new Set();
  const projects = Object.values(state.projects);
  for (const p of projects) {
    for (const s of stages(p, state.logs, state.owned).list) {
      if (!s.done) continue;
      if (s.key === 'configure') set.add('planner');
      if (s.key === 'parts') set.add('gathered');
      if (s.key === 'build') set.add('builder');
      if (s.key === 'software') set.add('flashed');
      if (s.key === 'fly') set.add('pilot');
      if (s.key === 'share') set.add('sharer');
    }
  }
  if (state.logs.length >= 10) set.add('ten');
  return set;
}
