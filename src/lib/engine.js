// Compatibility checks and flight physics. No React and no DOM, so it runs under `node --test`.
// The hover model is Anoorag Sunkari's from Multirotor.build: momentum theory with a
// Peukert correction and an ISA atmosphere.

import { SLOTS, GOALS, partById, partName } from '../data/parts.js';
import { cleanPayload } from './custom.js';

const CHEM = {
  LiPo: { nom: 3.7, full: 4.2, usable: 0.8, k: 1.05 },
  LiHV: { nom: 3.8, full: 4.35, usable: 0.8, k: 1.05 },
  'Li-Ion': { nom: 3.6, full: 4.2, usable: 0.85, k: 1.02 },
};
const CONNECTOR_AMPS = { 'BT2.0': 12, 'PH2.0': 8, XT30: 30, XT60: 60, XT90: 90, EC5: 120, AS150: 150 };

export const packVolts = (b) => b.c * CHEM[b.ch].nom;
export const packFull = (b) => b.c * CHEM[b.ch].full;

/** Turn { slot: partId } into { slot: part }. Unknown ids are dropped, so old share links survive. */
export function resolve(ids = {}, payload = null) {
  const sel = {};
  for (const s of SLOTS) {
    const p = ids[s.key] && partById(ids[s.key]);
    if (p) sel[s.key] = p;
  }
  const items = cleanPayload(payload);
  if (items.length) {
    sel.payload = { b: '', m: items.map((i) => i.name).join(', '), w: items.reduce((a, i) => a + i.g, 0), items };
  }
  return sel;
}

/** The parts and payload of a saved build. */
export const loadBuild = (project) => resolve(project.sel, project.payload);

const included = (sel, slot) => !!sel.fc?.includes?.includes(slot);
const motorCount = (sel) => sel.frame?.mc || 4;

/** Thrust and peak current for this motor with the chosen prop and battery. */
export function motorOutput(sel) {
  const m = sel.motor;
  if (!m) return null;
  const Vref = m.ref.c * 3.7;
  const V = sel.battery ? packVolts(sel.battery) : Vref;
  const d = sel.prop ? sel.prop.d : m.ref.d;
  const vr = V / Vref;
  const dr = d / m.ref.d;
  return { thrust: m.ref.t * vr ** 1.5 * dr ** 2.5, amps: m.ref.a * vr ** 1.5 * dr ** 3 };
}

export function allUpWeight(sel) {
  const mc = motorCount(sel);
  const parts = {
    frame: sel.frame?.w || 0,
    motors: (sel.motor?.w || 0) * mc,
    esc: sel.esc ? (sel.esc.t === '4in1' ? sel.esc.w : sel.esc.w * mc) : 0,
    fc: sel.fc?.w || 0,
    props: (sel.prop?.w || 0) * mc,
    battery: sel.battery?.w || 0,
    video: included(sel, 'video') ? 0 : sel.video?.w || 0,
    rx: included(sel, 'rx') ? 0 : sel.rx?.w || 0,
    gps: sel.gps?.w || 0,
    companion: sel.companion?.w || 0,
    payload: sel.payload?.w || 0,
  };
  const subtotal = Object.values(parts).reduce((a, b) => a + b, 0);
  parts.wiring = Math.max(1, subtotal * 0.04);
  return { total: subtotal + parts.wiring, parts };
}

/** Propeller figure of merit: small props are much less efficient than big ones. */
function figureOfMerit(prop, d) {
  const base = Math.min(0.62, Math.max(0.25, 0.25 + 0.035 * d));
  const blades = prop?.bl || 3;
  return base + (blades === 2 ? 0.02 : blades >= 4 ? -0.05 : 0);
}

