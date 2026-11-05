import React, { useState } from 'react';
import { A, Ext, PageHead, useToast } from '../components/ui.jsx';
import { toggleIn, updateProject, useStore } from '../lib/store.js';
import { copyText, downloadFile, grams, t } from '../lib/util.js';
import { BUILDS, buildById } from '../data/builds.js';
import { money, regionById, storeLinks } from '../data/regions.js';
import { AFTER_CRASH, AFTER_REPAIR, sparesFor, sparesTotal } from '../data/spares.js';
import { stepsFor } from '../data/assembly.js';
import { compareBuilds } from '../lib/compare.js';
import { check, loadBuild, resolve, summarize, traits } from '../lib/engine.js';
import { starterSettings } from '../lib/settings.js';
import { wiringPlan } from '../lib/wiring.js';

const notFound = () => <div className="wrap"><PageHead title={t('Build not found')} sub={t('It may be on another device, because builds are saved on the device that made them.')} back="/me" /></div>;

function SpareRow({ item, steps, region, done, onToggle }) {
  const repairs = item.steps.map((sid) => steps.find((s) => s.id === sid)).filter(Boolean);
  const shop = item.query && storeLinks(region, item.query)[0];
  return (
    <div className={`check ${done ? 'done' : ''}`}>
      <input type="checkbox" aria-label={t(item.title)} checked={done} onChange={onToggle} />
      <details className="grow" style={{ marginTop: -10, marginBottom: -10 }}>
        <summary className="title" style={{ fontWeight: 500 }}>
          <span className="grow">{item.title}<div className="small muted num" style={{ fontWeight: 400 }}>{money(item.usd, region)}</div></span>
        </summary>
        <div className="stack small" style={{ paddingBottom: 12 }}>
          {item.part && <div className="muted">{item.part}</div>}
          <p>{item.why}</p>
          {shop && <div><Ext href={shop.url} className="chip accent">{t('Search {shop}', { shop: shop.name })}</Ext></div>}
          {repairs.map((s) => (
            <div key={s.id}>
              <b>{t('Repair: {step}', { step: s.title })}</b>
              <ol className="numbered" style={{ marginTop: 4 }}>{s.do.map((d) => <li key={d}>{d}</li>)}</ol>
            </div>
          ))}
        </div>
      </details>
    </div>
  );
}

export function Spares({ id }) {
  const state = useStore();
  const p = state.projects[id];
  if (!p) return notFound();
  const region = regionById(state.profile.region);
  const sel = loadBuild(p);
  const items = sparesFor(sel, p.goal);
  const steps = stepsFor(traits(sel, p.firmware));
  const now = items.filter((i) => i.tier === 'now');
  const later = items.filter((i) => i.tier === 'later');
  const row = (i) => <SpareRow key={i.id} item={i} steps={steps} region={region} done={!!p.spares?.[i.id]} onToggle={() => toggleIn(id, 'spares', i.id)} />;
  return (
    <div className="wrap narrow">
      <PageHead title={t('Spares and repairs')} sub={p.name} back={`/p/${id}`} />
      {!sel.frame && <div className="note" style={{ marginTop: 14 }}>{t('Nothing here yet.')} <A to={`/configure/${id}`} className="link">{t('Pick your parts')}</A></div>}
      <section className="section" style={{ marginTop: 18 }}>
        <h2 style={{ marginBottom: 10 }}>{t('After every crash')}</h2>
        <ol className="card numbered small">{AFTER_CRASH.map((x) => <li key={x}>{x}</li>)}</ol>
      </section>
      <section className="section">
        <div className="row between" style={{ marginBottom: 4 }}>
          <h2>{t('Keep these in the box')}</h2>
          <b className="num">{money(sparesTotal(items), region)}</b>
        </div>
        <p className="small muted" style={{ marginBottom: 10 }}>{t('Cheap parts that fail often. Tick what you have, and open any row for how to repair it.')}</p>
        <div className="list">{now.map(row)}</div>
      </section>
      <section className="section">
        <h2 style={{ marginBottom: 4 }}>{t('Buy these when they break')}</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>{t('Expensive, or rarely the part that fails. There is no need to keep them on a shelf.')}</p>
        <div className="list">{later.map(row)}</div>
      </section>
      <div className="note warn section"><b>{t('After a repair')}</b>{AFTER_REPAIR}</div>
      <p className="tiny muted" style={{ marginTop: 10 }}>{t('Quantities are rules of thumb for this style of flying, and prices are rough estimates. Your crashes may vary.')}</p>
    </div>
  );
}

