import React, { useEffect, useRef, useState } from 'react';
import { animate, prefersStill, SNAPPY, SOFT, Spring } from '../lib/spring.js';
import { t, grams, minutes } from '../lib/util.js';
import { resolve, flight, cost } from '../lib/engine.js';
import { money } from '../data/regions.js';

const PATHS = {
  home: 'M3 11l9-8 9 8M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5',
  list: 'M4 6h16M4 12h16M4 18h10',
  build: 'M14.7 6.3a4 4 0 00-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 005.1-5.4l-2.6 2.6-2.3-.5-.5-2.3z',
  fly: 'M12 3v6m0 0l-8 5v2l8-3 8 3v-2l-8-5zm0 4v8m-3 3l3-1 3 1',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  chev: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1zm8 10a4 4 0 100-8 4 4 0 000 8z',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 006 21h12a1.7 1.7 0 001.5-2.5L14 9V3M7.5 15h9',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zm0 14a2 2 0 012-2h13v4H6a2 2 0 01-2-2z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
  share: 'M12 15V3m0 0L8 7m4-4l4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.500-3.500 9c-2.500-2.500-3.500-5.500-3.500-9s1-6.500 3.500-9z',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  plus: 'M12 5v14M5 12h14',
  cog: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 3v2m0 14v2M3 12h2m14 0h2M5.600 5.600L7 7m10 10l1.400 1.400M5.600 18.400L7 17m10-10l1.400-1.400',
  moon: 'M20 14.500A8.500 8.500 0 019.500 4a8.500 8.500 0 1010.500 10.500z',
  cpu: 'M8 8h8v8H8zM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3',
};

export function Icon({ name, className }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={PATHS[name]} /></svg>;
}

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
      <div className="chips" style={{ marginBottom: 8 }}>
        <span className="chip accent">{t(build.type)}</span>
        <span className="chip">{t(build.level)}</span>
        <span className="chip">{build.firmware}</span>
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
  const close = () => {
    const m = motion.current;
    if (m.closing) return;
    m.closing = true;
    if (prefersStill()) { onClose(); return; }
    m.y.to(m.h + 20);
  };
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
      if (m.closing && m.y.x >= m.h) { onClose(); return false; }
      return true;
    });
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => { stop(); document.body.style.overflow = prev; window.removeEventListener('keydown', onKey); };
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
    if (m.y.x > m.h * 0.35 || m.y.v > 900) { m.closing = true; m.y.to(m.h + 20); } else m.y.to(0);
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
