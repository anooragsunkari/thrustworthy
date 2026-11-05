// Everything a person does lives on their own device. There is no account and no server,
// so the site works on GitHub Pages, behind any firewall, and at a field with no signal.
import { useSyncExternalStore } from 'react';
import { registerCustom, unregisterCustom } from '../data/parts.js';
import { cleanSharedParts } from './custom.js';

const KEY = 'thrustworthy:v1';
const BLANK = {
  profile: { persona: null, region: null, level: null, firmware: null, theme: 'light' },
  projects: {},
  customParts: {},
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
    return { ...BLANK, ...s, profile: { ...BLANK.profile, ...s.profile } };
  } catch {
    return structuredClone(BLANK);
  }
}

let state = read();
registerCustom(cleanSharedParts(state.customParts));
const listeners = new Set();

// Null while saving works; otherwise the error, so the page can say why nothing is being kept.
let saveError = null;
const saveListeners = new Set();
function setSaveError(err) {
  if (err === saveError) return;
  saveError = err;
  saveListeners.forEach((l) => l());
}
export const useSaveError = () => useSyncExternalStore((l) => { saveListeners.add(l); return () => saveListeners.delete(l); }, () => saveError);

try {
  localStorage.setItem(`${KEY}:probe`, '1');
  localStorage.removeItem(`${KEY}:probe`);
} catch (err) {
  saveError = err;
}

function commit(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    setSaveError(null);
  } catch (err) {
    setSaveError(err);
  }
  listeners.forEach((l) => l());
}

// Without this, browsers may clear the site's data to free space, and Safari does after 7 days unused.
let askedToKeep = false;
function keepData() {
  if (askedToKeep || !globalThis.navigator?.storage?.persist) return;
  askedToKeep = true;
  navigator.storage.persisted().then((yes) => yes || navigator.storage.persist()).catch(() => {});
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
  keepData();
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
  keepData();
  return saved;
}

/** Keep the parts carried by a shared build, under their original ids. */
export function keepCustomParts(map = {}) {
  if (!Object.keys(map).length) return;
  registerCustom(map);
  commit({ ...state, customParts: { ...state.customParts, ...map } });
}

export function deleteCustomPart(id) {
  const customParts = { ...state.customParts };
  delete customParts[id];
  unregisterCustom(id);
  commit({ ...state, customParts });
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
  commit({ ...BLANK, ...s, profile: { ...BLANK.profile, ...s.profile } });
  keepData();
}

export function resetAll() {
  commit(structuredClone(BLANK));
}

// Build-progress photos go in IndexedDB because they are too big for localStorage.
const DB = 'thrustworthy-photos';
function db() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) { reject(new DOMException('Storage is not available', 'SecurityError')); return; }
    let req;
    try { req = indexedDB.open(DB, 1); } catch (err) { reject(err); return; }
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
    // A full disk aborts the transaction instead of raising onerror.
    t.onabort = () => reject(t.error || new DOMException('The save was cancelled', 'AbortError'));
  });
}
// Each photo has a "#meta" record with its file name and size, so picking the same file twice can be spotted.
const META = '#meta';
export async function savePhoto(key, dataUrl, file) {
  await tx('readwrite', (s) => {
    s.put({ name: file?.name || '', size: file?.size || 0 }, key + META);
    return s.put(dataUrl, key);
  });
  keepData();
}
export const loadPhoto = (key) => tx('readonly', (s) => s.get(key));
export const deletePhoto = (key) => tx('readwrite', (s) => { s.delete(key + META); return s.delete(key); });

/** The key of a photo in this build that came from the same file, or null. */
export async function findSamePhoto(pid, file) {
  try {
    const d = await db();
    return await new Promise((resolve) => {
      const req = d.transaction('photos', 'readonly').objectStore('photos').openCursor(IDBKeyRange.bound(`${pid}:`, `${pid}:￿`));
      req.onsuccess = () => {
        const c = req.result;
        if (!c) { resolve(null); return; }
        const k = String(c.key);
        if (k.endsWith(META) && c.value?.name === file.name && c.value?.size === file.size) { resolve(k.slice(0, -META.length)); return; }
        c.continue();
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

export function shrinkImage(file, max = 1000) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        if (!img.width || !img.height) throw new Error('The image has no size');
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL('image/jpeg', 0.82));
      } catch (err) {
        reject(err);
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('The browser could not decode the image')); };
    img.src = url;
  });
}
