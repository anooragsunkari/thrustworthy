import React, { useEffect, useRef, useState } from 'react';
import { A, Ext, Icon, PageHead, Progress, Tile, useToast } from '../components/ui.jsx';
import { STAGE_ICON } from '../lib/icons.js';
import { useStore, createProject, deleteProject, duplicateProject, keepCustomParts, deletePhoto, loadPhoto, savePhoto, setGearOwned, setOwnedQty, setProfile, shrinkImage, toggleIn, updateProject } from '../lib/store.js';
import { copyText, decodeBuild, downloadFile, go, grams, shareUrl, t } from '../lib/util.js';
import { SLOTS, partName } from '../data/parts.js';
import { GEAR } from '../data/personas.js';
import { PHASES, stepsFor } from '../data/assembly.js';
import { FW, ESC_NOTE, RADIO_NOTE } from '../data/firmware.js';
import { REGIONS, RULES_CHECKED, regionById, money, storeLinks } from '../data/regions.js';
import { buildFacts, legalChecklist } from '../data/legal.js';
import { check, cost, loadBuild, resolve, summarize, traits, flight } from '../lib/engine.js';
import { EVERY_BUILD_GEAR, gearOwned, ownedQty, shopping } from '../lib/owned.js';
import { stages } from '../lib/progress.js';
import { Flight } from './Fly.jsx';

const notFound = () => <div className="wrap"><PageHead title={t('Build not found')} sub={t('It may be on another device, because builds are saved on the device that made them.')} back="/me" /></div>;

export function ProjectHome({ id }) {
  const state = useStore();
  const p = state.projects[id];
  if (!p) return notFound();
  const s = stages(p, state.logs, state.owned);
  const remove = () => {
    if (window.confirm(t('Delete this build from this device?'))) { deleteProject(id); go('/me'); }
  };
  return (
    <div className="wrap narrow">
      <PageHead title={p.name} sub={`${p.firmware}`} back="/me" />
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between small"><span className="muted">{t('Progress')}</span><span className="num">{s.pct}%</span></div>
        <div style={{ marginTop: 8 }}><Progress value={s.pct} ok={s.pct === 100} /></div>
      </div>
      {s.next && <A to={s.next.to} className="btn block" style={{ marginTop: 14 }}>{t('Next: {step}', { step: t(s.next.title) })}</A>}
      {loadBuild(p).frame && (
        <A to={`/p/${id}/3d`} className="card tap row between" style={{ marginTop: 14, flexWrap: 'nowrap' }}>
          <Tile name="box" />
          <span className="grow">
            <h3>{t(s.pct === 100 ? 'Your finished drone in 3D' : 'See your drone in 3D')}</h3>
            <span className="small muted">{t('Turn it around, pull it apart, and tap any part for details.')}</span>
          </span>
          <Icon name="chev" className="chev" />
        </A>
      )}
      <div className="list" style={{ marginTop: 14 }}>
        {s.list.map((st) => (
          <A key={st.key} to={st.to} className="li">
            <Tile name={STAGE_ICON[st.key]} done={st.done} />
            <span className="grow"><div className="title">{t(st.title)}</div><div className="sub">{t(st.detail)}</div></span>
            <Icon name="chev" className="chev" />
          </A>
        ))}
      </div>
      <h2 style={{ margin: '24px 0 10px' }}>{t('Tools for this build')}</h2>
      <div className="list">
        {[
          [`/p/${id}/wiring`, 'Wiring diagram', 'Power, motor order and every connection, for your exact parts.', 'plug'],
          [`/p/${id}/settings`, 'Starter settings', 'A file for your firmware, with ports and battery limits filled in.', 'cog'],
          [`/p/${id}/spares`, 'Spares and repairs', 'What usually breaks, how many spares to keep, and how to fix it.', 'build'],
          [`/p/${id}/legal`, 'Am I legal?', 'A checklist for this exact build, in your country.', 'shield'],
          [`/compare/p.${p.copyOf && state.projects[p.copyOf] ? `${p.copyOf}/p.${id}` : id}`, 'Compare builds', 'See it side by side with another build.', 'columns'],
        ].map(([to, title, sub, icon]) => (
          <A key={to} to={to} className="li">
            <Tile name={icon} />
            <span className="grow"><div className="title">{t(title)}</div><div className="sub">{t(sub)}</div></span>
            <Icon name="chev" className="chev" />
          </A>
        ))}
      </div>
      <button className="btn secondary block" style={{ marginTop: 14 }} onClick={() => go(`/configure/${duplicateProject(id)}`)}>{t('Try a change on a copy')}</button>
      <button className="btn danger block" style={{ marginTop: 24 }} onClick={remove}>{t('Delete build')}</button>
    </div>
  );
}

