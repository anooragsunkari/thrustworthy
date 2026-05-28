# Multirotor.build

Interactive multi-rotor drone configurator with real-time compatibility checking, physics-based flight time estimation, and 3D component visualization.

**Live:** [lazyonbed.github.io/multirotor-build](https://lazyonbed.github.io/multirotor-build)

## Features

**3D Visualization** — 360° interactive drone viewer built with Three.js. Components appear as you select them. FC and ESC can be independently positioned above, between, or below the frame plates. Battery position and frame standoff height adapt dynamically.

**Compatibility Engine** — Real-time validation across 15+ rules: voltage ranges, current limits, C-rating adequacy, ESC/FC protocol matching, mounting pattern compatibility, VTX/camera ecosystem locks, and thrust-to-weight thresholds. Results are color-coded green (compatible), amber (warning), red (error).

**Flight Physics** — Momentum-theory hover power: `P = T^1.5 / √(2ρAN) / FM`. Includes Peukert discharge correction (k=1.05 LiPo, k=1.02 Li-Ion), ISA atmosphere density model, figure-of-merit prop efficiency, CG shift penalties from component placement, and frame material stiffness effects on vibration damping.

**Frame Materials** — Carbon fiber, aluminum 6061, 3D-printed TPU, fiberglass/FR4, and titanium. Each material has density and stiffness factors that affect frame weight, AUW, thrust-to-weight, and propeller efficiency through the figure of merit.

**Component Database** — 100+ real OEM parts across 9 categories: motors, ESCs, flight controllers, batteries, propellers, VTX, cameras, receivers, and GPS modules from T-Motor, EMAX, iFlight, Holybro, SpeedyBee, DJI, BetaFPV, and more.

## Supported Configurations

11 frame types (true-x, stretched-x, deadcat, h-frame, plus, v-shape, hex, octo, Y6, tricopter, bicopter) across 15 size classes from 65mm whoops to 15"+ industrial platforms.

## Quick Start

```bash
git clone https://github.com/lazyonbed/multirotor-build.git
cd multirotor-build
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build & Deploy

```bash
npm run build        # Creates dist/ folder
npm run preview      # Preview the production build locally
```

Pushing to `main` triggers automatic deployment to GitHub Pages via the included GitHub Actions workflow.

## Contributing Components

Fork the repo, add your component JSON to `src/App.jsx` in the appropriate database array (MOTORS, ESCS, FCS, etc.), and open a PR. Each component type has a defined schema — see the Upload modal in the app for required fields.

## Tech Stack

React 18, Three.js, Vite, DM Sans + DM Mono typography. Single-file architecture with no external state management. Light/dark theme toggle throughout.

## License

MIT
