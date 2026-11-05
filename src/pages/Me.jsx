import React, { useEffect, useRef } from 'react';
import { A, BuildCard, Ext, Icon, PageHead, Progress, useToast } from '../components/ui.jsx';
import { deleteCustomPart, exportData, importData, markSeen, resetAll, setProfile, useStore } from '../lib/store.js';
import { downloadFile, t, go } from '../lib/util.js';
import { BUILDS } from '../data/builds.js';
import { SLOTS } from '../data/parts.js';
import { PERSONAS, LEVELS } from '../data/personas.js';
import { REGIONS, regionById } from '../data/regions.js';
import { FW_CHOICES } from '../data/firmware.js';
import { BADGES, earned, stages } from '../lib/progress.js';
import { cost, loadBuild } from '../lib/engine.js';
import { GALLERY } from '../data/gallery.js';

export function Me() {
  const state = useStore();
  const { profile, projects, logs, seenAt } = state;
  const list = Object.values(projects).sort((a, b) => b.updated - a.updated);
  const got = earned(state);
  const region = regionById(profile.region);
  const fileRef = useRef(null);
  const [toast, setToast] = useToast();
  const types = new Set(list.map((p) => p.goal));
  const fresh = BUILDS.filter((b) => seenAt && b.added > seenAt && (types.has(b.goal) || b.personas.includes(profile.persona)));
  useEffect(() => () => { if (fresh.length || !seenAt) markSeen(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalMin = logs.reduce((a, l) => a + (l.minutes || 0), 0);
  const ordered = list.flatMap((p) => cost(loadBuild(p)).lines.filter((l) => p.have?.[l.slot]).map((l) => ({ p, l })));

  const restore = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { importData(await f.text()); setToast(t('Backup restored')); } catch { setToast(t('That file is not a backup')); }
  };

  return (
    <div className="wrap narrow">
      <PageHead title={t('My hangar')} sub={t('Everything is saved on this device. There is no account to make or lose.')} />

      {!!fresh.length && (
        <section className="section" style={{ marginTop: 18 }}>
          <h2>{t('New for you')}</h2>
          <div className="stack">{fresh.map((b) => <BuildCard key={b.id} build={b} region={region} />)}</div>
        </section>
      )}

      <section className="section" style={{ marginTop: 22 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2>{t('My builds')}</h2>
          <span className="row" style={{ gap: 14 }}>
            <A to="/compare" className="link small">{t('Compare')}</A>
            <A to="/configure" className="link small">{t('New build')}</A>
          </span>
        </div>
        {!list.length && (
          <div className="card stack">
            <p className="muted">{t('Nothing saved yet. Pick a starting point and it will show up here, with your progress.')}</p>
            <A to="/start" className="btn block">{t('Find my build')}</A>
          </div>
        )}
        <div className="stack">
          {list.map((p) => {
            const s = stages(p, logs);
            return (
              <A to={`/p/${p.id}`} key={p.id} className="card tap">
                <div className="row between"><h3>{p.name}</h3><span className="small num muted">{s.pct}%</span></div>
                <div className="small muted" style={{ margin: '2px 0 8px' }}>{s.next ? t('Next: {step}', { step: t(s.next.title) }) : t('Complete')} · {p.firmware}</div>
                <Progress value={s.pct} ok={s.pct === 100} />
              </A>
            );
          })}
        </div>
      </section>

      {!!ordered.length && (
        <section className="section">
          <details className="card">
            <summary>{t('Parts ordered or owned ({n})', { n: ordered.length })}</summary>
            <ul className="small stack" style={{ marginTop: 6 }}>
              {ordered.map(({ p, l }) => <li key={p.id + l.slot}>{l.part.b} {l.part.m}<div className="tiny muted">{p.name}</div></li>)}
            </ul>
          </details>
        </section>
      )}

      {!!logs.length && (
        <section className="section">
          <h2>{t('Flight time')}</h2>
          <div className="card stats">
            <div className="stat"><b>{logs.length}</b><span>{t('flights')}</span></div>
            <div className="stat"><b>{Math.round(totalMin)}</b><span>{t('minutes')}</span></div>
            <div className="stat"><b>{list.length}</b><span>{t('builds')}</span></div>
          </div>
        </section>
      )}

      <section className="section">
        <h2>{t('Badges')}</h2>
        <div className="grid two" style={{ gridTemplateColumns: '1fr 1fr' }}>
          {BADGES.map((b) => (
            <div key={b.id} className={`card badge ${got.has(b.id) ? '' : 'off'}`}>
              {got.has(b.id) ? <span className="chip ok"><Icon name="check" className="" />{t('Earned')}</span> : <span className="chip">{t('Not yet')}</span>}
              <h3 style={{ fontSize: 15 }}>{t(b.title)}</h3>
              <span className="tiny muted">{t(b.text)}</span>
            </div>
          ))}
        </div>
      </section>

      {!!Object.keys(state.customParts || {}).length && (
        <section className="section">
          <h2>{t('My parts')}</h2>
          <div className="list">
            {Object.values(state.customParts).map((c) => (
              <div className="li" key={c.id}>
                <span className="grow"><div className="title">{c.b} {c.m}</div><div className="sub">{t(SLOTS.find((s) => s.key === c.slot)?.label || '')} · {c.w} g</div></span>
                <button className="icon-btn" aria-label={t('Delete')} onClick={() => { if (window.confirm(t('Delete this part? Builds using it will lose it.'))) deleteCustomPart(c.id); }}><Icon name="close" /></button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>{t('Settings')}</h2>
        <div className="card stack">
          <label className="field"><span>{t('I am')}</span>
            <select className="input" value={profile.persona || ''} onChange={(e) => setProfile({ persona: e.target.value || null })}>
              <option value="">{t('Not set')}</option>
              {PERSONAS.map((p) => <option key={p.id} value={p.id}>{t(p.title)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('Country or region')}</span>
            <select className="input" value={profile.region || ''} onChange={(e) => setProfile({ region: e.target.value || null })}>
              <option value="">{t('Not set')}</option>
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{t(r.name)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('Experience')}</span>
            <select className="input" value={profile.level || ''} onChange={(e) => setProfile({ level: e.target.value || null })}>
              <option value="">{t('Not set')}</option>
              {LEVELS.map((l) => <option key={l.id} value={l.id}>{t(l.title)}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('Firmware')}</span>
            <select className="input" value={profile.firmware || ''} onChange={(e) => setProfile({ firmware: e.target.value || null })}>
              <option value="">{t('Pick for me')}</option>
              {FW_CHOICES.filter((x) => x !== 'Cleanflight').map((x) => <option key={x}>{x}</option>)}
            </select>
          </label>
          <label className="field"><span>{t('Appearance')}</span>
            <select className="input" value={profile.theme || 'light'} onChange={(e) => setProfile({ theme: e.target.value })}>
              <option value="light">{t('Light')}</option>
              <option value="dark">{t('Dark')}</option>
              <option value="auto">{t('Match my device')}</option>
            </select>
          </label>
        </div>
      </section>

      <section className="section">
        <h2>{t('Your data')}</h2>
        <p className="small muted" style={{ marginBottom: 10 }}>{t('Move your builds to another phone or computer with a backup file. Photos stay on this device.')}</p>
        <div className="btn-row">
          <button className="btn secondary" onClick={() => downloadFile('thrustworthy-backup.json', exportData(), 'application/json')}>{t('Save backup')}</button>
          <button className="btn secondary" onClick={() => fileRef.current.click()}>{t('Restore backup')}</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={restore} />
        </div>
        <button className="btn danger block" style={{ marginTop: 10 }} onClick={() => { if (window.confirm(t('Erase all your builds and logs from this device?'))) { resetAll(); go('/'); } }}>{t('Erase everything')}</button>
      </section>
      {toast}
    </div>
  );
}

export function Community() {
  const { profile, projects } = useStore();
  const region = regionById(profile.region);
  const mine = Object.values(projects);
  return (
    <div className="wrap">
      <PageHead title={t('Community')} sub={t('Open a build, copy it, and make it yours. Share yours with a link, no account needed.')} />
      <section className="section" style={{ marginTop: 18 }}>
        <h2>{t('From the community')}</h2>
        {GALLERY.length === 0 ? (
          <div className="card stack">
            <h3>{t('Be the first to post a build')}</h3>
            <p className="small muted">{t('This gallery only shows real builds from real people, so it is empty until the first one arrives. Finish a build and post it, and it could be yours.')}</p>
            <div className="btn-row">
              <A to={mine.length ? `/p/${mine[0].id}/share` : '/start'} className="btn">{t(mine.length ? 'Share my build' : 'Start a build')}</A>
              <Ext href="https://github.com/Anooragsunkari/thrustworthy/discussions" className="btn secondary"><Icon name="ext" />{t('Join the discussion')}</Ext>
            </div>
          </div>
        ) : (
          <div className="grid three">
            {GALLERY.map((g) => (
              <div className="card stack" key={g.link}>
                <h3>{g.title}</h3>
                <div className="small muted">{g.author}</div>
                <p className="small">{g.note}</p>
                <div className="btn-row"><a className="btn small" href={g.link}>{t('Open and copy')}</a><Ext className="btn secondary small" href={g.thread}>{t('Comments')}</Ext></div>
              </div>
            ))}
          </div>
        )}
      </section>
      <section className="section">
        <h2>{t('Reference builds to copy')}</h2>
        <div className="grid three">{BUILDS.map((b) => <BuildCard key={b.id} build={b} region={region} />)}</div>
      </section>
    </div>
  );
}
