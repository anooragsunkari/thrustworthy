import React, { useMemo, useState } from 'react';
import { A, Icon, Issue, PageHead, Sheet, SpringNum, useToast } from '../components/ui.jsx';
import { PartForm } from '../components/PartForm.jsx';
import { useStore, createProject, updateProject } from '../lib/store.js';
import { go, grams, minutes, t } from '../lib/util.js';
import { FIRMWARES, GOALS, SLOTS, partName } from '../data/parts.js';
import { BUILDS } from '../data/builds.js';
import { regionById, money } from '../data/regions.js';
import { personaById } from '../data/personas.js';
import { autofill, check, flight, isIncluded, missing, partQty, rate, summarize, toIds, allUpWeight, loadBuild } from '../lib/engine.js';
import { PAYLOAD_PRESETS } from '../lib/custom.js';
import { firmwareForGoal, ownedList, ownedQty, shopping } from '../lib/owned.js';

const specLine = (slot, p) => {
  switch (slot) {
    case 'frame': return `${p.wheel} mm · ${p.mc} ${t('motors')} · ${t('up to')} ${p.maxProp}" · ${p.w} g`;
    case 'motor': return `${p.sz} · ${p.kv} KV · ${p.cMin === p.cMax ? p.cMin : `${p.cMin}–${p.cMax}`}S · ${p.w} g`;
    case 'esc': return `${p.t === '4in1' ? '4-in-1' : t('Single')} · ${p.a} A · ${p.cMin}–${p.cMax}S · ${p.fw}`;
    case 'fc': return `${p.mcu} · ${p.fw.join(', ')}`;
    case 'prop': return `${p.d}" · ${p.bl} ${t('blades')}`;
    case 'battery': return `${p.c}S ${p.ch} · ${p.cap} mAh · ${p.dr}C · ${p.w} g`;
    case 'video': return p.sys === 'None' ? '' : `${p.sys} · ${p.lat} ms · ${p.w} g`;
    case 'rx': return `${p.proto} · ${p.band === 'sub' ? '868/915 MHz' : '2.4 GHz'}`;
    case 'gps': return `${p.chip} · ${p.w} g`;
    case 'companion': return `${t(p.ros)} · ${p.w} g`;
    default: return '';
  }
};

