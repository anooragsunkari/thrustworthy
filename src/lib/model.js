// Where each part sits on the drone, in millimeters, worked out from its specs.
// No three.js here, so the layout can be tested under `node --test`.
// Axes: y is up, and the front of the drone faces -z.
// This is a to-scale sketch for understanding a build. It is not a CAD model.

import { isIncluded, cost, check } from './engine.js';
import { SLOTS, partName } from '../data/parts.js';

/**
 * What to tell someone when the 3D view will not start. `gpu` means the browser refused
 * to give us graphics, which steps on their side can fix. Anything else is our bug.
 */
export function view3dHelp(error, userAgent = '') {
  if (!error?.gpu) return { gpu: false, steps: [] };
  const name = /\bEdg(e|A|iOS)?\//.test(userAgent) ? 'Edge' : /\b(Chrome|CriOS)\//.test(userAgent) ? 'Chrome' : null;
  if (!name) return { gpu: true, steps: ['Close the browser completely and open it again.', 'Turn on hardware acceleration in the browser settings.', 'Update your graphics driver.'] };
  const scheme = name.toLowerCase();
  return {
    gpu: true,
    steps: [
      `Close every ${name} window and open it again. After a graphics crash, ${name} can keep 3D off until it restarts.`,
      `Open ${scheme}://settings/system and turn on graphics acceleration, then restart ${name}.`,
      `Still stuck? Open ${scheme}://gpu and look at the WebGL lines. Updating your graphics driver often helps.`,
    ],
  };
}

const cube = (grams, density, ratio) => {
  // Box dimensions from weight, for parts where we know weight but not exact size.
  const volume = (grams / density) * 1000; // mm^3
  const [a, b, c] = ratio;
  const k = Math.cbrt(volume / (a * b * c));
  return { l: a * k, w: b * k, h: c * k };
};

const statorOf = (sz) => {
  const s = String(sz || '2207');
  return { dia: parseInt(s.slice(0, 2), 10) || 22, h: parseInt(s.slice(2, 4), 10) || 7 };
};

