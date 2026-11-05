import React from 'react';
import { A, Ext, Icon, PageHead } from '../components/ui.jsx';
import { setProfile, useStore } from '../lib/store.js';
import { t } from '../lib/util.js';
import { REGIONS, regionById, RULES_CHECKED } from '../data/regions.js';

export function Rules() {
  const { profile } = useStore();
  return (
    <div className="wrap narrow">
      <PageHead title={t('Rules by country')} sub={t('Flying rules, radio limits, import issues and shops, where you are.')} />
      <div className="list" style={{ marginTop: 14 }}>
        {REGIONS.map((r) => (
          <A key={r.id} to={`/rules/${r.id}`} className="li">
            <span className="grow"><div className="title">{t(r.name)}{profile.region === r.id && <span className="chip accent" style={{ marginLeft: 8 }}>{t('Yours')}</span>}</div><div className="sub">{r.regulator}</div></span>
            <Icon name="chev" className="chev" />
          </A>
        ))}
      </div>
      <p className="small muted" style={{ marginTop: 14 }}>{t('Do not see your country? The building and firmware guides still apply. Check your national aviation authority for the rules.')}</p>
    </div>
  );
}

export function RuleDetail({ id }) {
  const { profile } = useStore();
  const r = regionById(id);
  if (!r) return <div className="wrap"><PageHead title={t('Not found')} back="/rules" /></div>;
  return (
    <div className="wrap narrow">
      <PageHead title={t(r.name)} sub={t(r.summary)} back="/rules" />
      {profile.region !== id && <button className="btn secondary block" style={{ marginTop: 14 }} onClick={() => setProfile({ region: id })}>{t('Use {place} as my country', { place: t(r.name) })}</button>}
      <div className="stack" style={{ marginTop: 18 }}>
        {r.sections.map((s) => (
          <section className="card" key={s.title}>
            <h3>{t(s.title)}</h3>
            <ul className="bullets small" style={{ marginTop: 4 }}>{s.points.map((x) => <li key={x}>{t(x)}</li>)}</ul>
          </section>
        ))}
        <section className="card">
          <h3>{t('Where to buy')}</h3>
          <div className="chips" style={{ marginTop: 8 }}>{r.stores.map((st) => <Ext key={st.name} className="chip accent" href={st.home}>{st.name}</Ext>)}</div>
          {r.storeNote && <p className="small muted" style={{ marginTop: 8 }}>{t(r.storeNote)}</p>}
        </section>
        <section className="card">
          <h3>{t('Official sources')}</h3>
          <div className="stack small" style={{ marginTop: 6 }}>
            {r.sources.map(([a, b]) => <div key={b}><Ext href={b}>{t(a)}</Ext></div>)}
          </div>
        </section>
      </div>
      <p className="tiny muted" style={{ marginTop: 12 }}>{t('Checked {date}. This is a helpful summary and not legal advice. Laws change, so confirm with the official source before you fly or buy.', { date: RULES_CHECKED })}</p>
    </div>
  );
}

export function About() {
  const { profile } = useStore();
  return (
    <div className="wrap narrow">
      <PageHead title={t('About Thrustworthy')} sub={t('A free, open-source guide for anyone building a multirotor, whoever and wherever they are.')} />
      <section className="section" style={{ marginTop: 18 }}>
        <div className="card stack">
          <div>
            <h3>Anoorag Sunkari</h3>
            <p className="small muted">{t('Author')}</p>
            <div style={{ marginTop: 6 }}><Ext href="https://github.com/Anooragsunkari"><span className="small">github.com/Anooragsunkari</span></Ext></div>
          </div>
          <div>
            <h3>Chahat Deep Singh</h3>
            <p className="small muted">{t('Contributor and project maintainer.')}</p>
          </div>
        </div>
      </section>
      <section className="section">
        <h2>{t('What we promise')}</h2>
        <ul className="bullets" style={{ marginTop: 6 }}>
          {['No account, no tracking, and no ads. Your builds stay on your device.', 'No affiliate links. Shop links are plain searches.', 'No invented reviews or fake community numbers.', 'Works offline at the field once you have opened it.', 'No Google Fonts or foreign CDNs, so it loads the same way in every country.'].map((x) => <li key={x}>{t(x)}</li>)}
        </ul>
      </section>
      <section className="section">
        <h2>{t('What we are not')}</h2>
        <p className="muted">{t('We do not sell parts, and we cannot watch live prices or stock. We checked part specs against maker and retailer pages in November 2026, but they are typical values, and some thrust figures have no published test behind them. Check the maker\'s page before you buy. Building and flying drones has real risks: you are responsible for your safety and for following your local law.')}</p>
      </section>
      <section className="section btn-row">
        <A to="/about/numbers" className="btn secondary">{t('How we calculate')}</A>
        <Ext href="https://github.com/Anooragsunkari/thrustworthy" className="btn secondary"><Icon name="ext" />{t('Source code')}</Ext>
      </section>
    </div>
  );
}

export function Numbers() {
  return (
    <div className="wrap narrow">
      <PageHead title={t('How we calculate')} sub={t('Every number here comes from a formula you can check. All of it is an estimate.')} back="/about" />
      <div className="stack" style={{ marginTop: 18 }}>
        <section className="card">
          <h3>{t('Hover power')}</h3>
          <p className="small muted">{t('Momentum theory gives the ideal power to hold up the weight. We divide by a prop efficiency that grows with prop size, and by 75 percent for the motors and ESC.')}</p>
          <pre className="tiny" style={{ overflowX: 'auto', margin: '8px 0 0' }}>P = T^1.5 / sqrt(2 ρ A) / FM / 0.75 + electronics</pre>
        </section>
        <section className="card">
          <h3>{t('Flight time')}</h3>
          <p className="small muted">{t('We use 80 percent of the battery energy (85 percent for Li-ion), apply a Peukert correction for the current, and scale by flying style. Freestyle uses roughly two to three times the power of hover.')}</p>
        </section>
        <section className="card">
          <h3>{t('Thrust and current')}</h3>
          <p className="small muted">{t('Each motor lists a bench result at one prop and voltage. We scale thrust by voltage to the power of 1.5 and prop diameter to the power of 2.5. Current scales by voltage to the power of 1.5 and diameter cubed.')}</p>
        </section>
        <section className="card">
          <h3>{t('Air density')}</h3>
          <p className="small muted">{t('The standard ISA atmosphere, so high fields correctly show less flight time.')}</p>
        </section>
        <section className="card">
          <h3>{t('How close is it?')}</h3>
          <p className="small muted">{t('Our automated tests compare a Holybro X500-class quad, a 5-inch and a whoop against typical real figures. Expect to land within about 25 percent. Treat it as a tool for comparing builds and not as a guarantee.')}</p>
        </section>
      </div>
    </div>
  );
}