const sourcesOf = (projects) => [
  ...Object.values(projects).sort((a, b) => b.updated - a.updated).map((p) => ({ key: `p.${p.id}`, name: p.name, group: 'My builds' })),
  ...BUILDS.map((b) => ({ key: `g.${b.id}`, name: b.title, group: 'Reference builds' })),
];

function loadSource(key, projects) {
  const id = (key || '').slice(2);
  if ((key || '').startsWith('p.') && projects[id]) {
    const p = projects[id];
    return { name: p.name, sel: loadBuild(p), goal: p.goal, firmware: p.firmware, work: p.use === 'work', to: `/p/${id}` };
  }
  const b = (key || '').startsWith('g.') && buildById(id);
  return b ? { name: b.title, sel: resolve(b.sel), goal: b.goal, firmware: b.firmware, work: false, to: `/builds/${id}` } : null;
}

function SourcePick({ label, value, onChange, sources }) {
  const groups = ['My builds', 'Reference builds'].filter((g) => sources.some((s) => s.group === g));
  return (
    <label className="field"><span>{label}</span>
      <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
        {groups.map((g) => <optgroup key={g} label={t(g)}>{sources.filter((s) => s.group === g).map((s) => <option key={s.key} value={s.key}>{s.name}</option>)}</optgroup>)}
      </select>
    </label>
  );
}

