# Thrustworthy

**Build a drone you can trust, from first idea to first flight.**

**Live:** [lazyonbed.github.io/thrustworthy](https://lazyonbed.github.io/thrustworthy/)

A free, phone-first guide for anyone building a multirotor. It starts by asking who you are, where you fly and what you want to do, then adapts everything to that.

**Author:** [Anoorag Sunkari](https://github.com/lazyonbed), who created the original Multirotor.build configurator, its parts database and its flight model.
**Contributor and maintainer:** [Chahat Deep Singh](https://github.com/chahatdeep).

## Who it is for

| You are | You get |
|---|---|
| New and curious | Plain language, simulator-first advice, a tiny safe first build |
| An FPV pilot | Live thrust, current and tip-speed checks across freestyle, racing and long-range |
| A filmmaker | Cinewhoops and sub-250 g rigs with honest flight times |
| A researcher or student | PX4 and ArduPilot, ROS 2, companion computers, simulation first, CSV parts lists |
| A teacher | Cheap repairable frames and step tracking on students' own phones |
| A professional | RTK, heavy lift, missions, and the rules that apply to commercial work |

**Firmware:** Betaflight, INAV, ArduPilot and PX4 each have their own setup steps, checks and troubleshooting. Anyone asking about Cleanflight gets told plainly what to use instead.

**Country:** the US, Canada, the UK, the EU, China, India, Australia, Japan and Brazil each get their own currency, shops, drone laws and radio limits. The checker warns about things like a sub-GHz radio that is illegal where you live.

The site loads no Google Fonts or foreign CDNs, so it does not depend on services that are often blocked.

## The journey

1. **Find** your starting point in four quick questions, or just browse.
2. **Learn** from reference builds, each with cost, weight, flight time, and what it can and cannot do.
3. **Configure** with a checker covering voltage, fit, current, tip speed, firmware, serial ports and local law. Add payload such as a camera, and enter your own parts when one is not listed.
4. **Get parts** with local prices and shops, the extras first-timers forget, and export as text, PDF, CSV or a link.
5. **Build** with a checklist generated for your exact parts, a wiring diagram showing power, motor order and each connection, tips, common mistakes and progress photos.
6. **Set up** firmware with step-by-step guides linked to the official docs, plus a starter settings file with your ports and battery limits filled in.
7. **Fly** with an "Am I legal?" list for your exact build and country, a pre-flight checklist that works offline, a flight log, a troubleshooter that goes one fix at a time, and a spares list with repair steps.
8. **Share** with a link holding your whole build, plus a community gallery through GitHub.
9. **Come back** to a dashboard with your builds, progress and badges, and compare any two builds side by side before you change anything.

**See it in 3D:** every build generates a to-scale model from its parts' specs. Turn it, zoom it, pull it apart into an exploded view, and tap any part for its specs, price, checks and shops. Each model has a link that opens in any browser, with no sign-up.

**Motion:** interface and 3D movement run on a small spring-physics engine (`src/lib/spring.js`) rather than fixed easing curves, and all of it honors the reduced-motion setting.

## What it deliberately does not do

It is a static site with no server, so there are no accounts, no live prices, no price-drop alerts and no one-click checkout across shops. Everything you do stays on your device, and you can move it with a backup file. Community discussion happens on GitHub. The gallery only ever shows real builds.

## Run it

```bash
npm install
npm run dev
npm test
npm run build
```

Pushing to `main` runs the tests and deploys to GitHub Pages.

## Project layout

```
src/lib/engine.js         Compatibility checks and flight physics, with no UI code
src/lib/model.js          Where each part sits in the 3D model, in millimeters
src/lib/spring.js         Spring physics for every animation
src/components/Drone3D.jsx  The 3D scene and its interaction
src/data/parts.js         Parts database
src/data/builds.js        Reference builds, each one tested against the engine
src/data/regions.js       Laws, radio limits, shops and currency by country
src/data/legal.js         The "Am I legal?" checklist for one build
src/data/spares.js        What breaks, how many spares to keep, and how to repair it
src/lib/wiring.js         Motor order, ports and wires for one build
src/lib/settings.js       Starter settings files, one maker per firmware
src/lib/compare.js        Two builds side by side
src/lib/custom.js         Validation for parts people enter themselves
src/data/firmware.js      Setup guides and official links
src/data/assembly.js      Build steps, selected by the features of your build
src/data/troubleshoot.js  Fixes, ordered by how likely they are
```

## Contributing

Specs, prices, laws and links all go out of date, and corrections are very welcome. Please include a source. To add a part, add it to `src/data/parts.js`.

Part figures are typical values and prices are rough estimates. Legal summaries were checked in November 2026 and are not legal advice.

## License

MIT, copyright Anoorag Sunkari.
