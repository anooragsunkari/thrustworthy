import React, { useEffect } from 'react';
import { A, Icon, Logo } from './components/ui.jsx';
import { setProfile, useStore } from './lib/store.js';
import { t, useRoute } from './lib/util.js';
import { prefersStill } from './lib/spring.js';
import { Home, Start } from './pages/Home.jsx';
import { BuildDetail, Builds } from './pages/Builds.jsx';
import { Configure, ConfigureEntry } from './pages/Configure.jsx';
import { Assemble, FlyProject, ImportBuild, Legal, Parts, ProjectHome, Setup, ShareBuild } from './pages/Project.jsx';
import { Fix, Flight, Software, SoftwareDetail } from './pages/Fly.jsx';
import { Community, Me } from './pages/Me.jsx';
import { GuideModel, ProjectModel, SharedModel } from './pages/Model.jsx';
import { About, Numbers, RuleDetail, Rules } from './pages/Info.jsx';
import { Compare, Spares, StarterSettings, Wiring } from './pages/Tools.jsx';

function route(path) {
  const [a, b, c, d] = path.split('/').filter(Boolean);
  switch (a) {
    case undefined: return <Home />;
    case 'start': return <Start step={b} />;
    case 'builds':
      if (b === 'level') return <Builds level={c} key={c} />;
      if (b && c === '3d') return <GuideModel id={b} key={b} />;
      return b ? <BuildDetail id={b} key={b} /> : <Builds />;
    case 'configure': return b ? <Configure id={b} key={b} /> : <ConfigureEntry />;
    case 'p':
      switch (c) {
        case 'parts': return <Parts id={b} />;
        case 'assemble': return <Assemble id={b} />;
        case 'setup': return <Setup id={b} />;
        case 'fly': return <FlyProject id={b} />;
        case 'share': return <ShareBuild id={b} />;
        case '3d': return <ProjectModel id={b} key={b} />;
        case 'legal': return <Legal id={b} />;
        case 'wiring': return <Wiring id={b} />;
        case 'settings': return <StarterSettings id={b} />;
        case 'spares': return <Spares id={b} />;
        default: return <ProjectHome id={b} />;
      }
    case 'compare': return <Compare a={b} b={c} key={`${b}/${c}`} />;
    case 'b': return <ImportBuild token={b} />;
    case 'v': return <SharedModel token={b} key={b} />;
    case 'software': return b ? <SoftwareDetail id={b} key={b} /> : <Software />;
    case 'fly':
      if (b === 'fix') return <Fix id={c} fw={d} key={c} />;
      return <Flight />;
    case 'community': return <Community />;
    case 'me': return <Me />;
    case 'rules': return b ? <RuleDetail id={b} key={b} /> : <Rules />;
    case 'about': return b === 'numbers' ? <Numbers /> : <About />;
    default: return <div className="wrap"><div className="page-head"><h1>{t('Not found')}</h1><A to="/" className="link">{t('Back to home')}</A></div></div>;
  }
}

const TABS = [
  { to: '/', label: 'Home', icon: 'home', on: (p) => p === '/' || p.startsWith('/start') },
  { to: '/builds', label: 'Builds', icon: 'list', on: (p) => p.startsWith('/builds') || p.startsWith('/community') },
  { to: '/configure', label: 'Configure', icon: 'build', on: (p) => p.startsWith('/configure') || p.startsWith('/p/') || p.startsWith('/compare') },
  { to: '/fly', label: 'Fly', icon: 'fly', on: (p) => p.startsWith('/fly') || p.startsWith('/software') || p.startsWith('/rules') },
  { to: '/me', label: 'Me', icon: 'user', on: (p) => p.startsWith('/me') },
];
const NAV = [
  { to: '/builds', label: 'Builds', on: (p) => p.startsWith('/builds') },
  { to: '/configure', label: 'Configure', on: (p) => p.startsWith('/configure') || p.startsWith('/p/') },
  { to: '/software', label: 'Firmware', on: (p) => p.startsWith('/software') },
  { to: '/fly', label: 'Fly', on: (p) => p.startsWith('/fly') },
  { to: '/rules', label: 'Rules', on: (p) => p.startsWith('/rules') },
  { to: '/community', label: 'Community', on: (p) => p.startsWith('/community') },
  { to: '/me', label: 'My hangar', on: (p) => p.startsWith('/me') },
];

