// Parts people enter themselves. Share links can carry them, so everything passes through
// cleanCustom whether it came from the form or from a link somebody sent.
import { FIRMWARES, SLOTS } from '../data/parts.js';

const num = (key, label, min, max, opts = {}) => ({ key, label, kind: 'num', min, max, ...opts });
const text = (key, label, opts = {}) => ({ key, label, kind: 'text', ...opts });
const pick = (key, label, options, opts = {}) => ({ key, label, kind: 'select', options, def: options[0], ...opts });
const many = (key, label, options, opts = {}) => ({ key, label, kind: 'multi', options, ...opts });
const yesno = (key, label, def = true) => ({ key, label, kind: 'bool', def });

const CELLS = [num('cMin', 'Lowest battery (S)', 1, 14, { def: 3 }), num('cMax', 'Highest battery (S)', 1, 14, { def: 6 })];
const MOTOR_MOUNTS = ['6.6', '8', '9', '12', '16', '19', '25'];
const STACK_MOUNTS = ['20', '25.5', '26.5', '30.5', '35', 'pixhawk'];

const COMMON = [
  text('b', 'Brand', { required: true }),
  text('m', 'Model', { required: true }),
  num('w', 'Weight (g)', 0.1, 20000, { required: true }),
  num('p', 'Price each in USD (optional)', 0, 50000, { def: 0 }),
];

export const CUSTOM_FIELDS = {
  frame: [
    num('wheel', 'Wheelbase, motor to motor (mm)', 30, 2000, { required: true }),
    pick('mc', 'Motors', ['4', '6', '8']),
    num('maxProp', 'Largest prop (inches)', 1, 40, { required: true }),
    many('mount', 'Motor mount spacing (mm)', MOTOR_MOUNTS, { required: true }),
    many('stack', 'Stack mount', STACK_MOUNTS, { required: true }),
    yesno('ducted', 'Has ducts', false),
  ],
  motor: [
    text('sz', 'Size, such as 2207', { required: true, pattern: /^\d{4}$/, hint: 'Four digits' }),
    num('kv', 'KV', 10, 60000, { required: true }),
    ...CELLS,
    pick('mount', 'Mount spacing (mm)', MOTOR_MOUNTS, { def: '16' }),
    num('refT', 'Thrust per motor (g)', 1, 100000, { required: true }),
    num('refD', 'Measured with prop (inches)', 0.5, 40, { required: true }),
    num('refC', 'Measured at battery (S)', 1, 14, { required: true }),
    num('refA', 'Peak current per motor (A)', 0.5, 500, { required: true }),
  ],
  esc: [
    pick('t', 'Type', ['4in1', 'single']),
    num('a', 'Continuous current (A)', 1, 500, { required: true }),
    ...CELLS,
    text('fw', 'ESC firmware', { def: 'AM32' }),
    yesno('dshot', 'Supports DShot'),
    pick('mount', 'Mount', ['30.5', '20', '25.5', '35', 'arm'], { def: '30.5' }),
  ],
  fc: [
    text('mcu', 'Chip, such as STM32H743', { def: '' }),
    ...CELLS,
    num('u', 'Serial ports', 0, 16, { required: true }),
    many('fw', 'Firmware it runs', FIRMWARES, { required: true }),
    pick('mount', 'Mount', ['30.5', '20', '25.5', '26.5', '35', 'pixhawk'], { def: '30.5' }),
  ],
  prop: [
    num('d', 'Diameter (inches)', 0.5, 40, { required: true }),
    num('pi', 'Pitch (inches)', 0.1, 30, { def: 3 }),
    num('bl', 'Blades', 2, 8, { def: 3 }),
  ],
  battery: [
    num('c', 'Cells (S)', 1, 14, { required: true }),
    pick('ch', 'Chemistry', ['LiPo', 'LiHV', 'Li-Ion']),
    num('cap', 'Capacity (mAh)', 50, 100000, { required: true }),
    num('dr', 'Discharge rating (C)', 1, 300, { required: true }),
    pick('cn', 'Plug', ['XT60', 'XT30', 'XT90', 'EC5', 'AS150', 'BT2.0', 'PH2.0']),
  ],
  video: [
    pick('sys', 'System', ['Analog', 'DJI', 'Walksnail', 'HDZero']),
    ...CELLS,
    num('lat', 'Latency (ms)', 0, 500, { def: 25 }),
    num('pw', 'Power draw (W)', 0, 100, { def: 5 }),
  ],
  rx: [
    pick('proto', 'Protocol', ['ELRS', 'CRSF', 'SBUS']),
    pick('band', 'Band', ['2.4', 'sub']),
  ],
  gps: [
    text('chip', 'Chip, such as u-blox M10', { def: '' }),
    yesno('rtk', 'Has RTK', false),
  ],
  companion: [
    num('pw', 'Power draw (W)', 0, 200, { def: 5 }),
    text('ros', 'Good for', { def: 'Companion tasks' }),
  ],
};

export const fieldsFor = (slot) => [...COMMON.slice(0, 2), ...(CUSTOM_FIELDS[slot] || []), ...COMMON.slice(2)];

const cleanText = (v) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, 60);

