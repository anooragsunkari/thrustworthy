// Interactive model of a build. Grew from Anoorag Sunkari's Multirotor.build viewer.
// Three.js is large, so this chunk only loads on the 3D page.
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { layout } from '../lib/model.js';
import { t } from '../lib/util.js';
import { animate, BOUNCY, prefersStill, SNAPPY, SOFT, Spring } from '../lib/spring.js';

function palette(dark) {
  return {
    carbon: dark ? 0x56565c : 0x232326,
    metal: 0x9a9aa2,
    bell: dark ? 0xc4c4cb : 0x77777e,
    copper: 0xb87333,
    prop: dark ? 0xdcdce2 : 0x3a3a40,
    pcb: 0x1f6b47,
    pcb2: 0x17523a,
    caseTone: dark ? 0xe4e4e8 : 0xd0d0d6,
    battery: dark ? 0x4a4a52 : 0x2f2f35,
    strap: 0xc73e2e,
    lens: 0x101013,
    white: 0xf1f1f4,
    antenna: dark ? 0xa0a0a8 : 0x55555c,
  };
}

function buildScene(canvas, sel, dark) {
  const plan = layout(sel);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 50000);
  scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x30303a : 0xc0c0c6, dark ? 1.5 : 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(1, 2, 1.2);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xffffff, 0.5);
  fill.position.set(-1.5, -0.6, -1);
  scene.add(fill);

  const C = palette(dark);
  const root = new THREE.Group();
  scene.add(root);
  const groups = {};
  const pickable = [];
  const spinners = [];

  const material = (color, opts = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.15, transparent: true, ...opts });
  const addMesh = (group, geo, color, pos, opts) => {
    const m = new THREE.Mesh(geo, material(color, opts));
    if (pos) m.position.set(...pos);
    group.add(m);
    pickable.push(m);
    return m;
  };
  const box = (l, h, w) => new THREE.BoxGeometry(w, h, l);
  const cyl = (r, h, seg = 28, top = r) => new THREE.CylinderGeometry(top, r, h, seg);

  for (const p of plan.parts) {
    const g = new THREE.Group();
    g.userData = { slot: p.slot, explode: new THREE.Vector3(...p.explode) };
    switch (p.kind) {
      case 'frame': {
        addMesh(g, box(p.plateL, p.plateT, p.plateW), C.carbon, [0, 0, 0]);
        addMesh(g, box(p.plateL * 1.05, p.plateT, p.plateW * 1.05), C.carbon, [0, -p.gap, 0]);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          addMesh(g, cyl(Math.max(1, p.plateW * 0.035), p.gap, 10), C.metal, [sx * p.plateW * 0.4, -p.gap / 2, sz * p.plateL * 0.4], { metalness: 0.8, roughness: 0.3 });
        }
        for (const m of p.mounts) {
          const len = Math.hypot(m.x, m.z);
          const a = addMesh(g, new THREE.BoxGeometry(len, p.armT, p.armW), C.carbon, [m.x / 2, -p.gap / 2, m.z / 2]);
          a.rotation.y = -m.angle;
          if (p.ducted) {
            const d = addMesh(g, new THREE.TorusGeometry(p.propR * 1.08, Math.max(1.2, p.propR * 0.07), 10, 44), C.carbon, [m.x, -p.gap / 2 + p.armT, m.z]);
            d.rotation.x = Math.PI / 2;
          }
        }
        break;
      }
      case 'motors':
        for (const m of p.mounts) {
          addMesh(g, cyl(p.bellR * 0.72, p.bellH * 0.45, 20), C.copper, [m.x, p.y + p.bellH * 0.22, m.z], { metalness: 0.7, roughness: 0.35 });
          addMesh(g, cyl(p.bellR, p.bellH * 0.55, 28), C.bell, [m.x, p.y + p.bellH * 0.72, m.z], { metalness: 0.75, roughness: 0.3 });
        }
        break;
      case 'props':
        for (const m of p.mounts) {
          const s = new THREE.Group();
          s.position.set(m.x, p.y, m.z);
          s.userData.dir = m.dir;
          // A faint disc shows the swept area and gives a larger target to tap.
          const disc = addMesh(s, cyl(p.r, 0.6, 48), C.prop, null, { depthWrite: false });
          disc.userData.faint = true;
          for (let b = 0; b < p.blades; b += 1) {
            const ang = (b / p.blades) * Math.PI * 2;
            const blade = addMesh(s, new THREE.BoxGeometry(p.r, Math.max(0.8, p.r * 0.018), Math.max(2.2, p.r * 0.17)), C.prop, [Math.cos(ang) * p.r * 0.52, 0, Math.sin(ang) * p.r * 0.52]);
            blade.rotation.y = -ang;
          }
          addMesh(s, cyl(Math.max(1.6, p.r * 0.09), Math.max(2, p.r * 0.06), 14), C.metal, [0, 0, 0]);
          g.add(s);
          spinners.push(s);
        }
        break;
      case 'board': {
        const tone = p.tone === 'pcb2' ? C.pcb2 : C.pcb;
        addMesh(g, box(p.size.l, p.size.h, p.size.w), tone, p.pos);
        addMesh(g, box(p.size.l * 0.28, p.size.h * 0.8, p.size.w * 0.28), C.lens, [p.pos[0], p.pos[1] + p.size.h * 0.8, p.pos[2]]);
        break;
      }
      case 'box':
        addMesh(g, box(p.size.l, p.size.h, p.size.w), p.tone === 'case' ? C.caseTone : p.tone === 'payload' ? C.strap : C.pcb, p.pos, p.tone === 'payload' ? { roughness: 0.75 } : undefined);
        break;
      case 'perArm':
        for (const m of p.mounts) {
          const e = addMesh(g, new THREE.BoxGeometry(p.size.l, p.size.h, p.size.w), C.pcb, [m.x * p.at, p.y, m.z * p.at]);
          e.rotation.y = -m.angle;
        }
        break;
      case 'battery': {
        addMesh(g, box(p.size.l, p.size.h, p.size.w), C.battery, p.pos, { roughness: 0.65 });
        addMesh(g, box(Math.max(5, p.size.l * 0.14), p.size.h * 1.03, p.size.w * 1.03), C.strap, p.pos, { roughness: 0.8 });
        break;
      }
      case 'video': {
        addMesh(g, new THREE.BoxGeometry(p.cam, p.cam, p.cam * 0.9), C.lens, p.pos);
        const lens = addMesh(g, cyl(p.cam * 0.34, p.cam * 0.5, 20), C.metal, [p.pos[0], p.pos[1], p.pos[2] - p.cam * 0.6], { metalness: 0.9, roughness: 0.2 });
        lens.rotation.x = Math.PI / 2;
        addMesh(g, box(p.vtx.l, p.vtx.h, p.vtx.w), C.pcb2, p.vtxPos);
        addMesh(g, cyl(0.9, p.antenna, 8), C.antenna, [p.vtxPos[0], p.vtxPos[1] + p.antenna / 2 + 8, p.vtxPos[2] + p.vtx.l * 0.6]);
        break;
      }
      case 'rx':
        addMesh(g, box(p.size.l, p.size.h, p.size.w), C.pcb2, p.pos);
        addMesh(g, cyl(0.6, p.antenna, 6), C.antenna, [p.pos[0] + 3, p.pos[1] + p.antenna / 2, p.pos[2]]);
        break;
      case 'gps':
        addMesh(g, cyl(Math.max(0.9, p.r * 0.09), p.mast, 8), C.metal, [p.pos[0], p.pos[1] + p.mast / 2, p.pos[2]]);
        addMesh(g, cyl(p.r, p.r * 0.45, 28), C.white, [p.pos[0], p.pos[1] + p.mast + p.r * 0.22, p.pos[2]], { roughness: 0.8 });
        break;
      default:
    }
    g.traverse((o) => { if (o.isMesh) o.userData.slot = p.slot; });
    groups[p.slot] = g;
    root.add(g);
  }

  const fitRadius = plan.extent * 4.2; // fits the whole prop span in the view
  const still = prefersStill();
  const HOME = { theta: 0.72, phi: 1.02 };
  const PHI_MIN = 0.12;
  const PHI_MAX = Math.PI - 0.12;

  // Camera. Angles coast on their own momentum after a flick; springs handle zoom and resets.
  const theta = new Spring(HOME.theta, SOFT);
  const phi = new Spring(HOME.phi, SOFT);
  const zoom = new Spring(still ? fitRadius : fitRadius * 1.3, SOFT).to(fitRadius);
  const look = [new Spring(0, SOFT), new Spring(0, SOFT), new Spring(0, SOFT)];
  const focus = new Spring(1, SOFT);
  let homing = false;
  let lastTouched = 0;
  let clock = 0;

  // Each part has its own spring, so parts arrive one after another and overshoot slightly.
  const parts = Object.values(groups).map((g, i) => {
    const ev = g.userData.explode;
    const len = ev.length();
    return {
      g,
      i,
      slot: g.userData.slot,
      exploded: new Spring(still ? 0 : 1.15, BOUNCY).to(0, still ? 0 : 0.12 + i * 0.07),
      lift: new Spring(0, BOUNCY),
      dim: new Spring(0, SOFT),
      glow: new Spring(0, SNAPPY),
      liftBy: len ? ev.clone().multiplyScalar((plan.unit * 0.16) / len) : new THREE.Vector3(),
    };
  });
  const rotor = new Spring(0, { k: 14, c: 7 }).to(still ? 0 : 1);
  const tiltX = new Spring(0, { k: 60, c: 9 });
  const tiltZ = new Spring(0, { k: 60, c: 9 });

  let selected = null;
  let hovered = null;
  let isExploded = false;
  let onPick = () => {};

  const applyTargets = () => {
    for (const a of parts) {
      const isSel = selected === a.slot;
      a.dim.to(selected && !isSel ? 1 : 0);
      a.lift.to(isSel ? 1 : 0);
      a.glow.to(isSel ? 0.3 : hovered === a.slot ? 0.16 : 0);
    }
    rotor.to(still ? 0 : selected ? 0.08 : 1);
    focus.to(selected ? 0.8 : 1);
  };

  const size = () => {
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  };
  size();
  const ro = new ResizeObserver(size);
  ro.observe(canvas);

  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const hit = (x, y) => {
    const b = canvas.getBoundingClientRect();
    ndc.set(((x - b.left) / b.width) * 2 - 1, -((y - b.top) / b.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const all = ray.intersectObjects(pickable, false);
    // Prefer solid parts over the faint prop disc, so props never block what is beneath them.
    const solid = all.find((i) => !i.object.userData.faint);
    return (solid || all[0])?.object.userData.slot || null;
  };

  const pointers = new Map();
  let downAt = null;
  let moved = 0;
  let pinch = 0;
  let lastMove = 0;
  const onDown = (e) => {
    try { canvas.setPointerCapture(e.pointerId); } catch { /* the pointer already ended */ }
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 1) { downAt = [e.clientX, e.clientY]; moved = 0; }
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      pinch = Math.hypot(a[0] - b[0], a[1] - b[1]);
      moved = 99;
    }
    // Catching the model stops it, the way a hand would.
    theta.v = 0;
    phi.v = 0;
    homing = false;
    lastTouched = clock;
  };
  const onMove = (e) => {
    if (!pointers.has(e.pointerId)) {
      if (e.pointerType === 'mouse') {
        const s = hit(e.clientX, e.clientY);
        if (s !== hovered) { hovered = s; canvas.style.cursor = s ? 'pointer' : 'grab'; applyTargets(); }
      }
      return;
    }
    const prev = pointers.get(e.pointerId);
    pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
      if (pinch) zoom.to(Math.max(plan.extent * 0.8, Math.min(fitRadius * 2.4, zoom.target * (pinch / d))));
      pinch = d;
      lastTouched = clock;
      return;
    }
    const dx = e.clientX - prev[0];
    const dy = e.clientY - prev[1];
    moved += Math.abs(dx) + Math.abs(dy);
    const now = performance.now();
    const dt = Math.max(0.004, (now - lastMove) / 1000);
    lastMove = now;
    const dT = -dx * 0.008;
    // Past the poles it resists, like pulling on a rubber band.
    const over = phi.x < PHI_MIN || phi.x > PHI_MAX;
    const dP = -dy * 0.008 * (over ? 0.25 : 1);
    theta.x += dT;
    phi.x += dP;
    // Smoothed, so one jittery sample does not decide the throw.
    theta.v = theta.v * 0.7 + (dT / dt) * 0.3;
    phi.v = phi.v * 0.7 + (dP / dt) * 0.3;
    lastTouched = clock;
  };
  const onUp = (e) => {
    const wasTap = pointers.size === 1 && moved < 7 && downAt;
    pointers.delete(e.pointerId);
    if (performance.now() - lastMove > 90) { theta.v = 0; phi.v = 0; } // held still before letting go
    if (still) { theta.v = 0; phi.v = 0; }
    if (wasTap) onPick(hit(e.clientX, e.clientY));
    if (pointers.size < 2) pinch = 0;
    lastTouched = clock;
  };
  const onWheel = (e) => {
    e.preventDefault();
    zoom.to(Math.max(plan.extent * 0.8, Math.min(fitRadius * 2.4, zoom.target * (1 + Math.sign(e.deltaY) * 0.1))));
    lastTouched = clock;
  };
  const onLeave = () => { if (hovered) { hovered = null; applyTargets(); } };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('wheel', onWheel, { passive: false });

  // Save the battery while the model is scrolled off screen.
  let visible = true;
  const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; });
  io.observe(canvas);

  const v = new THREE.Vector3();
  const lookAt = new THREE.Vector3();
  const box3 = new THREE.Box3();
  const center = new THREE.Vector3();

  const frame = (dt) => {
    clock += dt;
    const dragging = pointers.size > 0;

    if (!dragging) {
      if (homing) {
        theta.step(dt);
        phi.step(dt);
        if (theta.settled && phi.settled) homing = false;
      } else {
        // Coast on momentum, with friction.
        theta.x += theta.v * dt;
        phi.x += phi.v * dt;
        const drag = Math.exp(-dt * 3.2);
        theta.v *= drag;
        phi.v *= drag;
        // The poles push back.
        if (phi.x < PHI_MIN) phi.v += (PHI_MIN - phi.x) * 90 * dt;
        if (phi.x > PHI_MAX) phi.v += (PHI_MAX - phi.x) * 90 * dt;
        // After a rest, drift gently so the model feels alive.
        if (!still && !selected && clock - lastTouched > 4) theta.v += (0.1 - theta.v) * Math.min(1, dt * 0.8);
      }
    }

    zoom.step(dt);
    focus.step(dt);
    rotor.step(dt);

    // Lean into the motion, like a drone responding to a stick.
    tiltX.to(still ? 0 : Math.max(-0.22, Math.min(0.22, phi.v * 0.09)));
    tiltZ.to(still ? 0 : Math.max(-0.22, Math.min(0.22, -theta.v * 0.05)));
    tiltX.step(dt);
    tiltZ.step(dt);
    root.rotation.x = tiltX.x;
    root.rotation.z = tiltZ.x;
    root.position.y = still ? 0 : Math.sin(clock * 1.5) * plan.extent * 0.007;

    for (const a of parts) {
      a.exploded.step(dt);
      a.lift.step(dt);
      a.dim.step(dt);
      a.glow.step(dt);
      a.g.position.copy(a.g.userData.explode).multiplyScalar(a.exploded.x).addScaledVector(a.liftBy, a.lift.x);
      const dim = Math.max(0, Math.min(1, a.dim.x));
      const glow = Math.max(0, a.glow.x);
      const speed = Math.max(0, Math.min(1, rotor.x));
      a.g.traverse((o) => {
        if (!o.isMesh) return;
        // Fast blades blur into a disc, as they do in real life.
        let base = 1;
        if (o.userData.faint) base = 0.05 + 0.2 * speed;
        else if (a.slot === 'prop') base = 1 - 0.6 * speed;
        o.material.opacity = base * (1 - 0.85 * dim);
        o.material.depthWrite = !o.userData.faint && dim < 0.5;
        o.material.emissive.setHex(0xffffff);
        o.material.emissiveIntensity = glow;
      });
    }

    // Glide the camera toward the chosen part.
    const chosen = selected && groups[selected];
    if (chosen) {
      box3.setFromObject(chosen).getCenter(center);
      look[0].to(center.x * 0.6);
      look[1].to(center.y * 0.6);
      look[2].to(center.z * 0.6);
    } else {
      look[0].to(0); look[1].to(0); look[2].to(0);
    }
    look.forEach((s) => s.step(dt));
    lookAt.set(look[0].x, look[1].x, look[2].x);

    const spread = Math.max(0, ...parts.map((a) => a.exploded.x));
    const radius = zoom.x * focus.x * (1 + Math.min(1.2, spread) * 0.12);
    const cam = Math.max(0.02, Math.min(Math.PI - 0.02, phi.x));
    v.setFromSphericalCoords(radius, cam, theta.x).add(lookAt);
    camera.position.copy(v);
    camera.lookAt(lookAt);

    spinners.forEach((s) => { s.rotation.y += rotor.x * 34 * dt * s.userData.dir; });
    if (visible) renderer.render(scene, camera);
    return true;
  };
  applyTargets();
  const stop = animate(frame);

  return {
    setSelected(slot) { selected = slot; lastTouched = clock; applyTargets(); },
    setExploded(on) {
      if (on === isExploded) return;
      isExploded = on;
      const n = parts.length;
      for (const a of parts) {
        const delay = still ? 0 : (on ? a.i : n - a.i) * 0.035;
        a.exploded.to(on ? 1 : 0, delay);
        if (still) a.exploded.set(on ? 1 : 0);
      }
      lastTouched = clock;
    },
    setOnPick(fn) { onPick = fn; },
    reset() {
      homing = !still;
      const turn = Math.PI * 2;
      const to = HOME.theta + Math.round((theta.x - HOME.theta) / turn) * turn;
      if (still) { theta.set(to); phi.set(HOME.phi); } else { theta.to(to); phi.to(HOME.phi); }
      zoom.to(fitRadius);
      lastTouched = clock;
    },
    slots: () => Object.keys(groups),
    /** Screen position of a part, so development tests can tap it like a person would. */
    screenOf(slot) {
      const g = groups[slot];
      if (!g) return null;
      const c = new THREE.Box3().setFromObject(g).getCenter(new THREE.Vector3()).project(camera);
      const b = canvas.getBoundingClientRect();
      return [b.left + ((c.x + 1) / 2) * b.width, b.top + ((1 - c.y) / 2) * b.height];
    },
    dispose() {
      stop();
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('wheel', onWheel);
      scene.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
      renderer.dispose();
    },
  };
}

