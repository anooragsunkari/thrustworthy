import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDS } from '../src/data/builds.js';
import { SLOTS, FCS, FRAMES, partById } from '../src/data/parts.js';
import { REGIONS, money, regionById, storeLinks, videoSearch, weightNote } from '../src/data/regions.js';
import { FW, FW_CHOICES } from '../src/data/firmware.js';
import { layout, partDetails, view3dHelp } from '../src/lib/model.js';
import { Spring, SOFT, SNAPPY, BOUNCY, springCurve } from '../src/lib/spring.js';
import { cleanCustom, cleanPayload, cleanSharedParts, fieldsFor, formValues, CUSTOM_FIELDS, CUSTOM_ID } from '../src/lib/custom.js';
import { brokenBuilds, buildAround, buildsUsing, cleanOwned, EVERY_BUILD_GEAR, gearOwned, MAX_OWNED, ownedList, shopping } from '../src/lib/owned.js';
import { BADGES, stages } from '../src/lib/progress.js';
import { BADGE_ICON, GOAL_ICON, PATHS, SLOT_ICON, STAGE_ICON, SYMPTOM_ICON } from '../src/lib/icons.js';
import { SYMPTOMS } from '../src/data/troubleshoot.js';
import { GOALS } from '../src/data/parts.js';
import { GEAR, PERSONAS } from '../src/data/personas.js';
import { buildFacts, legalChecklist } from '../src/data/legal.js';
import { registerCustom } from '../src/data/parts.js';
import { encodeBuild, decodeBuild } from '../src/lib/util.js';
import { resolve, check, flight, cost, missing, autofill, summarize, toIds } from '../src/lib/engine.js';
import { assignPorts, motorMap, wiringPlan } from '../src/lib/wiring.js';
import { starterSettings } from '../src/lib/settings.js';
import { sparesFor, sparesTotal } from '../src/data/spares.js';
import { compareBuilds } from '../src/lib/compare.js';
import { STEPS } from '../src/data/assembly.js';

const load = (b) => resolve(b.sel);
const ids = (s, ctx) => check(s, ctx).map((i) => i.id);
const five = () => resolve(BUILDS.find((b) => b.id === 'budget-five').sel);

for (const b of BUILDS) {
  test(`${b.id}: complete, no errors, sensible numbers`, () => {
    const s = load(b);
    assert.deepEqual(missing(s), [], 'has every required part');
    for (const [k, id] of Object.entries(b.sel)) assert.ok(partById(id), `${k}: ${id} exists`);
    const issues = check(s, { firmware: b.firmware, goal: b.goal });
    const errs = issues.filter((i) => i.level === 'error');
    assert.deepEqual(errs.map((e) => `${e.id}: ${e.detail}`), []);
    const f = flight(s, { goal: b.goal });
    assert.ok(f.twr >= 1.6 && f.twr < 25, `t/w ${f.twr}`);
    assert.ok(f.hover > 2 && f.hover < 60, `hover ${f.hover}`);
    assert.ok(cost(s).total > 0);
  });
}

test('flight model stays near known real-world aircraft', () => {
  const x = flight(load(BUILDS.find((b) => b.id === 'research-x500')), { goal: 'lab' });
  assert.ok(x.hover > 11 && x.hover < 25, `X500 hover ${x.hover}`);
  const w = flight(load(BUILDS.find((b) => b.id === 'first-whoop')), { goal: 'whoop' });
  assert.ok(w.hover > 3 && w.hover < 8, `whoop hover ${w.hover}`);
  const f = flight(five(), { goal: 'freestyle' });
  assert.ok(f.hover > 6 && f.hover < 14, `5in hover ${f.hover}`);
  assert.ok(f.auw > 500 && f.auw < 800, `5in auw ${f.auw}`);
});

test('thin air reduces hover time', () => {
  assert.ok(flight(five(), { altitude: 3000 }).hover < flight(five(), { altitude: 0 }).hover);
});

test('catches a pack that is too high voltage', () => {
  const s = { ...five(), motor: partById('m-eco2207-4s') };
  assert.ok(ids(s).includes('v-hi-motor'));
  assert.ok(ids(s).includes('tip') || ids(s).includes('tip-near'));
});

test('catches a 6S pack on a 1S board', () => {
  const s = { ...load(BUILDS[0]), battery: partById('b-6s1300') };
  assert.ok(ids(s).includes('v-hi-fc'));
});

test('catches props that do not fit', () => {
  assert.ok(ids({ ...five(), prop: partById('p-hq7') }).includes('fit-prop'));
});

test('catches motors that do not bolt on', () => {
  assert.ok(ids({ ...five(), motor: partById('m-ex0802') }).includes('fit-motor'));
});

test('catches firmware the board cannot run', () => {
  const s = five();
  assert.ok(ids(s, { firmware: 'PX4' }).includes('fw'));
  assert.ok(!ids(s, { firmware: 'Betaflight' }).includes('fw'));
});

test('catches an undersized ESC', () => {
  const s = { ...five(), esc: partById('e-hb20') };
  assert.ok(ids(s).includes('esc-amps'));
});

test('flags a Pixhawk on a small frame', () => {
  assert.ok(ids({ ...five(), fc: partById('fc-6c') }).includes('fit-fc'));
});

test('flags Betaflight used for companion autonomy', () => {
  const s = { ...five(), companion: partById('c-pi02') };
  assert.ok(ids(s, { firmware: 'Betaflight' }).includes('bf-companion'));
});

test('flags too few UARTs', () => {
  const s = { ...load(BUILDS[0]), fc: { ...partById('fc-matrix'), u: 0, includes: ['esc'] }, rx: partById('r-rp1') };
  assert.ok(ids(s).includes('uart'));
});

test('region rules apply to radio and video', () => {
  const s = { ...five(), rx: partById('r-bf900') };
  const region = { name: 'Testland', sub900: 'no', sub900Note: 'x' };
  assert.ok(ids(s, { region }).includes('r-900'));
});

test('included slots do not count as missing or cost money', () => {
  const s = load(BUILDS[0]);
  assert.ok(!missing(s).includes('esc'));
  assert.ok(!missing(s).includes('rx'));
  assert.ok(!cost(s).lines.some((l) => l.slot === 'esc'));
});

test('single ESCs are priced per motor', () => {
  const s = load(BUILDS.find((b) => b.id === 'research-x500'));
  const line = cost(s).lines.find((l) => l.slot === 'esc');
  assert.equal(line.qty, 4);
});

test('autofill completes a frame into a working drone for each class', () => {
  for (const [frame, goal, firmware] of [
    ['f-m65', 'whoop', 'Betaflight'],
    ['f-source5', 'freestyle', 'Betaflight'],
    ['f-source7', 'longrange', 'INAV'],
    ['f-protek35', 'cine', 'Betaflight'],
    ['f-x500', 'lab', 'PX4'],
    ['f-t650', 'heavy', 'ArduPilot'],
  ]) {
    const ctx = { goal, firmware };
    const s = autofill(resolve({ frame }), ctx);
    assert.deepEqual(missing(s), [], `${frame} missing`);
    const errs = check(s, ctx).filter((i) => i.level === 'error');
    assert.deepEqual(errs.map((e) => `${frame}: ${e.id} ${e.detail}`), []);
  }
});

