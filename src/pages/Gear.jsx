import React, { useState } from 'react';
import { Icon, PageHead, Sheet } from '../components/ui.jsx';
import { BrokenBuilds, EditPartSheet, PartForm } from '../components/PartForm.jsx';
import { createProject, setGearOwned, setOwnedQty, useStore } from '../lib/store.js';
import { go, t } from '../lib/util.js';
import { GOALS, SLOTS, partName } from '../data/parts.js';
import { GEAR } from '../data/personas.js';
import { money, regionById } from '../data/regions.js';
import { toIds } from '../lib/engine.js';
import { buildAround, EVERY_BUILD_GEAR, firmwareForGoal, MAX_OWNED, ownedList, ownedQty } from '../lib/owned.js';

const label = (slot) => SLOTS.find((s) => s.key === slot)?.label || '';
// Most people who own motors or props own a set, so start there.
const startQty = (slot) => (slot === 'motor' || slot === 'prop' ? 4 : 1);

export function Stepper({ part, qty }) {
  const name = partName(part);
  return (
    <span className="stepper">
      <button className="icon-btn" aria-label={t(qty === 1 ? 'Remove {name}' : 'One fewer {name}', { name })} onClick={() => setOwnedQty(part.id, qty - 1)}><Icon name={qty === 1 ? 'close' : 'minus'} /></button>
      <b className="num" aria-live="polite">{qty}</b>
      <button className="icon-btn" aria-label={t('One more {name}', { name })} disabled={qty >= MAX_OWNED} onClick={() => setOwnedQty(part.id, qty + 1)}><Icon name="plus" /></button>
    </span>
  );
}

function AddSheet({ slot, owned, mine, onClose }) {
  const [q, setQ] = useState('');
  const [writing, setWriting] = useState(false);
  const s = SLOTS.find((x) => x.key === slot);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const list = [...mine, ...s.list.filter((p) => p.sys !== 'None')]
    .filter((p) => words.every((w) => partName(p).toLowerCase().includes(w)));
  return (
    <Sheet title={t('Add: {slot}', { slot: t(s.label) })} sub={t('Tap everything you have.')} onClose={onClose}>
      {(close) => (writing
        ? <PartForm slot={slot} own={startQty(slot)} onCancel={() => setWriting(false)} onDone={close} />
        : (
          <>
            <button className="btn secondary block" style={{ marginBottom: 12 }} onClick={() => setWriting(true)}><Icon name="plus" />{t('It is not listed. Add my own part')}</button>
            <label className="field" style={{ marginBottom: 12 }}><span>{t('Search')}</span><input className="input" type="search" value={q} onChange={(e) => setQ(e.target.value)} /></label>
            {!list.length && <p className="small muted">{t('Nothing matches. You can add it as your own part.')}</p>}
            {list.map((p) => {
              const n = ownedQty(owned, p.id);
              return (
                <button key={p.id} className={`pick ${n ? 'on' : ''}`} aria-pressed={!!n} onClick={() => setOwnedQty(p.id, n ? 0 : startQty(slot))}>
                  <span className="grow">
                    <div className="title">{partName(p)}{p.custom && <span className="chip accent" style={{ marginLeft: 6 }}>{t('Yours')}</span>}</div>
                    <div className="sub num">{p.w} g</div>
                  </span>
                  {n > 0 && <span className="chip ok"><Icon name="check" />{n}</span>}
                </button>
              );
            })}
          </>
        ))}
    </Sheet>
  );
}

function AroundSheet({ owned, profile, region, onClose }) {
  const start = (goal) => {
    const firmware = profile.firmware || firmwareForGoal(goal);
    const sel = buildAround(owned, { firmware, goal, region });
    const id = createProject({ name: t('Build from my gear'), goal, firmware, sel: toIds(sel) });
    go(`/configure/${id}`);
  };
  return (
    <Sheet title={t('Build around my gear')} sub={t('What should it do? Parts that fit go in, and you choose the rest.')} onClose={onClose}>
      <div className="list">
        {GOALS.map((g) => (
          <button key={g.id} className="li" onClick={() => start(g.id)}>
            <span className="grow title">{t(g.label)}</span><Icon name="chev" className="chev" />
          </button>
        ))}
      </div>
    </Sheet>
  );
}