/** Turn raw values into a part the engine can use. Returns { part, errors }. */
export function cleanCustom(slot, raw = {}) {
  const fields = CUSTOM_FIELDS[slot] ? fieldsFor(slot) : null;
  if (!fields || !SLOTS.some((s) => s.key === slot)) return { part: null, errors: [{ key: 'slot', message: 'Unknown part type' }] };
  const out = { slot, custom: true };
  const errors = [];
  for (const f of fields) {
    const v = raw[f.key];
    const empty = v === undefined || v === null || v === '';
    if (f.kind === 'num') {
      const n = Number(v);
      if (empty && f.def !== undefined) out[f.key] = f.def;
      else if (empty || !Number.isFinite(n)) errors.push({ key: f.key, message: 'Enter a number' });
      else if (n < f.min || n > f.max) errors.push({ key: f.key, message: `Between ${f.min} and ${f.max}` });
      else out[f.key] = n;
    } else if (f.kind === 'text') {
      const s = cleanText(v);
      if (!s && f.required) errors.push({ key: f.key, message: 'Required' });
      else if (s && f.pattern && !f.pattern.test(s)) errors.push({ key: f.key, message: f.hint || 'Check the format' });
      else out[f.key] = s || f.def || '';
    } else if (f.kind === 'select') {
      const s = String(v ?? '');
      out[f.key] = f.options.includes(s) ? s : f.def;
    } else if (f.kind === 'multi') {
      const list = (Array.isArray(v) ? v : []).map(String).filter((x) => f.options.includes(x));
      if (!list.length && f.required) errors.push({ key: f.key, message: 'Choose at least one' });
      out[f.key] = list;
    } else if (f.kind === 'bool') {
      out[f.key] = v === undefined ? f.def : v === true || v === 'true';
    }
  }
  if (out.cMin !== undefined && out.cMax !== undefined && out.cMin > out.cMax) {
    errors.push({ key: 'cMax', message: 'Must not be below the lowest' });
  }
  if (errors.length) return { part: null, errors };

  // Fields the engine reads that the form does not need to ask for.
  if (slot === 'frame') {
    out.mc = Number(out.mc);
    out.minProp = Math.round(out.maxProp * 0.7 * 10) / 10;
    out.cat = out.ducted ? 'cinewhoop' : out.wheel < 100 ? 'whoop' : out.wheel >= 400 ? 'lab' : 'freestyle';
  }
  if (slot === 'motor') out.ref = { c: out.refC, d: out.refD, t: out.refT, a: out.refA };
  if (slot === 'fc') {
    out.flash = 2;
    out.imu = '';
    if (out.mount === 'pixhawk') out.needsPM = true;
  }
  if (slot === 'video') out.mw = 0;
  return { part: out, errors: [] };
}

/** What the form starts with: empty for a new part, or a saved part's numbers to edit. */
export function formValues(slot, part = null) {
  return Object.fromEntries(fieldsFor(slot).map((f) => {
    const saved = part?.[f.key];
    if (f.kind === 'multi') return [f.key, Array.isArray(saved) ? saved : []];
    if (saved === undefined || saved === null) return [f.key, f.def ?? ''];
    return [f.key, f.kind === 'select' ? String(saved) : saved];
  }));
}

export const CUSTOM_ID = /^x-[a-z0-9-]{1,40}$/;

const canonical = (p) => JSON.stringify(Object.keys(p).sort().map((k) => [k, p[k]]));
const shortHash = (s) => {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = (h * 33 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

/**
 * A link is a snapshot, and you can edit a part after sending it. If a link carries different specs
 * under an id already in use, give the link's version its own id, so opening an old link never
 * overwrites what you saved. The same link always gets the same id.
 */
export function reconcileShared(custom, sel, lookup) {
  const out = {};
  const nextSel = { ...sel };
  for (const [id, part] of Object.entries(custom)) {
    const mine = lookup(id);
    if (!mine || canonical(mine) === canonical(part)) { out[id] = part; continue; }
    const fresh = `x-shared-${shortHash(canonical({ ...part, id: '' }))}`;
    out[fresh] = { ...part, id: fresh };
    for (const [slot, v] of Object.entries(nextSel)) if (v === id) nextSel[slot] = fresh;
  }
  return { custom: out, sel: nextSel };
}

/** Read the custom parts carried by a share link, ignoring anything that does not validate. */
export function cleanSharedParts(raw) {
  const out = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [id, p] of Object.entries(raw).slice(0, 12)) {
    if (!CUSTOM_ID.test(id) || !p || typeof p !== 'object') continue;
    const { part } = cleanCustom(p.slot, p);
    if (part) out[id] = { ...part, id };
  }
  return out;
}

export const PAYLOAD_PRESETS = [
  { name: 'Action camera', g: 155 },
  { name: 'Stripped action camera', g: 35 },
  { name: 'Depth camera', g: 75 },
  { name: 'LiDAR sensor', g: 265 },
];

export function cleanPayload(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 12).map((i) => {
    const name = cleanText(i?.name) || 'Payload';
    const g = Number(i?.g);
    return Number.isFinite(g) && g > 0 && g <= 100000 ? { name, g } : null;
  }).filter(Boolean);
}
