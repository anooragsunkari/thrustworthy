import React, { useEffect, useRef, useState } from 'react';
import { animate, prefersStill, SNAPPY, SOFT, Spring } from '../lib/spring.js';
import { t, grams, minutes } from '../lib/util.js';
import { resolve, flight, cost } from '../lib/engine.js';
import { money } from '../data/regions.js';
import { GOAL_ICON, PATHS } from '../lib/icons.js';


export function Icon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>;
}

// Each project's own logo, unaltered, on a dark plate because most were drawn for dark backgrounds.
const FIRMWARE_LOGOS = { Betaflight: 'betaflight-dark.svg', INAV: 'inav.png', ArduPilot: 'ardupilot.png', PX4: 'px4.svg' };
export const FirmwareLogo = ({ id, name, icon = 'cpu' }) => (FIRMWARE_LOGOS[id]
  ? <span className="fw-logo"><img src={`logos/${FIRMWARE_LOGOS[id]}`} alt={t('{name} logo', { name: name || id })} loading="lazy" /></span>
  : <span className="fw-logo" aria-hidden="true"><Icon name={icon} /></span>);

/** An icon on a rounded tile. A finished step shows a tick. */
export const Tile = ({ name, done, children }) => <span className={`ico ${done ? 'ok' : ''}`} aria-hidden="true">{children || <Icon name={done ? 'check' : name} />}</span>;

/** Three bars, so Beginner, Intermediate and Pro read as a scale at a glance. */
export const LevelBars = ({ level }) => {
  const n = { Beginner: 1, Intermediate: 2, Pro: 3 }[level] || 0;
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {[[4, 14, 6], [10, 9, 11], [16, 4, 16]].map(([x, y, h], i) => <rect key={x} x={x} y={y} width="4.5" height={h} rx="1.5" opacity={i < n ? 1 : 0.22} />)}
    </svg>
  );
};

export const Logo = () => (
  <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M10 10l12 12M22 10L10 22" /><circle cx="8.500" cy="8.500" r="5" /><circle cx="23.500" cy="8.500" r="5" /><circle cx="8.500" cy="23.500" r="5" /><circle cx="23.500" cy="23.500" r="5" /><rect x="13" y="13" width="6" height="6" rx="1.500" fill="currentColor" stroke="none" />
  </svg>
);