test('old share links with removed part ids still open', () => {
  const s = resolve({ frame: 'f-source5', motor: 'part-that-no-longer-exists' });
  assert.ok(s.frame && !s.motor);
  assert.deepEqual(toIds(s), { frame: 'f-source5' });
});

test('every part carries the fields the UI needs', () => {
  for (const slot of SLOTS) for (const p of slot.list) {
    assert.ok(p.id && p.b && p.m, `${slot.key} ${p.id}`);
    assert.equal(typeof p.p, 'number');
    assert.equal(typeof p.w, 'number');
  }
  for (const f of FCS) assert.ok(Array.isArray(f.fw) && f.fw.length);
  assert.equal(new Set(SLOTS.flatMap((s) => s.list.map((p) => p.id))).size, SLOTS.flatMap((s) => s.list).length, 'ids are unique');
});

test('summarize counts levels', () => {
  const n = summarize([{ level: 'error' }, { level: 'warn' }, { level: 'warn' }, { level: 'info' }]);
  assert.deepEqual(n, { errors: 1, warnings: 2, infos: 1 });
});

test('every region is complete, and its links are real URLs', () => {
  for (const r of REGIONS) {
    assert.ok(r.summary && r.regulator && r.sections.length && r.stores.length && r.sources.length, r.id);
    for (const s of r.stores) {
      assert.match(s.home, /^https:/, `${r.id} ${s.name}`);
      assert.match(s.search('a b'), /^https:.*a(%20|-)b/, `${r.id} ${s.name}`);
    }
    for (const [, u] of r.sources) assert.match(u, /^https:/);
    assert.ok(r.weights[0].min === 0, r.id);
  }
});

test('weight notes change at the local threshold', () => {
  const uk = regionById('uk');
  assert.match(weightNote(uk, 50), /Under 100 g/);
  assert.match(weightNote(uk, 150), /From 100 g/);
  assert.match(weightNote(uk, 300), /From 250 g/);
  assert.equal(weightNote(null, 300), null);
});

test('money converts and rounds, and defaults to dollars', () => {
  assert.equal(money(100, null), '$100');
  assert.equal(money(100, regionById('in')), '₹8,500');
  assert.equal(money(103, regionById('cn')), '¥730');
});

test('shops and video sites suit the country', () => {
  assert.equal(storeLinks(regionById('cn'), 'iFlight XING2')[0].name, 'Taobao');
  assert.equal(storeLinks(null, 'iFlight XING2')[0].name, 'GetFPV');
  assert.ok(storeLinks(regionById('us'), 'Holybro Pixhawk 6C').some((s) => s.name === 'Holybro'));
  assert.equal(videoSearch(regionById('cn'), 'x').site, 'Bilibili');
  assert.equal(videoSearch(regionById('us'), 'x').site, 'YouTube');
});

test('regional radio rules reach the checker', () => {
  const s = { ...five(), rx: partById('r-bf900') };
  assert.ok(ids(s, { region: regionById('cn') }).includes('r-900c'));
  assert.ok(ids(s, { region: regionById('eu') }).includes('r-868'));
  const dji = { ...five(), video: partById('v-o4p') };
  assert.ok(ids(dji, { region: regionById('us') }).includes('r-dji'));
  assert.ok(!ids(dji, { region: regionById('eu') }).includes('r-dji'));
});

test('firmware guides are complete, and every build firmware has one', () => {
  for (const id of FW_CHOICES) {
    assert.ok(FW[id].tag && FW[id].links.length, id);
    if (!FW[id].legacy) assert.ok(FW[id].steps.length >= 5 && FW[id].tool.url, id);
    for (const s of FW[id].steps) assert.match(s.link, /^https:/);
  }
  for (const b of BUILDS) assert.ok(FW[b.firmware] && !FW[b.firmware].legacy, b.id);
});

test('autofill suits the job as well as being compatible', () => {
  const ctx = { goal: 'longrange', firmware: 'INAV' };
  const lr = autofill(resolve({ frame: 'f-source7' }), ctx);
  assert.equal(lr.prop.d, 7, 'uses the prop size the frame was designed for');
  assert.ok(flight(lr, ctx).hover > 18, `long-range hover ${flight(lr, ctx).hover}`);
  const fr = autofill(resolve({ frame: 'f-source5' }), { goal: 'freestyle', firmware: 'Betaflight' });
  assert.ok(fr.prop.d >= 5, 'a 5-inch frame gets 5-inch props');
  assert.ok(flight(fr, { goal: 'freestyle' }).twr >= 4, 'freestyle has enough thrust');
});

test('autofill never leaves an error on any frame, and picks what a builder would', () => {
  const byCat = { whoop: ['whoop', 'Betaflight'], ultralight: ['cine', 'Betaflight'], cinewhoop: ['cine', 'Betaflight'], freestyle: ['freestyle', 'Betaflight'], longrange: ['longrange', 'INAV'], lab: ['lab', 'PX4'], heavy: ['heavy', 'ArduPilot'] };
  for (const fr of FRAMES) {
    const [goal, firmware] = byCat[fr.cat];
    const ctx = { goal, firmware };
    const s = autofill(resolve({ frame: fr.id }), ctx);
    assert.deepEqual(missing(s), [], fr.m);
    assert.deepEqual(check(s, ctx).filter((i) => i.level === 'error').map((i) => `${fr.m}: ${i.detail}`), []);
    assert.ok(s.battery.w <= s.motor.w * fr.mc * 3, `${fr.m} battery ${s.battery.m}`);
    if (fr.wheel < 400 && s.esc) assert.equal(s.esc.t, '4in1', fr.m);
    if (fr.cat === 'cinewhoop') assert.match(s.prop.m, /ducted/);
    else assert.doesNotMatch(s.prop.m, /ducted/);
  }
});

test('real ratings that were wrong in the first version stay caught', () => {
  const on = (over, sel) => ids({ ...resolve(sel), ...over }, {});
  const s4 = { frame: 'f-source5', battery: 'b-4s1550' };
  assert.ok(on({ video: partById('v-o4') }, s4).includes('v-hi-video'), 'O4 Air Unit is 1-3S');
  assert.ok(on({ video: partById('v-hdz') }, s4).includes('v-hi-video'), 'HDZero Race V3 needs a BEC above 2S');
  assert.ok(!on({ video: partById('v-o4p') }, s4).includes('v-hi-video'), 'O4 Pro takes 4S');
  assert.ok(on({ fc: partById('fc-f4-2s') }, { frame: 'f-m65', battery: 'b-1s300' }).includes('v-lo-fc'), 'CrazyF411 ELRS is 2-4S');
  assert.ok(on({ esc: partById('e-hb20') }, { frame: 'f-x500', battery: 'b-6s42' }).includes('v-hi-esc'), 'Holybro 20A is 2-4S');
  assert.ok(on({ motor: partById('m-xing2806') }, { frame: 'f-source7' }).every((x) => x !== 'fit-motor'), 'XING 2806.5 uses 19 mm');
  assert.ok(on({ motor: partById('m-xing2806') }, { frame: 'f-apex' }).includes('fit-motor'), 'and that does not fit a 16 mm arm');
});

