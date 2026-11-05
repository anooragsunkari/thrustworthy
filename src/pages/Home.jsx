import React, { useState } from 'react';
import { A, BuildCard, HeroDrone, Icon, Progress, FirmwareLogo } from '../components/ui.jsx';
import { useStore, setProfile, createProject } from '../lib/store.js';
import { go, t } from '../lib/util.js';
import { PERSONAS, LEVELS, personaById } from '../data/personas.js';
import { BUILDS } from '../data/builds.js';
import { REGIONS, regionById, guessRegion } from '../data/regions.js';
import { FW, FW_CHOICES } from '../data/firmware.js';
import { stages } from '../lib/progress.js';

export const rankBuilds = (profile, n = 3) => {
  const score = (b) => (b.personas.includes(profile.persona) ? 10 - b.personas.indexOf(profile.persona) : 0) + (b.level === profile.level ? 3 : 0) + (b.firmware === profile.firmware ? 2 : 0);
  return [...BUILDS].sort((a, b) => score(b) - score(a)).slice(0, n);
};

const JOURNEY = [
  ['Choose a starting point', 'Reference builds for each style of flying, with honest costs and flight times.'],
  ['Make it yours', 'Swap any part. Voltage, size, current, firmware and local rules get checked as you go.'],
  ['Get the parts', 'Your list, with prices in your currency and the shops in your country.'],
  ['Build it, step by step', 'A checklist with tips and common mistakes, made for your exact parts.'],
  ['Set up the software', 'Flash, configure, calibrate and test on Betaflight, INAV, ArduPilot or PX4.'],
  ['Fly, fix and share', 'A pre-flight list, a troubleshooter that asks what is wrong, and a link to show it off.'],
];