/** The new theme grows out of the button you pressed, where the browser supports it. */
function switchTheme(e, theme) {
  if (!document.startViewTransition || prefersStill()) { setProfile({ theme }); return; }
  const b = e.currentTarget.getBoundingClientRect();
  const x = b.left + b.width / 2;
  const y = b.top + b.height / 2;
  const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
  const vt = document.startViewTransition(() => {
    document.documentElement.dataset.theme = theme;
    setProfile({ theme });
  });
  vt.ready.then(() => {
    document.documentElement.animate(
      { clipPath: [`circle(0 at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
      { duration: 620, easing: getComputedStyle(document.documentElement).getPropertyValue('--ease-soft').trim() || 'ease-out', pseudoElement: '::view-transition-new(root)' },
    );
  }).catch(() => {});
}

/** Content below the fold rises in as it reaches the screen, one piece after another. */
function useReveal(path) {
  useEffect(() => {
    if (prefersStill() || !('IntersectionObserver' in window)) return undefined;
    const io = new IntersectionObserver((entries) => {
      let n = 0;
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.style.transitionDelay = `${Math.min(n, 5) * 45}ms`;
        en.target.classList.remove('pre');
        io.unobserve(en.target);
        n += 1;
      }
    }, { rootMargin: '0px 0px -6% 0px' });
    const els = document.querySelectorAll('main .card, main .list, main .section > h2, main .journey > li');
    els.forEach((el) => {
      if (el.closest('.model-grid') || el.getBoundingClientRect().top < window.innerHeight * 0.94) return;
      el.classList.add('pre');
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);
}

export default function App() {
  const path = useRoute();
  useReveal(path);
  const { profile } = useStore();
  const isLight = profile.theme === 'light' || (profile.theme === 'auto' && window.matchMedia('(prefers-color-scheme: light)').matches);
  useEffect(() => {
    document.documentElement.dataset.theme = profile.theme || 'light';
  }, [profile.theme]);

  return (
    <div>
      <header className="top">
        <div className="wrap top-in">
          <A to="/" className="brand"><Logo />Thrustworthy</A>
          <nav className="top-nav" aria-label={t('Main')}>
            {NAV.map((n) => <A key={n.to} to={n.to} className={n.on(path) ? 'on' : ''}>{t(n.label)}</A>)}
          </nav>
          <button
            className="theme-toggle"
            aria-label={t(isLight ? 'Switch to dark mode' : 'Switch to light mode')}
            title={t(isLight ? 'Switch to dark mode' : 'Switch to light mode')}
            onClick={(e) => switchTheme(e, isLight ? 'dark' : 'light')}
          >
            <Icon name={isLight ? 'moon' : 'sun'} />
          </button>
        </div>
      </header>
      <main>
        <div className="page" key={path}>{route(path)}</div>
        <footer className="foot wrap">
          <div className="wrap" style={{ padding: 0 }}>
            <p>{t('By')} <A to="/about" className="link">Anoorag Sunkari</A>. {t('Open source, MIT licensed.')}</p>
            <p className="row" style={{ marginTop: 6, gap: 14 }}>
              <A to="/software" className="link">{t('Firmware')}</A>
              <A to="/rules" className="link">{t('Rules')}</A>
              <A to="/community" className="link">{t('Community')}</A>
              <A to="/about" className="link">{t('About')}</A>
            </p>
          </div>
        </footer>
      </main>
      <nav className="tabs" aria-label={t('Main')}>
        {TABS.map((n) => (
          <A key={n.to} to={n.to} className={n.on(path) ? 'on' : ''} aria-current={n.on(path) ? 'page' : undefined}>
            <Icon name={n.icon} /><span>{t(n.label)}</span>
          </A>
        ))}
      </nav>
    </div>
  );
}
