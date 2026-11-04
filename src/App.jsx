import React, { useEffect } from 'react';
import { A, Icon, Logo } from './components/ui.jsx';
import { useStore } from './lib/store.js';
import { t, useRoute } from './lib/util.js';
import { Home, Start } from './pages/Home.jsx';
import { BuildDetail, Builds } from './pages/Builds.jsx';
import { Configure, ConfigureEntry } from './pages/Configure.jsx';
import { Assemble, FlyProject, ImportBuild, Parts, ProjectHome, Setup, ShareBuild } from './pages/Project.jsx';
import { Fix, Flight, Software, SoftwareDetail } from './pages/Fly.jsx';
import { Community, Me } from './pages/Me.jsx';
import { About, Numbers, RuleDetail, Rules } from './pages/Info.jsx';

function route(path) {
  const [a, b, c, d] = path.split('/').filter(Boolean);
  switch (a) {
    case undefined: return <Home />;
    case 'start': return <Start step={b} />;
    case 'builds':
      if (b === 'level') return <Builds level={c} key={c} />;
      return b ? <BuildDetail id={b} key={b} /> : <Builds />;
    case 'configure': return b ? <Configure id={b} key={b} /> : <ConfigureEntry />;
    case 'p':
      switch (c) {
        case 'parts': return <Parts id={b} />;
        case 'assemble': return <Assemble id={b} />;
        case 'setup': return <Setup id={b} />;
        case 'fly': return <FlyProject id={b} />;
        case 'share': return <ShareBuild id={b} />;
        default: return <ProjectHome id={b} />;
      }
    case 'b': return <ImportBuild token={b} />;
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
  { to: '/configure', label: 'Configure', icon: 'build', on: (p) => p.startsWith('/configure') || p.startsWith('/p/') },
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

export default function App() {
  const path = useRoute();
  const { profile } = useStore();
  useEffect(() => {
    const el = document.documentElement;
    if (profile.theme === 'light' || profile.theme === 'dark') el.dataset.theme = profile.theme;
    else delete el.dataset.theme;
  }, [profile.theme]);

  return (
    <div key={profile.lang || 'en'}>
      <header className="top">
        <div className="wrap top-in">
          <A to="/" className="brand"><Logo />Thrustworthy</A>
          <nav className="top-nav" aria-label={t('Main')}>
            {NAV.map((n) => <A key={n.to} to={n.to} className={n.on(path) ? 'on' : ''}>{t(n.label)}</A>)}
          </nav>
        </div>
      </header>
      <main>
        {route(path)}
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
