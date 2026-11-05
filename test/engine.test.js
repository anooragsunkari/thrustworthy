import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDS } from '../src/data/builds.js';
import { SLOTS, FCS, FRAMES, partById } from '../src/data/parts.js';
import { REGIONS, money, regionById, storeLinks, videoSearch, weightNote } from '../src/data/regions.js';
import { FW, FW_CHOICES } from '../src/data/firmware.js';
import { layout, partDetails } from '../src/lib/model.js';
import { Spring, SOFT, SNAPPY, BOUNCY, springCurve } from '../src/lib/spring.js';
import { cleanCustom, cleanPayload, cleanSharedParts, fieldsFor, CUSTOM_FIELDS } from '../src/lib/custom.js';
import { buildFacts, legalChecklist } from '../src/data/legal.js';
import { registerCustom } from '../src/data/parts.js';
import { encodeBuild, decodeBuild } from '../src/lib/util.js';
import { resolve, check, flight, cost, missing, autofill, summarize, toIds } from '../src/lib/engine.js';

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
