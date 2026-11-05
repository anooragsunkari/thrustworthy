// The wiring plan for one build: power, motor order and which pad each device uses.
// No React here, so it can be tested under `node --test`. The starter settings read the same
// port choices, so the diagram and the file cannot disagree.
//
// Motor order and spin direction come from each firmware's mixer source, checked November 2026.
// Bearings are degrees clockwise from the front of the aircraft.

import { isIncluded, packFull, flight } from './engine.js';
import { partName } from '../data/parts.js';

const row = ([n, deg, dir]) => ({ n, deg, dir });
const SP_QUAD = [[1, 135, 'CW'], [2, 45, 'CCW'], [3, -135, 'CCW'], [4, -45, 'CW']];
const AP_QUAD = [[1, 45, 'CCW'], [2, -135, 'CCW'], [3, -45, 'CW'], [4, 135, 'CW']];
const AP_HEX = [[1, 90, 'CW'], [2, -90, 'CCW'], [3, -30, 'CW'], [4, 150, 'CCW'], [5, 30, 'CCW'], [6, -150, 'CW']];
const AP_OCTO = [[1, 22.5, 'CW'], [2, -157.5, 'CW'], [3, 67.5, 'CCW'], [4, 157.5, 'CCW'], [5, -22.5, 'CCW'], [6, -112.5, 'CCW'], [7, -67.5, 'CW'], [8, 112.5, 'CW']];

