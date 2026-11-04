import React, { useState } from 'react';
import { A, Ext, Icon, PageHead, Progress } from '../components/ui.jsx';
import { addLog, deleteLog, useStore } from '../lib/store.js';
import { dateStr, t } from '../lib/util.js';
import { SYMPTOMS } from '../data/troubleshoot.js';
import { FW, FW_CHOICES, preflightFor, CHECKED, LEARNING } from '../data/firmware.js';
import { regionById } from '../data/regions.js';
import { SoftwareSteps } from './Project.jsx';

export function Preflight({ firmware }) {
  const items = preflightFor(firmware);
  const [done, setDone] = useState({});
  const n = items.filter((i) => done[i]).length;
  return (
    <div className="stack">
      <div className="row between small"><span className="muted">{t('{a} of {b} checked', { a: n, b: items.length })}</span>
        <button className="link small" onClick={() => setDone({})}>{t('Reset')}</button></div>
      <Progress value={(n / items.length) * 100} ok={n === items.length} />
      <div className="list">
        {items.map((i) => (
          <label key={i} className={`check ${done[i] ? 'done' : ''}`}>
            <input type="checkbox" checked={!!done[i]} onChange={() => setDone({ ...done, [i]: !done[i] })} />
            <span className="title grow" style={{ fontWeight: 520 }}>{t(i)}</span>
          </label>
        ))}
      </div>
      {n === items.length && <div className="note ok"><b>{t('You are clear to fly')}</b>{t('Stay within your local rules, and land with battery to spare.')}</div>}
    </div>
  );
}

function LogForm({ projectId, projects }) {
  const [form, setForm] = useState({ project: projectId || projects[0]?.id || '', minutes: '', note: '', issue: '' });
  const [saved, setSaved] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const submit = (e) => {
    e.preventDefault();
    addLog({ project: form.project, minutes: form.minutes ? +form.minutes : null, note: form.note.trim(), issue: form.issue });
    setForm({ ...form, minutes: '', note: '', issue: '' });
    setSaved(true);
  };
  return (
    <form className="card stack" onSubmit={submit}>
      {!projectId && projects.length > 0 && (
        <label className="field"><span>{t('Which build?')}</span>
          <select className="input" value={form.project} onChange={set('project')}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
      )}
      <label className="field"><span>{t('Minutes flown')}</span><input className="input" type="number" inputMode="decimal" min="0" max="240" value={form.minutes} onChange={set('minutes')} /></label>
      <label className="field"><span>{t('Any problem?')}</span>
        <select className="input" value={form.issue} onChange={set('issue')}>
          <option value="">{t('No, it flew well')}</option>
          {SYMPTOMS.map((s) => <option key={s.id} value={s.id}>{t(s.title)}</option>)}
        </select>
      </label>
      <label className="field"><span>{t('Notes')}</span><textarea className="input" value={form.note} onChange={set('note')} maxLength={500} /></label>
      <button className="btn block">{t('Save flight')}</button>
      {saved && !form.issue && <div className="note ok" role="status">{t('Flight saved.')}</div>}
    </form>
  );
}

function Logs({ projectId }) {
  const state = useStore();
  const logs = state.logs.filter((l) => !projectId || l.project === projectId);
  if (!logs.length) return null;
  return (
    <div className="list" style={{ marginTop: 12 }}>
      {logs.slice(0, 20).map((l) => {
        const sym = SYMPTOMS.find((s) => s.id === l.issue);
        return (
          <div className="li" key={l.id}>
            <span className="grow">
              <div className="title">{dateStr(l.at)}{l.minutes ? ` · ${l.minutes} ${t('min')}` : ''}</div>
              <div className="sub">{state.projects[l.project]?.name}{l.note ? ` · ${l.note}` : ''}</div>
              {sym && <A to={`/fly/fix/${sym.id}`} className="link small">{t(sym.title)}</A>}
            </span>
            <button className="icon-btn" aria-label={t('Delete')} onClick={() => deleteLog(l.id)}><Icon name="close" /></button>
          </div>
        );
      })}
    </div>
  );
}