export function layout(sel) {
  const frame = sel.frame;
  if (!frame) return null;
  const mc = frame.mc;
  const wheel = frame.wheel;
  const arm = wheel / 2;
  const tiny = wheel < 100;
  const large = wheel >= 400;
  const ducted = frame.cat === 'whoop' || frame.cat === 'cinewhoop';
  const stackSize = sel.fc?.mount === 'pixhawk' ? 30.5 : parseFloat(sel.fc?.mount) || 20;
  const plateW = Math.max(tiny ? 26 : 34, stackSize + 8);
  const plateL = plateW * (large ? 1.6 : 1.7);
  const plateT = Math.max(1.2, Math.min(wheel * 0.01, 3));
  const gap = tiny ? 8 : large ? 34 : 20;
  const armT = Math.max(2, Math.min(wheel * 0.018, 6));
  const armW = Math.max(3, Math.min(wheel * 0.05, 20));
  const unit = Math.max(tiny ? 26 : 45, wheel * 0.2);

  const mounts = [];
  for (let i = 0; i < mc; i += 1) {
    const a = ((i * 360) / mc + 180 / mc) * (Math.PI / 180);
    mounts.push({ x: Math.cos(a) * arm, z: Math.sin(a) * arm, dir: i % 2 ? 1 : -1, angle: a });
  }

  const out = [];
  const add = (slot, kind, spec) => out.push({ slot, kind, ...spec });

  add('frame', 'frame', { y: 0, plateW, plateL, plateT, gap, armT, armW, mounts, ducted, propR: (sel.prop ? sel.prop.d : frame.maxProp) * 12.7, explode: [0, 0, 0] });

  const armY = -gap / 2;
  const stator = statorOf(sel.motor?.sz);
  const bellR = (stator.dia / 2) * 1.2;
  const bellH = stator.h + Math.max(2, stator.dia * 0.3);
  const propY = armY + armT / 2 + bellH + 2;
  if (sel.motor) add('motor', 'motors', { y: armY + armT / 2, bellR, bellH, mounts, explode: [0, unit * 0.9, 0] });
  if (sel.prop) add('prop', 'props', { y: propY, r: (sel.prop.d * 25.4) / 2, blades: sel.prop.bl, mounts, explode: [0, unit * 1.7, 0] });

  let top = plateT / 2;
  if (sel.fc?.mount === 'pixhawk') {
    add('fc', 'box', { size: { l: 84, w: 44, h: 16 }, pos: [0, top + 8, 0], tone: 'case', explode: [0, unit * 1.4, 0] });
    top += 16;
  } else if (sel.fc) {
    const s = stackSize + 6;
    add('fc', 'board', { size: { l: s, w: s, h: 2 }, pos: [0, -gap * 0.3, 0], explode: [0, unit * 1.1, 0] });
  }

  if (sel.esc && !isIncluded(sel, 'esc')) {
    if (sel.esc.t === 'single') {
      add('esc', 'perArm', { size: { l: 30, w: 16, h: 6 }, y: armY + armT / 2 + 3, at: 0.5, mounts, explode: [0, unit * 0.45, 0] });
    } else {
      const s = (parseFloat(sel.esc.mount) || 30.5) + 7;
      add('esc', 'board', { size: { l: s, w: s, h: 3 }, pos: [0, -gap * 0.72, 0], tone: 'pcb2', explode: [0, -unit * 0.8, 0] });
    }
  }

  let bottom = -gap - plateT / 2;
  if (sel.companion) {
    const size = cube(sel.companion.w, 0.75, [1.6, 1, 0.42]);
    add('companion', 'box', { size, pos: [0, bottom - size.h / 2 - 2, 0], tone: 'pcb', explode: [0, -unit * 1.6, 0] });
    bottom -= size.h + 4;
  }

  if (sel.payload) {
    const size = cube(Math.max(sel.payload.w, 5), 1, [1.3, 1, 0.8]);
    add('payload', 'box', { size, pos: [0, bottom - size.h / 2 - 3, -plateL * 0.05], tone: 'payload', explode: [0, -unit * 2.2, 0] });
    bottom -= size.h + 5;
  }

  if (sel.battery) {
    const size = cube(sel.battery.w, 2, [2.1, 1, 0.82]);
    const under = large && !sel.companion;
    const y = under ? bottom - size.h / 2 - 2 : top + size.h / 2 + 1;
    add('battery', 'battery', { size, pos: [0, y, 0], explode: [0, (under ? -1 : 1) * unit * 2.1, 0] });
    if (under) bottom -= size.h + 4; else top += size.h + 2;
  }

  if (sel.video && sel.video.sys !== 'None' && !isIncluded(sel, 'video')) {
    const c = Math.max(tiny ? 8 : 13, Math.min(19, Math.cbrt(sel.video.w) * 7));
    add('video', 'video', {
      cam: c,
      pos: [0, -gap / 2, -(plateL / 2 + c * 0.2)],
      vtx: { l: tiny ? 12 : 24, w: tiny ? 12 : 24, h: tiny ? 3 : 7 },
      vtxPos: [0, -gap * 0.5, plateL * 0.32],
      antenna: tiny ? 18 : 42,
      explode: [0, unit * 0.2, -unit * 1.1],
    });
  }

  if (sel.rx && !isIncluded(sel, 'rx')) {
    add('rx', 'rx', { size: { l: 14, w: 10, h: 4 }, pos: [plateW * 0.3, -gap * 0.5, plateL * 0.42], antenna: tiny ? 14 : 34, explode: [unit * 0.9, 0, unit * 0.6] });
  }

  if (sel.gps) {
    const r = Math.max(9, Math.cbrt(sel.gps.w) * 7);
    const mast = large ? 70 : 12;
    add('gps', 'gps', { r, mast, pos: [0, top, -plateL * 0.28], explode: [0, unit * 2.6, 0] });
  }

  const propR = sel.prop ? (sel.prop.d * 25.4) / 2 : frame.maxProp * 12.7;
  const extent = arm + propR;
  return { parts: out, extent, unit, height: top - bottom };
}

const ROLES = {
  frame: 'Holds everything together and sets the maximum prop size.',
  motor: 'Spins the props. Two spin each way, so the drone can yaw.',
  prop: 'Turns motor power into lift.',
  esc: 'Turns flight controller commands into power for each motor.',
  fc: 'The brain. It reads the sensors and runs your firmware.',
  battery: 'Powers everything, and is usually the heaviest part.',
  video: 'Sends a live view to your goggles.',
  rx: 'Listens to your radio controller.',
  gps: 'Tells the drone where it is, for return-to-home and missions.',
  companion: 'Runs your own code on board, such as ROS 2 or vision.',
};