export function ConfigureEntry() {
  const state = useStore();
  const { profile } = state;
  const projects = Object.values(state.projects).sort((a, b) => b.updated - a.updated);
  const persona = personaById(profile.persona);
  const fresh = (goal, firmware) => {
    const id = createProject({ name: t('My build'), goal, firmware: profile.firmware || firmware || persona?.firmware || 'Betaflight' });
    go(`/configure/${id}`);
  };
  return (
    <div className="wrap narrow">
      <PageHead title={t('Configure')} sub={t('Pick parts and watch the numbers change. Bad combinations get flagged before you buy anything.')} />
      {!!projects.length && (
        <section className="section" style={{ marginTop: 18 }}>
          <h2>{t('Keep going')}</h2>
          <div className="list">
            {projects.map((p) => (
              <A key={p.id} to={`/configure/${p.id}`} className="li">
                <span className="grow"><div className="title">{p.name}</div><div className="sub">{p.firmware} · {t(GOALS.find((g) => g.id === p.goal)?.label || '')}</div></span>
                <Icon name="chev" className="chev" />
              </A>
            ))}
          </div>
        </section>
      )}
      <A to="/gear" className="card tap row between" style={{ marginTop: 18, flexWrap: 'nowrap' }}>
        <span className="grow"><h3>{t('Start from what you have')}</h3><span className="small muted">{t('Tell us what is on your bench, and build around it.')}</span></span>
        <Icon name="chev" className="chev" />
      </A>
      <section className="section">
        <h2>{t('Start from a blank build')}</h2>
        <p className="muted small" style={{ marginBottom: 12 }}>{t('What do you want it to do?')}</p>
        <div className="list">
          {GOALS.map((g) => (
            <button key={g.id} className="li" onClick={() => fresh(g.id, firmwareForGoal(g.id))}>
              <span className="grow title">{t(g.label)}</span><Icon name="chev" className="chev" />
            </button>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>{t('Or start from a working build')}</h2>
        <div className="list">
          {BUILDS.map((b) => (
            <A key={b.id} to={`/builds/${b.id}`} className="li">
              <span className="grow"><div className="title">{t(b.title)}</div><div className="sub">{t(b.type)} · {b.firmware}</div></span><Icon name="chev" className="chev" />
            </A>
          ))}
        </div>
      </section>
    </div>
  );
}

export function Configure({ id }) {
  const state = useStore();
  const p = state.projects[id];
  const region = regionById(state.profile.region);
  const [open, setOpen] = useState(null);
  const [altitude, setAltitude] = useState(0);
  const [toast, setToast] = useToast();

  const sel = useMemo(() => (p ? loadBuild(p) : {}), [p, state.customParts]);
  if (!p) return <div className="wrap"><PageHead title={t('Build not found')} back="/configure" /></div>;

  const ctx = { firmware: p.firmware, goal: p.goal, region };
  const issues = check(sel, ctx);
  const n = summarize(issues);
  const f = flight(sel, { goal: p.goal, altitude });
  const c = shopping(sel, state.owned);
  const miss = missing(sel);
  const auw = allUpWeight(sel).total;
  const setPart = (slot, part) => {
    const next = { ...p.sel };
    if (part) next[slot] = part.id; else delete next[slot];
    updateProject(p.id, { sel: next });
  };
  const fill = () => {
    const out = autofill(sel, ctx, { withCompanion: false, owned: ownedList(state.owned) });
    updateProject(p.id, { sel: toIds(out) });
    setToast(t('Filled in the rest with parts that suit this frame'));
  };
  const status = n.errors ? { cls: 'err', label: t('{n} to fix', { n: n.errors }) } : miss.length ? { cls: '', label: t('{n} parts to pick', { n: miss.length }) } : n.warnings ? { cls: 'warn', label: t('Works, with notes') } : { cls: 'ok', label: t('Compatible') };

  return (
    <div className="wrap narrow">
      <PageHead title={p.name} back={`/p/${p.id}`} />
      <div className="grid two" style={{ marginTop: 12 }}>
        <label className="field"><span>{t('Build name')}</span><input className="input" value={p.name} maxLength={60} onChange={(e) => updateProject(p.id, { name: e.target.value })} /></label>
        <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'nowrap' }}>
          <label className="field" style={{ flex: '1 1 0', minWidth: 0 }}><span>{t('Used for')}</span>
            <select className="input" value={p.goal} onChange={(e) => updateProject(p.id, { goal: e.target.value })}>
              {GOALS.map((g) => <option key={g.id} value={g.id}>{t(g.label)}</option>)}
            </select>
          </label>
          <label className="field" style={{ flex: '1 1 0', minWidth: 0 }}><span>{t('Firmware')}</span>
            <select className="input" value={p.firmware} onChange={(e) => updateProject(p.id, { firmware: e.target.value })}>
              {FIRMWARES.map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
        </div>
      </div>

      <section className="section" style={{ marginTop: 20 }}>
        <div className="list">
          {SLOTS.map((s) => {
            const inc = isIncluded(sel, s.key);
            const part = sel[s.key];
            const bad = issues.filter((i) => i.parts.includes(s.key));
            const level = bad.some((i) => i.level === 'error') ? 'err' : bad.some((i) => i.level === 'warn') ? 'warn' : part ? 'ok' : '';
            const line = c.lines.find((l) => l.slot === s.key);
            return (
              <button key={s.key} className="li" onClick={() => setOpen(s.key)} disabled={inc} style={inc ? { opacity: .7, cursor: 'default' } : undefined}>
                <i className={`dot ${inc ? 'ok' : level}`} aria-hidden="true" />
                <span className="grow">
                  <div className="sub">{t(s.label)}{!s.required && ` · ${t('optional')}`}</div>
                  <div className="title">{inc ? t('Included in the flight controller') : part ? partName(part) : <span className="muted" style={{ fontWeight: 500 }}>{t('Choose')}</span>}</div>
                  {line?.own > 0 && <div className="chips" style={{ marginTop: 4 }}><span className="chip ok">{line.buy ? t('You own {have} of {need}', { have: line.own, need: line.qty }) : t('You own this')}</span></div>}
                </span>
                {!inc && <Icon name="chev" className="chev" />}
              </button>
            );
          })}
        </div>
        {miss.length > 0 && (
          <div className="btn-row" style={{ marginTop: 12 }}>
            <button className="btn secondary" onClick={fill} disabled={!sel.frame}>{sel.frame ? t('Fill in the rest for me') : t('Choose a frame first')}</button>
          </div>
        )}
      </section>

      <Payload project={p} />

      {!!issues.length && (
        <section className="section" aria-live="polite">
          <h2>{t('Checks')}</h2>
          <div className="stack">{issues.map((i) => <Issue key={i.id} issue={i} />)}</div>
        </section>
      )}
      {!issues.length && !miss.length && <div className="note ok" style={{ marginTop: 14 }}><b>{t('Everything works together')}</b>{t('No conflicts in voltage, size, current or firmware.')}</div>}

      {f && (
        <section className="section">
          <details className="card">
            <summary>{t('See the numbers')}</summary>
            <dl className="kv num" style={{ marginTop: 8 }}>
              <dt>{t('Hover time')}</dt><dd>{f.hover.toFixed(1)} {t('min')}</dd>
              <dt>{t('Hover power')}</dt><dd>{Math.round(f.hoverW)} W</dd>
              <dt>{t('Hover current')}</dt><dd>{f.hoverA.toFixed(1)} A</dd>
              <dt>{t('Peak current')}</dt><dd>{Math.round(f.peakA)} A</dd>
              <dt>{t('Battery energy')}</dt><dd>{f.energyWh.toFixed(1)} Wh</dd>
              <dt>{t('Hover throttle')}</dt><dd>{Math.round(f.hoverThrottle)}%</dd>
              <dt>{t('Air density')}</dt><dd>{f.rho.toFixed(3)} kg/m³</dd>
            </dl>
            <label className="field" style={{ marginTop: 14 }}>
              <span>{t('Flying field elevation: {m} m', { m: altitude })}</span>
              <input type="range" min="0" max="5000" step="100" value={altitude} onChange={(e) => setAltitude(+e.target.value)} style={{ width: '100%' }} />
            </label>
            <p className="tiny muted" style={{ marginTop: 8 }}>{t('These are estimates, typically within about 25 percent of a real flight.')} <A to="/about/numbers" className="link">{t('How we calculate this')}</A></p>
          </details>
        </section>
      )}

      <div className="section btn-row">
        {sel.frame && <A to={`/p/${p.id}/3d`} className="btn secondary"><Icon name="cpu" />{t('View in 3D')}</A>}
        <A to={`/p/${p.id}/parts`} className="btn">{t('Get the parts')}</A>
      </div>

      <div className="dock">
        <div className="stats">
          <div className="stat"><SpringNum value={c.toBuy} format={(n) => money(n, region)} /><span>{c.saved > 0 ? t('to buy') : t('parts')}</span></div>
          <div className="stat">{auw ? <SpringNum value={auw} format={grams} /> : <b>–</b>}<span>{t('weight')}</span></div>
          <div className="stat">{f ? <SpringNum value={f.twr} format={(n) => `${n.toFixed(1)}:1`} /> : <b>–</b>}<span>{t('T/W')}</span></div>
          <div className="stat">{f ? <SpringNum value={[f.flyMin, f.flyMax]} format={minutes} /> : <b>–</b>}<span>{t('min')}</span></div>
        </div>
        <div className="row between" style={{ marginTop: 6 }}>
          <span className={`chip ${status.cls}`}>{status.label}</span>
          <span className="tiny muted">{t('Saved on this device')}</span>
        </div>
      </div>

      {open && <Picker slot={open} sel={sel} ctx={ctx} region={region} owned={state.owned} mine={Object.values(state.customParts || {}).filter((x) => x.slot === open)} onPick={setPart} onClose={() => setOpen(null)} />}
      {toast}
    </div>
  );
}

function Payload({ project }) {
  const [name, setName] = useState('');
  const [g, setG] = useState('');
  const list = project.payload || [];
  const add = (item) => updateProject(project.id, { payload: [...list, item].slice(0, 12) });
  const grams2 = Number(g);
  const valid = Number.isFinite(grams2) && grams2 > 0 && grams2 <= 100000;
  const submit = (e) => {
    e.preventDefault();
    if (!valid) return;
    add({ name: name.trim() || 'Payload', g: grams2 });
    setName('');
    setG('');
  };
  return (
    <section className="section">
      <h2>{t('Payload')}</h2>
      <p className="small muted" style={{ marginBottom: 12 }}>{t('Anything extra it carries, such as a camera or sensor. It changes flight time, thrust and the rules that apply.')}</p>
      {!!list.length && (
        <div className="list" style={{ marginBottom: 12 }}>
          {list.map((i, n) => (
            <div className="li" key={`${i.name}${n}`}>
              <span className="grow"><div className="title">{t(i.name)}</div><div className="sub num">{i.g} g</div></span>
              <button className="icon-btn" aria-label={t('Remove')} onClick={() => updateProject(project.id, { payload: list.filter((_, x) => x !== n) })}><Icon name="close" /></button>
            </div>
          ))}
        </div>
      )}
      <div className="chips" style={{ marginBottom: 12 }}>
        {PAYLOAD_PRESETS.map((x) => <button key={x.name} className="filter" style={{ minHeight: 34, fontSize: 14 }} onClick={() => add(x)}><Icon name="plus" className="tiny-ico" />{t(x.name)} · {x.g} g</button>)}
      </div>
      <form className="row" style={{ flexWrap: 'nowrap', alignItems: 'flex-end' }} onSubmit={submit}>
        <label className="field grow"><span>{t('Name')}</span><input className="input" value={name} maxLength={40} onChange={(e) => setName(e.target.value)} /></label>
        <label className="field" style={{ width: 92, flex: 'none' }}><span>{t('Grams')}</span><input className="input" type="number" inputMode="decimal" min="1" max="100000" value={g} onChange={(e) => setG(e.target.value)} /></label>
        <button className="btn secondary" style={{ flex: 'none', paddingInline: 18, minHeight: 46 }} disabled={!valid}>{t('Add')}</button>
      </form>
      <p className="tiny muted" style={{ marginTop: 8 }}>{t('Preset weights are typical. Weigh your own for a better estimate.')}</p>
    </section>
  );
}

function Picker({ slot, sel, ctx, region, mine, owned, onPick, onClose }) {
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null);
  const s = SLOTS.find((x) => x.key === slot);
  const rate1 = (p) => ({ p, r: rate(slot, p, sel, ctx) });
  const order = { ok: 0, warn: 1, error: 2 };
  // What you have comes first, including your own parts you have not said you own yet.
  const ownedHere = ownedList(owned).map((e) => e.part).filter((p) => p.slot === slot);
  const firstIds = new Set([...ownedHere, ...mine].map((p) => p.id));
  const first = [...ownedHere, ...mine.filter((p) => !ownedHere.some((o) => o.id === p.id))].map(rate1).sort((a, b) => order[a.r.status] - order[b.r.status]);
  const rated = s.list
    .filter((p) => !firstIds.has(p.id))
    .map(rate1)
    .sort((a, b) => order[a.r.status] - order[b.r.status] || a.p.p - b.p.p);
  const row = (close) => ({ p, r }) => {
    const need = partQty(sel, slot, p);
    const have = Math.min(ownedQty(owned, p.id), need);
    const button = (
      <button key={p.id} className={`pick ${sel[slot]?.id === p.id ? 'on' : ''} ${r.status === 'error' ? 'bad' : ''}`} onClick={() => { onPick(slot, p); close(); }}>
        <i className={`dot ${r.status === 'error' ? 'err' : r.status === 'warn' ? 'warn' : 'ok'}`} aria-hidden="true" />
        <span className="grow">
          <div className="title">{partName(p)}{p.custom && <span className="chip accent" style={{ marginLeft: 6 }}>{t('Yours')}</span>}</div>
          <div className="sub num">{specLine(slot, p)}</div>
          {have > 0 && <div className="chips" style={{ marginTop: 4 }}><span className="chip ok">{have >= need ? t('You own this') : t('You own {have} of {need}', { have, need })}</span></div>}
          {r.reason && <div className={`why ${r.status}`}>{t(r.reason)}</div>}
        </span>
        {p.p > 0 && have < need && <span className="right small num">{money(p.p * (need - have), region)}</span>}
      </button>
    );
    if (!p.custom) return button;
    return (
      <div className="pick-row" key={p.id}>
        {button}
        <button className="icon-btn" aria-label={t('Edit {name}', { name: partName(p) })} onClick={() => setEditing(p)}><Icon name="edit" /></button>
      </div>
    );
  };
  return (
    <Sheet title={t(s.label)} sub={t(s.hint)} onClose={onClose}>
      {(close) => {
        if (editing) return <PartForm part={editing} onCancel={() => setEditing(null)} onDone={() => setEditing(null)} />;
        if (adding) return <PartForm slot={slot} askOwn own={(part) => partQty(sel, slot, part)} onCancel={() => setAdding(false)} onDone={(part) => { onPick(slot, part); close(); }} />;
        return (
          <>
            <button className="btn secondary block" style={{ marginBottom: 12 }} onClick={() => setAdding(true)}><Icon name="plus" />{t('Add my own part')}</button>
            {!s.required && sel[slot] && <button className="btn quiet block" style={{ marginBottom: 8 }} onClick={() => { onPick(slot, null); close(); }}>{t('Remove')}</button>}
            {!!first.length && <p className="tiny muted" style={{ margin: '4px 0 8px' }}>{t('Yours')}</p>}
            {first.map(row(close))}
            {!!first.length && <p className="tiny muted" style={{ margin: '12px 0 8px' }}>{t('All parts')}</p>}
            {rated.map(row(close))}
          </>
        );
      }}
    </Sheet>
  );
}