export function Compare({ a: startA, b: startB }) {
  const { projects, profile } = useStore();
  const region = regionById(profile.region);
  const sources = sourcesOf(projects);
  const has = (k) => sources.some((s) => s.key === k);
  const firstA = has(startA) ? startA : sources[0].key;
  const [a, setA] = useState(firstA);
  const [b, setB] = useState(has(startB) ? startB : sources.find((s) => s.key !== firstA).key);
  const A1 = loadSource(a, projects);
  const B1 = loadSource(b, projects);
  if (!A1 || !B1) return notFound();
  const c = compareBuilds(A1, B1, region);
  const show = {
    weight: (v) => grams(v),
    twr: (v) => `${v.toFixed(1)}:1`,
    time: (v) => `${Math.round(v)}`,
    hover: (v) => `${Math.round(v)}`,
    peak: (v) => `${Math.round(v)}`,
    cost: (v) => money(v, region),
    spares: (v) => money(v, region),
  };
  const fmt = (r, v) => (v === null ? '–' : (show[r.id] ? show[r.id](v) : `${v}`));
  const same = c.parts.filter((x) => x.same);
  const changed = c.parts.filter((x) => !x.same);
  return (
    <div className="wrap narrow">
      <PageHead title={t('Compare builds')} sub={t('See what a change really does, before you buy anything.')} back="/me" />
      <div className="cmp-pick" style={{ marginTop: 14 }}>
        <SourcePick label={t('First')} value={a} onChange={setA} sources={sources} />
        <SourcePick label={t('Second')} value={b} onChange={setB} sources={sources} />
      </div>
      {a === b && <div className="note" style={{ marginTop: 12 }}>{t('These are the same build. Pick a different one to compare.')}</div>}
      <section className="section" style={{ marginTop: 18 }}>
        <div className="list">
          <div className="cmp-row cmp-head small"><b>{A1.name}</b><b>{B1.name}</b></div>
          {c.rows.map((r) => (
            <div className="cmp-row" key={r.id}>
              <div className="cmp-label small muted">{t(r.label)}</div>
              <div className={`num ${r.winner === 'a' ? 'cmp-win' : ''}`}>{fmt(r, r.a)}</div>
              <div className={`num ${r.winner === 'b' ? 'cmp-win' : ''}`}>{fmt(r, r.b)}</div>
            </div>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>{t('The better value is in bold where one is clearly better. Weight and peak current depend on what you want from the build. Times and thrust are estimates.')}</p>
      </section>
      {!c.firmwareSame && <div className="note section">{t('These builds use different firmware: {a} and {b}.', { a: A1.firmware, b: B1.firmware })}</div>}
      {(c.legalOnlyA.length > 0 || c.legalOnlyB.length > 0) && (
        <section className="section">
          <h2 style={{ marginBottom: 10 }}>{t('Legal differences')}</h2>
          <div className="card stack small">
            {c.legalOnlyA.length > 0 && <div><b>{t('Only {name} needs', { name: A1.name })}</b><ul className="bullets" style={{ marginTop: 4 }}>{c.legalOnlyA.map((i) => <li key={i.id}>{i.title}</li>)}</ul></div>}
            {c.legalOnlyB.length > 0 && <div><b>{t('Only {name} needs', { name: B1.name })}</b><ul className="bullets" style={{ marginTop: 4 }}>{c.legalOnlyB.map((i) => <li key={i.id}>{i.title}</li>)}</ul></div>}
          </div>
        </section>
      )}
      <section className="section">
        <h2 style={{ marginBottom: 10 }}>{t('Different parts ({n})', { n: changed.length })}</h2>
        {!changed.length && <div className="note">{t('Both builds use the same parts.')}</div>}
        <div className="list">
          {changed.length > 0 && <div className="cmp-row cmp-head small"><b>{A1.name}</b><b>{B1.name}</b></div>}
          {changed.map((x) => (
            <div className="cmp-row" key={x.slot}>
              <div className="cmp-label small muted">{t(x.label)}</div>
              <div className="small">{x.a || t('None')}</div>
              <div className="small">{x.b || t('None')}</div>
            </div>
          ))}
        </div>
        {same.length > 0 && (
          <details className="card" style={{ marginTop: 12 }}>
            <summary>{t('Parts in common ({n})', { n: same.length })}</summary>
            <ul className="small stack" style={{ marginTop: 6 }}>{same.map((x) => <li key={x.slot}><span className="muted">{t(x.label)}</span><div>{x.a}</div></li>)}</ul>
          </details>
        )}
      </section>
      <section className="section btn-row">
        <A to={A1.to} className="btn secondary">{t('Open {name}', { name: A1.name })}</A>
        <A to={B1.to} className="btn secondary">{t('Open {name}', { name: B1.name })}</A>
      </section>
    </div>
  );
}

const WIRE = { battery: 'var(--err)', ground: 'var(--ink)', five: 'var(--warn)', signal: 'var(--muted)' };

function Box({ x, y, w, h, title, sub }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="10" fill="var(--surface)" stroke="var(--line)" />
      <text x={x + w / 2} y={sub ? y + h / 2 - 3 : y + h / 2 + 4} textAnchor="middle" fontSize="13" fontWeight="600" fill="var(--ink)">{title}</text>
      {sub && <text x={x + w / 2} y={y + h / 2 + 13} textAnchor="middle" fontSize="11" fill="var(--muted)">{sub}</text>}
    </g>
  );
}

const Feed = ({ x, y1, y2 }) => (
  <g strokeWidth="2.5">
    <line x1={x - 8} y1={y1} x2={x - 8} y2={y2} stroke={WIRE.battery} />
    <line x1={x + 8} y1={y1} x2={x + 8} y2={y2} stroke={WIRE.ground} />
    <text x={x - 14} y={(y1 + y2) / 2 + 4} textAnchor="end" fontSize="12" fill={WIRE.battery}>+</text>
    <text x={x + 14} y={(y1 + y2) / 2 + 4} fontSize="12" fill="var(--ink)">−</text>
  </g>
);

/** Battery, through any power module, to the ESC and every motor. */
function PowerDiagram({ sel, power, mc }) {
  const single = power.aio;
  const escX = single ? 80 : 14;
  const escW = single ? 180 : 170;
  const feedX = escX + escW / 2;
  let y = 8;
  const batY = y;
  y += 44 + 34;
  const pmY = power.pm ? y : null;
  if (power.pm) y += 40 + 30;
  const escY = y;
  const motorsY = escY + 52 + 62;
  const H = motorsY + 30;
  const spot = (i) => (mc === 1 ? 170 : 26 + (i * 288) / (mc - 1));
  return (
    <svg viewBox={`0 0 340 ${H}`} className="diagram" role="img" aria-label={t('Power wiring from the battery to the motors')}>
      <Box x={feedX - 80} y={batY} w={160} h={44} title={t('Battery')} sub={`${sel.battery.c}S ${sel.battery.ch} · ${sel.battery.cn}`} />
      {power.pm && <Box x={feedX - 80} y={pmY} w={160} h={40} title={t('Power module')} />}
      <Feed x={feedX} y1={batY + 44} y2={power.pm ? pmY : escY} />
      {power.pm && <Feed x={feedX} y1={pmY + 40} y2={escY} />}
      {power.capacitor && (
        <text x={feedX + 28} y={batY + 44 + 21} fontSize="11" fill="var(--muted)">{t('Capacitor here')}</text>
      )}
      <Box x={escX} y={escY} w={escW} h={52} title={t(single ? 'All-in-one board' : power.single ? `${mc} ESCs` : '4-in-1 ESC')} sub={power.single ? t('One per motor') : undefined} />
      {!single && (
        <g>
          <Box x={206} y={escY} w={120} h={52} title={t('Flight controller')} />
          <line x1={escX + escW} y1={escY + 26} x2={206} y2={escY + 26} stroke={WIRE.signal} strokeWidth="2" strokeDasharray="4 3" />
          {power.pm && <path d={`M${feedX + 80} ${pmY + 20} H266 V${escY}`} fill="none" stroke={WIRE.signal} strokeWidth="2" strokeDasharray="4 3" />}
        </g>
      )}
      {Array.from({ length: mc }, (_, i) => (
        <g key={i}>
          <line x1={feedX} y1={escY + 52} x2={spot(i)} y2={motorsY - 14} stroke="var(--faint)" strokeWidth="2" />
          <circle cx={spot(i)} cy={motorsY} r="14" fill="var(--surface)" stroke="var(--ink)" />
          <text x={spot(i)} y={motorsY + 4} textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--ink)">{`M${i + 1}`}</text>
        </g>
      ))}
    </svg>
  );
}

/** The aircraft from above, with its front at the top. */
function MotorMap({ motors }) {
  const c = 150;
  const R = 100;
  const at = (deg, r) => { const a = (deg * Math.PI) / 180; return [c + Math.sin(a) * r, c - Math.cos(a) * r]; };
  return (
    <svg viewBox="0 0 300 300" className="diagram motor-map" role="img" aria-label={t('Motor numbers and spin directions, seen from above')}>
      <defs>
        <marker id="spin-head" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7z" fill="var(--ink)" /></marker>
      </defs>
      <path d="M150 6l9 13h-18z" fill="var(--ink)" />
      <text x="150" y="33" textAnchor="middle" fontSize="11" fontWeight="600" fill="var(--muted)">{t('FRONT')}</text>
      {motors.map((m) => { const [x, y] = at(m.deg, R); return <line key={m.n} x1={c} y1={c} x2={x} y2={y} stroke="var(--faint)" strokeWidth="5" strokeLinecap="round" />; })}
      <rect x="128" y="120" width="44" height="60" rx="10" fill="var(--surface)" stroke="var(--line)" />
      {motors.map((m) => {
        const [x, y] = at(m.deg, R);
        const r = 27;
        const cw = m.dir === 'CW';
        const start = (cw ? -60 : 60) * (Math.PI / 180);
        const end = (cw ? 60 : -60) * (Math.PI / 180);
        const p = (a) => `${(x + Math.sin(a) * r).toFixed(1)} ${(y - Math.cos(a) * r).toFixed(1)}`;
        return (
          <g key={m.n}>
            <circle cx={x} cy={y} r="20" fill="var(--bg)" stroke="var(--ink)" strokeWidth="1.5" />
            <text x={x} y={y + 1} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--ink)">{m.n}</text>
            <text x={x} y={y + 12} textAnchor="middle" fontSize="9" fill="var(--muted)">{m.dir}</text>
            <path d={`M${p(start)} A${r} ${r} 0 0 ${cw ? 1 : 0} ${p(end)}`} fill="none" stroke="var(--ink)" strokeWidth="1.5" markerEnd="url(#spin-head)" />
          </g>
        );
      })}
    </svg>
  );
}