export function Flight({ projectId }) {
  const state = useStore();
  const p = projectId ? state.projects[projectId] : null;
  const projects = Object.values(state.projects);
  const [fw, setFw] = useState(p?.firmware || state.profile.firmware || 'Betaflight');
  const region = regionById(state.profile.region);
  return (
    <div className="wrap narrow">
      <PageHead title={t('Fly')} sub={p ? p.name : t('Your checklist and your fixes, even with no signal at the field.')} back={p ? `/p/${p.id}` : undefined} />
      {region && <A to={`/rules/${region.id}`} className="note info" style={{ display: 'block', marginTop: 14, textDecoration: 'none' }}><b>{t('Rules for {place}', { place: t(region.name) })}</b>{t(region.summary)}</A>}
      <section className="section" style={{ marginTop: 22 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2>{t('Pre-flight check')}</h2>
          {!p && (
            <select className="input" style={{ width: 'auto', minHeight: 40 }} aria-label={t('Firmware')} value={fw} onChange={(e) => setFw(e.target.value)}>
              {FW_CHOICES.filter((x) => !FW[x].legacy).map((x) => <option key={x}>{x}</option>)}
            </select>
          )}
        </div>
        <Preflight firmware={p?.firmware || fw} />
      </section>
      <section className="section">
        <h2>{t('Something wrong?')}</h2>
        <div className="list">
          {SYMPTOMS.filter((s) => !s.only || s.only.includes(p?.firmware || fw)).map((s) => (
            <A key={s.id} to={`/fly/fix/${s.id}${p ? `/${p.firmware}` : `/${fw}`}`} className="li">
              <span className="grow"><div className="title">{t(s.title)}</div><div className="sub">{t(s.hint)}</div></span>
              <Icon name="chev" className="chev" />
            </A>
          ))}
        </div>
      </section>
      <section className="section">
        <h2>{t('Log a flight')}</h2>
        {projects.length || p ? <LogForm projectId={projectId} projects={projects} /> : <div className="note">{t('Save a build first, then you can log flights against it.')} <A to="/configure" className="link">{t('Configure')}</A></div>}
        <Logs projectId={projectId} />
      </section>
    </div>
  );
}

export function Fix({ id, fw }) {
  const state = useStore();
  const sym = SYMPTOMS.find((s) => s.id === id);
  const [firmware, setFirmware] = useState(fw || state.profile.firmware || 'Betaflight');
  const [i, setI] = useState(0);
  const [fixed, setFixed] = useState(false);
  if (!sym) return <div className="wrap"><PageHead title={t('Not found')} back="/fly" /></div>;
  const steps = sym.steps.filter((s) => !s.only || s.only.includes(firmware));
  const step = steps[i];
  return (
    <div className="wrap narrow">
      <PageHead title={t(sym.title)} back="/fly" />
      <label className="field" style={{ marginTop: 12 }}><span>{t('Firmware')}</span>
        <select className="input" value={firmware} onChange={(e) => { setFirmware(e.target.value); setI(0); setFixed(false); }}>
          {FW_CHOICES.filter((x) => !FW[x].legacy).map((x) => <option key={x}>{x}</option>)}
        </select>
      </label>
      <div style={{ marginTop: 18 }}>
        {fixed ? (
          <div className="note ok"><b>{t('Glad that worked')}</b>{t('Add a note to your flight log so you remember it next time.')}</div>
        ) : step ? (
          <div className="card stack" aria-live="polite">
            <div className="small muted num">{t('Try {a} of {b}', { a: i + 1, b: steps.length })}</div>
            <h2>{t(step.title)}</h2>
            <p>{t(step.text)}</p>
            <div className="btn-row">
              <button className="btn" onClick={() => setFixed(true)}><Icon name="check" />{t('That fixed it')}</button>
              <button className="btn secondary" onClick={() => setI(i + 1)}>{t('Still broken')}</button>
            </div>
          </div>
        ) : (
          <div className="card stack">
            <h2>{t('Time to ask for help')}</h2>
            <p className="muted">{t('You have tried the usual causes. Post your symptoms and your build link, and include any log. People will be able to help much faster.')}</p>
            <div className="chips">
              {(state.profile.lang === 'zh' ? [...LEARNING.zh, ...LEARNING.en] : LEARNING.en).map(([a, b]) => <Ext key={a} href={b} className="chip accent">{a}</Ext>)}
            </div>
            <button className="link small" onClick={() => setI(0)}>{t('Start again')}</button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Software() {
  return (
    <div className="wrap narrow">
      <PageHead title={t('Choose your firmware')} sub={t('Firmware is the software on your flight controller. Your choice depends on what you want to do.')} />
      <section className="section" style={{ marginTop: 18 }}>
        <div className="stack">
          {[
            ['I want to freestyle, race or film', 'Betaflight'],
            ['I want FPV with GPS and return-to-home', 'INAV'],
            ['I want missions, mapping or a work aircraft', 'ArduPilot'],
            ['I do robotics research with ROS 2', 'PX4'],
            ['I have an old board with Cleanflight', 'Cleanflight'],
          ].map(([q, id]) => (
            <A key={id} to={`/software/${id}`} className="card tap row between" style={{ flexWrap: 'nowrap' }}>
              <span className="grow"><div className="small muted">{t(q)}</div><h3>{FW[id].name}</h3></span>
              <Icon name="chev" className="chev" />
            </A>
          ))}
        </div>
        <p className="tiny muted" style={{ marginTop: 10 }}>{t('Checked {date}. Firmware moves quickly, so trust the official docs if they disagree with us.', { date: CHECKED })}</p>
      </section>
    </div>
  );
}

export function SoftwareDetail({ id }) {
  const fw = FW[id];
  if (!fw) return <div className="wrap"><PageHead title={t('Not found')} back="/software" /></div>;
  return (
    <div className="wrap narrow">
      <PageHead title={fw.name} sub={t(fw.tag)} back="/software">
        <div className="chips" style={{ marginTop: 10 }}><span className={`chip ${fw.legacy ? 'warn' : ''}`}>{t('Latest stable: {v}', { v: fw.version })}</span></div>
      </PageHead>
      {fw.legacyNote && <div className="note warn" style={{ marginTop: 14 }}><b>{t('Not for new builds')}</b>{t(fw.legacyNote)}</div>}
      {fw.legacy && <div className="btn-row" style={{ marginTop: 12 }}><A to="/software/Betaflight" className="btn">Betaflight</A><A to="/software/INAV" className="btn secondary">INAV</A></div>}
      <section className="section grid two" style={{ marginTop: 20 }}>
        <div><h3>{t('Great for')}</h3><ul className="bullets yes small">{fw.bestFor.map((x) => <li key={x}>{t(x)}</li>)}</ul></div>
        <div><h3>{t('Not for')}</h3><ul className="bullets no small">{fw.notFor.map((x) => <li key={x}>{t(x)}</li>)}</ul></div>
      </section>
      {fw.tool && (
        <section className="section">
          <Ext href={fw.tool.url} className="btn block"><Icon name="ext" />{t('Open {tool}', { tool: fw.tool.name })}</Ext>
          <p className="tiny muted" style={{ marginTop: 8 }}>{t(fw.toolNote)}</p>
        </section>
      )}
      {!!fw.steps.length && (
        <section className="section">
          <h2>{t('Setup steps')}</h2>
          <SoftwareSteps fw={fw} />
        </section>
      )}
      <section className="section">
        <h2>{t('Official links')}</h2>
        <div className="chips">{fw.links.map(([a, b]) => <Ext key={a} href={b} className="chip accent">{t(a)}</Ext>)}</div>
      </section>
      {fw.research && (
        <section className="section">
          <h2>{t('For researchers')}</h2>
          <div className="chips">{fw.research.map(([a, b]) => <Ext key={a} href={b} className="chip info">{t(a)}</Ext>)}</div>
        </section>
      )}
    </div>
  );
}
