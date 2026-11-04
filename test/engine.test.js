import test from 'node:test';
import assert from 'node:assert/strict';
import { BUILDS } from '../src/data/builds.js';
import { SLOTS, FCS, FRAMES, partById } from '../src/data/parts.js';
import { REGIONS, money, regionById, storeLinks, videoSearch, weightNote } from '../src/data/regions.js';
import { FW, FW_CHOICES } from '../src/data/firmware.js';
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
