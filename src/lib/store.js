// Everything a person does lives on their own device. There is no account and no server,
// so the site works on GitHub Pages, behind any firewall, and at a field with no signal.
import { useSyncExternalStore } from 'react';
import { registerCustom, unregisterCustom } from '../data/parts.js';
import { cleanSharedParts } from './custom.js';
import { cleanOwned, MAX_OWNED } from './owned.js';

const KEY = 'thrustworthy:v1';
const BLANK = {
  profile: { persona: null, region: null, level: null, firmware: null, theme: 'light' },
  projects: {},
  customParts: {},
  owned: { parts: {}, gear: {} },
  logs: [],
  themeVersion: 2,
  lastVisit: null,
  seenAt: null,
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(BLANK);
    const s = JSON.parse(raw);
    // Earlier versions saved a default theme for every visitor, so reset it once to the white default.
    if (s.themeVersion !== 2) { s.themeVersion = 2; if (s.profile) s.profile.theme = 'light'; }
    return { ...BLANK, ...s, profile: { ...BLANK.profile, ...s.profile }, owned: cleanOwned(s.owned) };
  } catch {
    return structuredClone(BLANK);
  }
}

let state = read();
registerCustom(cleanSharedParts(state.customParts));
const listeners = new Set();

function commit(next) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* private mode: keep working in memory */ }
  listeners.forEach((l) => l());
}

export const getState = () => state;
export const useStore = () => useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => state);

export function setProfile(patch) {
  commit({ ...state, profile: { ...state.profile, ...patch } });
}

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

export function createProject({ name, goal, firmware, sel, fromBuild = null, payload = [] }) {
  const id = newId();
  const project = { id, name: name || 'My build', goal: goal || 'freestyle', firmware: firmware || 'Betaflight', sel: sel || {}, payload, fromBuild, created: Date.now(), updated: Date.now(), have: {}, extras: {}, steps: {}, software: {}, shared: false };
  commit({ ...state, projects: { ...state.projects, [id]: project } });
  return id;
}

/** A copy to change freely, remembering where it came from so the two can be compared. */
export function duplicateProject(id) {
  const cur = state.projects[id];
  if (!cur) return null;
  const copy = createProject({ name: `${cur.name} (copy)`, goal: cur.goal, firmware: cur.firmware, sel: { ...cur.sel }, payload: [...(cur.payload || [])], fromBuild: cur.fromBuild });
  commit({ ...state, projects: { ...state.projects, [copy]: { ...state.projects[copy], copyOf: id, use: cur.use, ports: cur.ports } } });
  return copy;
}

export function updateProject(id, patch) {
  const cur = state.projects[id];
  if (!cur) return;
  commit({ ...state, projects: { ...state.projects, [id]: { ...cur, ...patch, updated: Date.now() } } });
}

export function toggleIn(id, field, key) {
  const cur = state.projects[id];
  if (!cur) return;
  const map = { ...(cur[field] || {}) };
  if (map[key]) delete map[key]; else map[key] = Date.now();
  updateProject(id, { [field]: map });
}

/** Save a validated part from the form. Returns it with its new id. */
export function addCustomPart(part) {
  const id = `x-${part.slot}-${newId()}`.toLowerCase();
  const saved = { ...part, id };
  registerCustom({ [id]: saved });
  commit({ ...state, customParts: { ...state.customParts, [id]: saved } });
  return saved;
}

/** Keep the parts carried by a shared build, under their original ids. */
export function keepCustomParts(map = {}) {
  if (!Object.keys(map).length) return;
  registerCustom(map);
  commit({ ...state, customParts: { ...state.customParts, ...map } });
}

/** Change a saved part in place. Every build using it picks up the new numbers. */
export function updateCustomPart(id, part) {
  const saved = { ...part, id };
  registerCustom({ [id]: saved });
  commit({ ...state, customParts: { ...state.customParts, [id]: saved } });
  return saved;
}

export function deleteCustomPart(id) {
  const customParts = { ...state.customParts };
  delete customParts[id];
  const parts = { ...state.owned.parts };
  delete parts[id];
  unregisterCustom(id);
  commit({ ...state, customParts, owned: { ...state.owned, parts } });
}

/** How many of a part you own. Zero removes it. */
export function setOwnedQty(id, qty) {
  const parts = { ...state.owned.parts };
  if (qty >= 1) parts[id] = Math.min(Math.floor(qty), MAX_OWNED); else delete parts[id];
  commit({ ...state, owned: { ...state.owned, parts } });
}

/** A radio or charger you own serves every build, so this also clears any older per-build tick. */
export function setGearOwned(id, on) {
  const gear = { ...state.owned.gear };
  if (on) gear[id] = true; else delete gear[id];
  const projects = { ...state.projects };
  if (!on) {
    for (const [pid, p] of Object.entries(projects)) {
      if (!p.extras?.[id]) continue;
      const extras = { ...p.extras };
      delete extras[id];
      projects[pid] = { ...p, extras };
    }
  }
  commit({ ...state, projects, owned: { ...state.owned, gear } });
}

export function deleteProject(id) {
  const projects = { ...state.projects };
  delete projects[id];
  commit({ ...state, projects });
}

export function addLog(entry) {
  commit({ ...state, logs: [{ id: newId(), at: Date.now(), ...entry }, ...state.logs] });
}

export function deleteLog(id) {
  commit({ ...state, logs: state.logs.filter((l) => l.id !== id) });
}

export function markSeen() {
  commit({ ...state, seenAt: new Date().toISOString().slice(0, 10) });
}

export function exportData() {
  return JSON.stringify(state, null, 2);
}

export function importData(text) {
  const s = JSON.parse(text);
  if (!s || typeof s !== 'object' || !s.profile) throw new Error('Not a Thrustworthy backup');
  registerCustom(cleanSharedParts(s.customParts));
  commit({ ...BLANK, ...s, profile: { ...BLANK.profile, ...s.profile }, owned: cleanOwned(s.owned) });
}

export function resetAll() {
  commit(structuredClone(BLANK));
}

// Build-progress photos go in IndexedDB because they are too big for localStorage.
const DB = 'thrustworthy-photos';
function db() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore('photos');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function tx(mode, fn) {
  const d = await db();
  return new Promise((resolve, reject) => {
    const t = d.transaction('photos', mode);
    const out = fn(t.objectStore('photos'));
    t.oncomplete = () => resolve(out.result);
    t.onerror = () => reject(t.error);
  });
}
export const savePhoto = (key, dataUrl) => tx('readwrite', (s) => s.put(dataUrl, key));
export const loadPhoto = (key) => tx('readonly', (s) => s.get(key));
export const deletePhoto = (key) => tx('readwrite', (s) => s.delete(key));

export function shrinkImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = reject;
    img.src = url;
  });
}