export function Parts({ id }) {
  const state = useStore();
  const p = state.projects[id];
  const region = regionById(state.profile.region);
  const [toast, setToast] = useToast();
  if (!p) return notFound();
  const sel = loadBuild(p);
  const c = shopping(sel, state.owned);
  const buying = c.lines.filter((l) => l.buy > 0);
  const mine = c.lines.filter((l) => l.buy === 0);
  const price = (n, l) => (l.unit ? money(n, region) : t('Price not set'));
  const tr = traits(sel, p.firmware);
  const gear = GEAR.filter((g) => !g.when || g.when(tr));
  const gearTotal = gear.filter((g) => !gearOwned(g, p, state.owned)).reduce((a, g) => a + g.p, 0);
  const n = summarize(check(sel, { firmware: p.firmware, goal: p.goal, region }));

  const asText = () => [
    p.name, `${t('Firmware')}: ${p.firmware}`, '',
    ...buying.map((l) => `${t(SLOTS.find((s) => s.key === l.slot).label)}: ${l.buy > 1 ? `${l.buy} x ` : ''}${partName(l.part)} (${price(l.buyTotal, l)})`),
    ...(mine.length ? ['', `${t('Already own')}: ${mine.map((l) => partName(l.part)).join(', ')}`] : []),
    ...(sel.payload ? ['', `${t('Payload')}: ${sel.payload.items.map((i) => `${i.name} (${i.g} g)`).join(', ')}`] : []),
    '', `${t(c.saved ? 'Left to buy' : 'Total')}: ${money(c.toBuy, region)}`, shareUrl(p),
  ].join('\n');
  const csv = () => {
    const esc = (x) => `"${String(x).replace(/"/g, '""')}"`;
    const rows = [['Slot', 'Brand', 'Model', 'Qty', 'Owned', 'To buy', 'Approx unit USD', 'Approx to buy USD'], ...c.lines.map((l) => [l.slot, l.part.b, l.part.m, l.qty, l.own, l.buy, l.unit, l.buyTotal])];
    downloadFile(`${p.name.replace(/[^\w-]+/g, '_')}.csv`, rows.map((r) => r.map(esc).join(',')).join('\n'), 'text/csv');
  };

  return (
    <div className="wrap narrow">
      <PageHead title={t('Get the parts')} sub={p.name} back={`/p/${id}`} />
      {n.errors > 0 && <div className="note err" style={{ marginTop: 14 }}><b>{t('This build has problems to fix')}</b><A to={`/configure/${id}`} className="link">{t('Fix them before you buy')}</A></div>}
      {!region && <div className="note" style={{ marginTop: 14 }}><A to="/start/where" className="link">{t('Tell us your country')}</A> {t('to see local prices, shops and rules.')}</div>}

      <section className="section" style={{ marginTop: 18 }}>
        <div className="row between" style={{ marginBottom: 10 }}>
          <h2>{t('Drone parts')}</h2>
          <b className="num">{money(c.toBuy, region)}</b>
        </div>
        {c.saved > 0 && <p className="small muted" style={{ marginBottom: 10 }}>{t('You save about {sum} with parts you own.', { sum: money(c.saved, region) })}</p>}
        {!c.lines.length && <div className="note">{t('Nothing here yet.')} <A to={`/configure/${id}`} className="link">{t('Pick your parts')}</A></div>}
        <div className="list">
          {buying.map((l) => {
            const done = !!p.have?.[l.slot];
            return (
              <div key={l.slot}>
                <label className={`check ${done ? 'done' : ''}`}>
                  <input type="checkbox" checked={done} onChange={() => toggleIn(id, 'have', l.slot)} />
                  <span className="grow">
                    <div className="sub small muted">{t(SLOTS.find((s) => s.key === l.slot).label)}</div>
                    <div className="title">{l.buy > 1 && `${l.buy} × `}{partName(l.part)}</div>
                    {l.own > 0 && <div className="small muted">{t('You own {have} of {need}', { have: l.own, need: l.qty })}</div>}
                  </span>
                  <span className="small num">{price(l.buyTotal, l)}</span>
                </label>
                <div className="chips no-print" style={{ padding: '0 14px 12px 48px' }}>
                  {storeLinks(region, partName(l.part)).map((st) => <Ext key={st.name} href={st.url} className="chip accent">{st.name}</Ext>)}
                  <button className="chip own-btn" onClick={() => setOwnedQty(l.part.id, Math.max(ownedQty(state.owned, l.part.id), l.qty))}><Icon name="plus" />{t('I own this')}</button>
                </div>
              </div>
            );
          })}
        </div>
        <p className="tiny muted" style={{ marginTop: 8 }}>{t('Tick a part once you have ordered it or it has arrived. Shop links open a search, so you can compare prices. We have no affiliate deals. Prices here are rough estimates.')}</p>
      </section>

      {!!mine.length && (
        <section className="section">
          <div className="row between" style={{ marginBottom: 10 }}>
            <h2>{t('Already yours')}</h2>
            <A to="/gear" className="link small no-print">{t('Gear I own')}</A>
          </div>
          <div className="list">
            {mine.map((l) => (
              <div className="li" key={l.slot}>
                <i className="dot ok" aria-hidden="true" />
                <span className="grow" style={{ minWidth: 0 }}>
                  <div className="sub">{t(SLOTS.find((s) => s.key === l.slot).label)}</div>
                  <div className="title">{l.qty > 1 && `${l.qty} × `}{partName(l.part)}</div>
                </span>
                <button className="chip own-btn no-print" onClick={() => setOwnedQty(l.part.id, 0)}>{t('I do not own this')}</button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="row between" style={{ marginBottom: 4 }}>
          <h2>{t('You will also need')}</h2>
          <b className="num">{money(gearTotal, region)}</b>
        </div>
        <p className="small muted" style={{ marginBottom: 10 }}>{t('The costs most first-time guides forget. Untick anything you already own.')}</p>
        <div className="list">
          {gear.map((g) => {
            const owned = gearOwned(g, p, state.owned);
            const link = g.query && storeLinks(region, g.query)[0];
            return (
              <label key={g.id} className="check">
                <input type="checkbox" checked={!owned} onChange={() => (EVERY_BUILD_GEAR(g) ? setGearOwned(g.id, !owned) : toggleIn(id, 'extras', g.id))} />
                <span className="grow">
                  <div className="title" style={owned ? { color: 'var(--muted)' } : undefined}>{t(g.title)}</div>
                  <div className="small muted">{t(g.detail)}</div>
                  {link && !owned && <Ext href={link.url}><span className="small">{t('Search {shop}', { shop: link.name })}</span></Ext>}
                </span>
                <span className="small num">{money(g.p, region)}</span>
              </label>
            );
          })}
        </div>
      </section>

      <div className="card section">
        <div className="row between"><b>{t('All in')}</b><b className="num" style={{ fontSize: 20 }}>{money(c.toBuy + gearTotal, region)}</b></div>
      </div>

      <section className="section btn-row no-print">
        <button className="btn secondary" onClick={async () => setToast((await copyText(asText())) ? t('Copied') : t('Could not copy'))}>{t('Copy list')}</button>
        <button className="btn secondary" onClick={() => window.print()}>{t('Print or save PDF')}</button>
        <button className="btn secondary" onClick={csv}>{t('Download CSV')}</button>
        <A to={`/p/${id}/share`} className="btn secondary">{t('Share link')}</A>
      </section>
      <A to={`/p/${id}/assemble`} className="btn block section no-print">{t('Next: {step}', { step: t('Build') })}</A>
      {toast}
    </div>
  );
}

function StepPhoto({ pid, sid }) {
  const key = `${pid}:${sid}`;
  const [src, setSrc] = useState(null);
  const ref = useRef(null);
  useEffect(() => { let on = true; loadPhoto(key).then((d) => on && setSrc(d || null)).catch(() => {}); return () => { on = false; }; }, [key]);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const data = await shrinkImage(f);
    await savePhoto(key, data);
    setSrc(data);
  };
  return (
    <div style={{ marginTop: 10 }}>
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
      {src ? (
        <>
          <img src={src} alt={t('Your progress photo')} className="photo" />
          <button className="link small" style={{ marginTop: 4 }} onClick={async () => { await deletePhoto(key); setSrc(null); }}>{t('Remove photo')}</button>
        </>
      ) : <button className="btn secondary small" onClick={() => ref.current.click()}><Icon name="camera" />{t('Add a progress photo')}</button>}
    </div>
  );
}

export function Assemble({ id }) {
  const state = useStore();
  const p = state.projects[id];
  if (!p) return notFound();
  const sel = loadBuild(p);
  const steps = stepsFor(traits(sel, p.firmware));
  const done = steps.filter((s) => p.steps?.[s.id]).length;
  const pct = steps.length ? (done / steps.length) * 100 : 0;

  return (
    <div className="wrap narrow">
      <PageHead title={t('Build it')} sub={t('Steps for your exact parts. Tick them off as you go.')} back={`/p/${id}`} />
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between small"><span className="muted">{t('{a} of {b} steps', { a: done, b: steps.length })}</span><span className="num">{Math.round(pct)}%</span></div>
        <div style={{ marginTop: 8 }}><Progress value={pct} ok={pct === 100} /></div>
      </div>

      <A to={`/p/${id}/wiring`} className="card tap row between" style={{ marginTop: 14, flexWrap: 'nowrap' }}>
        <Tile name="plug" />
        <span className="grow"><h3>{t('Wiring diagram')}</h3><span className="small muted">{t('Power, motor order and every connection, for your exact parts.')}</span></span>
        <Icon name="chev" className="chev" />
      </A>

      {PHASES.map((phase) => {
        const list = steps.filter((s) => s.phase === phase);
        if (!list.length) return null;
        return (
          <section className="section" key={phase} style={{ marginTop: 24 }}>
            <h2 style={{ marginBottom: 10 }}>{t(phase)}</h2>
            <div className="list">
              {list.map((s) => {
                const isDone = !!p.steps?.[s.id];
                return (
                  <div key={s.id}>
                    <div className={`check ${isDone ? 'done' : ''}`}>
                      <input type="checkbox" aria-label={t(s.title)} checked={isDone} onChange={() => toggleIn(id, 'steps', s.id)} />
                      <details className="grow" style={{ marginTop: -10, marginBottom: -10 }}>
                        <summary className="title" style={{ fontWeight: 590 }}>{t(s.title)}</summary>
                        <div style={{ paddingBottom: 10 }}>
                          <ol className="numbered small">{s.do.map((d) => <li key={d}>{t(d)}</li>)}</ol>
                          {s.tip && <div className="note ok" style={{ marginTop: 10 }}><b>{t('Tip')}</b>{t(s.tip)}</div>}
                          {s.mistake && <div className="note warn" style={{ marginTop: 8 }}><b>{t('Common mistake')}</b>{t(s.mistake)}</div>}
                          <StepPhoto pid={id} sid={s.id} />
                        </div>
                      </details>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
      {pct === 100 && <div className="note ok section"><b>{t('First Build Complete')}</b>{t('Great work. Next you will set up the software.')}</div>}
      <A to={`/p/${id}/setup`} className="btn block section">{t('Next: {step}', { step: t('Set up software') })}</A>
    </div>
  );
}

export function Setup({ id }) {
  const state = useStore();
  const p = state.projects[id];
  if (!p) return notFound();
  const fw = FW[p.firmware];
  const done = fw.steps.filter((s) => p.software?.[s.id]).length;
  return (
    <div className="wrap narrow">
      <PageHead title={t('Set up {fw}', { fw: fw.name })} sub={p.name} back={`/p/${id}`} />
      <div className="card" style={{ marginTop: 14 }}>
        <div className="row between small"><span className="muted">{t('{a} of {b} steps', { a: done, b: fw.steps.length })}</span></div>
        <div style={{ marginTop: 8 }}><Progress value={(done / fw.steps.length) * 100} ok={done === fw.steps.length} /></div>
      </div>
      <Ext href={fw.tool.url} className="btn secondary block" style={{ marginTop: 14 }}><Icon name="ext" />{t('Open {tool}', { tool: fw.tool.name })}</Ext>
      <p className="tiny muted" style={{ marginTop: 8 }}>{t(fw.toolNote)}</p>
      <div className="note warn" style={{ marginTop: 14 }}><b>{t('Keep the props off')}</b>{t('Props stay off until every step here is finished.')}</div>
      <A to={`/p/${id}/settings`} className="card tap row between" style={{ marginTop: 14, flexWrap: 'nowrap' }}>
        <Tile name="cog" />
        <span className="grow"><h3>{t('Starter settings')}</h3><span className="small muted">{t('A file for your firmware, with ports and battery limits filled in.')}</span></span>
        <Icon name="chev" className="chev" />
      </A>
      <section className="section" style={{ marginTop: 18 }}>
        <SoftwareSteps fw={fw} doneMap={p.software} onToggle={(k) => toggleIn(id, 'software', k)} />
      </section>
      <section className="section grid two">
        {[ESC_NOTE, RADIO_NOTE].map((n) => (
          <div className="card" key={n.title}>
            <h3>{t(n.title)}</h3><p className="small muted" style={{ margin: '4px 0 8px' }}>{t(n.text)}</p>
            <div className="chips">{n.links.map(([a, b]) => <Ext key={a} href={b} className="chip accent">{a}</Ext>)}</div>
          </div>
        ))}
      </section>
      <A to={`/p/${id}/fly`} className="btn block section">{t('Next: {step}', { step: t('Fly') })}</A>
    </div>
  );
}

export function SoftwareSteps({ fw, doneMap, onToggle }) {
  return (
    <div className="list">
      {fw.steps.map((s) => {
        const isDone = !!doneMap?.[s.id];
        return (
          <div className={`check ${isDone ? 'done' : ''}`} key={s.id}>
            {onToggle && <input type="checkbox" aria-label={t(s.title)} checked={isDone} onChange={() => onToggle(s.id)} />}
            <details className="grow" style={{ marginTop: -10, marginBottom: -10 }}>
              <summary className="title" style={{ fontWeight: 590 }}>{t(s.title)}</summary>
              <div style={{ paddingBottom: 10 }}>
                <ol className="numbered small">{s.do.map((d) => <li key={d}>{t(d)}</li>)}</ol>
                <div style={{ marginTop: 8 }}><Ext href={s.link}><span className="small">{t('Official guide')}</span></Ext></div>
              </div>
            </details>
          </div>
        );
      })}
    </div>
  );
}

export const FlyProject = ({ id }) => <Flight projectId={id} />;

export function Legal({ id }) {
  const state = useStore();
  const p = state.projects[id];
  const region = regionById(state.profile.region);
  if (!p) return notFound();
  const sel = loadBuild(p);
  const f = flight(sel, { goal: p.goal });
  const work = p.use === 'work';
  const items = region && f ? legalChecklist(region.id, buildFacts(sel, f, { work })) : [];
  const done = items.filter((i) => p.legal?.[i.id]).length;
  return (
    <div className="wrap narrow">
      <PageHead title={t('Am I legal?')} sub={p.name} back={`/p/${id}`} />
      {!region && (
        <div className="stack" style={{ marginTop: 14 }}>
          <div className="note">{t('Tell us your country')} {t('to see local prices, shops and rules.')}</div>
          <div className="list">
            {REGIONS.map((r) => <button key={r.id} className="li" onClick={() => setProfile({ region: r.id })}><span className="grow title">{t(r.name)}</span><Icon name="chev" className="chev" /></button>)}
          </div>
        </div>
      )}
      {region && !f && <div className="note" style={{ marginTop: 14 }}>{t('Pick your motors and battery first, because the rules depend on weight.')} <A to={`/configure/${id}`} className="link">{t('Pick your parts')}</A></div>}
      {region && f && (
        <>
          <div className="card" style={{ marginTop: 14 }}>
            <div className="row between"><span className="small muted">{t(region.name)}</span><b className="num">{grams(f.auw)}</b></div>
            <div className="segment" data-i={work ? 1 : 0} role="group" aria-label={t('Why you fly')}>
              <button className={work ? '' : 'on'} aria-pressed={!work} onClick={() => updateProject(id, { use: 'fun' })}>{t('For fun')}</button>
              <button className={work ? 'on' : ''} aria-pressed={work} onClick={() => updateProject(id, { use: 'work' })}>{t('For work')}</button>
            </div>
            <div className="row between small" style={{ marginTop: 14 }}><span className="muted">{t('{a} of {b} checked', { a: done, b: items.length })}</span></div>
            <div style={{ marginTop: 8 }}><Progress value={items.length ? (done / items.length) * 100 : 0} ok={done === items.length} /></div>
          </div>
          <div className="list" style={{ marginTop: 14 }}>
            {items.map((i) => {
              const isDone = !!p.legal?.[i.id];
              return (
                <label key={i.id} className={`check ${isDone ? 'done' : ''}`}>
                  <input type="checkbox" checked={isDone} onChange={() => toggleIn(id, 'legal', i.id)} />
                  <span className="grow">
                    <span className="title" style={{ fontWeight: 500 }}>{t(i.title)}</span>
                    {i.kind === 'check' && <span className="chip warn" style={{ marginLeft: 6 }}>{t('Unconfirmed')}</span>}
                    <div className="small muted" style={{ marginTop: 2 }}>{t(i.detail)}</div>
                  </span>
                </label>
              );
            })}
          </div>
          <A to={`/rules/${region.id}`} className="btn secondary block" style={{ marginTop: 14 }}>{t('Full rules')}</A>
          <p className="tiny muted" style={{ marginTop: 10 }}>{t('Checked {date}. This is a helpful summary and not legal advice. Laws change, so confirm with the official source before you fly or buy.', { date: RULES_CHECKED })} {t('Local rules, airspace limits and permits can also apply.')}</p>
        </>
      )}
    </div>
  );
}

export function ShareBuild({ id }) {
  const state = useStore();
  const p = state.projects[id];
  const [toast, setToast] = useToast();
  if (!p) return notFound();
  const url = shareUrl(p);
  const sel = loadBuild(p);
  const f = flight(sel, { goal: p.goal });
  const body = encodeURIComponent(`Build link: ${url}\n\nFirmware: ${p.firmware}\n${f ? `Weight: ${Math.round(f.auw)} g\n` : ''}\nWhat I learned:\n\nPhotos (drag them in):\n`);
  const issue = `https://github.com/chahatdeep/thrustworthy/issues/new?title=${encodeURIComponent(`Build: ${p.name}`)}&labels=gallery&body=${body}`;
  const nativeShare = async () => {
    updateProject(id, { shared: true });
    if (navigator.share) {
      try { await navigator.share({ title: p.name, text: t('My drone build on Thrustworthy'), url }); } catch { /* cancelled */ }
    } else {
      setToast((await copyText(url)) ? t('Link copied') : t('Could not copy'));
    }
  };
  return (
    <div className="wrap narrow">
      <PageHead title={t('Share your build')} sub={p.name} back={`/p/${id}`} />
      <div className="card stack" style={{ marginTop: 14 }}>
        <div><h3>{t('Send a link')}</h3><p className="small muted">{t('The link holds your whole parts list. Anyone can open it and make their own copy, with no sign-up.')}</p></div>
        <input className="input" readOnly value={url} onFocus={(e) => e.target.select()} aria-label={t('Build link')} />
        <button className="btn block" onClick={nativeShare}><Icon name="share" />{t('Share link')}</button>
      </div>
      <div className="card stack" style={{ marginTop: 12 }}>
        <div><h3>{t('Add it to the community gallery')}</h3><p className="small muted">{t('Open a short post on GitHub with your link and photos. A free account is needed. Others can comment there, and we add finished builds to the gallery.')}</p></div>
        <Ext href={issue} className="btn secondary block"><Icon name="ext" />{t('Post on GitHub')}</Ext>
        <button className="link small" onClick={() => updateProject(id, { shared: true })}>{t('Mark as shared')}</button>
      </div>
      <A to={`/p/${id}/3d`} className="card tap row between" style={{ marginTop: 12, flexWrap: 'nowrap' }}>
        <Tile name="box" />
        <span className="grow"><h3>{t('Share it in 3D')}</h3><span className="small muted">{t('Anyone can open the model in a browser and tap each part.')}</span></span>
        <Icon name="chev" className="chev" />
      </A>
      {toast}
    </div>
  );
}

export function ImportBuild({ token }) {
  const shared = decodeBuild(token);
  const { profile } = useStore();
  const region = regionById(profile.region);
  if (!shared) return <div className="wrap"><PageHead title={t('This link did not work')} sub={t('It may have been cut off when it was copied.')} back="/" /></div>;
  const sel = resolve(shared.sel, shared.payload);
  const c = cost(sel);
  return (
    <div className="wrap narrow">
      <PageHead title={shared.name} sub={t('Someone shared this build with you.')} />
      <div className="list" style={{ marginTop: 14 }}>
        {c.lines.map((l) => (
          <div className="li" key={l.slot}>
            <span className="grow"><div className="sub">{t(SLOTS.find((s) => s.key === l.slot).label)}</div><div className="title">{partName(l.part)}</div></span>
            <span className="small num">{money(l.total, region)}</span>
          </div>
        ))}
      </div>
      <A to={`/v/${token}`} className="btn secondary block" style={{ marginTop: 14 }}><Icon name="cpu" />{t('View in 3D')}</A>
      <button className="btn block" style={{ marginTop: 10 }} onClick={() => { keepCustomParts(shared.custom); const id = createProject({ ...shared }); go(`/p/${id}`); }}>{t('Save a copy to my builds')}</button>
    </div>
  );
}