/** Top-down drone with spinning props. A real part of the brand and not stock art. */
export const HeroDrone = () => {
  const props = [[46, 46, false], [154, 46, true], [46, 154, true], [154, 154, false]];
  const ref = useRef(null);
  useEffect(() => {
    if (prefersStill()) return undefined;
    const rx = new Spring(0, { k: 40, c: 7 });
    const ry = new Spring(0, { k: 40, c: 7 });
    let clock = 0;
    const onMove = (e) => {
      const b2 = ref.current?.getBoundingClientRect();
      if (!b2) return;
      const dx = (e.clientX - (b2.left + b2.width / 2)) / window.innerWidth;
      const dy = (e.clientY - (b2.top + b2.height / 2)) / window.innerHeight;
      ry.to(Math.max(-1, Math.min(1, dx)) * 26);
      rx.to(Math.max(-1, Math.min(1, dy)) * -26);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    const stop = animate((dt) => {
      clock += dt;
      rx.step(dt);
      ry.step(dt);
      if (ref.current) ref.current.style.transform = `perspective(700px) translateY(${(Math.sin(clock * 1.6) * 5).toFixed(2)}px) rotateX(${rx.x.toFixed(2)}deg) rotateY(${ry.x.toFixed(2)}deg)`;
      return true;
    });
    return () => { stop(); window.removeEventListener('pointermove', onMove); };
  }, []);
  return (
    <svg ref={ref} className="hero-art" viewBox="0 0 200 200" role="img" aria-label={t('A quadcopter seen from above')}>
      <g stroke="currentColor" strokeWidth="6" strokeLinecap="round"><path d="M64 64l72 72M136 64l-72 72" /></g>
      <rect x="76" y="70" width="48" height="60" rx="12" fill="var(--bg)" stroke="currentColor" strokeWidth="4" />
      <rect x="88" y="82" width="24" height="22" rx="5" fill="currentColor" />
      {props.map(([x, y, rev], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="36" fill="none" stroke="var(--line)" strokeWidth="2" />
          <g className={`prop ${rev ? 'rev' : ''}`}>
            <ellipse cx={x} cy={y} rx="32" ry="4.500" fill="currentColor" opacity=".55" />
          </g>
          <circle cx={x} cy={y} r="9" fill="var(--bg)" stroke="currentColor" strokeWidth="4" />
        </g>
      ))}
    </svg>
  );
};

/** A number that rolls to its new value, with momentum. */
export function SpringNum({ value, format }) {
  const list = Array.isArray(value) ? value : [value];
  const ref = useRef(null);
  const springs = useRef(null);
  if (!springs.current || springs.current.length !== list.length) springs.current = list.map((n) => new Spring(n, SOFT));
  const show = () => format(...springs.current.map((s) => s.x));
  useEffect(() => {
    if (prefersStill()) {
      springs.current.forEach((s, i) => s.set(list[i]));
      if (ref.current) ref.current.textContent = show();
      return undefined;
    }
    springs.current.forEach((s, i) => s.to(list[i]));
    return animate((dt) => {
      springs.current.forEach((s) => s.step(dt));
      if (ref.current) ref.current.textContent = show();
      if (springs.current.every((s) => s.settled)) {
        springs.current.forEach((s) => s.set(s.target));
        if (ref.current) ref.current.textContent = show();
        return false;
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [list.join('|')]);
  return <b ref={ref}>{show()}</b>;
}

export const A = ({ to, children, ...rest }) => <a href={`#${to}`} {...rest}>{children}</a>;
export const Ext = ({ href, children, className = 'link', ...rest }) => <a className={className} href={href} target="_blank" rel="noopener noreferrer" {...rest}>{children}</a>;

export const PageHead = ({ title, sub, back, children }) => (
  <header className="page-head">
    {back && <div><A to={back} className="link back-link"><Icon name="back" />{t('Back')}</A></div>}
    <h1 style={{ fontSize: 'clamp(32px,7.5vw,48px)' }}>{title}</h1>
    {sub && <p>{sub}</p>}
    {children}
  </header>
);

export function Issue({ issue }) {
  const cls = { error: 'err', warn: 'warn', info: 'info' }[issue.level];
  return (
    <div className={`note ${cls}`}>
      <b>{t(issue.title)}</b>
      <div>{t(issue.detail)}</div>
      {issue.fix && <div className="fix">{t(issue.fix)}</div>}
    </div>
  );
}

export function BuildCard({ build, region }) {
  const sel = resolve(build.sel);
  const f = flight(sel, { goal: build.goal });
  return (
    <A to={`/builds/${build.id}`} className="card tap">
      <div className="row" style={{ marginBottom: 12, flexWrap: 'nowrap' }}>
        <Tile name={GOAL_ICON[build.goal] || 'frame'} />
        <div className="chips">
          <span className="chip accent">{t(build.type)}</span>
          <span className="chip">{t(build.level)}</span>
          <span className="chip">{build.firmware}</span>
        </div>
      </div>
      <h3>{t(build.title)}</h3>
      <p className="small muted" style={{ margin: '4px 0 12px' }}>{t(build.pitch)}</p>
      <div className="stats">
        <div className="stat"><b>{money(cost(sel).total, region)}</b><span>{t('parts')}</span></div>
        <div className="stat"><b>{grams(f.auw)}</b><span>{t('weight')}</span></div>
        <div className="stat"><b>{minutes(f.flyMin, f.flyMax)}</b><span>{t('min of flying')}</span></div>
      </div>
    </A>
  );
}

export function Sheet({ title, sub, onClose, children }) {
  const sheet = useRef(null);
  const bg = useRef(null);
  const motion = useRef({ y: new Spring(0, { k: 260, c: 28 }), closing: false, dragging: false, h: 1 });
  const draw = () => {
    const m = motion.current;
    if (sheet.current) sheet.current.style.transform = `translateY(${m.y.x.toFixed(1)}px)`;
    if (bg.current) bg.current.style.opacity = String(Math.max(0, Math.min(1, 1 - m.y.x / m.h)));
  };
  const closed = useRef(false);
  const timer = useRef(0);
  const finish = () => {
    if (closed.current) return;
    closed.current = true;
    onClose();
  };
  const leave = () => {
    const m = motion.current;
    if (m.closing) return;
    m.closing = true;
    if (prefersStill()) { finish(); return; }
    m.y.to(m.h + 20);
    // Animation frames pause on a hidden or struggling page, and the sheet must still close.
    timer.current = setTimeout(finish, 900);
  };
  const close = leave;
  useEffect(() => {
    const m = motion.current;
    m.h = sheet.current.offsetHeight || 600;
    const still = prefersStill();
    m.y.set(still ? 0 : m.h);
    m.y.to(0);
    draw();
    const stop = animate((dt) => {
      if (!m.dragging) m.y.step(dt);
      draw();
      if (m.closing && m.y.x >= m.h) { finish(); return false; }
      return true;
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => { stop(); clearTimeout(timer.current); document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const drag = useRef(null);
  const onDown = (e) => {
    if (e.target.closest('button')) return;
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* the pointer already ended */ }
    motion.current.dragging = true;
    drag.current = { y: e.clientY, start: motion.current.y.x, lastY: e.clientY, lastT: performance.now(), v: 0 };
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const m = motion.current;
    const raw = d.start + (e.clientY - d.y);
    // Pulling up past the top resists, like a rubber band.
    m.y.x = raw < 0 ? -Math.sqrt(-raw) * 2 : raw;
    const now = performance.now();
    const dt = Math.max(0.004, (now - d.lastT) / 1000);
    d.v = d.v * 0.6 + ((e.clientY - d.lastY) / dt) * 0.4;
    d.lastY = e.clientY;
    d.lastT = now;
  };
  const onUp = () => {
    const d = drag.current;
    if (!d) return;
    drag.current = null;
    const m = motion.current;
    m.dragging = false;
    const held = performance.now() - d.lastT > 90;
    m.y.v = held ? 0 : d.v; // the sheet leaves at the speed of your finger
    if (m.y.x > m.h * 0.35 || m.y.v > 900) leave(); else m.y.to(0);
  };
  return (
    <div className="sheet-bg" onClick={close}>
      <i ref={bg} className="sheet-shade" />
      <div ref={sheet} className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="sheet-drag" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
          <i className="sheet-grab" aria-hidden="true" />
          <div className="sheet-head">
            <div><h2 style={{ fontSize: 20 }}>{title}</h2>{sub && <div className="small muted">{sub}</div>}</div>
            <button className="icon-btn" onClick={close} aria-label={t('Close')}><Icon name="close" /></button>
          </div>
        </div>
        <div className="sheet-body">{typeof children === 'function' ? children(close) : children}</div>
      </div>
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return undefined;
    const id = setTimeout(() => setMsg(null), 2200);
    return () => clearTimeout(id);
  }, [msg]);
  return [msg ? <div className="toast" role="status">{msg}</div> : null, setMsg];
}

export const Progress = ({ value, ok }) => <div className={`progress ${ok ? 'ok' : ''}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: `${value}%` }} /></div>;
