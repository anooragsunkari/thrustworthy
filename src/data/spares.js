// What usually breaks on this build, how many spares to keep, and how to repair it.
// Quantities are rules of thumb from the hobby, not measured failure rates. Prices are rough
// USD: parts in the database use their listed price, and everything else is an estimate.

import { isIncluded } from '../lib/engine.js';
import { partName } from './parts.js';

// How hard this style of flying is on the aircraft.
const WEAR = {
  whoop: { sets: 4, motors: 1, arms: 0 },
  freestyle: { sets: 6, motors: 1, arms: 2 },
  race: { sets: 8, motors: 2, arms: 2 },
  cine: { sets: 3, motors: 1, arms: 1 },
  longrange: { sets: 3, motors: 1, arms: 1 },
  lab: { sets: 2, motors: 1, arms: 1 },
  heavy: { sets: 1, motors: 1, arms: 1 },
};

const money = (x) => Math.round(x * 100) / 100;

/**
 * tier 'now' means keep it in the box from day one. 'later' means buy it when it breaks,
 * because it is expensive, or rarely fails, or goes out of date on a shelf.
 */
export function sparesFor(sel, goal = 'freestyle') {
  const wear = WEAR[goal] || WEAR.freestyle;
  const mc = sel.frame?.mc || 4;
  const tiny = (sel.frame?.wheel || 200) < 100;
  const aioEsc = isIncluded(sel, 'esc');
  const out = [];
  const add = (item) => out.push({ query: null, steps: [], ...item });

  if (sel.prop) {
    const count = wear.sets * mc;
    add({
      id: 'props', tier: 'now', title: `${wear.sets === 1 ? '1 extra set' : `${wear.sets} extra sets`} of props`, qty: count, usd: money(sel.prop.p * count), part: partName(sel.prop), query: partName(sel.prop),
      why: 'Props are what breaks first, and flying on a chipped one causes vibration. Half of them spin each way, so check you are buying matched pairs.',
      steps: ['props'],
    });
  }
  if (sel.motor) {
    add({
      id: 'motors', tier: 'now', title: wear.motors === 1 ? '1 spare motor' : `${wear.motors} spare motors`, qty: wear.motors, usd: money(sel.motor.p * wear.motors), part: partName(sel.motor), query: partName(sel.motor),
      why: tiny ? 'Tiny motors wear out with flying, and one that stutters or runs hot can take the board with it.' : 'A hard crash bends shafts and damages bells. A motor that feels rough when you turn it by hand needs replacing.',
      steps: ['motors-4in1', 'motors-aio', 'motor-mount', 'motor-test'],
    });
  }
  if (sel.frame) {
    if (tiny || sel.frame.cat === 'whoop') {
      add({ id: 'frame', tier: 'now', title: '1 spare frame', qty: 1, usd: money(sel.frame.p), part: partName(sel.frame), query: partName(sel.frame), why: 'Whoop ducts crack after many crashes, and they are cheap to replace.', steps: ['frame', 'motor-mount'] });
    } else if (wear.arms) {
      const large = sel.frame.wheel >= 400;
      const usd = large ? sel.frame.p * 0.15 : Math.max(5, sel.frame.p * 0.1);
      add({
        id: 'arms', tier: large ? 'later' : 'now', title: wear.arms === 1 ? '1 spare arm' : `${wear.arms} spare arms`, qty: wear.arms, usd: money(usd * wear.arms), part: partName(sel.frame), query: `${partName(sel.frame)} arm`,
        why: large ? 'Arms on larger frames rarely break unless the aircraft falls, but they can be slow to arrive.' : 'Carbon arms crack where they meet the body. Check for fine cracks after any hard hit, because a split arm can fail in flight.',
        steps: ['frame', 'motor-mount', 'motor-test'],
      });
    }
  }
  const hasVideo = sel.video && sel.video.sys !== 'None' && !isIncluded(sel, 'video');
  if (hasVideo) {
    add({ id: 'vtx-antenna', tier: 'now', title: '1 spare video antenna', qty: 1, usd: 10, query: 'FPV video antenna', why: 'Props cut antennas, and powering a video transmitter without an antenna can destroy it.', steps: ['antennas'] });
  }
  if (sel.rx && !isIncluded(sel, 'rx')) {
    add({ id: 'rx-antenna', tier: 'now', title: '1 spare receiver antenna', qty: 1, usd: 4, query: `${sel.rx.proto} receiver antenna`, why: 'A damaged receiver antenna shortens your range without warning, so swap it as soon as you see a cut.', steps: ['antennas'] });
  }
  add({ id: 'hardware', tier: 'now', title: 'Screws, standoffs and rubber grommets', qty: 1, usd: 10, query: tiny ? 'M1.4 screw assortment drone' : 'M3 M2 screw standoff kit drone', why: 'Small hardware shakes loose and gets lost at the field.', steps: ['frame', 'stack'] });
  if (sel.battery) {
    add({ id: 'straps', tier: 'now', title: '2 battery straps and a grip pad', qty: 2, usd: 6, query: 'LiPo battery strap', why: 'Straps wear through, and a battery coming loose ends the flight.', steps: ['battery-mount'] });
    if (!tiny) {
      add({ id: 'pigtail', tier: 'now', title: `Spare ${sel.battery.cn} lead${aioEsc ? '' : ' and capacitor'}`, qty: 1, usd: aioEsc ? 4 : 7, query: `${sel.battery.cn} pigtail`, why: 'Battery leads get torn off in crashes. The capacitor sticks out and is often the part that gets hit.', steps: ['battery-lead', 'smoke-test'] });
    }
    add({ id: 'battery', tier: 'later', title: 'Another battery', qty: 1, usd: money(sel.battery.p), part: partName(sel.battery), query: partName(sel.battery), why: 'Replace any pack that is puffed, punctured or dented. Do not fly it again, and recycle it safely.', steps: ['lipo', 'battery-mount'] });
  }
  if (hasVideo) {
    add({ id: 'camera', tier: 'later', title: sel.video.sys === 'Analog' ? 'A replacement camera' : 'A replacement camera or lens', qty: 1, usd: money(sel.video.p * 0.3), part: partName(sel.video), query: `${sel.video.b} FPV camera`, why: 'The camera faces the crash. Many can be repaired with only a new lens, so check that first.', steps: ['camera-mount', 'smoke-test'] });
  }
  if (sel.esc && !aioEsc) {
    const single = sel.esc.t === 'single';
    add({ id: 'esc', tier: 'later', title: single ? 'A replacement ESC' : 'A replacement 4-in-1 ESC', qty: 1, usd: money(sel.esc.p), part: partName(sel.esc), query: partName(sel.esc), why: 'Usually burned by a short circuit or a stuck motor. Find the cause before you fit a new one, or it will burn too.', steps: ['battery-lead', 'motors-4in1', 'smoke-test', 'motor-test'] });
  }
  if (sel.fc) {
    add({ id: 'fc', tier: 'later', title: aioEsc ? 'A replacement all-in-one board' : 'A replacement flight controller', qty: 1, usd: money(sel.fc.p), part: partName(sel.fc), query: partName(sel.fc), why: 'Often survives crashes, but a pad can tear or the gyro can fail. Back up your settings first so that a swap takes minutes.', steps: ['stack', 'pix-mount', 'smoke-test', 'motor-test'] });
  }
  if (sel.gps) {
    add({ id: 'gps', tier: 'later', title: 'A replacement GPS', qty: 1, usd: money(sel.gps.p), part: partName(sel.gps), query: partName(sel.gps), why: 'It sits on top and takes the hit when the aircraft lands upside down. Recalibrate the compass after you replace it.', steps: ['gps-wire'] });
  }
  return out;
}

/** The cost of everything worth having on day one. */
export const sparesTotal = (items) => money(items.filter((i) => i.tier === 'now').reduce((a, i) => a + i.usd, 0));

export const AFTER_CRASH = [
  'Unplug the battery before you touch anything.',
  'Look over the battery. If it is puffed, dented or warm, move it somewhere fire-safe and stop flying it.',
  'Turn each motor by hand. It should spin freely without scraping or wobbling.',
  'Check each prop, then each arm, for chips and fine cracks.',
  'Check that the antennas are attached and uncut, and that nothing is loose inside.',
];

export const AFTER_REPAIR = 'After any soldering, take the props off, power up through a smoke stopper, and check motor order and direction again.';