export function Home() {
  const state = useStore();
  const { profile } = state;
  const persona = personaById(profile.persona);
  const region = regionById(profile.region);
  const projects = Object.values(state.projects).sort((a, b) => b.updated - a.updated);
  const current = projects[0];
  const featured = rankBuilds(profile);
  const s = current && stages(current, state.logs, state.owned);

  return (
    <div className="wrap">
      <section className="hero">
        <div>
          <h1>{t(persona ? persona.heroTitle : 'Build a drone you can trust')}</h1>
          <p>{t(persona ? persona.heroSub : 'From first idea to first flight. Pick who you are, and we check every part, every number and your local rules along the way.')}</p>
          <div className="btn-row" style={{ marginTop: 28, maxWidth: 440 }}>
            {current
              ? <A to={`/p/${current.id}`} className="btn">{t('Continue {name}', { name: current.name })}</A>
              : <A to="/start" className="btn">{t('Find my build')}</A>}
            <A to="/builds" className="btn secondary">{t('Browse builds')}</A>
          </div>
        </div>
        <HeroDrone />
      </section>

      {current && s.next && (
        <section className="section">
          <A to={s.next.to} className="card tap">
            <div className="row between"><span className="small muted">{t('Your next step')}</span><span className="small num muted">{s.pct}%</span></div>
            <h3 style={{ margin: '4px 0 10px' }}>{t(s.next.title)}: {current.name}</h3>
            <Progress value={s.pct} />
          </A>
        </section>
      )}

      {!persona && (
        <section className="section">
          <h2>{t('What brings you here?')}</h2>
          <div className="grid two">
            {PERSONAS.map((p) => (
              <button key={p.id} className="card tap persona" onClick={() => { setProfile({ persona: p.id, level: p.level }); go('/start/where'); }}>
                <span className="ico"><Icon name={p.icon} /></span>
                <span><h3>{t(p.title)}</h3><span className="small muted">{t(p.blurb)}</span></span>
              </button>
            ))}
          </div>
        </section>
      )}

      {persona && (
        <section className="section">
          <h2>{t('Where to start')}</h2>
          <ol className="grid three">
            {persona.first.map((f) => (
              <li key={f.title} className="card"><h3>{t(f.title)}</h3><p className="small muted" style={{ marginTop: 4 }}>{t(f.text)}</p></li>
            ))}
          </ol>
        </section>
      )}

      <section className="section">
        <div className="row between" style={{ marginBottom: 14 }}>
          <h2>{t(persona ? 'Builds for you' : 'Featured builds')}</h2>
          <A to="/builds" className="link small">{t('See all')}</A>
        </div>
        <div className="grid three">{featured.map((b) => <BuildCard key={b.id} build={b} region={region} />)}</div>
      </section>

      {!persona && (
        <section className="section">
          <h2>{t('Choose your level')}</h2>
          <div className="grid three">
            {LEVELS.map((l) => (
              <A key={l.id} to={`/builds/level/${l.id}`} className="card tap">
                <h3>{t(l.title)}</h3><p className="small muted" style={{ marginTop: 4 }}>{t(l.text)}</p>
              </A>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2>{t('From idea to first flight')}</h2>
        <ol className="journey">
          {JOURNEY.map(([a, b]) => <li key={a}><h3>{t(a)}</h3><p>{t(b)}</p></li>)}
        </ol>
      </section>

      <section className="section">
        <h2>{t('Your firmware')}</h2>
        <p className="muted" style={{ marginBottom: 14 }}>{t('Every guide adapts to your firmware. Not sure which one? We will explain the choice.')}</p>
        <div className="list">
          {['Betaflight', 'INAV', 'ArduPilot', 'PX4', 'Cleanflight'].map((id) => (
            <A key={id} to={`/software/${id}`} className="li">
              <FirmwareLogo id={id} name={FW[id].name} /><span className="grow"><div className="title">{FW[id].name}</div><div className="sub">{t(FW[id].tag)}</div></span>
              <Icon name="chev" className="chev" />
            </A>
          ))}
        </div>
      </section>

      <section className="section">
        <h2>{t('Your country')}</h2>
        <p className="muted" style={{ marginBottom: 14 }}>{t('Drone laws, radio limits and shops change at every border. See what applies where you fly.')}</p>
        <div className="chips">
          {REGIONS.map((r) => <A key={r.id} to={`/rules/${r.id}`} className="filter" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>{t(r.name)}</A>)}
        </div>
      </section>
    </div>
  );
}

/** Four short questions, every one skippable. */
export function Start({ step }) {
  const { profile } = useStore();
  const order = ['who', 'where', 'level', 'firmware'];
  const i = order.indexOf(step || 'who');
  const nextOf = (s) => { const n = order[order.indexOf(s) + 1]; go(n ? `/start/${n}` : '/start/done'); };

  if (step === 'done') return <StartDone />;
  const suggested = guessRegion();

  return (
    <div className="wrap narrow flow">
      <div className="flow-bar" aria-hidden="true">{order.map((o, n) => <i key={o} className={n <= i ? 'on' : ''} />)}</div>
      {step === 'where' ? (
        <>
          <h1 style={{ fontSize: 34 }}>{t('Where will you fly?')}</h1>
          <p className="muted" style={{ margin: '8px 0 18px' }}>{t('This sets your currency, shops, radio limits and drone laws. It stays on your device.')}</p>
          <div className="list">
            {[...REGIONS].sort((a, b) => (b.id === suggested) - (a.id === suggested)).map((r) => (
              <button key={r.id} className="li" onClick={() => { setProfile({ region: r.id }); nextOf('where'); }}>
                <span className="grow"><div className="title">{t(r.name)}</div><div className="sub">{r.currency}{r.id === suggested ? ` · ${t('Suggested')}` : ''}</div></span>
                <Icon name="chev" className="chev" />
              </button>
            ))}
          </div>
          <button className="btn quiet" style={{ marginTop: 10 }} onClick={() => nextOf('where')}>{t('My country is not listed')}</button>
        </>
      ) : step === 'level' ? (
        <>
          <h1 style={{ fontSize: 34 }}>{t('How much have you built?')}</h1>
          <p className="muted" style={{ margin: '8px 0 18px' }}>{t('This changes how much we explain. You can change it at any time.')}</p>
          <div className="stack">
            {LEVELS.map((l) => (
              <button key={l.id} className={`card tap ${profile.level === l.id ? 'sel' : ''}`} onClick={() => { setProfile({ level: l.id }); nextOf('level'); }}>
                <h3>{t(l.title)}</h3><p className="small muted">{t(l.text)}</p>
              </button>
            ))}
          </div>
        </>
      ) : step === 'firmware' ? (
        <>
          <h1 style={{ fontSize: 34 }}>{t('Do you have a firmware in mind?')}</h1>
          <p className="muted" style={{ margin: '8px 0 18px' }}>{t('Firmware is the software on the flight controller. If you do not know yet, that is normal.')}</p>
          <div className="list">
            <button className="li" onClick={() => { setProfile({ firmware: null }); nextOf('firmware'); }}>
              <span className="grow"><div className="title">{t('Pick for me')}</div><div className="sub">{t('Recommended if you are unsure')}</div></span><Icon name="chev" className="chev" />
            </button>
            {FW_CHOICES.map((id) => (
              <button key={id} className="li" onClick={() => { setProfile({ firmware: id === 'Cleanflight' ? 'Betaflight' : id }); nextOf('firmware'); }}>
                <FirmwareLogo id={id} name={FW[id].name} /><span className="grow"><div className="title">{FW[id].name}</div><div className="sub">{t(FW[id].tag)}</div></span><Icon name="chev" className="chev" />
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <h1 style={{ fontSize: 34 }}>{t('What brings you here?')}</h1>
          <p className="muted" style={{ margin: '8px 0 18px' }}>{t('Four quick questions. There is no account, and nothing leaves your device.')}</p>
          <div className="stack">
            {PERSONAS.map((p) => (
              <button key={p.id} className={`card tap persona ${profile.persona === p.id ? 'sel' : ''}`} onClick={() => { setProfile({ persona: p.id, level: p.level }); nextOf('who'); }}>
                <span className="ico"><Icon name={p.icon} /></span>
                <span><h3>{t(p.title)}</h3><span className="small muted">{t(p.blurb)}</span></span>
              </button>
            ))}
          </div>
          <A to="/builds" className="btn quiet" style={{ marginTop: 10 }}>{t('Just let me browse')}</A>
        </>
      )}
    </div>
  );
}

function StartDone() {
  const { profile } = useStore();
  const persona = personaById(profile.persona) || PERSONAS[0];
  const fwId = profile.firmware || persona.firmware;
  const region = regionById(profile.region);
  const picks = rankBuilds({ ...profile, firmware: fwId }, 3);
  return (
    <div className="wrap narrow">
      <div className="page-head">
        <h1 style={{ fontSize: 34 }}>{t('Here is your starting point')}</h1>
      </div>
      <div className="stack">
        <div className="card">
          <span className="chip accent">{t('Your firmware')}</span>
          <h2 style={{ margin: '8px 0 4px' }}>{FW[fwId].name}</h2>
          <p className="small muted">{t(profile.firmware ? FW[fwId].tag : persona.whyFw)}</p>
          <A to={`/software/${fwId}`} className="link small">{t('More about this choice')}</A>
        </div>
        {region && (
          <A to={`/rules/${region.id}`} className="card tap">
            <span className="chip info">{t('Before you fly')}</span>
            <h3 style={{ marginTop: 8 }}>{t('Rules for {place}', { place: t(region.name) })}</h3>
            <p className="small muted">{t(region.summary)}</p>
          </A>
        )}
      </div>
      <section className="section">
        <h2>{t('Builds for you')}</h2>
        <div className="stack">{picks.map((b) => <BuildCard key={b.id} build={b} region={region} />)}</div>
      </section>
      <section className="section">
        <button className="btn secondary block" onClick={() => { const id = createProject({ name: t('My build'), goal: picks[0].goal, firmware: fwId }); go(`/configure/${id}`); }}>
          <Icon name="plus" />{t('Start from a blank build')}
        </button>
      </section>
    </div>
  );
}
