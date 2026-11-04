import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles.css';
import { getState, setProfile } from './lib/store.js';
import { guessLanguage, loadLanguage } from './lib/util.js';

async function boot() {
  const { profile } = getState();
  const lang = profile.lang || guessLanguage();
  try { await loadLanguage(lang); } catch { /* fall back to English */ }
  if (!profile.lang) setProfile({ lang });

  const params = new URLSearchParams(window.location.search);
  if (params.get('lang') === 'zh' || params.get('lang') === 'en') {
    await loadLanguage(params.get('lang'));
    setProfile({ lang: params.get('lang') });
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode><App /></React.StrictMode>,
  );

  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
}
boot();