export function Gear() {
  const { owned, customParts, profile, projects } = useStore();
  const region = regionById(profile.region);
  const [adding, setAdding] = useState(null);
  const [around, setAround] = useState(false);
  const [editing, setEditing] = useState(null);
  const [broken, setBroken] = useState([]);
  const items = ownedList(owned);
  const worth = items.reduce((a, e) => a + (e.part.p || 0) * e.qty, 0);
  const gear = GEAR.filter(EVERY_BUILD_GEAR);
  const usedBy = Object.keys(projects).length;
  return (
    <div className="wrap narrow">
      <PageHead title={t('Gear I own')} sub={t('Parts here come off your shopping lists and are offered first when you choose. It stays on this device.')} back="/me" />
      <section className="section" style={{ marginTop: 18 }}>
        <BrokenBuilds builds={broken} />
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2>{t('Drone parts')}</h2>
          {!!items.length && <span className="small muted num">{t('About {sum}', { sum: money(worth, region) })}</span>}
        </div>
        {!items.length && <div className="note" style={{ marginBottom: 12 }}>{t('Nothing yet. Add a leftover motor, a spare battery or anything from an old build.')}</div>}
        {!!items.length && (
          <div className="list" style={{ marginBottom: 12 }}>
            {items.map(({ part, qty }) => (
              <div className="li" key={part.id}>
                <span className="grow" style={{ minWidth: 0 }}>
                  <div className="sub">{t(label(part.slot))}</div>
                  <div className="title">{partName(part)}</div>
                </span>
                {part.custom && <button className="icon-btn" aria-label={t('Edit {name}', { name: partName(part) })} onClick={() => setEditing(part)}><Icon name="edit" /></button>}
                <Stepper part={part} qty={qty} />
              </div>
            ))}
          </div>
        )}
        <p className="tiny muted" style={{ marginBottom: 8 }}>{t('Add')}</p>
        <div className="chips">
          {SLOTS.map((s) => <button key={s.key} className="filter" style={{ minHeight: 34, fontSize: 14 }} onClick={() => setAdding(s.key)}><Icon name="plus" className="tiny-ico" />{t(s.label)}</button>)}
        </div>
        {!!items.length && <button className="btn block" style={{ marginTop: 16 }} onClick={() => setAround(true)}>{t('Build around my gear')}</button>}
        {usedBy > 1 && !!items.length && <p className="tiny muted" style={{ marginTop: 8 }}>{t('Each build counts your whole stock. If two builds share a part, you may need more than you own.')}</p>}
      </section>

      <section className="section">
        <h2>{t('Radio, charger and tools')}</h2>
        <p className="small muted" style={{ margin: '4px 0 10px' }}>{t('Tick what you have, and it comes off every build. Check that your radio can talk to each new receiver.')}</p>
        <div className="list">
          {gear.map((g) => (
            <label key={g.id} className="check">
              <input type="checkbox" checked={!!owned.gear[g.id]} onChange={(e) => setGearOwned(g.id, e.target.checked)} />
              <span className="grow"><div className="title">{t(g.title)}</div><div className="small muted">{t(g.detail)}</div></span>
            </label>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>{t('Digital goggles and spare props are not here. Goggles must match each build\'s video system, and props get used up, so tick those on each build\'s parts page.')}</p>
      </section>

      {adding && <AddSheet slot={adding} owned={owned} mine={Object.values(customParts).filter((c) => c.slot === adding)} onClose={() => setAdding(null)} />}
      {around && <AroundSheet owned={owned} profile={profile} region={region} onClose={() => setAround(false)} />}
      {editing && <EditPartSheet part={editing} onClose={() => setEditing(null)} onSaved={setBroken} />}
    </div>
  );
}
