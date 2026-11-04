// Interactive 3D preview, adapted from Anoorag Sunkari's Multirotor.build viewer.
// Three.js is large, so this chunk only loads when someone taps "View in 3D".
import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { t } from '../lib/util.js';

function build(canvas, sel, dark) {
  const W = canvas.clientWidth;
  const H = canvas.clientHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H, false);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, W / H, 0.01, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, dark ? 0x334455 : 0xcfd2d8, dark ? 1.3 : 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(2, 3, 2);
  scene.add(key);

  const frame = sel.frame;
  const mc = frame?.mc || 4;
  const size = frame ? Math.min(frame.wheel, 900) / 220 : 1;
  const sc = Math.pow(size, 0.55); // compress the range so whoops and octos both fit the view
  const arm = 0.1 * sc;
  const mat = (color, rough = 0.45, metal = 0.2) => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
  const carbon = mat(dark ? 0x4a4c55 : 0x2b2c31);
  const metal = mat(dark ? 0x888a95 : 0x6a6b73, 0.25, 0.85);
  const accent = mat(0x0a84ff, 0.4, 0.1);
  const pcb = mat(0x1f5a39, 0.6, 0.1);
  const drone = new THREE.Group();
  const pW = 0.036 * sc;
  const pD = 0.05 * sc;

  drone.add(new THREE.Mesh(new THREE.BoxGeometry(pW, 0.002, pD), carbon));
  const gap = 0.014;
  const low = new THREE.Mesh(new THREE.BoxGeometry(pW * 1.1, 0.002, pD * 1.1), carbon);
  low.position.y = -gap;
  drone.add(low);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const so = new THREE.Mesh(new THREE.CylinderGeometry(0.0018, 0.0018, gap, 8), metal);
    so.position.set(sx * pW * 0.38, -gap / 2, sz * pD * 0.38);
    drone.add(so);
  }

  const propDisc = sel.prop ? (sel.prop.d * 0.0254) / 2 * 0.42 * (sc / size ** 0.2) : 0.03 * sc;
  const spinners = [];
  for (let i = 0; i < mc; i += 1) {
    const a = ((i * 360) / mc + 180 / mc) * (Math.PI / 180);
    const x = Math.cos(a) * arm;
    const z = Math.sin(a) * arm;
    const len = Math.hypot(x, z);
    const beam = new THREE.Mesh(new THREE.BoxGeometry(len, 0.003, 0.005 * sc), carbon);
    beam.position.set(x / 2, -gap / 2, z / 2);
    beam.rotation.y = -Math.atan2(z, x);
    drone.add(beam);
    if (sel.motor) {
      const m = new THREE.Group();
      m.position.set(x, -gap / 2, z);
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.008 * sc ** 0.6, 0.009 * sc ** 0.6, 0.008, 18), metal);
      bell.position.y = 0.005;
      m.add(bell);
      if (sel.prop) {
        const spin = new THREE.Group();
        spin.position.y = 0.011;
        spin.userData.dir = i % 2 ? 1 : -1;
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(propDisc, propDisc, 0.0006, 36), new THREE.MeshStandardMaterial({ color: 0x0a84ff, transparent: true, opacity: 0.12 }));
        spin.add(disc);
        const blades = sel.prop.bl;
        for (let b = 0; b < blades; b += 1) {
          const bl = new THREE.Mesh(new THREE.BoxGeometry(propDisc, 0.0008, propDisc * 0.16), accent);
          const ang = (b / blades) * Math.PI * 2;
          bl.position.set(Math.cos(ang) * propDisc * 0.5, 0, Math.sin(ang) * propDisc * 0.5);
          bl.rotation.y = -ang;
          spin.add(bl);
        }
        spinners.push(spin);
        m.add(spin);
      }
      drone.add(m);
    }
  }

  if (sel.fc) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(pW * 0.7, 0.002, pD * 0.5), pcb);
    b.position.y = -gap * 0.35;
    drone.add(b);
  }
  if (sel.esc) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(pW * 0.65, 0.002, pD * 0.5), mat(0x173d29, 0.6, 0.1));
    b.position.y = -gap * 0.7;
    drone.add(b);
  }
  if (sel.battery) {
    const h = 0.008 + Math.min(0.016, (sel.battery.cap / 1000) * 0.004);
    const box = new THREE.Mesh(new THREE.BoxGeometry(pW * 0.85, h, pD * 0.8), mat(dark ? 0x30323a : 0x3a3b42, 0.5, 0.2));
    box.position.y = 0.003 + h / 2;
    drone.add(box);
  }
  if (sel.video && sel.video.sys !== 'None') {
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.008), mat(0x111114, 0.5));
    cam.position.set(0, -gap / 2, -pD * 0.55);
    drone.add(cam);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.001, 0.001, 0.022, 6), accent);
    ant.position.set(0, 0.011, pD * 0.45);
    drone.add(ant);
  }
  if (sel.gps) {
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.03, 8), metal);
    mast.position.set(0, 0.03, pD * 0.2);
    drone.add(mast);
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.003, 18), mat(0xeeeeee, 0.8));
    pad.position.set(0, 0.046, pD * 0.2);
    drone.add(pad);
  }
  if (sel.companion) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(pW * 0.8, 0.004, pD * 0.6), pcb);
    b.position.y = -gap - 0.006;
    drone.add(b);
  }
  scene.add(drone);

  const orbit = { theta: 0.8, phi: 1.05, r: 0.34 * sc + 0.12 };
  let down = false; let lx = 0; let ly = 0; let vT = 0.003; let vP = 0;
  const pt = (e) => (e.touches ? e.touches[0] : e);
  const onDown = (e) => { down = true; const p = pt(e); lx = p.clientX; ly = p.clientY; };
  const onMove = (e) => {
    if (!down) return;
    if (e.cancelable) e.preventDefault();
    const p = pt(e);
    vT = -(p.clientX - lx) * 0.006;
    vP = -(p.clientY - ly) * 0.006;
    lx = p.clientX; ly = p.clientY;
  };
  const onUp = () => { down = false; };
  canvas.addEventListener('mousedown', onDown);
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);
  canvas.addEventListener('touchstart', onDown, { passive: true });
  canvas.addEventListener('touchmove', onMove, { passive: false });
  canvas.addEventListener('touchend', onUp);

  let raf;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const v = new THREE.Vector3();
  const loop = () => {
    raf = requestAnimationFrame(loop);
    orbit.theta += vT;
    orbit.phi = Math.max(0.2, Math.min(Math.PI - 0.2, orbit.phi + vP));
    vP *= 0.9;
    vT = down ? 0 : vT * 0.98 + (still ? 0 : 0.0006);
    v.setFromSphericalCoords(orbit.r, orbit.phi, orbit.theta);
    camera.position.copy(v);
    camera.lookAt(0, 0, 0);
    if (!still) spinners.forEach((s) => { s.rotation.y += 0.35 * s.userData.dir; });
    renderer.render(scene, camera);
  };
  loop();
  return () => {
    cancelAnimationFrame(raf);
    renderer.dispose();
    canvas.removeEventListener('mousedown', onDown);
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
    canvas.removeEventListener('touchstart', onDown);
    canvas.removeEventListener('touchmove', onMove);
    canvas.removeEventListener('touchend', onUp);
  };
}

export default function Viewer3D({ sel }) {
  const ref = useRef(null);
  useEffect(() => {
    const dark = getComputedStyle(document.documentElement).colorScheme.includes('dark');
    try { return build(ref.current, sel, dark); } catch { return undefined; }
  }, [sel]);
  return (
    <div>
      <div className="viewer"><canvas ref={ref} aria-label={t('3D preview of your drone')} /></div>
      <p className="tiny muted" style={{ marginTop: 6 }}>{t('Drag to rotate. A rough model, not to scale.')}</p>
    </div>
  );
}
