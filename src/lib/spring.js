// A damped spring, integrated with real forces rather than a fixed easing curve. A moving
// thing keeps its velocity when its target changes, which is what makes motion feel fluid.
// No browser APIs, so it runs under `node --test`.

export const SOFT = { k: 120, c: 20 };      // calm, no overshoot to speak of
export const SNAPPY = { k: 320, c: 32 };    // quick, settles fast
export const BOUNCY = { k: 240, c: 16 };    // a visible overshoot

const STEP = 1 / 240;
const MAX_DT = 1 / 3; // slow devices keep real time, and a long stall cannot blow up the physics

export class Spring {
  constructor(value = 0, preset = SNAPPY) {
    this.x = value;
    this.v = 0;
    this.target = value;
    this.k = preset.k;
    this.c = preset.c;
    this.delay = 0;
    this.left = 0;
  }

  /** Move toward a new target, keeping current velocity. Optional delay in seconds. */
  to(target, delay = 0) {
    this.target = target;
    this.delay = delay;
    return this;
  }

  /** Jump with no motion. */
  set(value) {
    this.x = value;
    this.target = value;
    this.v = 0;
    this.delay = 0;
    return this;
  }

  step(dt) {
    let t = Math.min(dt, MAX_DT);
    if (this.delay > 0) {
      const used = Math.min(this.delay, t);
      this.delay -= used;
      t -= used;
      if (t <= 0) return this.x;
    }
    this.left += t;
    while (this.left >= STEP) {
      // Semi-implicit Euler: stable for stiff springs at this step size.
      this.v += (-this.k * (this.x - this.target) - this.c * this.v) * STEP;
      this.x += this.v * STEP;
      this.left -= STEP;
    }
    return this.x;
  }

  get settled() {
    return this.delay <= 0 && Math.abs(this.x - this.target) < 1e-3 && Math.abs(this.v) < 1e-2;
  }
}

/** Sample a spring from 0 to 1 as a CSS linear() easing, so plain CSS gets real spring motion. */
export function springCurve(preset, samples = 48) {
  const s = new Spring(0, preset).to(1);
  const trace = [0];
  let time = 0;
  const dt = 1 / 120;
  while (time < 3) {
    s.step(dt);
    time += dt;
    trace.push(s.x);
    if (s.settled) break;
  }
  const stride = Math.max(1, Math.floor(trace.length / samples));
  const points = trace.filter((_, i) => i % stride === 0).map((v) => +v.toFixed(4));
  points[points.length - 1] = 1;
  return { easing: `linear(${points.join(', ')})`, seconds: +time.toFixed(3), peak: Math.max(...trace) };
}

export const prefersStill = () => {
  try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch { return false; }
};

/** Publish spring curves as CSS variables. Browsers without linear() keep the CSS fallbacks. */
export function installSpringCss() {
  try {
    if (!CSS.supports('transition-timing-function', 'linear(0, 1)')) return;
    const root = document.documentElement.style;
    for (const [name, preset] of [['soft', SOFT], ['snappy', SNAPPY], ['bouncy', BOUNCY]]) {
      const c = springCurve(preset);
      root.setProperty(`--ease-${name}`, c.easing);
      root.setProperty(`--dur-${name}`, `${c.seconds}s`);
    }
  } catch { /* CSS fallbacks apply */ }
}

/** Runs fn(dt) every frame until it returns false. Returns a function that stops it. */
export function animate(fn) {
  let raf = 0;
  let last = performance.now();
  const tick = (now) => {
    const dt = (now - last) / 1000;
    last = now;
    if (fn(dt) === false) return;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);
}