function WirePair({ device, sideB }) {
  const rowH = 30;
  const top = 34;
  const H = top + device.wires.length * rowH + 6;
  return (
    <svg viewBox={`0 0 340 ${H}`} className="diagram" role="img" aria-label={t('{a} wires to {b}', { a: device.label, b: sideB })}>
      <rect x="4" y="4" width="112" height={H - 8} rx="10" fill="var(--surface)" stroke="var(--line)" />
      <rect x="224" y="4" width="112" height={H - 8} rx="10" fill="var(--surface)" stroke="var(--line)" />
      <text x="60" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{device.key === 'companion' ? t('Computer') : t(device.label)}</text>
      <text x="280" y="24" textAnchor="middle" fontSize="12" fontWeight="600" fill="var(--ink)">{sideB}</text>
      {device.wires.map((w, i) => {
        const y = top + i * rowH + 15;
        return (
          <g key={`${w.from}${w.to}`}>
            <text x="108" y={y + 4} textAnchor="end" fontSize="12" fill="var(--ink)">{w.from}</text>
            <text x="232" y={y + 4} fontSize="12" fill="var(--ink)">{w.to}</text>
            <line x1="116" y1={y} x2="224" y2={y} stroke={WIRE[w.kind]} strokeWidth="2.5" strokeDasharray={w.optional ? '5 4' : undefined} />
          </g>
        );
      })}
    </svg>
  );
}