test('autofill avoids parts we know are hard to find', () => {
  for (const frame of ['f-m65', 'f-source5', 'f-source7', 'f-x500', 'f-t650']) {
    const s = autofill(resolve({ frame }), { goal: 'freestyle', firmware: 'Betaflight' });
    for (const [k, p] of Object.entries(s)) if (k !== 'frame') assert.notEqual(p.stock, 'low', `${frame} ${k} ${p.m}`);
  }
});

test('every build lays out in 3D with one model per visible part', () => {
  for (const b of BUILDS) {
    const s = load(b);
    const plan = layout(s);
    const slots = plan.parts.map((p) => p.slot);
    for (const key of Object.keys(s)) {
      if (s[key].sys === 'None') continue;
      if (s.fc?.includes?.includes(key)) continue;
      assert.ok(slots.includes(key), `${b.id} draws ${key}`);
    }
    for (const p of plan.parts) {
      assert.equal(p.explode.length, 3, `${b.id} ${p.slot}`);
      for (const n of p.explode) assert.ok(Number.isFinite(n), `${b.id} ${p.slot} explode`);
      if (p.pos) for (const n of p.pos) assert.ok(Number.isFinite(n), `${b.id} ${p.slot} pos`);
      if (p.size) for (const n of Object.values(p.size)) assert.ok(Number.isFinite(n) && n > 0, `${b.id} ${p.slot} size`);
    }
  }
});

test('the 3D model is to scale, with arms and props from real specs', () => {
  const s = five();
  const plan = layout(s);
  const motors = plan.parts.find((p) => p.slot === 'motor');
  assert.equal(motors.mounts.length, s.frame.mc);
  const m = motors.mounts[0];
  assert.ok(Math.abs(Math.hypot(m.x, m.z) * 2 - s.frame.wheel) < 0.01, 'motor to motor equals wheelbase');
  assert.ok(Math.abs(plan.parts.find((p) => p.slot === 'prop').r - (s.prop.d * 25.4) / 2) < 0.01, 'prop radius');
  const hex = layout(resolve({ frame: 'f-t680' }));
  assert.equal(hex.parts[0].mounts.length, 6, 'hex has six arms');
});

test('a build with no frame has no model yet', () => {
  assert.equal(layout(resolve({ motor: 'm-eco2207' })), null);
});

test('the props on a real build do not hit each other', () => {
  for (const b of BUILDS) {
    const s = load(b);
    const { mounts } = layout(s).parts[0];
    const gap = Math.hypot(mounts[0].x - mounts[1].x, mounts[0].z - mounts[1].z);
    assert.ok(gap > s.prop.d * 25.4, `${b.id}: ${gap} mm between motors, ${s.prop.d * 25.4} mm props`);
  }
});

test('tapping any part gives details, with price and checks', () => {
  const s = five();
  for (const key of Object.keys(s)) {
    const d = partDetails(key, s, { firmware: 'Betaflight', goal: 'freestyle' });
    assert.ok(d.name && d.role && d.rows.length, key);
    assert.ok(d.rows.some((r) => r.label === 'Weight'), `${key} weight`);
    for (const r of d.rows) assert.ok(!/undefined|NaN/.test(r.value), `${key} ${r.label}: ${r.value}`);
  }
  assert.equal(partDetails('motor', s, {}).qty, 4);
  assert.equal(partDetails('gps', s, {}), null);
  const aio = load(BUILDS[0]);
  assert.deepEqual(partDetails('fc', aio, {}).includes, ['esc', 'rx']);
});

const run = (s, seconds, dt = 1 / 60) => { let peak = s.x; for (let i = 0; i < seconds / dt; i += 1) { s.step(dt); peak = Math.max(peak, s.x); } return peak; };

test('springs settle on their target at any frame rate', () => {
  for (const preset of [SOFT, SNAPPY, BOUNCY]) {
    for (const dt of [1 / 120, 1 / 60, 1 / 30, 1 / 10]) {
      const s = new Spring(0, preset).to(1);
      run(s, 4, dt);
      assert.ok(Math.abs(s.x - 1) < 0.01, `x=${s.x} at dt=${dt}`);
      assert.ok(s.settled, `settled at dt=${dt}`);
    }
  }
});

test('a bouncy spring overshoots, and a soft one barely does', () => {
  assert.ok(run(new Spring(0, BOUNCY).to(1), 2) > 1.05);
  assert.ok(run(new Spring(0, SOFT).to(1), 3) < 1.05);
});

test('a moving spring keeps its velocity when the target changes', () => {
  const s = new Spring(0, SNAPPY).to(1);
  run(s, 0.1);
  const v = s.v;
  s.to(-1);
  assert.equal(s.v, v);
  s.step(1 / 240);
  assert.ok(s.v > 0, 'still heading the old way for a moment');
});

test('a long stall does not blow up a spring', () => {
  const s = new Spring(0, BOUNCY).to(1);
  s.step(30);
  assert.ok(Number.isFinite(s.x) && Math.abs(s.x) < 3, `x=${s.x}`);
});

test('a delayed spring waits before it moves', () => {
  const s = new Spring(0, SNAPPY).to(1, 0.5);
  run(s, 0.4);
  assert.equal(s.x, 0);
  run(s, 1);
  assert.ok(s.x > 0.9);
});

test('spring curves become valid CSS easing, starting at 0 and ending at 1', () => {
  for (const preset of [SOFT, SNAPPY, BOUNCY]) {
    const c = springCurve(preset);
    assert.match(c.easing, /^linear\(0, /);
    assert.match(c.easing, /, 1\)$/);
    assert.ok(c.seconds > 0.2 && c.seconds < 3, `${c.seconds}`);
  }
  assert.ok(springCurve(BOUNCY).peak > 1.05);
});

