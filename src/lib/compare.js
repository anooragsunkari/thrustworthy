// Two builds side by side. No React here, so the numbers can be tested under `node --test`.

import { SLOTS, partName } from '../data/parts.js';
import { buildFacts, legalChecklist } from '../data/legal.js';
import { sparesFor, sparesTotal } from '../data/spares.js';
import { check, flight, summarize } from './engine.js';
import { shopping } from './owned.js';

/** One build as the numbers compare cares about. `build` is { sel, goal, firmware, work }. */
function measure(build, region, owned) {
  const ctx = { firmware: build.firmware, goal: build.goal, region };
  const f = flight(build.sel, { goal: build.goal });
  const n = summarize(check(build.sel, ctx));
  const legal = region && f ? legalChecklist(region.id, buildFacts(build.sel, f, { work: build.work })) : null;
  const list = shopping(build.sel, owned);
  return {
    f,
    n,
    usd: list.total,
    toBuy: list.toBuy,
    saved: list.saved,
    spares: sparesTotal(sparesFor(build.sel, build.goal)),
    legal,
  };
}

// better: which direction wins. Weight has none, because lighter is not always the goal.
const row = (id, label, a, b, better = null) => {
  let winner = null;
  if (better && a !== null && b !== null && a !== b) winner = (better === 'high') === (a > b) ? 'a' : 'b';
  return { id, label, a, b, winner };
};

export function compareBuilds(a, b, region = null, owned = null) {
  const ma = measure(a, region, owned);
  const mb = measure(b, region, owned);
  const flown = (m, key) => (m.f ? m.f[key] : null);
  const rows = [
    row('weight', 'Weight', flown(ma, 'auw'), flown(mb, 'auw')),
    row('twr', 'Thrust-to-weight', flown(ma, 'twr'), flown(mb, 'twr'), 'high'),
    row('time', 'Flight time, flying (min)', flown(ma, 'flyMax'), flown(mb, 'flyMax'), 'high'),
    row('hover', 'Hover time (min)', flown(ma, 'hover'), flown(mb, 'hover'), 'high'),
    row('peak', 'Peak current (A)', flown(ma, 'peakA'), flown(mb, 'peakA')),
    row('cost', 'Parts cost', ma.usd, mb.usd, 'low'),
    ...(ma.saved || mb.saved ? [row('tobuy', 'Left to buy, after what you own', ma.toBuy, mb.toBuy, 'low')] : []),
    row('spares', 'Spares kit', ma.spares, mb.spares, 'low'),
    row('errors', 'Problems to fix', ma.n.errors, mb.n.errors, 'low'),
    row('warnings', 'Warnings', ma.n.warnings, mb.n.warnings, 'low'),
  ];
  if (ma.legal && mb.legal) rows.push(row('legal', 'Legal steps', ma.legal.length, mb.legal.length, 'low'));

  const parts = SLOTS.map((s) => {
    const pa = a.sel[s.key];
    const pb = b.sel[s.key];
    return { slot: s.key, label: s.label, a: pa ? partName(pa) : null, b: pb ? partName(pb) : null, same: (pa?.id || null) === (pb?.id || null) };
  }).filter((p) => p.a || p.b);
  const payload = (x) => x.sel.payload?.w || 0;
  if (payload(a) || payload(b)) {
    const name = (x) => (x.sel.payload ? `${x.sel.payload.m} (${x.sel.payload.w} g)` : null);
    parts.push({ slot: 'payload', label: 'Payload', a: name(a), b: name(b), same: name(a) === name(b) });
  }

  const titles = (list) => new Set((list || []).map((i) => i.title));
  const ta = titles(ma.legal);
  const tb = titles(mb.legal);
  return {
    rows,
    parts,
    changed: parts.filter((p) => !p.same).length,
    firmwareSame: a.firmware === b.firmware,
    legalOnlyA: (ma.legal || []).filter((i) => !tb.has(i.title)),
    legalOnlyB: (mb.legal || []).filter((i) => !ta.has(i.title)),
  };
}
