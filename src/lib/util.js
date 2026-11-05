import { useEffect, useState } from 'react';
import { partById, registerCustom } from '../data/parts.js';
import { cleanPayload, cleanSharedParts } from './custom.js';

// Fills {name} placeholders in a sentence. Non-strings pass through untouched.
export function t(s, vars) {
  if (typeof s !== 'string' || !vars) return s;
  let out = s;
  for (const k of Object.keys(vars)) out = out.split(`{${k}}`).join(vars[k]);
  return out;
}

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
  if (project.payload?.length) payload.p = project.payload;
  // A link has to work for someone who does not have your custom parts, so it carries them.
  const mine = {};
  for (const id of Object.values(project.sel || {})) {
    const part = partById(id);
    if (part?.custom) mine[id] = part;
  }
  if (Object.keys(mine).length) payload.x = mine;
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
    const custom = cleanSharedParts(j.x);
    registerCustom(custom);
    return { name: String(j.n || 'Shared build').slice(0, 80), goal: String(j.g || 'freestyle'), firmware: String(j.f || 'Betaflight'), sel, payload: cleanPayload(j.p), custom };
  } catch {
    return null;
  }
}
export const shareUrl = (project) => `${window.location.origin}${window.location.pathname}#/b/${encodeBuild(project)}`;

export const model3dUrl = (project) => `${window.location.origin}${window.location.pathname}#/v/${encodeBuild(project)}`;

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
