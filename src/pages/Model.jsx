import React, { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { A, Ext, Icon, Issue, PageHead, useToast } from '../components/ui.jsx';
import { createProject, useStore } from '../lib/store.js';
import { copyText, decodeBuild, go, grams, minutes, model3dUrl, t } from '../lib/util.js';
import { SLOTS, partName } from '../data/parts.js';
import { buildById } from '../data/builds.js';
import { money, regionById, storeLinks } from '../data/regions.js';
import { allUpWeight, cost, flight, isIncluded, resolve } from '../lib/engine.js';
import { partDetails } from '../lib/model.js';
import { prefersStill } from '../lib/spring.js';

const Drone3D = lazy(() => import('../components/Drone3D.jsx'));

const INCLUDES = { esc: 'ESC', rx: 'Receiver', video: 'Camera and video' };

function Details({ info, region, editTo, onClose }) {
  if (!info) {
    return (
      <div className="card">
        <h3>{t('Tap any part')}</h3>
        <p className="small muted" style={{ marginTop: 4 }}>{t('See what it does, its specs and where to buy it. Use the exploded view to reach parts hidden inside the frame.')}</p>
      </div>
    );
  }
  const shops = storeLinks(region, partName(info.part));
  return (
    <div className="card stack" aria-live="polite">
      <div className="row between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
        <div className="grow">
          <div className="small muted">{t(info.label)}{info.qty > 1 && ` · ${info.qty} ×`}</div>
          <h2 style={{ fontSize: 23, marginTop: 2 }}>{info.name}</h2>
        </div>
        <button className="icon-btn" onClick={onClose} aria-label={t('Close')}><Icon name="close" /></button>
      </div>
      <p className="small muted">{t(info.role)}</p>
      {!!info.includes.length && (
        <div className="note"><b>{t('Built into this board')}</b>{info.includes.map((k) => t(INCLUDES[k])).join(', ')}</div>
      )}
      <dl className="kv num">
        {info.rows.map((r) => (
          <React.Fragment key={r.label}><dt>{t(r.label)}</dt><dd>{t(r.value)}</dd></React.Fragment>
        ))}
        {info.usd > 0 && <><dt>{t('Approx. price')}</dt><dd>{money(info.usd, region)}</dd></>}
      </dl>
      {info.issues.filter((i) => i.level !== 'info').map((i) => <Issue key={i.id} issue={i} />)}
      {info.usd > 0 && (
        <div className="chips">{shops.map((s) => <Ext key={s.name} href={s.url} className="chip accent">{s.name}</Ext>)}</div>
      )}
      {editTo && <A to={editTo} className="btn secondary small">{t('Change this part')}</A>}
    </div>
  );
}

function Viewer({ name, firmware, goal, ids, back, editTo, shareProject, footer }) {
  const { profile } = useStore();
  const region = regionById(profile.region);
  const sel = useMemo(() => resolve(ids), [ids]);
  const [selected, setSelected] = useState(null);
  const [exploded, setExploded] = useState(false);
  const [toast, setToast] = useToast();
  const panel = useRef(null);
  const ctx = { firmware, goal, region };
  const info = selected ? partDetails(selected, sel, ctx) : null;
  const f = flight(sel, { goal });
  const list = SLOTS.filter((s) => (sel[s.key] && sel[s.key].sys !== 'None' && !isIncluded(sel, s.key)));

  const pick = (slot) => setSelected(slot === selected ? null : slot);
  // On a phone the details sit under the model, so bring them into view after a tap.
  useEffect(() => {
    if (selected) panel.current?.scrollIntoView({ behavior: prefersStill() ? 'auto' : 'smooth', block: 'nearest' });
  }, [selected]);

  if (!sel.frame) {
    return (
      <div className="wrap narrow">
        <PageHead title={name} back={back} />
        <div className="note" style={{ marginTop: 14 }}>{t('Choose a frame first')}</div>
      </div>
    );
  }

  return (
    <div className="wrap">
      <PageHead title={name} sub={t('Your drone, built from your parts. Drag to turn it, pinch or scroll to zoom, and tap a part.')} back={back} />
      <div className="model-grid" style={{ marginTop: 16 }}>
        <div className="model-stage">
          <Suspense fallback={<div className="viewer" />}>
            <Drone3D sel={sel} selected={selected} exploded={exploded} onPick={pick} theme={profile.theme} />
          </Suspense>
          <div className="segment" data-i={exploded ? 1 : 0} role="group" aria-label={t('View')}>
            <button className={exploded ? '' : 'on'} aria-pressed={!exploded} onClick={() => setExploded(false)}>{t('Assembled')}</button>
            <button className={exploded ? 'on' : ''} aria-pressed={exploded} onClick={() => setExploded(true)}>{t('Exploded')}</button>
          </div>
        </div>
        <div className="model-side">
          <div ref={panel}>
            <Details info={info} region={region} editTo={editTo} onClose={() => setSelected(null)} />
          </div>
          <div className="list" style={{ marginTop: 12 }}>
            {list.map((s) => (
              <button key={s.key} className={`li ${selected === s.key ? 'li-on' : ''}`} aria-pressed={selected === s.key} onClick={() => setSelected(s.key)}>
                <span className="grow"><div className="sub">{t(s.label)}</div><div className="title">{partName(sel[s.key])}</div></span>
                <Icon name="chev" className="chev" />
              </button>
            ))}
          </div>
          {f && (
            <div className="stats four" style={{ marginTop: 18, marginBottom: 6 }}>
              <div className="stat"><b>{money(cost(sel).total, region)}</b><span>{t('parts')}</span></div>
              <div className="stat"><b>{grams(allUpWeight(sel).total)}</b><span>{t('weight')}</span></div>
              <div className="stat"><b>{f.twr.toFixed(1)}:1</b><span>{t('T/W')}</span></div>
              <div className="stat"><b>{minutes(f.flyMin, f.flyMax)}</b><span>{t('min')}</span></div>
            </div>
          )}
          <div className="btn-row" style={{ marginTop: 12 }}>
            {shareProject && (
              <button className="btn" onClick={async () => {
                const url = model3dUrl(shareProject);
                if (navigator.share) {
                  try { await navigator.share({ title: name, url }); } catch { /* cancelled */ }
                } else setToast((await copyText(url)) ? t('Link copied') : t('Could not copy'));
              }}><Icon name="share" />{t('Share this 3D view')}</button>
            )}
            {footer}
          </div>
          <p className="tiny muted" style={{ marginTop: 10 }}>{t('Drawn to scale from each part\'s specs, as a guide. It is not a CAD model, so check the fit against your real parts.')}</p>
        </div>
      </div>
      {toast}
    </div>
  );
}

export function ProjectModel({ id }) {
  const { projects } = useStore();
  const p = projects[id];
  if (!p) return <div className="wrap"><PageHead title={t('Build not found')} back="/me" /></div>;
  return <Viewer name={p.name} firmware={p.firmware} goal={p.goal} ids={p.sel} back={`/p/${id}`} editTo={`/configure/${id}`} shareProject={p} />;
}

export function GuideModel({ id }) {
  const b = buildById(id);
  if (!b) return <div className="wrap"><PageHead title={t('Build not found')} back="/builds" /></div>;
  const start = () => {
    const pid = createProject({ name: t(b.title), goal: b.goal, firmware: b.firmware, sel: b.sel, fromBuild: b.id });
    go(`/p/${pid}`);
  };
  return <Viewer name={t(b.title)} firmware={b.firmware} goal={b.goal} ids={b.sel} back={`/builds/${id}`} shareProject={{ name: t(b.title), goal: b.goal, firmware: b.firmware, sel: b.sel }} footer={<button className="btn secondary" onClick={start}>{t('Start this build')}</button>} />;
}

/** Anyone can open this from a link, with no account and nothing saved. */
export function SharedModel({ token }) {
  const shared = decodeBuild(token);
  if (!shared) return <div className="wrap"><PageHead title={t('This link did not work')} sub={t('It may have been cut off when it was copied.')} back="/" /></div>;
  const save = () => {
    const pid = createProject({ ...shared });
    go(`/p/${pid}`);
  };
  return <Viewer name={shared.name} firmware={shared.firmware} goal={shared.goal} ids={shared.sel} back="/" shareProject={shared} footer={<button className="btn secondary" onClick={save}>{t('Save a copy to my builds')}</button>} />;
}