const GOOD = {
  frame: { b: 'My', m: 'Frame', w: 100, wheel: 220, mc: '4', maxProp: 5, mount: ['16'], stack: ['30.5'], ducted: false },
  motor: { b: 'My', m: 'Motor', w: 30, sz: '2207', kv: 1900, cMin: 4, cMax: 6, mount: '16', refT: 1500, refD: 5, refC: 6, refA: 35 },
  esc: { b: 'My', m: 'ESC', w: 10, t: '4in1', a: 50, cMin: 3, cMax: 6, fw: 'AM32', dshot: true, mount: '30.5' },
  fc: { b: 'My', m: 'FC', w: 8, mcu: 'STM32H743', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight'], mount: '30.5' },
  prop: { b: 'My', m: 'Prop', w: 4, d: 5, pi: 4, bl: 3 },
  battery: { b: 'My', m: 'Pack', w: 200, c: 6, ch: 'LiPo', cap: 1300, dr: 100, cn: 'XT60' },
  video: { b: 'My', m: 'Cam', w: 15, sys: 'Analog', cMin: 2, cMax: 6 },
  rx: { b: 'My', m: 'RX', w: 2, proto: 'ELRS', band: '2.4' },
  gps: { b: 'My', m: 'GPS', w: 10, chip: 'M10' },
  companion: { b: 'My', m: 'Pi', w: 40, pw: 5, ros: 'ROS 2' },
};

test('payload adds weight, costs flight time and thrust margin, and adds no price', () => {
  const ids = BUILDS.find((b) => b.id === 'budget-five').sel;
  const plain = resolve(ids);
  const heavy = resolve(ids, [{ name: 'Action camera', g: 155 }]);
  const a = flight(plain, { goal: 'freestyle' });
  const b = flight(heavy, { goal: 'freestyle' });
  assert.ok(Math.abs(b.auw - a.auw - 155 * 1.04) < 1, `${a.auw} -> ${b.auw}`);
  assert.ok(b.hover < a.hover && b.twr < a.twr);
  assert.equal(cost(heavy).total, cost(plain).total);
  assert.deepEqual(toIds(heavy), toIds(plain), 'payload never ends up in the part list');
  assert.ok(check(heavy, { goal: 'freestyle' }));
});

test('too much payload is caught by the same checks', () => {
  const s = resolve(BUILDS.find((b) => b.id === 'first-whoop').sel, [{ name: 'Action camera', g: 155 }]);
  assert.ok(ids(s, { goal: 'whoop' }).includes('twr'));
});

test('payload is drawn in 3D and can be tapped', () => {
  const s = resolve(BUILDS.find((b) => b.id === 'research-x500').sel, [{ name: 'Depth camera', g: 75 }]);
  assert.ok(layout(s).parts.some((p) => p.slot === 'payload'));
  const d = partDetails('payload', s, {});
  assert.equal(d.name, 'Depth camera');
  assert.ok(d.rows.some((r) => r.label === 'Weight' && r.value === '75 g'));
});

test('bad payload values are dropped', () => {
  assert.deepEqual(cleanPayload([{ name: 'x', g: -5 }, { name: 'y', g: 'abc' }, null, { name: 'z', g: 1e9 }]), []);
  assert.deepEqual(cleanPayload('nope'), []);
  assert.equal(cleanPayload([{ name: 'a'.repeat(500), g: 5 }])[0].name.length, 60);
});

test('every kind of custom part validates, and works in the checker and the 3D model', () => {
  for (const slot of Object.keys(CUSTOM_FIELDS)) {
    const { part, errors } = cleanCustom(slot, GOOD[slot]);
    assert.deepEqual(errors, [], slot);
    assert.equal(part.custom, true);
  }
  const reg = {};
  const sel = {};
  for (const slot of Object.keys(GOOD)) {
    const id = `x-test-${slot}`;
    reg[id] = { ...cleanCustom(slot, GOOD[slot]).part, id };
    sel[slot] = id;
  }
  registerCustom(reg);
  const s = resolve(sel);
  assert.equal(Object.keys(s).length, Object.keys(GOOD).length);
  assert.deepEqual(missing(s), []);
  const ctx = { firmware: 'Betaflight', goal: 'freestyle' };
  assert.deepEqual(check(s, ctx).filter((i) => i.level === 'error').map((i) => i.detail), []);
  assert.ok(ids(s, ctx).includes('custom-motor'), 'says the numbers are yours');
  const f = flight(s, ctx);
  assert.ok(f.twr > 2 && f.hover > 3, `${f.twr} ${f.hover}`);
  assert.ok(cost(s).total >= 0);
  for (const p of layout(s).parts) for (const n of [...(p.pos || []), ...p.explode]) assert.ok(Number.isFinite(n), p.slot);
  for (const slot of Object.keys(GOOD)) {
    for (const r of partDetails(slot, s, ctx).rows) assert.ok(!/undefined|NaN/.test(r.value), `${slot} ${r.label} ${r.value}`);
  }
});

test('the checker catches a bad custom part like any other', () => {
  const { part } = cleanCustom('motor', { ...GOOD.motor, mount: '25' });
  registerCustom({ 'x-big-motor': { ...part, id: 'x-big-motor' } });
  assert.ok(ids({ ...five(), motor: part }).includes('fit-motor'));
});

test('custom part forms reject nonsense with field-level errors', () => {
  const err = (slot, raw) => cleanCustom(slot, raw).errors.map((e) => e.key);
  assert.ok(err('motor', { ...GOOD.motor, b: '  ' }).includes('b'));
  assert.ok(err('motor', { ...GOOD.motor, kv: 'fast' }).includes('kv'));
  assert.ok(err('motor', { ...GOOD.motor, sz: 'big' }).includes('sz'));
  assert.ok(err('battery', { ...GOOD.battery, c: 99 }).includes('c'));
  assert.ok(err('esc', { ...GOOD.esc, cMin: 6, cMax: 3 }).includes('cMax'));
  assert.ok(err('frame', { ...GOOD.frame, mount: [] }).includes('mount'));
  assert.ok(err('fc', { ...GOOD.fc, fw: ['NotReal'] }).includes('fw'));
  assert.equal(cleanCustom('notaslot', {}).part, null);
  for (const slot of Object.keys(CUSTOM_FIELDS)) assert.ok(fieldsFor(slot).some((f) => f.key === 'w'), slot);
});

test('share links carry payload and custom parts, and survive tampering', () => {
  const { part } = cleanCustom('frame', GOOD.frame);
  const id = 'x-frame-share';
  registerCustom({ [id]: { ...part, id } });
  const token = encodeBuild({ name: 'Mine', goal: 'lab', firmware: 'PX4', sel: { frame: id }, payload: [{ name: 'Depth camera', g: 75 }] });
  const back = decodeBuild(token);
  assert.equal(back.custom[id].wheel, 220);
  assert.deepEqual(back.payload, [{ name: 'Depth camera', g: 75 }]);
  assert.ok(resolve(back.sel, back.payload).frame.custom);
  // A hand-edited link cannot smuggle in bad values.
  const dirty = cleanSharedParts({
    '../evil': { slot: 'frame', ...GOOD.frame },
    'x-bad': { slot: 'frame', ...GOOD.frame, wheel: 1e12 },
    'x-nope': { slot: 'wings' },
    'x-ok': { slot: 'gps', ...GOOD.gps, b: '<img src=x onerror=alert(1)>'.repeat(9) },
    'x-text': 'hello',
  });
  assert.deepEqual(Object.keys(dirty), ['x-ok']);
  assert.ok(dirty['x-ok'].b.length <= 60);
  assert.equal(decodeBuild('%%%notbase64'), null);
});

const facts = (over) => ({ g: 500, fpv: true, video: true, camera: true, sub: false, work: false, ...over });
const legalIds = (r, over) => legalChecklist(r, facts(over)).map((i) => i.id);

test('every country has a legal checklist with complete items', () => {
  for (const r of REGIONS) {
    for (const over of [{}, { g: 50, fpv: false, video: false, camera: false }, { g: 5000, sub: true, work: true }]) {
      const items = legalChecklist(r.id, facts(over));
      assert.ok(items.length >= 1, `${r.id} has at least one rule`);
      assert.equal(new Set(items.map((i) => i.id)).size, items.length, `${r.id} ids unique`);
      for (const i of items) assert.ok(i.title && i.detail && ['must', 'check'].includes(i.kind), `${r.id} ${i.id}`);
    }
  }
  assert.deepEqual(legalChecklist('atlantis', facts()), []);
});

test('legal weight thresholds follow each country', () => {
  assert.ok(!legalIds('us', { g: 249 }).includes('register'));
  assert.ok(legalIds('us', { g: 250 }).includes('register'));
  assert.ok(legalIds('us', { g: 250 }).includes('rid'));
  assert.ok(!legalIds('uk', { g: 99 }).includes('flyer'));
  assert.ok(legalIds('uk', { g: 100 }).includes('flyer'));
  assert.ok(legalIds('uk', { g: 150, camera: true }).includes('operator'));
  assert.ok(!legalIds('uk', { g: 150, camera: false }).includes('operator'));
  assert.ok(legalIds('uk', { g: 250, camera: false }).includes('operator'));
  assert.ok(legalIds('ca', { g: 250 }).includes('basic'));
  assert.ok(!legalIds('ca', { g: 249 }).includes('basic'));
  assert.ok(legalIds('jp', { g: 100, fpv: false, video: false }).includes('register'));
  assert.ok(!legalIds('jp', { g: 99, fpv: false, video: false }).includes('register'));
  assert.ok(legalIds('br', { g: 251 }).includes('sisant'));
  assert.ok(!legalIds('br', { g: 250 }).includes('sisant'));
  const eu = (g) => legalChecklist('eu', facts({ g })).find((i) => i.id === 'cat').title;
  assert.match(eu(249), /A1/);
  assert.match(eu(250), /A3/);
});

test('legal items follow the build and how it is used', () => {
  assert.ok(legalIds('uk', { fpv: true }).includes('observer'));
  assert.ok(!legalIds('uk', { fpv: false }).includes('observer'));
  assert.ok(legalIds('us', { work: true }).includes('107'));
  assert.ok(!legalIds('us', { work: false }).includes('107'));
  assert.ok(legalIds('eu', { sub: true }).includes('band'));
  assert.ok(legalIds('cn', {}).includes('beijing'));
});

test('payload can push a build over a legal limit', () => {
  const b = BUILDS.find((x) => x.id === 'sub250');
  const light = resolve(b.sel);
  const loaded = resolve(b.sel, [{ name: 'Action camera', g: 155 }]);
  const us = (s) => legalChecklist('us', buildFacts(s, flight(s, { goal: b.goal }))).map((i) => i.id);
  assert.ok(!us(light).includes('register'));
  assert.ok(us(loaded).includes('register'));
  const cam = resolve({ frame: 'f-m65', motor: 'm-ex0802' }, [{ name: 'Depth camera', g: 50 }]);
  assert.ok(buildFacts(cam, null).camera, 'a camera payload counts as a camera');
});

test('a spring keeps real time on a slow device', () => {
  const fast = new Spring(0, SNAPPY).to(1);
  const slow = new Spring(0, SNAPPY).to(1);
  for (let i = 0; i < 60; i += 1) fast.step(1 / 60);
  for (let i = 0; i < 8; i += 1) slow.step(1 / 8);
  assert.ok(Math.abs(fast.x - slow.x) < 0.02, `60 fps ${fast.x}, 8 fps ${slow.x}`);
});

// Wiring, starter settings, spares and compare
const build = (id) => BUILDS.find((b) => b.id === id);
const project = (b, extra = {}) => ({ name: b.title, firmware: b.firmware, goal: b.goal, sel: b.sel, ...extra });

test('motor order follows each firmware', () => {
  const spot = (fw) => Object.fromEntries(motorMap(fw, 4).map((m) => [m.n, `${m.where} ${m.dir}`]));
  const betaflight = { 1: 'Rear right CW', 2: 'Front right CCW', 3: 'Rear left CCW', 4: 'Front left CW' };
  const ardupilot = { 1: 'Front right CCW', 2: 'Rear left CCW', 3: 'Front left CW', 4: 'Rear right CW' };
  assert.deepEqual(spot('Betaflight'), betaflight);
  assert.deepEqual(spot('INAV'), betaflight);
  assert.deepEqual(spot('ArduPilot'), ardupilot);
  assert.deepEqual(spot('PX4'), ardupilot);
  assert.equal(motorMap('Betaflight', 6), null, 'an unchecked combination says so rather than guessing');
});

test('every motor table is balanced, or the aircraft would spin', () => {
  for (const fw of ['Betaflight', 'INAV', 'ArduPilot', 'PX4']) {
    for (const mc of [4, 6, 8]) {
      const map = motorMap(fw, mc);
      if (!map) continue;
      assert.equal(map.length, mc);
      assert.equal(map.filter((m) => m.dir === 'CW').length, mc / 2, `${fw} ${mc}`);
      assert.equal(new Set(map.map((m) => m.deg)).size, mc, `${fw} ${mc} positions`);
      const moment = (axis) => map.reduce((a, m) => a + axis((m.deg * Math.PI) / 180), 0);
      assert.ok(Math.abs(moment(Math.sin)) < 1e-9 && Math.abs(moment(Math.cos)) < 1e-9, `${fw} ${mc} centered`);
    }
  }
});

test('ports never collide and always cross TX to RX', () => {
  for (const b of BUILDS) {
    const plan = wiringPlan(load(b), b.firmware);
    assert.deepEqual(plan.conflicts, [], b.id);
    assert.deepEqual(plan.unassigned, [], b.id);
    for (const d of plan.devices) {
      for (const w of d.wires) {
        if (w.from === 'TX') assert.match(w.to, /RX/, `${b.id} ${d.key}`);
        if (w.from === 'RX') assert.match(w.to, /TX/, `${b.id} ${d.key}`);
      }
    }
  }
});

test('a saved port is kept, and a stale one is replaced', () => {
  const s = five();
  assert.equal(assignPorts(s, { rx: 'UART4' }).rx, 'UART4');
  assert.equal(assignPorts(s, { rx: 'UART99' }).rx, 'UART1');
  const plan = wiringPlan(s, 'Betaflight', { rx: 'UART2', video: 'UART2' });
  assert.deepEqual(plan.conflicts, ['UART2']);
});

test('capacitor rating clears the full pack voltage', () => {
  const plan = wiringPlan(five(), 'Betaflight');
  assert.ok(plan.power.capacitor.volts >= 25.2 * 1.25, `${plan.power.capacitor.volts} V on 6S`);
  assert.equal(wiringPlan(load(build('first-whoop')), 'Betaflight').power.capacitor, null);
});

test('large aircraft get thicker wire than an FPV quad at the same current', () => {
  const big = wiringPlan(load(build('mapper')), 'ArduPilot').power;
  assert.ok(big.peak >= 30, `peak ${big.peak}`);
  assert.ok(big.awg <= 12, `${big.awg} AWG at ${big.peak} A, held for minutes`);
  const fpv = wiringPlan(five(), 'Betaflight').power;
  assert.ok(fpv.awg >= 10 && fpv.awg <= 14, `${fpv.awg} AWG at ${fpv.peak} A, in bursts`);
});

test('every reference build gets a settings file with no surprises', () => {
  for (const b of BUILDS) {
    const out = starterSettings(project(b), load(b));
    assert.ok(out.ok, `${b.id}: ${out.reason}`);
    assert.doesNotMatch(out.text, /undefined|NaN|null/, b.id);
    assert.doesNotMatch(out.text, /\b(p_|rate|PID|MC_.*_P)\b/i, `${b.id} contains no tuning`);
    assert.ok(out.manual.length > 0, `${b.id} says what is left to do`);
  }
});

test('Betaflight file uses the checked values', () => {
  const b = build('budget-five');
  const { text } = starterSettings(project(b), load(b));
  assert.match(text, /^serial 0 64 115200 57600 0 115200$/m, 'receiver on UART1');
  assert.match(text, /set serialrx_provider = CRSF/);
  assert.match(text, /^serial 1 2048 /m, 'SmartAudio on UART2');
  assert.match(text, /set motor_pwm_protocol = DSHOT300/);
  assert.match(text, /set dshot_bidir = ON/, 'AM32 reports RPM');
  assert.match(text, /set vbat_min_cell_voltage = 330/);
  assert.match(text, /batch end\nsave\n$/);
});

test('digital video uses MSP and the HD OSD on Betaflight, and its own mask on INAV', () => {
  const b = build('digital-five');
  const { text } = starterSettings(project(b), load(b));
  assert.match(text, /^serial 1 131073 /m);
  assert.match(text, /osd_displayport_device = MSP/);
  const sel = resolve({ ...b.sel, fc: 'fc-matek', video: 'v-hdzfs' });
  const inav = starterSettings(project(b, { firmware: 'INAV' }), sel).text;
  assert.match(inav, /^serial 1 33554432 /m);
  assert.match(inav, /receiver_type = SERIAL/);
  assert.match(inav, /osd_video_system = HDZERO/);
  assert.doesNotMatch(inav, /RX_SERIAL|dshot_bidir/, 'INAV does not have these');
});

test('stock BLHeli_S never gets bidirectional DShot', () => {
  const sel = resolve({ ...build('budget-five').sel, esc: 'e-bls55', fc: 'fc-sb405v5' });
  const out = starterSettings(project(build('budget-five')), sel);
  assert.doesNotMatch(out.text, /dshot_bidir/);
  assert.ok(out.manual.some((m) => /Bluejay/.test(m)));
});

test('built-in ESC keeps the motor protocol the board sets', () => {
  const b = build('first-whoop');
  assert.doesNotMatch(starterSettings(project(b), load(b)).text, /motor_pwm_protocol/);
});

test('LiHV does not make Betaflight count the wrong number of cells', () => {
  const b = build('first-whoop');
  assert.match(starterSettings(project(b), load(b)).text, /vbat_max_cell_voltage = 440/);
});

test('ArduPilot file scales battery limits by cell count, and maps Pixhawk ports', () => {
  const b = build('research-x500');
  const fw = { firmware: 'ArduPilot' };
  const s = load(b);
  const { text } = starterSettings(project(b, fw), s);
  const cells = s.battery.c;
  assert.match(text, /^FRAME_CLASS,1$/m);
  assert.ok(text.includes(`MOT_BAT_VOLT_MAX,${+(4.2 * cells).toFixed(2)}`));
  assert.ok(text.includes(`BATT_CRT_VOLT,${+(3.5 * cells).toFixed(2)}`));
  assert.match(text, /^SERIAL3_PROTOCOL,5$/m, 'GPS1 is SERIAL3');
  assert.doesNotMatch(text, /MOT_PWM_TYPE,[56]/, 'DShot depends on which Pixhawk output is used');
});

test('ArduPilot on an FPV board does not guess SERIAL numbers', () => {
  const sel = resolve({ ...build('budget-five').sel, fc: 'fc-sb405v5' });
  const out = starterSettings(project(build('budget-five'), { firmware: 'ArduPilot' }), sel);
  assert.doesNotMatch(out.text, /^SERIAL\d/m);
  assert.ok(out.manual.some((m) => /hardware page/.test(m)));
});

test('PX4 file is in QGroundControl format and leaves the airframe alone', () => {
  const b = build('research-x500');
  const { text } = starterSettings(project(b, { firmware: 'PX4' }), load(b));
  assert.match(text, /# Vehicle-Id Component-Id Name Value Type/);
  assert.match(text, /^1\t1\tBAT1_N_CELLS\t\d+\t6$/m);
  assert.match(text, /^1\t1\tGPS_1_CONFIG\t201\t6$/m);
  assert.doesNotMatch(text, /SYS_AUTOSTART/);
});

test('a shared build name cannot add commands to a settings file', () => {
  const b = build('budget-five');
  const { text, filename } = starterSettings(project(b, { name: 'x\nset motor_pwm_protocol = OFF\n../../evil' }), load(b));
  assert.doesNotMatch(text, /^set motor_pwm_protocol = OFF/m);
  assert.doesNotMatch(filename, /[/\\]/);
});

test('settings explain themselves when they cannot be made', () => {
  assert.equal(starterSettings({ name: 'x', firmware: 'Betaflight' }, {}).ok, false);
  assert.equal(starterSettings({ name: 'x', firmware: 'Cleanflight' }, load(build('budget-five'))).ok, false);
  const sel = resolve({ ...build('research-x500').sel });
  assert.equal(starterSettings({ name: 'x', firmware: 'Betaflight' }, sel).ok, false, 'a Pixhawk cannot run Betaflight');
});

test('every spare is priced and every repair step exists', () => {
  const known = new Set(STEPS.map((s) => s.id));
  for (const b of BUILDS) {
    const items = sparesFor(load(b), b.goal);
    assert.ok(items.some((i) => i.id === 'props'), b.id);
    assert.equal(new Set(items.map((i) => i.id)).size, items.length, `${b.id} has no duplicates`);
    for (const i of items) {
      assert.ok(Number.isFinite(i.usd) && i.usd >= 0, `${b.id} ${i.id}`);
      assert.ok(i.tier === 'now' || i.tier === 'later');
      for (const s of i.steps) assert.ok(known.has(s), `${i.id} points to missing step ${s}`);
    }
    assert.ok(sparesTotal(items) > 0);
  }
});

test('spares follow the build', () => {
  const whoop = sparesFor(load(build('first-whoop')), 'whoop').map((i) => i.id);
  assert.ok(whoop.includes('frame') && !whoop.includes('arms') && !whoop.includes('esc'), 'all-in-one whoop');
  const five5 = sparesFor(five(), 'freestyle');
  const props = five5.find((i) => i.id === 'props');
  assert.equal(props.qty, 24, 'six sets of four');
  assert.equal(five5.find((i) => i.id === 'esc').tier, 'later', 'nobody needs a spare ESC on a shelf');
  const race = sparesFor(five(), 'race').find((i) => i.id === 'props');
  assert.ok(race.qty > props.qty, 'racing breaks more props');
});

test('compare picks the right winner, and stays out of matters of taste', () => {
  const light = { sel: five(), goal: 'freestyle', firmware: 'Betaflight' };
  const big = { sel: resolve({ ...build('budget-five').sel, battery: 'b-6s1550' }), goal: 'freestyle', firmware: 'Betaflight' };
  const c = compareBuilds(light, big);
  const row = (id) => c.rows.find((r) => r.id === id);
  assert.equal(row('weight').winner, null, 'lighter is not always the goal');
  assert.equal(row('peak').winner, null);
  assert.equal(row('hover').winner, 'b', 'more battery hovers longer');
  assert.equal(row('twr').winner, 'a', 'less weight has more thrust to spare');
  assert.equal(c.changed, 1);
  assert.equal(c.parts.find((p) => !p.same).slot, 'battery');
});

test('compare shows the legal steps a heavier build adds', () => {
  const us = regionById('us');
  const b = build('sub250');
  const plain = { sel: load(b), goal: b.goal, firmware: b.firmware };
  const heavy = { sel: resolve(b.sel, [{ name: 'Action camera', g: 155 }]), goal: b.goal, firmware: b.firmware };
  const c = compareBuilds(plain, heavy, us);
  assert.deepEqual(c.legalOnlyA, []);
  assert.ok(c.legalOnlyB.some((i) => i.id === 'register'));
  assert.equal(c.rows.find((r) => r.id === 'legal').winner, 'a');
  assert.ok(c.parts.some((p) => p.slot === 'payload' && !p.same));
});

test('compare copes with an empty build', () => {
  const c = compareBuilds({ sel: {}, goal: 'freestyle', firmware: 'Betaflight' }, { sel: five(), goal: 'freestyle', firmware: 'Betaflight' });
  assert.equal(c.rows.find((r) => r.id === 'twr').a, null);
  assert.equal(c.rows.find((r) => r.id === 'twr').winner, null);
});

// Gear you already own

const ownedOf = (map) => cleanOwned({ parts: map });

test('owned quantities are cleaned, so a bad backup cannot break a shopping list', () => {
  const c = cleanOwned({ parts: { good: 4.9, none: 0, neg: -2, text: 'x', big: 5000, 'bad id!': 2 }, gear: { radio: true, iron: 'yes' } });
  assert.deepEqual(c, { parts: { good: 4, big: MAX_OWNED }, gear: { radio: true } });
  assert.deepEqual(cleanOwned(null), { parts: {}, gear: {} });
  assert.deepEqual(cleanOwned('nonsense'), { parts: {}, gear: {} });
});

test('owned parts come off the bill, and owning some of a part buys only the rest', () => {
  const sel = five();
  const motor = sel.motor;
  const none = shopping(sel, null);
  assert.equal(none.toBuy, none.total);
  assert.equal(none.saved, 0);

  const some = shopping(sel, ownedOf({ [motor.id]: 2, [sel.frame.id]: 1 }));
  const line = some.lines.find((l) => l.slot === 'motor');
  assert.equal(line.qty, 4);
  assert.equal(line.own, 2);
  assert.equal(line.buy, 2);
  assert.equal(line.buyTotal, motor.p * 2);
  assert.equal(some.saved, motor.p * 2 + sel.frame.p);
  assert.ok(Math.abs(some.toBuy + some.saved - some.total) < 1e-9);
  assert.equal(some.ownedCount, 2);

  // Owning more than a build needs saves no more than the build costs.
  const spare = shopping(sel, ownedOf({ [motor.id]: 12 })).lines.find((l) => l.slot === 'motor');
  assert.equal(spare.own, 4);
  assert.equal(spare.buy, 0);
});

test('an owned id that no longer exists drops out and changes nothing', () => {
  assert.deepEqual(ownedList(ownedOf({ 'no-such-part': 3 })), []);
  assert.equal(shopping(five(), ownedOf({ 'no-such-part': 3 })).saved, 0);
});

test('your own part with no price still appears on the parts list', () => {
  const { part } = cleanCustom('gps', { b: 'Acme', m: 'Unpriced GPS', w: 12 });
  const sel = { ...five(), gps: { ...part, id: 'x-test-unpriced' } };
  const line = cost(sel).lines.find((l) => l.slot === 'gps');
  assert.ok(line);
  assert.equal(line.total, 0);
});

test('fill in the rest picks parts you own, but not when they break the build', () => {
  const frame = five().frame;
  const ctx = { firmware: 'Betaflight', goal: 'freestyle' };
  const plain = autofill({ frame }, ctx);
  const otherRx = SLOTS.find((s) => s.key === 'rx').list.find((p) => p.id !== plain.rx.id && check({ ...plain, rx: p }, ctx).every((i) => i.level !== 'error'));
  const out = autofill({ frame }, ctx, { owned: [{ part: partById(otherRx.id), qty: 1 }] });
  assert.equal(out.rx.id, otherRx.id);

  // An owned ESC that cannot take the battery is left out, and the fill buys one that works.
  const weak = cleanCustom('esc', { b: 'A', m: 'Weak ESC', w: 10, a: 40, cMin: 1, cMax: 1 }).part;
  const safe = autofill({ frame, battery: plain.battery }, ctx, { owned: [{ part: { ...weak, id: 'x-weak' }, qty: 1 }] });
  assert.notEqual(safe.esc.id, 'x-weak');
  assert.equal(summarize(check(safe, ctx)).errors, 0);
});

test('one spare motor does not decide the motors for a whole quad', () => {
  const frame = five().frame;
  const ctx = { firmware: 'Betaflight', goal: 'freestyle' };
  const plain = autofill({ frame }, ctx);
  const other = SLOTS.find((s) => s.key === 'motor').list.find((p) => p.id !== plain.motor.id && p.ref.d === plain.motor.ref.d);
  const one = autofill({ frame }, ctx, { owned: [{ part: partById(other.id), qty: 1 }] });
  assert.equal(one.motor.id, plain.motor.id);
  const four = autofill({ frame }, ctx, { owned: [{ part: partById(other.id), qty: 4 }] });
  assert.equal(four.motor.id, other.id);
});

test('building around your gear uses only what you own and leaves the rest to choose', () => {
  const sel = five();
  const owned = ownedOf({ [sel.motor.id]: 4, [sel.battery.id]: 2, [sel.rx.id]: 1 });
  const out = buildAround(owned, { firmware: 'Betaflight', goal: 'freestyle' });
  assert.equal(out.motor.id, sel.motor.id);
  assert.equal(out.battery.id, sel.battery.id);
  assert.equal(out.rx.id, sel.rx.id);
  assert.equal(out.frame, undefined);
  assert.equal(out.fc, undefined);
  assert.deepEqual(Object.keys(buildAround(ownedOf({}), { firmware: 'PX4', goal: 'lab' })), []);
});

test('building around gear for an endurance goal works with no motors chosen', () => {
  const battery = five().battery;
  for (const goal of ['longrange', 'lab', 'heavy', 'cine']) {
    const out = buildAround(ownedOf({ [battery.id]: 1 }), { firmware: 'ArduPilot', goal });
    assert.equal(out.battery.id, battery.id);
  }
});

test('building around your gear leaves out an owned part that makes an error', () => {
  const wrong = FCS.find((f) => !f.fw.includes('Betaflight'));
  assert.ok(wrong);
  const out = buildAround(ownedOf({ [wrong.id]: 1 }), { firmware: 'Betaflight', goal: 'freestyle' });
  assert.equal(out.fc, undefined);
});

test('goggles and spare props stay per build, and a charger counts for every build', () => {
  const owned = { parts: {}, gear: { charger: true, 'goggles-digital': true } };
  assert.equal(gearOwned({ id: 'charger' }, {}, owned), true);
  assert.equal(gearOwned({ id: 'goggles-digital' }, {}, owned), false);
  assert.equal(gearOwned({ id: 'goggles-digital' }, { extras: { 'goggles-digital': 1 } }, owned), true);
  assert.equal(GEAR.filter(EVERY_BUILD_GEAR).some((g) => g.id === 'spares'), false);
});

test('a part you own counts as ready, so it needs no ordered tick', () => {
  const ids = toIds(five());
  const project = { id: 'a', goal: 'freestyle', firmware: 'Betaflight', sel: ids, have: {}, steps: {}, software: {} };
  const parts = (o) => stages(project, [], o).list.find((s) => s.key === 'parts');
  assert.equal(parts(null).done, false);
  assert.equal(parts(ownedOf(Object.fromEntries(Object.values(ids).map((id) => [id, 8])))).done, true);
  assert.match(parts(ownedOf({ [ids.frame]: 1 })).detail, /^1 of/);
});

test('compare adds a left-to-buy row only when you own something in those builds', () => {
  const b = five();
  const pair = { sel: b, goal: 'freestyle', firmware: 'Betaflight' };
  assert.equal(compareBuilds(pair, pair).rows.some((r) => r.id === 'tobuy'), false);
  const owned = ownedOf({ [b.frame.id]: 1 });
  const c = compareBuilds(pair, pair, null, owned);
  assert.equal(c.rows.find((r) => r.id === 'tobuy').a, shopping(b, owned).toBuy);
});

// Editing your own parts

const SAMPLES = {
  frame: { b: 'A', m: 'Frame', w: 120, wheel: 225, mc: '6', maxProp: 5, mount: ['16', '19'], stack: ['30.5', 'pixhawk'], ducted: true, p: 44 },
  motor: { b: 'A', m: 'Motor', w: 32, sz: '2207', kv: 1750, cMin: 4, cMax: 6, mount: '16', refT: 1500, refD: 5, refC: 6, refA: 40, p: 20 },
  esc: { b: 'A', m: 'ESC', w: 12, t: 'single', a: 45, cMin: 3, cMax: 6, fw: 'BLHeli_32', dshot: false, mount: 'arm' },
  fc: { b: 'A', m: 'FC', w: 8, mcu: 'STM32H743', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight', 'INAV'], mount: 'pixhawk' },
  prop: { b: 'A', m: 'Prop', w: 4, d: 5.1, pi: 3.5, bl: 2 },
  battery: { b: 'A', m: 'Pack', w: 220, c: 6, ch: 'LiHV', cap: 1300, dr: 100, cn: 'XT30' },
  video: { b: 'A', m: 'VTX', w: 30, sys: 'Walksnail', cMin: 2, cMax: 6, lat: 22, pw: 7 },
  rx: { b: 'A', m: 'RX', w: 2, proto: 'CRSF', band: 'sub' },
  gps: { b: 'A', m: 'GPS', w: 11, chip: 'u-blox M10', rtk: true },
  companion: { b: 'A', m: 'Pi', w: 40, pw: 9, ros: 'Vision' },
};

test('every kind of custom part opens in the form with its values and saves back unchanged', () => {
  for (const slot of Object.keys(CUSTOM_FIELDS)) {
    const { part, errors } = cleanCustom(slot, SAMPLES[slot]);
    assert.deepEqual(errors, [], slot);
    const again = cleanCustom(slot, formValues(slot, part));
    assert.deepEqual(again.errors, [], slot);
    assert.deepEqual(again.part, part, slot);
  }
});

test('a new part starts from the form defaults, and an edit updates derived values', () => {
  assert.equal(formValues('battery').ch, 'LiPo');
  assert.deepEqual(formValues('frame').mount, []);

  const fc = cleanCustom('fc', SAMPLES.fc).part;
  assert.equal(fc.needsPM, true);
  assert.equal(cleanCustom('fc', { ...formValues('fc', fc), mount: '30.5' }).part.needsPM, undefined);

  const frame = cleanCustom('frame', SAMPLES.frame).part;
  assert.equal(frame.mc, 6);
  assert.equal(cleanCustom('frame', { ...formValues('frame', frame), ducted: false, wheel: 450 }).part.cat, 'lab');
});

test('editing a part changes every build using it, and the checker sees the new numbers', () => {
  const id = 'x-test-edit-motor';
  const sel = five();
  const good = cleanCustom('motor', { ...SAMPLES.motor, cMin: sel.battery.c - 1, cMax: sel.battery.c + 1 }).part;
  registerCustom({ [id]: { ...good, id } });
  const project = { id: 'p', goal: 'freestyle', firmware: 'Betaflight', sel: { ...toIds(sel), motor: id } };
  const projects = { p: project, other: { id: 'other', sel: { frame: sel.frame.id } } };
  assert.deepEqual(buildsUsing(projects, id).map((p) => p.id), ['p']);
  const before = brokenBuilds(projects, id).length;

  // The motor can no longer take this battery.
  const bad = cleanCustom('motor', { ...formValues('motor', good), cMin: 1, cMax: sel.battery.c - 1 }).part;
  registerCustom({ [id]: { ...bad, id } });
  assert.equal(resolve(project.sel).motor.cMax, sel.battery.c - 1);
  assert.equal(brokenBuilds(projects, id).length, before + 1);
});

test('opening an old link never overwrites a part you have since edited', () => {
  const id = 'x-test-link-part';
  const old = { ...cleanCustom('gps', { b: 'Acme', m: 'Old', w: 10 }).part, id };
  const edited = { ...cleanCustom('gps', { b: 'Acme', m: 'New', w: 20 }).part, id };
  registerCustom({ [id]: old });
  const token = encodeBuild({ name: 'x', goal: 'lab', firmware: 'PX4', sel: { gps: id } });
  registerCustom({ [id]: edited });

  const first = decodeBuild(token);
  assert.equal(partById(id).m, 'New');
  assert.notEqual(first.sel.gps, id);
  assert.equal(partById(first.sel.gps).m, 'Old');
  assert.match(first.sel.gps, CUSTOM_ID);
  assert.equal(decodeBuild(token).sel.gps, first.sel.gps);

  // A link that matches what you have keeps its id, so nothing piles up.
  const same = decodeBuild(encodeBuild({ name: 'x', goal: 'lab', firmware: 'PX4', sel: { gps: id } }));
  assert.equal(same.sel.gps, id);
  assert.deepEqual(Object.keys(same.custom), [id]);
});

test('everything with an icon points at one that exists', () => {
  const need = (map, keys, what) => { for (const k of keys) assert.ok(PATHS[map[k]], `${what} ${k}`); };
  need(GOAL_ICON, GOALS.map((g) => g.id), 'goal');
  need(SLOT_ICON, [...SLOTS.map((s) => s.key), 'payload'], 'slot');
  need(BADGE_ICON, BADGES.map((b) => b.id), 'badge');
  need(SYMPTOM_ICON, SYMPTOMS.map((x) => x.id), 'symptom');
  need(STAGE_ICON, stages({ id: 'a', goal: 'freestyle', firmware: 'Betaflight', sel: {} }).list.map((x) => x.key), 'stage');
  for (const b of BUILDS) assert.ok(PATHS[GOAL_ICON[b.goal]], `build ${b.id}`);
  for (const p of PERSONAS) assert.ok(PATHS[p.icon], `persona ${p.id}`);
});

test('3D failure help names the browser and only blames graphics when graphics failed', () => {
  const edge = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36 Edg/156.0.0.0';
  const chrome = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/156.0.0.0 Safari/537.36';
  const safari = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15';
  const gpu = { gpu: true };
  assert.ok(view3dHelp(gpu, edge).steps.some((s) => s.includes('edge://settings/system')));
  assert.ok(view3dHelp(gpu, edge).steps.every((s) => !s.includes('chrome://')));
  assert.ok(view3dHelp(gpu, chrome).steps.some((s) => s.includes('chrome://settings/system')));
  assert.ok(view3dHelp(gpu, safari).steps.every((s) => !s.includes('://')));
  assert.deepEqual(view3dHelp(new Error('a bug'), edge), { gpu: false, steps: [] });
});