export function flight(sel, { altitude = 0, goal = 'freestyle' } = {}) {
  const { motor, battery, frame, prop } = sel;
  if (!motor || !battery) return null;
  const mc = motorCount(sel);
  const auw = allUpWeight(sel).total;
  const out = motorOutput(sel);
  const twr = (out.thrust * mc) / auw;

  const rho = 1.225 * (1 - (0.0065 * altitude) / 288.15) ** 4.2561;
  const dIn = prop ? prop.d : motor.ref.d;
  const dM = dIn * 0.0254;
  const area = Math.PI * (dM / 2) ** 2 * mc;
  const T = (auw / 1000) * 9.81;
  const ideal = T ** 1.5 / Math.sqrt(2 * rho * area);
  const FM = figureOfMerit(prop, dIn);
  const eta = 0.75; // motor and ESC, combined
  const electronics = 1 + (sel.video?.pw || 0) + (sel.gps ? 0.5 : 0) + (sel.companion?.pw || 0);
  const hoverW = ideal / FM / eta + electronics;

  const chem = CHEM[battery.ch];
  const V = packVolts(battery);
  const Ah = battery.cap / 1000;
  const energy = V * Ah * chem.usable;
  const hoverA = hoverW / (V * 0.95);
  const peukert = (Ah / Math.max(hoverA, 0.1)) ** (chem.k - 1);
  const hover = (energy / hoverW) * 60 * Math.min(peukert, 1.05);
  const g = GOALS.find((x) => x.id === goal) || GOALS[1];

  return {
    auw,
    twr,
    hover,
    flyMin: hover * g.fly[0],
    flyMax: hover * g.fly[1],
    hoverW,
    hoverA,
    FM,
    rho,
    peakA: out.amps * mc,
    energyWh: V * Ah,
    hoverThrottle: Math.min(100, (1 / Math.max(twr, 0.01)) * 100),
    frameCat: frame?.cat,
  };
}

/** How many of this part one aircraft needs. */
export function partQty(sel, slot, part) {
  if (slot === 'motor' || slot === 'prop' || (slot === 'esc' && part?.t === 'single')) return motorCount(sel);
  return 1;
}

export function cost(sel) {
  let total = 0;
  const lines = [];
  for (const s of SLOTS) {
    const p = sel[s.key];
    if (!p) continue;
    const qty = partQty(sel, s.key, p);
    if (s.key === 'esc' && included(sel, 'esc')) continue;
    if (s.key === 'rx' && included(sel, 'rx')) continue;
    if (s.key === 'video' && included(sel, 'video')) continue;
    // Your own part with no price is still a part to get. Only "no video" costs nothing and is nothing.
    if (p.p === 0 && !p.custom) continue;
    lines.push({ slot: s.key, part: p, qty, unit: p.p, total: p.p * qty });
    total += p.p * qty;
  }
  return { total, lines };
}

const issue = (level, id, title, detail, fix, parts = []) => ({ level, id, title, detail, fix, parts });

/**
 * Every check returns plain language first and numbers second.
 * error = it will not work or will damage something. warn = it works, with a catch. info = worth knowing.
 */
