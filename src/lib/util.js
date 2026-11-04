import { useEffect, useState } from 'react';
import zhLoader from './zh-loader.js';

// gettext-style translation: the English sentence is the key, so an untranslated string
// simply stays in English and nothing can show up blank. Keys holding {0}, {1} also match
// the engine's generated sentences, and any captured words are translated in turn.
let dict = null;
let patterns = [];
export function t(s, vars) {
  if (typeof s !== 'string') return s;
  let out = dict && dict[s];
  if (!out && dict) {
    for (const [re, tpl] of patterns) {
      const m = s.match(re);
      if (m) { out = tpl.replace(/\{(\d)\}/g, (_, i) => t(m[+i + 1])).replace(/([一-鿿]) (?=[一-鿿])/g, '$1'); break; }
    }
  }
  out = out || s;
  if (vars) for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(vars[k]);
  return out;
}
const toPattern = (key) => {
  const esc = key.replace(/[.*+?^$()|[\]\\]/g, '\\$&').replace(/\{(\d)\}/g, '(.+?)');
  return new RegExp(`^${esc}$`);
};
export async function loadLanguage(lang) {
  dict = lang === 'zh' ? await zhLoader() : null;
  patterns = dict ? Object.entries(dict).filter(([k]) => /\{\d\}/.test(k)).map(([k, v]) => [toPattern(k), v]) : [];
  document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
}
export const guessLanguage = () => ((navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en');

// Hash routing: it works on GitHub Pages and any static mirror without server rewrites.
export function useRoute() {
  const get = () => (window.location.hash.replace(/^#/, '') || '/').split('?')[0];
  const [path, setPath] = useState(get());
  useEffect(() => {
    const on = () => { setPath(get()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return path;
}
export const go = (path) => { window.location.hash = path; };

// Share links carry the whole build, so they need no server.
export function encodeBuild(project) {
  const payload = { n: project.name, g: project.goal, f: project.firmware, s: project.sel };
  const b = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  return b.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
export function decodeBuild(token) {
  try {
    const b = token.replace(/-/g, '+').replace(/_/g, '/');
    const j = JSON.parse(decodeURIComponent(escape(atob(b))));
    if (typeof j !== 'object' || !j.s) return null;
    const sel = {};
    for (const [k, v] of Object.entries(j.s)) if (typeof k === 'string' && typeof v === 'string') sel[k] = v;
    return { name: String(j.n || 'Shared build').slice(0, 80), goal: String(j.g || 'freestyle'), firmware: String(j.f || 'Betaflight'), sel };
  } catch {
    return null;
  }
}
export const shareUrl = (project) => `${window.location.origin}${window.location.pathname}#/b/${encodeBuild(project)}`;

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    let ok = false;
    try { ok = document.execCommand('copy'); } catch { ok = false; }
    el.remove();
    return ok;
  }
}

export function downloadFile(name, text, type = 'text/plain') {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

export const grams = (g) => (g >= 1000 ? `${(g / 1000).toFixed(2)} kg` : `${Math.round(g)} g`);
export const minutes = (a, b) => (Math.round(a) === Math.round(b) ? `${Math.round(a)}` : `${Math.round(a)}–${Math.round(b)}`);
export const dateStr = (ms) => new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