export default function Drone3D({ sel, selected, exploded, onPick, theme }) {
  const ref = useRef(null);
  const api = useRef(null);
  const [failed, setFailed] = useState(false);
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  useEffect(() => {
    const dark = theme === 'dark' || getComputedStyle(document.documentElement).colorScheme.includes('dark');
    let scene;
    try {
      scene = buildScene(ref.current, sel, dark);
    } catch {
      setFailed(true);
      return undefined;
    }
    api.current = scene;
    if (import.meta.env.DEV) window.__drone3d = scene;
    scene.setOnPick((s) => pickRef.current(s));
    scene.setSelected(selected || null);
    scene.setExploded(!!exploded);
    return () => { scene.dispose(); api.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sel, theme]);

  useEffect(() => { api.current?.setSelected(selected || null); }, [selected]);
  useEffect(() => { api.current?.setExploded(!!exploded); }, [exploded]);

  if (failed) {
    return <div className="viewer viewer-fail"><p className="small muted">{t('This browser could not start 3D graphics. You can still tap any part in the list.')}</p></div>;
  }
  return (
    <div className="viewer">
      <canvas ref={ref} role="img" aria-label={t('3D model of your drone. Parts are also listed below.')} />
      <button className="viewer-reset" onClick={() => api.current?.reset()}>{t('Reset view')}</button>
    </div>
  );
}