export function check(sel, ctx = {}) {
  const { firmware, goal = 'freestyle', region } = ctx;
  const out = [];
  const add = (...a) => out.push(issue(...a));
  const { frame, motor, esc, fc, prop, battery, video, rx, gps, companion } = sel;
  const mc = motorCount(sel);
  const noEsc = included(sel, 'esc');
  const noRx = included(sel, 'rx');

  // Voltage
  if (battery) {
    for (const [slot, p, name] of [['motor', motor, 'motors'], ['esc', noEsc ? null : esc, 'ESC'], ['fc', fc, 'flight controller'], ['video', video, 'video system']]) {
      if (!p) continue;
      if (battery.c > p.cMax) add('error', `v-hi-${slot}`, `Battery voltage is too high for the ${name}`, `A ${battery.c}S pack can exceed what ${partName(p)} is rated for (${p.cMin}–${p.cMax}S). This can destroy it the moment you plug in.`, `Use a battery of ${p.cMax}S or lower, or pick a higher-voltage ${name}.`, ['battery', slot]);
      else if (battery.c < p.cMin) add(slot === 'motor' ? 'warn' : 'error', `v-lo-${slot}`, `Battery voltage is too low for the ${name}`, `${partName(p)} expects ${p.cMin}–${p.cMax}S and this pack is ${battery.c}S.`, `Use a ${p.cMin}S or higher battery.`, ['battery', slot]);
    }
  }

  // Physical fit
  if (frame && motor && !frame.mount.includes(motor.mount)) add('error', 'fit-motor', 'Motors will not bolt onto this frame', `The frame arms take ${frame.mount.join(' / ')} mm hole spacing and these motors use ${motor.mount} mm.`, 'Pick a motor size made for this frame class.', ['frame', 'motor']);
  if (frame && prop) {
    if (prop.d > frame.maxProp) add('error', 'fit-prop', 'Props are too big for this frame', `${prop.d}" props hit the frame or duct, which fits up to ${frame.maxProp}".`, `Choose props of ${frame.maxProp}" or smaller.`, ['frame', 'prop']);
    else if (prop.d < frame.minProp) add('warn', 'small-prop', 'Props are small for this frame', `This frame is designed for ${frame.minProp}–${frame.maxProp}" props. Smaller props lose thrust and flight time.`, 'Move up a prop size if you can.', ['frame', 'prop']);
  }
  if (frame && fc && !frame.stack.includes(fc.mount)) add(fc.mount === 'pixhawk' ? 'error' : 'warn', 'fit-fc', 'Flight controller does not match the frame mount', fc.mount === 'pixhawk' ? `A Pixhawk-size controller will not fit on this small frame (it takes ${frame.stack.join(' / ')} mm stacks).` : `The frame takes ${frame.stack.join(' / ')} mm stacks and this board is ${fc.mount} mm. An adapter plate may work, with less room.`, 'Choose a board with a matching hole pattern.', ['frame', 'fc']);
  if (esc && fc && !noEsc && esc.t === '4in1' && fc.mount !== 'pixhawk' && esc.mount !== fc.mount) add('warn', 'stack-mismatch', 'ESC and flight controller will not stack', `The ESC is ${esc.mount} mm and the flight controller is ${fc.mount} mm, so they cannot share standoffs.`, 'Pick both from the same mounting size.', ['esc', 'fc']);
  if (esc && fc && !noEsc && esc.t === '4in1' && fc.mount === 'pixhawk') add('info', 'pix-4in1', 'A 4-in-1 ESC on a Pixhawk needs extra wiring', 'Run the signal wires from the 4-in-1 ESC to the PWM rail by hand, since there is no plug-in stack cable.', null, ['esc', 'fc']);
  if (esc && frame && esc.t === 'single' && frame.wheel < 400) add('warn', 'single-small', 'Separate ESCs are unusual at this size', 'Small frames rarely have arm space for four separate ESCs. A 4-in-1 board is lighter and tidier.', 'Choose a 4-in-1 ESC.', ['esc', 'frame']);
  if (fc && noEsc && esc) add('info', 'aio-esc', 'Your flight controller already includes an ESC', 'You can remove the separate ESC from this build.', null, ['esc', 'fc']);
  if (battery && frame?.plug && battery.cn !== frame.plug) add('warn', 'plug', 'Battery plug does not match', `This class of frame normally uses ${frame.plug} and this pack has ${battery.cn}.`, `Pick a ${frame.plug} battery.`, ['battery', 'frame']);

  // Electrical load
  const o = motorOutput(sel);
  if (motor && (esc || noEsc)) {
    const rating = noEsc ? fc.aio : esc.a;
    if (o.amps > rating * 1.1) add('error', 'esc-amps', 'Motors can pull more current than the ESC can handle', `About ${o.amps.toFixed(0)} A per motor at full throttle against a ${rating} A ESC. That risks burning the ESC.`, 'Pick a bigger ESC, or use smaller props or a lower voltage.', ['motor', noEsc ? 'fc' : 'esc']);
    else if (o.amps > rating * 0.85) add('warn', 'esc-amps-near', 'ESC has little headroom', `About ${o.amps.toFixed(0)} A per motor against a ${rating} A rating. It works, but hard flying will run hot.`, 'A slightly bigger ESC gives a safety margin.', ['motor', noEsc ? 'fc' : 'esc']);
  }
  if (motor && battery) {
    const peak = o.amps * mc;
    const avail = (battery.cap / 1000) * battery.dr;
    if (battery.ch === 'Li-Ion' && peak > avail) add(['longrange', 'lab', 'heavy'].includes(goal) ? 'info' : 'warn', 'liion-peak', 'Li-ion packs cannot give full throttle for long', `Full throttle could ask for ${peak.toFixed(0)} A and this pack gives about ${avail.toFixed(0)} A. That suits gentle cruising only.`, 'Fly smoothly, or use a LiPo if you want punch.', ['battery', 'motor']);
    else if (peak > avail * 1.15) add('error', 'batt-amps', 'Battery cannot deliver enough current', `Full throttle could ask for ${peak.toFixed(0)} A and this pack is rated for about ${avail.toFixed(0)} A. Expect voltage sag and a damaged pack.`, 'Choose a bigger capacity or higher C rating.', ['battery', 'motor']);
    else if (peak > avail * 0.9) add('warn', 'batt-amps-near', 'Battery is close to its current limit', `About ${peak.toFixed(0)} A peak against about ${avail.toFixed(0)} A rated.`, null, ['battery', 'motor']);
    const cn = CONNECTOR_AMPS[battery.cn];
    if (cn && battery.ch !== 'Li-Ion' && peak > cn * 3.5) add('warn', 'connector', `${battery.cn} plug is undersized`, `Peak current of ${peak.toFixed(0)} A is far over what a ${battery.cn} plug handles continuously (${cn} A). Normal builds run a few times over this in short bursts, but not this far.`, 'Move up a plug size.', ['battery']);
  }

  // Motor, prop and voltage together
  if (motor && prop && battery) {
    const rpm = motor.kv * packFull(battery);
    const tip = (rpm * Math.PI * prop.d * 0.0254) / 60;
    if (tip > 430) add('error', 'tip', 'This motor, prop and voltage combination spins too fast', `${motor.kv} KV on ${battery.c}S gives a no-load prop tip speed near ${tip.toFixed(0)} m/s. That overheats motors and burns ESCs.`, 'Use a lower KV motor, a lower-voltage battery, or a smaller prop.', ['motor', 'battery', 'prop']);
    else if (tip > 370) add('warn', 'tip-near', 'This combination is aggressive', `No-load tip speed is near ${tip.toFixed(0)} m/s. Expect hot motors and a lot of noise.`, 'A lower KV or lower cell count runs cooler.', ['motor', 'battery', 'prop']);
    const r = prop.d / motor.ref.d;
    if (r > 1.35) add('warn', 'prop-big', 'These props are big for this motor', `These motors are usually paired with about ${motor.ref.d}" props, and yours are ${prop.d}". They may struggle and overheat.`, 'Use a larger motor or smaller props.', ['motor', 'prop']);
  }

  // Performance
  if (motor && battery) {
    const f = flight(sel, { goal });
    const g = GOALS.find((x) => x.id === goal) || GOALS[1];
    if (f.twr < 1.6) add('error', 'twr', 'Too heavy to fly safely', `Thrust is only ${f.twr.toFixed(1)} times the weight. The drone would have almost no control authority.`, 'Reduce weight or use stronger motors.', ['motor', 'battery']);
    else if (f.twr < g.twr) add('warn', 'twr-goal', `Underpowered for ${g.label.toLowerCase()}`, `Thrust-to-weight is ${f.twr.toFixed(1)}:1, and this style usually wants ${g.twr}:1 or more.`, 'Try lighter parts or more thrust.', ['motor', 'battery']);
    if (battery.w / f.auw > 0.5) add('info', 'batt-heavy', 'Battery is over half the weight', 'Flight time gains flatten here. Adding more battery may barely help.', null, ['battery']);
  }

  // Firmware
  if (fc && firmware && !fc.fw.includes(firmware)) add('error', 'fw', `${partName(fc)} does not run ${firmware}`, `This board supports ${fc.fw.join(', ')}.`, `Pick a board that lists ${firmware}, or change firmware.`, ['fc']);
  if (firmware === 'Betaflight' && esc && !noEsc && !esc.dshot) add('error', 'dshot', 'Betaflight needs a DShot ESC', `${partName(esc)} does not support DShot, so RPM filtering and bidirectional DShot are unavailable.`, 'Choose a DShot ESC.', ['esc']);
  if (firmware === 'INAV' && fc?.mcu === 'STM32F722') add('info', 'inav-f722', 'INAV runs with fewer features on this chip', 'F722 boards still get INAV releases with some features cut, such as geozones. An H7 board has none of those limits.', null, ['fc']);
  if (firmware === 'INAV' && !gps) add('warn', 'inav-gps', 'INAV is at its best with a GPS', 'Without GPS you lose return-to-home and waypoint missions, the main reasons people choose INAV.', 'Add a GPS.', ['gps']);
  if ((firmware === 'ArduPilot' || firmware === 'PX4') && !gps && !companion) add('warn', 'ap-gps', `${firmware} needs a position source for autonomous modes`, 'Without GPS or a vision system you only have manual and stabilized modes.', 'Add a GPS, or a companion computer running vision.', ['gps']);
  if (firmware === 'ArduPilot' && fc && fc.flash < 2 && fc.fw.includes('ArduPilot')) add('info', 'ap-flash', 'This board runs a reduced ArduPilot', `With ${fc.flash} MB of flash some features are left out, and future releases may drop it. A 2 MB H7 board gives you everything.`, null, ['fc']);
  if (esc?.legacy && !noEsc) add('info', 'blheli32', 'BLHeli_32 has been discontinued', 'These ESCs still work, but the firmware gets no more updates. New builds are better served by AM32 or Bluejay.', null, ['esc']);
  for (const [slot, p] of Object.entries(sel)) if (p.custom) add('info', `custom-${slot}`, `${partName(p)} uses specs you entered`, 'The checks for this part are only as accurate as those numbers.', null, [slot]);
  if (sel.payload && motor && battery && sel.payload.w / allUpWeight(sel).total > 0.25) add('info', 'payload-share', 'Your payload is a big share of the weight', 'Mount it close to the center of the drone, so the motors stay balanced.', null, ['payload']);
  for (const [slot, p] of Object.entries(sel)) if (p.stock === 'low') add('info', `stock-${slot}`, `${partName(p)} may be hard to find`, 'The maker or main retailers listed it as discontinued or out of stock when we checked. Search your local shops, or pick a similar part.', null, [slot]);
  if (rx?.legacy && !noRx) add('info', 'legacy-rx', 'Older radio link', 'SBUS still works but new builds generally use ELRS or Crossfire.', null, ['rx']);
  if (fc?.needsPM) add('info', 'pm', 'You also need a power module', 'Pixhawk-class boards are powered through a separate power module and power distribution board. Budget about $30 and check that it is rated for your battery.', null, ['fc']);
  if (gps?.conn === 'pixhawk' && fc && fc.mount !== 'pixhawk') add('info', 'gps-plug', 'GPS uses a Pixhawk-style plug', 'You will need to rewire the JST-GH connector to solder pads on this board.', null, ['gps', 'fc']);
  if (companion && fc && fc.mount !== 'pixhawk' && firmware === 'Betaflight') add('warn', 'bf-companion', 'Betaflight is not meant for companion-computer autonomy', 'It has no MAVLink offboard mode or position control. PX4 or ArduPilot are built for this.', 'Switch to PX4 or ArduPilot.', ['companion', 'fc']);
  if (companion && frame && frame.wheel < 200 && companion.w > 30) add('warn', 'comp-weight', 'This computer is heavy for this frame', `${partName(companion)} weighs ${companion.w} g, which uses much of a small frame's lift.`, 'Choose a smaller computer or a larger frame.', ['companion', 'frame']);

  // Wiring budget
  if (fc) {
    const need = [];
    if (rx && !noRx) need.push('receiver');
    if (video && video.sys !== 'None' && video.sys !== 'Analog') need.push('digital video');
    if (video && video.sys === 'Analog') need.push('VTX control');
    if (gps) need.push('GPS');
    if (companion) need.push('companion computer');
    if (need.length > fc.u) add('error', 'uart', 'Not enough serial ports', `You need ${need.length} UARTs (${need.join(', ')}) and ${partName(fc)} has ${fc.u}.`, 'Remove one device or choose a board with more UARTs.', ['fc']);
  }

  // Region
  if (region && frame) {
    if (rx?.band === 'sub' && region.sub900 === 'no') add('error', 'r-900', `Sub-GHz radio is not allowed in ${region.name}`, region.sub900Note, 'Choose a 2.4 GHz receiver.', ['rx']);
    if (rx?.band === 'sub' && region.sub900 === 'caution') add('warn', 'r-900c', `Sub-GHz radio may not be allowed in ${region.name}`, region.sub900Note, 'Choose a 2.4 GHz receiver.', ['rx']);
    if (rx?.band === 'sub' && region.sub900 === 'band') add('info', 'r-868', `Set the band for ${region.name}`, region.sub900Note, null, ['rx']);
    if (video && region.vtxNote && video.sys !== 'None') add(region.vtxLevel || 'info', 'r-vtx', `Video transmitter rules in ${region.name}`, region.vtxNote, null, ['video']);
    if (video?.b === 'DJI' && region.djiNote) add('warn', 'r-dji', `DJI availability in ${region.name}`, region.djiNote, 'HDZero, Walksnail or analog can be alternatives. Check local stock first.', ['video']);
  }

  const order = { error: 0, warn: 1, info: 2 };
  return out.sort((a, b) => order[a.level] - order[b.level]);
}

