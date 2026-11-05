// What a person already has on their bench. It belongs to them and not to one build, so it lives
// beside the builds and every shopping list reads it. No React here, so it runs under `node --test`.

import { SLOTS, partById } from '../data/parts.js';
import { GOALS_FIRMWARE } from '../data/personas.js';
import { autofill, check, cost, loadBuild, summarize } from './engine.js';

export const MAX_OWNED = 99;

export function cleanOwned(raw) {
  const out = { parts: {}, gear: {} };
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, n] of Object.entries(raw.parts || {})) {
    const qty = Math.floor(Number(n));
    if (/^[\w.-]{1,60}$/.test(id) && qty >= 1) out.parts[id] = Math.min(qty, MAX_OWNED);
  }
  for (const [id, on] of Object.entries(raw.gear || {})) if (on === true) out.gear[id] = true;
  return out;
}

export const ownedQty = (owned, id) => owned?.parts?.[id] || 0;

/** Everything owned, as { part, qty }, in the order the configurator lists parts. Deleted parts drop out. */
export function ownedList(owned) {
  const slot = (p) => SLOTS.findIndex((s) => s.key === p.slot);
  return Object.entries(owned?.parts || {})
    .map(([id, qty]) => ({ part: partById(id), qty }))
    .filter((e) => e.part && e.part.slot)
    .sort((a, b) => slot(a.part) - slot(b.part));
}

/** The parts list for a build, split into what you have and what you still need to buy. */
export function shopping(sel, owned) {
  const c = cost(sel);
  const lines = c.lines.map((l) => {
    const own = Math.min(l.qty, ownedQty(owned, l.part.id));
    const buy = l.qty - own;
    return { ...l, own, buy, buyTotal: l.unit * buy };
  });
  const toBuy = lines.reduce((a, l) => a + l.buyTotal, 0);
  return { lines, total: c.total, toBuy, saved: c.total - toBuy, ownedCount: lines.filter((l) => l.own > 0).length };
}

// Goggles must match this build's video system and spare props are used up, so owning them is
// decided build by build. A charger or a soldering iron serves every build.
export const EVERY_BUILD_GEAR = (g) => !['goggles-digital', 'spares'].includes(g.id);

export const gearOwned = (g, project, owned) => !!project?.extras?.[g.id] || (EVERY_BUILD_GEAR(g) && !!owned?.gear?.[g.id]);

export const firmwareForGoal = (goal) => GOALS_FIRMWARE[goal] || 'Betaflight';

/** A new build made only from parts you own: what fits goes in, and the rest stays empty to choose. */
export function buildAround(owned, ctx) {
  return autofill({}, ctx, { owned: ownedList(owned), onlyOwned: true, withCompanion: ctx.firmware !== 'Betaflight' });
}

export const buildsUsing = (projects, id) => Object.values(projects || {}).filter((p) => Object.values(p.sel || {}).includes(id));

/** Builds using this part that the checker says cannot fly as they are. */
export const brokenBuilds = (projects, id) => buildsUsing(projects, id)
  .filter((p) => summarize(check(loadBuild(p), { firmware: p.firmware, goal: p.goal })).errors > 0);
