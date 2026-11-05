import React, { useState } from 'react';
import { A, BuildCard, Ext, Icon, Issue, PageHead } from '../components/ui.jsx';
import { useStore, createProject } from '../lib/store.js';
import { go, grams, minutes, t } from '../lib/util.js';
import { BUILDS, BUILD_TYPES, buildById } from '../data/builds.js';
import { SLOTS, FIRMWARES, partName } from '../data/parts.js';
import { regionById, money, videoSearch, weightNote } from '../data/regions.js';
import { check, cost, flight, resolve, isIncluded } from '../lib/engine.js';

export function Builds({ level }) {
  const { profile } = useStore();
  const region = regionById(profile.region);
  const [type, setType] = useState('All');
  const [lvl, setLvl] = useState(level || 'All');
  const [fw, setFw] = useState('All');
  const list = BUILDS.filter((b) => (type === 'All' || b.type === type) && (lvl === 'All' || b.level === lvl) && (fw === 'All' || b.firmware === fw));
  const Row = ({ items, value, set }) => (
    <div className="scroller">
      {items.map((x) => <button key={x} className={`filter ${value === x ? 'on' : ''}`} aria-pressed={value === x} onClick={() => set(x)}>{t(x)}</button>)}
    </div>
  );
  return (
    <div className="wrap">
      <PageHead title={t('Build guides')} sub={t('Each one has passed our compatibility checker. Open a build to see the details, or copy it and make it yours.')} />
      <div style={{ marginTop: 12 }}>
        <Row items={BUILD_TYPES} value={type} set={setType} />
        <Row items={['All', 'Beginner', 'Intermediate', 'Pro']} value={lvl} set={setLvl} />
        <Row items={['All', ...FIRMWARES]} value={fw} set={setFw} />
      </div>
      <div className="grid three" style={{ marginTop: 6 }}>{list.map((b) => <BuildCard key={b.id} build={b} region={region} />)}</div>
      <A to="/compare" className="btn secondary block" style={{ marginTop: 14 }}>{t('Compare two builds')}</A>
      {!list.length && <div className="note" style={{ marginTop: 12 }}>{t('No builds match those filters yet. You can start from a blank build in the configurator.')}</div>}
    </div>
  );
}

export function BuildDetail({ id }) {
  const { profile } = useStore();
  const region = regionById(profile.region);
  const b = buildById(id);
  if (!b) return <div className="wrap"><PageHead title={t('Build not found')} back="/builds" /></div>;
  const sel = resolve(b.sel);
  const f = flight(sel, { goal: b.goal });
  const c = cost(sel);
  const notes = check(sel, { firmware: b.firmware, goal: b.goal, region }).filter((i) => i.level !== 'info' || i.id.startsWith('r-'));
  const video = videoSearch(region, `${b.title} ${b.type} drone build`);
  const start = () => {
    const pid = createProject({ name: t(b.title), goal: b.goal, firmware: b.firmware, sel: b.sel, fromBuild: b.id });
    go(`/p/${pid}`);
  };
  const w = weightNote(region, f.auw);

  return (
    <div className="wrap narrow">
      <PageHead title={t(b.title)} sub={t(b.pitch)} back="/builds">
        <div className="chips" style={{ marginTop: 12 }}>
          <span className="chip accent">{t(b.type)}</span><span className="chip">{t(b.level)}</span><span className="chip">{b.firmware}</span>
        </div>
      </PageHead>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="stats four">
          <div className="stat"><b>{money(c.total, region)}</b><span>{t('parts only')}</span></div>
          <div className="stat"><b>{grams(f.auw)}</b><span>{t('all-up weight')}</span></div>
          <div className="stat"><b>{minutes(f.flyMin, f.flyMax)} {t('min')}</b><span>{t('typical flying')}</span></div>
          <div className="stat"><b>{f.twr.toFixed(1)}:1</b><span>{t('thrust to weight')}</span></div>
        </div>
      </div>

      <div className="btn-row" style={{ marginTop: 14 }}>
        <button className="btn" onClick={start}>{t('Start this build')}</button>
        <A to={`/builds/${b.id}/3d`} className="btn secondary"><Icon name="cpu" />{t('View in 3D')}</A>
        <Ext href={video.url} className="btn secondary"><Icon name="ext" />{t('Watch on {site}', { site: video.site })}</Ext>
      </div>

      {w && <div className="note info" style={{ marginTop: 14 }}><b>{t('Rules for {place}', { place: t(region.name) })}</b>{t(w)} <A to={`/rules/${region.id}`} className="link">{t('Full rules')}</A></div>}
      {!region && <div className="note" style={{ marginTop: 14 }}><A to="/start/where" className="link">{t('Tell us your country')}</A> {t('to see local prices, shops and rules.')}</div>}

      <section className="section grid two">
        <div><h3>{t('What it can do')}</h3><ul className="bullets yes small">{b.can.map((x) => <li key={x}>{t(x)}</li>)}</ul></div>
        <div><h3>{t('What it cannot do')}</h3><ul className="bullets no small">{b.cant.map((x) => <li key={x}>{t(x)}</li>)}</ul></div>
        <div><h3>{t('Skills you will need')}</h3><ul className="bullets small">{b.skills.map((x) => <li key={x}>{t(x)}</li>)}</ul></div>
      </section>

      <section className="section">
        <h2>{t('Parts list')}</h2>
        <div className="list">
          {SLOTS.filter((s) => sel[s.key] && sel[s.key].sys !== 'None' || (s.key === 'esc' && isIncluded(sel, 'esc')) || (s.key === 'rx' && isIncluded(sel, 'rx'))).map((s) => {
            const inc = isIncluded(sel, s.key);
            const line = c.lines.find((l) => l.slot === s.key);
            return (
              <div className="li" key={s.key}>
                <span className="grow"><div className="sub">{t(s.label)}</div><div className="title">{inc ? t('Included in the flight controller') : partName(sel[s.key])}</div></span>
                {line && <span className="right small num">{line.qty > 1 && <span className="muted">{line.qty} × </span>}{money(line.total, region)}</span>}
              </div>
            );
          })}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>{t('Prices are rough estimates for comparison, and you will still need a radio, charger and goggles. We add those on the parts page.')}</p>
      </section>

      {!!notes.length && (
        <section className="section">
          <h2>{t('Worth knowing')}</h2>
          <div className="stack">{notes.map((i) => <Issue key={i.id} issue={i} />)}</div>
        </section>
      )}
    </div>
  );
}