export const summarize = (issues) => ({
  errors: issues.filter((i) => i.level === 'error').length,
  warnings: issues.filter((i) => i.level === 'warn').length,
  infos: issues.filter((i) => i.level === 'info').length,
});

/** How a candidate part would change the build. Used to sort and label choices in the picker. */
export function rate(slot, part, sel, ctx) {
  const before = new Set(check(sel, ctx).map((i) => i.id));
  const next = { ...sel, [slot]: part };
  const after = check(next, ctx).filter((i) => i.parts.includes(slot));
  const errors = after.filter((i) => i.level === 'error');
  const warns = after.filter((i) => i.level === 'warn');
  return {
    status: errors.length ? 'error' : warns.length ? 'warn' : 'ok',
    reason: errors[0]?.title || warns[0]?.title || null,
    fresh: after.filter((i) => !before.has(i.id)).length,
  };
}

/** Fill empty slots with parts that suit the frame and goal and create no new errors. */
export function autofill(sel, ctx = {}, opts = {}) {
  const next = { ...sel };
  // ESC first, so the flight controller can match its mount. Tiny frames use all-in-one boards.
  const tiny = (next.frame?.wheel || 200) < 100;
  const order = ['frame', 'motor', 'prop', 'battery', ...(tiny ? ['fc', 'esc'] : ['esc', 'fc']), 'rx', 'video'];
  if (ctx.firmware === 'INAV' || ctx.firmware === 'ArduPilot' || ctx.firmware === 'PX4') order.push('gps');
  if (opts.onlyOwned && !order.includes('gps')) order.push('gps');
  if (opts.withCompanion) order.push('companion');
  // Compatible is not the same as good. Cheapest wins only among parts that suit the job:
  // use the prop size the frame was designed for, and buy endurance when the goal needs it.
  const endurance = ['longrange', 'lab', 'heavy', 'cine'].includes(ctx.goal);
  const prefer = (key, p) => {
    if (key === 'motor' && next.frame) return Math.abs(p.ref.d - next.frame.maxProp) * 100 + p.p;
    if (key === 'prop' && next.frame) return Math.abs(Math.min(next.frame.maxProp, next.motor?.ref.d ?? Infinity) - p.d) * 100 + p.p;
    if (key === 'battery' && endurance) return -(flight({ ...next, battery: p }, { goal: ctx.goal })?.hover ?? 0) * 20 + p.p / 10;
    return p.p;
  };
  const score = (r, key, p) => (r.status === 'error' ? 1e6 : r.status === 'warn' ? 1e3 : 0) + prefer(key, p);
  // Picks are made one slot at a time, so rule out parts that only look cheap because their
  // partner has not been chosen yet, or that an experienced builder would never pair.
  const sensible = (key, p) => {
    const fr = next.frame;
    if (key === 'motor' && fr) {
      if (p.ref.d < fr.minProp * 0.85 || p.ref.d > fr.maxProp * 1.25) return false;
      // A large frame carries a battery and payload, so check it can lift roughly 800 g on top.
      return fr.wheel < 400 || p.ref.t * fr.mc >= (fr.w + 800) * 2;
    }
    // The model name only tells us about parts in the database. Your own part can be called anything.
    if (key === 'prop' && fr) return p.d <= fr.maxProp && (p.custom || /ducted/.test(p.m) === (fr.cat === 'cinewhoop'));
    if (key === 'esc' && fr) return (p.t === 'single') === (fr.wheel >= 400);
    if (key === 'battery' && next.motor) {
      if (p.c !== next.motor.ref.c) return false;
      return p.w <= next.motor.w * (fr?.mc || 4) * (endurance ? 3 : 2.5);
    }
    return true;
  };
  for (const key of order) {
    if (next[key]) continue;
    if (included(next, key)) continue;
    const slot = SLOTS.find((s) => s.key === key);
    let best = null;
    let bestScore = Infinity;
    // A part you own wins over buying one, as long as you have enough of it and it creates no
    // error. One spare motor should not decide which motors a whole quad gets.
    for (const { part: p, qty } of opts.owned || []) {
      if (p.slot !== key || qty < partQty(next, key, p) || !sensible(key, p)) continue;
      const r = rate(key, p, next, ctx);
      if (r.status === 'error') continue;
      const s = score(r, key, p) - 1e5;
      if (s < bestScore) { bestScore = s; best = p; }
    }
    if (best || opts.onlyOwned) {
      if (best) next[key] = best;
      continue;
    }
    for (const p of slot.list) {
      if (key === 'video' && p.id === 'v-none' && ctx.goal !== 'lab' && ctx.goal !== 'heavy') continue;
      if (p.legacy || p.stock === 'low' || !sensible(key, p)) continue;
      const s = score(rate(key, p, next, ctx), key, p);
      if (s < bestScore) { bestScore = s; best = p; }
    }
    if (best && bestScore < 1e6) next[key] = best;
  }
  return next;
}

/** Slots still missing before the build can fly. */
export function missing(sel) {
  return SLOTS.filter((s) => s.required && !sel[s.key] && !included(sel, s.key)).map((s) => s.key);
}

export const isIncluded = included;
export const toIds = (sel) => Object.fromEntries(Object.entries(sel).filter(([, v]) => v.id).map(([k, v]) => [k, v.id]));

/** Features of the build, which select the matching assembly steps. */
export function traits(sel, firmware) {
  const t = new Set();
  if (sel.fc?.includes?.includes('esc')) t.add('aio'); else t.add('solder');
  if (sel.esc?.t === 'single') t.add('single-esc');
  if (sel.esc?.t === '4in1' && !t.has('aio')) t.add('stack');
  if (sel.fc?.mount === 'pixhawk') t.add('pixhawk');
  if (sel.gps) t.add('gps');
  if (sel.companion) t.add('companion');
  if (sel.video && sel.video.sys === 'Analog') t.add('analog');
  if (sel.video && !['Analog', 'None'].includes(sel.video.sys)) t.add('digital');
  if (firmware) t.add(firmware);
  if ((sel.frame?.wheel || 200) < 100) t.add('tiny');
  return t;
}