export function Wiring({ id }) {
  const state = useStore();
  const p = state.projects[id];
  if (!p) return notFound();
  const sel = loadBuild(p);
  const plan = wiringPlan(sel, p.firmware, p.ports);
  const fcName = sel.fc ? t('Flight controller') : '';
  const choose = (key, port) => updateProject(id, { ports: { ...plan.ports, [key]: port } });
  return (
    <div className="wrap narrow">
      <PageHead title={t('Wiring diagram')} sub={p.name} back={`/p/${id}`} />
      {(!sel.fc || !sel.battery) && <div className="note" style={{ marginTop: 14 }}>{t('Pick your flight controller and battery first, because the wiring depends on them.')} <A to={`/configure/${id}`} className="link">{t('Pick your parts')}</A></div>}
      <div className="note warn" style={{ marginTop: 14 }}><b>{t('Check this against your board\'s manual')}</b>{t('This shows what connects to what. Pad names and positions differ between boards, and the manual for your exact board always wins.')}</div>

      {plan.power && (
        <section className="section" style={{ marginTop: 22 }}>
          <h2 style={{ marginBottom: 10 }}>{t('Power')}</h2>
          <div className="card"><PowerDiagram sel={sel} power={plan.power} mc={plan.mc} /></div>
          <ol className="numbered small" style={{ marginTop: 12 }}>{plan.power.steps.map((s) => <li key={s}>{t(s)}</li>)}</ol>
          <ul className="bullets small" style={{ marginTop: 8 }}>
            {plan.power.capacitor && <li>{t('Add a low-ESR capacitor across the battery pads: at least {min} µF and {v} V, with its stripe to negative.', { min: plan.power.capacitor.min, v: plan.power.capacitor.volts })}</li>}
            {plan.power.awg && <li>{t('Use about {awg} AWG wire for the battery lead. Peak current is near {a} A, and this is a rule of thumb.', { awg: plan.power.awg, a: Math.round(plan.power.peak) })}</li>}
          </ul>
          <div className="note err" style={{ marginTop: 12 }}><b>{t('Reversed polarity destroys boards instantly')}</b>{t('Check + and − with a multimeter, and use a smoke stopper for the first power-up.')}</div>
        </section>
      )}

      <section className="section">
        <h2 style={{ marginBottom: 4 }}>{t('Motor order for {fw}', { fw: p.firmware })}</h2>
        {plan.motors ? (
          <>
            <p className="small muted" style={{ marginBottom: 10 }}>{t('Seen from above, with the front at the top. Each firmware numbers motors differently.')}</p>
            <div className="card"><MotorMap motors={plan.motors} /></div>
            <div className="list" style={{ marginTop: 12 }}>
              {[...plan.motors].sort((a, b) => a.n - b.n).map((m) => (
                <div className="li" key={m.n} style={{ minHeight: 44 }}>
                  <b className="num" style={{ width: 24 }}>{m.n}</b>
                  <span className="grow">{t(m.where)}{plan.mc === 8 ? ` (${m.deg}°)` : ''}</span>
                  <span className="small muted">{t(m.dir === 'CW' ? 'Clockwise' : 'Counter-clockwise')}</span>
                </div>
              ))}
            </div>
            {['Betaflight', 'INAV'].includes(p.firmware) && <p className="tiny muted" style={{ marginTop: 8 }}>{t('These directions are the firmware default, called props in. Many pilots turn on the reversed setting for props out, which flips every direction, so match your setting.')}</p>}
            <p className="tiny muted" style={{ marginTop: 8 }}>{t('Pads labeled M1 to M4 do not always reach the same motor number. The motor test with props off is what proves it.')}</p>
          </>
        ) : <div className="note">{t('We have not checked the motor order for this frame on {fw}. Follow the mixer diagram in its setup tool.', { fw: p.firmware })}</div>}
      </section>

      {plan.devices.length > 0 && sel.fc && (
        <section className="section">
          <h2 style={{ marginBottom: 4 }}>{t('Connections')}</h2>
          <p className="small muted" style={{ marginBottom: 10 }}>{t('Choose ports that exist on your board and are free. Your starter settings use the same choices.')}</p>
          {plan.conflicts.length > 0 && <div className="note err" style={{ marginBottom: 12 }}><b>{t('Two devices share a port')}</b>{t('Each one needs its own: {ports}.', { ports: plan.conflicts.join(', ') })}</div>}
          {plan.unassigned.length > 0 && <div className="note err" style={{ marginBottom: 12 }}><b>{t('Not enough serial ports')}</b>{plan.unassigned.join(', ')}</div>}
          <div className="stack">
            {plan.devices.map((d) => (
              <div className="card stack" key={d.key}>
                <div className="row between" style={{ flexWrap: 'nowrap', gap: 12 }}>
                  <span className="grow"><h3>{t(d.label)}</h3><div className="small muted">{d.name}</div></span>
                  <select className="input" style={{ width: 'auto', minHeight: 40, flex: 'none' }} aria-label={t('Port for {name}', { name: d.label })} value={d.port || ''} onChange={(e) => choose(d.key, e.target.value)}>
                    {!d.port && <option value="">{t('None free')}</option>}
                    {d.options.map((o) => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <WirePair device={d} sideB={fcName} />
                <ul className="bullets small">{d.notes.map((n) => <li key={n}>{t(n)}</li>)}</ul>
              </div>
            ))}
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>{t('Red is battery voltage, orange is 5 V, dark is ground, and grey is signal. Dashed wires are optional.')}</p>
        </section>
      )}
      <section className="section btn-row no-print">
        <button className="btn secondary" onClick={() => window.print()}>{t('Print or save PDF')}</button>
        <A to={`/p/${id}/settings`} className="btn">{t('Starter settings')}</A>
      </section>
    </div>
  );
}

export function StarterSettings({ id }) {
  const state = useStore();
  const p = state.projects[id];
  const [toast, setToast] = useToast();
  if (!p) return notFound();
  const sel = loadBuild(p);
  const region = regionById(state.profile.region);
  const out = starterSettings(p, sel);
  const n = summarize(check(sel, { firmware: p.firmware, goal: p.goal, region }));
  return (
    <div className="wrap narrow">
      <PageHead title={t('Starter settings')} sub={p.name} back={`/p/${id}`} />
      {!out.ok && <div className="note" style={{ marginTop: 14 }}>{t(out.reason)} <A to={`/configure/${id}`} className="link">{t('Pick your parts')}</A></div>}
      {out.ok && (
        <>
          <div className="note warn" style={{ marginTop: 14 }}><b>{t('Keep the props off')}</b>{t('This is a starting point for {fw} {v}, with no tuning. We checked the setting names against the firmware, but this exact file has not been run on your board. Read each line, then test with the props off.', { fw: p.firmware, v: out.version })}</div>
          {n.errors > 0 && <div className="note err" style={{ marginTop: 12 }}><b>{t('This build has problems to fix')}</b><A to={`/configure/${id}`} className="link">{t('Fix them before you use these settings')}</A></div>}
          <section className="section" style={{ marginTop: 22 }}>
            <h2 style={{ marginBottom: 10 }}>{t('How to use it')}</h2>
            <ol className="card numbered small">{out.steps.map((s) => <li key={s}>{t(s)}</li>)}</ol>
          </section>
          <section className="section">
            <div className="row between" style={{ marginBottom: 10 }}>
              <h2>{t('Your file')}</h2>
              <A to={`/p/${id}/wiring`} className="link small">{t('Change ports')}</A>
            </div>
            <pre className="code" tabIndex="0">{out.text}</pre>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn" onClick={async () => setToast((await copyText(out.text)) ? t('Copied') : t('Could not copy'))}>{t('Copy')}</button>
              <button className="btn secondary" onClick={() => downloadFile(out.filename, out.text)}>{t('Download {name}', { name: out.filename })}</button>
            </div>
          </section>
          <section className="section">
            <h2 style={{ marginBottom: 4 }}>{t('Set these by hand')}</h2>
            <p className="small muted" style={{ marginBottom: 10 }}>{t('They depend on your exact board or your choices, so they are not in the file.')}</p>
            <ul className="card bullets small">{out.manual.map((m) => <li key={m}>{t(m)}</li>)}</ul>
          </section>
          <A to={`/p/${id}/setup`} className="btn secondary block section">{t('Back to the setup guide')}</A>
        </>
      )}
      {toast}
    </div>
  );
}