const place = (deg) => {
  const r = (deg * Math.PI) / 180;
  const front = Math.cos(r);
  const right = Math.sin(r);
  const a = front > 0.3 ? 'Front' : front < -0.3 ? 'Rear' : '';
  const b = right > 0.3 ? 'right' : right < -0.3 ? 'left' : '';
  const s = `${a} ${b}`.trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/** Motor numbers and spin directions, or null where we have not checked that combination. */
export function motorMap(firmware, mc = 4) {
  const tables = {
    Betaflight: { 4: SP_QUAD },
    INAV: { 4: SP_QUAD },
    ArduPilot: { 4: AP_QUAD, 6: AP_HEX, 8: AP_OCTO },
    PX4: { 4: AP_QUAD, 6: AP_HEX, 8: AP_OCTO },
  };
  const table = tables[firmware]?.[mc];
  return table ? table.map(row).map((m) => ({ ...m, where: place(m.deg) })) : null;
}

const PIX_PORTS = ['TELEM1', 'TELEM2', 'GPS1', 'GPS2'];
const isPix = (sel) => sel.fc?.mount === 'pixhawk';

/** The devices in this build that need a serial port. */
export function devicesOf(sel) {
  const out = [];
  if (sel.rx && !isIncluded(sel, 'rx')) out.push('rx');
  if (sel.video && sel.video.sys !== 'None' && !isIncluded(sel, 'video')) out.push('video');
  if (sel.gps) out.push('gps');
  if (sel.companion) out.push('companion');
  return out;
}

const sbus = (sel) => sel.rx?.proto === 'SBUS';

export function portOptions(sel, device) {
  if (isPix(sel)) return device === 'rx' && sbus(sel) ? ['RC IN', ...PIX_PORTS] : PIX_PORTS;
  return Array.from({ length: sel.fc?.u || 0 }, (_, i) => `UART${i + 1}`);
}

/** Which port each device uses: what the person saved if it is still valid, otherwise a free one. */
export function assignPorts(sel, saved = {}) {
  const devices = devicesOf(sel);
  const out = {};
  const taken = new Set();
  for (const d of devices) {
    if (saved[d] && portOptions(sel, d).includes(saved[d])) { out[d] = saved[d]; taken.add(saved[d]); }
  }
  const prefer = {
    gps: ['GPS1', 'GPS2'],
    companion: ['TELEM2', 'TELEM1'],
    rx: sbus(sel) ? ['RC IN'] : ['TELEM1', 'TELEM2'],
    video: ['GPS2', 'TELEM1'],
  };
  const order = isPix(sel) ? ['gps', 'companion', 'rx', 'video'] : ['rx', 'video', 'gps', 'companion'];
  for (const d of order) {
    if (!devices.includes(d) || out[d]) continue;
    const opts = portOptions(sel, d);
    const list = isPix(sel) ? [...prefer[d].filter((p) => opts.includes(p)), ...opts] : opts;
    const free = list.find((p) => !taken.has(p)) || null;
    out[d] = free;
    if (free) taken.add(free);
  }
  return out;
}

const pad = (port, name) => {
  if (!port) return name;
  const m = /^UART(\d+)$/.exec(port);
  return m ? `${name}${m[1]}` : `${port} ${name}`;
};

const wire = (from, to, kind, optional = false) => ({ from, to, kind, optional });
const crossed = (port) => [wire('TX', pad(port, 'RX'), 'signal'), wire('RX', pad(port, 'TX'), 'signal')];

function deviceWiring(sel, device, port) {
  const pix = isPix(sel);
  const power = pix ? 'Power board +' : 'VBAT';
  const gnd = pix ? 'Power board −' : 'GND';
  if (device === 'rx') {
    const name = partName(sel.rx);
    if (sbus(sel)) {
      return pix && port === 'RC IN'
        ? { label: 'Receiver', name, wires: [wire('SBUS', 'RC IN', 'signal'), wire('5V', 'RC IN 5V', 'five'), wire('GND', 'RC IN GND', 'ground')], notes: ['RC IN is a single plug that carries all three wires.'] }
        : { label: 'Receiver', name, wires: [wire('SBUS', pad(port, 'RX'), 'signal'), wire('5V', '5V', 'five'), wire('GND', 'GND', 'ground')], notes: ['Standard SBUS is an inverted signal. Use a pad marked SBUS if your board has one. Otherwise check its manual, because you may need an inverter.'] };
    }
    return {
      label: 'Receiver',
      name,
      wires: [...crossed(port), wire('5V', '5V', 'five'), wire('GND', 'GND', 'ground')],
      notes: ['TX goes to RX, and RX goes to TX. Avoid a UART your board reserves for SBUS, because its pull-down can stop the receiver from working.'],
    };
  }
  if (device === 'video') {
    const name = partName(sel.video);
    if (sel.video.sys === 'Analog') {
      return {
        label: 'Video',
        name,
        wires: [
          wire('VTX power', power, 'battery'), wire('VTX ground', gnd, 'ground'), wire('VTX control', pad(port, 'TX'), 'signal'),
          wire('VTX video', 'Video out', 'signal'), wire('Camera video', 'Camera in', 'signal'), wire('Camera 5V', '5V', 'five'), wire('Camera GND', 'GND', 'ground'),
        ],
        notes: ['Screw the antenna on before you apply power. A video transmitter can burn out without one.'],
      };
    }
    return {
      label: 'Video',
      name,
      wires: [wire('Power', power, 'battery'), wire('GND', gnd, 'ground'), ...crossed(port)],
      notes: [`Check that this unit is rated for your battery, ${sel.battery ? `${sel.battery.c}S` : 'once you pick one'}. Attach the antenna before you apply power.`],
    };
  }
  if (device === 'gps') {
    const plug = pix && sel.gps.conn === 'pixhawk';
    const notes = [];
    if (plug) notes.push(`This GPS comes with a plug that fits the ${port} port.`);
    else if (sel.gps.conn === 'pixhawk') notes.push('This GPS has a Pixhawk-style plug, so you will rewire it to these pads.');
    notes.push('Connect SDA and SCL only if your GPS has a compass.');
    return {
      label: 'GPS',
      name: partName(sel.gps),
      wires: [...crossed(port), wire('5V', '5V', 'five'), wire('GND', 'GND', 'ground'), wire('SDA', 'SDA', 'signal', true), wire('SCL', 'SCL', 'signal', true)],
      notes,
    };
  }
  return {
    label: 'Companion computer',
    name: partName(sel.companion),
    wires: [...crossed(port), wire('GND', 'GND', 'ground')],
    notes: ['Power the computer from its own 5 V regulator, never from the flight controller. Check that the logic levels match: most boards use 3.3 V.'],
  };
}

const CAP_VOLTS = [16, 25, 35, 50, 63, 100];

function powerPlan(sel) {
  const { battery, esc, fc, frame } = sel;
  if (!battery) return null;
  const aio = isIncluded(sel, 'esc');
  const single = esc?.t === 'single' && !aio;
  const full = packFull(battery);
  const volts = CAP_VOLTS.find((v) => v >= full * 1.25) || CAP_VOLTS[CAP_VOLTS.length - 1];
  const f = flight(sel);
  const peak = f ? f.peakA : 0;
  // FPV pulls its peak in short bursts. A large aircraft can hold it for minutes, so it needs thicker wire.
  const sustained = (frame?.wheel || 200) >= 400;
  const awg = sustained
    ? (peak < 30 ? 14 : peak < 60 ? 12 : peak < 100 ? 10 : 8)
    : (peak < 40 ? 18 : peak < 80 ? 16 : peak < 130 ? 14 : peak < 200 ? 12 : 10);
  const mc = frame?.mc || 4;
  const steps = [];
  if (aio) steps.push(`Solder the battery lead to the board's main power pads, red to + and black to −.`);
  else if (single) {
    steps.push(fc?.needsPM ? `Run the battery through the power module, then to the power distribution board.` : 'Solder the battery lead to the power distribution board, red to + and black to −.');
    steps.push(`Connect each of the ${mc} ESCs to the power board, red to + and black to −.`);
  } else if (fc?.needsPM) {
    steps.push('Run the battery through the power module, then to the ESC power pads, red to + and black to −.');
  } else {
    steps.push('Solder the battery lead to the ESC main power pads, red to + and black to −.');
  }
  if (fc?.needsPM) steps.push('Plug the power module into POWER1 on the flight controller.');
  if (!aio && esc) {
    if (fc?.mount === 'pixhawk') steps.push('Connect each ESC signal wire and ground to the flight controller PWM outputs, using the motor numbers below.');
    else if (single) steps.push('Connect each ESC signal wire and ground to the motor pads on the flight controller, using the motor numbers below.');
    else steps.push('Join the ESC to the flight controller with the stack cable. Check its pin order first, because not all cables match.');
  }
  steps.push('Motor wires go to the matching ESC pads. Their order sets the spin direction, which you can correct later.');
  return {
    aio,
    single,
    pm: !!fc?.needsPM,
    capacitor: aio ? null : { volts, min: 470 },
    awg: aio || (frame?.wheel || 200) < 100 ? null : awg,
    peak,
    steps,
  };
}

/** Everything the wiring page draws. `saved` holds the person's port choices. */
export function wiringPlan(sel, firmware, saved = {}) {
  const ports = assignPorts(sel, saved);
  const devices = devicesOf(sel).map((d) => ({ key: d, port: ports[d], options: portOptions(sel, d), ...deviceWiring(sel, d, ports[d]) }));
  const used = devices.map((d) => d.port).filter(Boolean);
  return {
    pixhawk: isPix(sel),
    power: powerPlan(sel),
    motors: motorMap(firmware, sel.frame?.mc || 4),
    mc: sel.frame?.mc || 4,
    devices,
    ports,
    conflicts: [...new Set(used.filter((p, i) => used.indexOf(p) !== i))],
    unassigned: devices.filter((d) => !d.port).map((d) => d.label),
  };
}