/** Everything to show when someone taps a part, in display order. */
export function partDetails(slot, sel, ctx = {}) {
  const part = sel[slot];
  if (!part) return null;
  if (slot === 'payload') {
    return {
      slot,
      part,
      name: part.m,
      label: 'Payload',
      role: 'Extra weight the drone carries. It counts toward thrust, flight time and legal limits.',
      rows: [...part.items.map((i) => ({ label: i.name, value: `${i.g} g` })), { label: 'Weight', value: `${part.w} g` }],
      qty: 1,
      usd: 0,
      includes: [],
      issues: check(sel, ctx).filter((i) => i.parts.includes(slot)),
    };
  }
  const c = cost(sel).lines.find((l) => l.slot === slot);
  const rows = [];
  const row = (label, value) => { if (value !== undefined && value !== null && value !== '') rows.push({ label, value: String(value) }); };
  switch (slot) {
    case 'frame':
      row('Wheelbase', `${part.wheel} mm`); row('Motors', part.mc); row('Largest prop', `${part.maxProp}"`);
      row('Motor mount', `${part.mount.join(' / ')} mm`); row('Stack mount', part.stack.join(' / '));
      break;
    case 'motor':
      row('Size', part.sz); row('KV', part.kv); row('Battery', `${part.cMin === part.cMax ? part.cMin : `${part.cMin}–${part.cMax}`}S`);
      row('Mount', `${part.mount} mm`); row('Rated thrust', `${part.ref.t} g on ${part.ref.d}" at ${part.ref.c}S`);
      break;
    case 'esc':
      row('Type', part.t === '4in1' ? '4-in-1' : 'Single'); row('Current', `${part.a} A`); row('Battery', `${part.cMin}–${part.cMax}S`); row('ESC firmware', part.fw);
      row('DShot', part.dshot ? 'Yes' : 'No');
      break;
    case 'fc':
      row('Chip', part.mcu); row('Gyro', part.imu); row('Battery', `${part.cMin === part.cMax ? part.cMin : `${part.cMin}–${part.cMax}`}S`);
      row('Firmware', part.fw.join(', ')); row('Serial ports', part.u); row('Mount', part.mount === 'pixhawk' ? 'Pixhawk' : `${part.mount} mm`);
      if (part.aio) row('Built-in ESC', `${part.aio} A`);
      break;
    case 'prop':
      row('Diameter', `${part.d}"`); row('Pitch', part.pi); row('Blades', part.bl);
      break;
    case 'battery':
      row('Cells', `${part.c}S ${part.ch}`); row('Capacity', `${part.cap} mAh`); row('Discharge', `${part.dr}C`); row('Plug', part.cn);
      break;
    case 'video':
      row('System', part.sys); row('Latency', part.lat ? `${part.lat} ms` : null); row('Battery', `${part.cMin}–${part.cMax}S`);
      break;
    case 'rx':
      row('Protocol', part.proto); row('Band', part.band === 'sub' ? '868/915 MHz' : '2.4 GHz');
      break;
    case 'gps':
      row('Chip', part.chip); row('RTK', part.rtk ? 'Yes' : null);
      break;
    case 'companion':
      row('Good for', part.ros); row('Power', `${part.pw} W`);
      break;
    default:
  }
  const qty = c?.qty || 1;
  const each = part.w;
  const weightText = slot === 'motor' || slot === 'prop' || (slot === 'esc' && part.t === 'single')
    ? `${each} g each, ${Math.round(each * (sel.frame?.mc || 4) * 10) / 10} g total`
    : `${each} g`;
  row('Weight', weightText);
  const slotInfo = SLOTS.find((s) => s.key === slot);
  return {
    slot,
    part,
    name: partName(part),
    label: slotInfo.label,
    role: ROLES[slot],
    rows,
    qty,
    usd: c?.total ?? 0,
    includes: slot === 'fc' && part.includes ? part.includes : [],
    issues: check(sel, ctx).filter((i) => i.parts.includes(slot)),
  };
}
