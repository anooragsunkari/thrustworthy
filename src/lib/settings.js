// Starter settings for one build, as a file its firmware's tool can load.
//
// The rule here is to leave a setting out unless we are sure of it. Names and values were read
// from firmware source and official docs in November 2026, for the versions named in VERSIONS.
// Tuning is never included. Anything board-specific, or that we could not confirm, goes in
// `manual`, so the person sets it by hand. A wrong setting is worse than a missing one.

import { isIncluded } from './engine.js';
import { assignPorts } from './wiring.js';

export const VERSIONS = { Betaflight: '2026.6', INAV: '9.1', ArduPilot: 'Copter 4.7', PX4: '1.17' };

// Per-cell volts. LiHV uses the LiPo floor because no firmware publishes a LiHV figure.
const CELLS = {
  LiPo: { warn: 3.5, min: 3.3, full: 4.2, detect: 4.3 },
  LiHV: { warn: 3.5, min: 3.3, full: 4.35, detect: 4.4 },
  'Li-Ion': { warn: 3.0, min: 2.8, full: 4.1, detect: 4.3 },
};

const oneLine = (s) => String(s).replace(/[\r\n\t#]+/g, ' ').slice(0, 80);
const fileName = (name, ext) => `${String(name).replace(/[^\w-]+/g, '_').slice(0, 60) || 'build'}${ext}`;
const uartIndex = (port) => { const m = /^UART(\d+)$/.exec(port || ''); return m ? +m[1] - 1 : null; };

// ESCs that report RPM back. Stock BLHeli_S does not, and turning it on there stops motors spinning.
const bidirectional = (esc) => /AM32|BLHeli_32/.test(esc.fw || '') || /^Bluejay/.test(esc.fw || '');

const COMMON_MANUAL = ['Choose your radio, your arm switch and your flight modes.', 'Set failsafe, then test it with the props off.', 'Check motor order and direction with the props off.'];

function betaflight(sel, ports) {
  const lines = ['batch start'];
  const manual = [...COMMON_MANUAL];
  const aio = isIncluded(sel, 'esc');
  const serial = (port, mask, why) => {
    const i = uartIndex(port);
    if (i === null) return;
    lines.push(`# ${why}`, `serial ${i} ${mask} 115200 57600 0 115200`);
  };
  if (ports.rx) {
    lines.push('feature RX_SERIAL');
    serial(ports.rx, 64, `Receiver on ${ports.rx}`);
    lines.push(`set serialrx_provider = ${sel.rx.proto === 'SBUS' ? 'SBUS' : 'CRSF'}`);
  } else if (isIncluded(sel, 'rx')) {
    manual.push('Check that the built-in receiver works. The board target normally sets it up.');
  }
  if (ports.video) {
    if (sel.video.sys === 'Analog') {
      lines.push('feature OSD');
      if (sel.video.id === 'v-analog') serial(ports.video, 2048, `SmartAudio video control on ${ports.video}`);
      else manual.push(`Set ${ports.video} to your video transmitter's control protocol, either SmartAudio or Tramp.`);
    } else {
      lines.push('feature OSD');
      serial(ports.video, 131073, `Digital video on ${ports.video}`);
      lines.push('set osd_displayport_device = MSP', 'set vcd_video_system = HD');
    }
  }
  if (ports.gps) {
    lines.push('feature GPS');
    serial(ports.gps, 2, `GPS on ${ports.gps}`);
    if (/u-?blox/i.test(sel.gps.chip || '')) lines.push('set gps_provider = UBLOX');
    else manual.push('Set the GPS protocol to match your module.');
  }
  if (ports.companion) manual.push(`Set up ${ports.companion} for your companion computer. Betaflight has no offboard control.`);
  if (sel.esc && !aio) {
    if (sel.esc.dshot) {
      lines.push('# DShot300 works on every board here and is enough for a first flight', 'set motor_pwm_protocol = DSHOT300');
      if (bidirectional(sel.esc)) lines.push('set dshot_bidir = ON');
      else manual.push('Turn on bidirectional DShot only after flashing Bluejay onto your ESC. Stock BLHeli_S does not support it.');
    } else {
      manual.push('Set the motor protocol to match your ESC, which does not use DShot.');
    }
  } else if (aio) {
    manual.push('Keep the motor protocol your board target sets. It suits the built-in ESC.');
  }
  const c = CELLS[sel.battery.ch];
  lines.push(`# Battery: ${sel.battery.c}S ${sel.battery.ch}`);
  lines.push(`set vbat_max_cell_voltage = ${Math.round(c.detect * 100)}`, `set vbat_warning_cell_voltage = ${Math.round(c.warn * 100)}`, `set vbat_min_cell_voltage = ${Math.round(c.min * 100)}`);
  lines.push('batch end', 'save');
  manual.push('Set your video channel and power to legal values for your country.', 'Set board alignment if the arrow on the board does not point forward.');
  return { ext: '.txt', comment: '#', lines, manual, tool: 'Betaflight App', steps: ['Flash the latest stable firmware for your exact board target.', 'Check that your wiring matches the ports on the wiring page.', 'Take the props off, then connect the board over USB.', 'Open the CLI tab, paste everything below and press Enter.', 'It saves and reboots on its own. Check the Ports tab afterward.'] };
}

function inav(sel, ports) {
  const lines = ['batch start'];
  const manual = [...COMMON_MANUAL];
  const aio = isIncluded(sel, 'esc');
  const serial = (port, mask, why) => {
    const i = uartIndex(port);
    if (i === null) return;
    lines.push(`# ${why}`, `serial ${i} ${mask} 115200 115200 0 115200`);
  };
  if (ports.rx) {
    serial(ports.rx, 64, `Receiver on ${ports.rx}`);
    lines.push('set receiver_type = SERIAL', `set serialrx_provider = ${sel.rx.proto === 'SBUS' ? 'SBUS' : 'CRSF'}`);
  }
  if (ports.video) {
    lines.push('feature OSD');
    if (sel.video.sys === 'Analog') {
      if (sel.video.id === 'v-analog') serial(ports.video, 2048, `SmartAudio video control on ${ports.video}`);
      else manual.push(`Set ${ports.video} to your video transmitter's control protocol, either SmartAudio or Tramp.`);
    } else {
      serial(ports.video, 33554432, `Digital video on ${ports.video}`);
      if (sel.video.sys === 'HDZero') lines.push('set osd_video_system = HDZERO');
      else if (sel.video.sys === 'Walksnail') lines.push('set osd_video_system = AVATAR');
      else manual.push('Choose the OSD video system for your DJI unit, following the INAV DJI guide.');
    }
  }
  if (ports.gps) {
    lines.push('feature GPS');
    serial(ports.gps, 2, `GPS on ${ports.gps}`);
    if (/u-?blox/i.test(sel.gps.chip || '')) lines.push('set gps_provider = UBLOX');
    else manual.push('Set the GPS protocol to match your module.');
  }
  lines.push(`set failsafe_procedure = ${sel.gps ? 'RTH' : 'LAND'}`);
  if (ports.companion) manual.push(`Set up ${ports.companion} for your companion computer.`);
  if (sel.esc && !aio && sel.esc.dshot) lines.push('set motor_pwm_protocol = DSHOT300');
  else if (sel.esc && !aio) manual.push('Set the motor protocol to match your ESC, which does not use DShot.');
  const c = CELLS[sel.battery.ch];
  lines.push(`# Battery: ${sel.battery.c}S ${sel.battery.ch}`);
  lines.push(`set vbat_max_cell_voltage = ${Math.round(c.detect * 100)}`, `set vbat_warning_cell_voltage = ${Math.round(c.warn * 100)}`, `set vbat_min_cell_voltage = ${Math.round(c.min * 100)}`);
  lines.push('batch end', 'save');
  manual.unshift('Run the setup wizard first and choose the multirotor preset closest to your size, because this file does not set the mixer.');
  manual.push('Set your video channel and power to legal values for your country.');
  return { ext: '.txt', comment: '#', lines, manual, tool: 'INAV Configurator', steps: ['Flash the latest stable firmware for your exact board target.', 'Check that your wiring matches the ports on the wiring page.', 'Take the props off, then connect the board over USB.', 'Open the CLI tab, paste everything below and press Enter.', 'It saves and reboots on its own. Check the Ports tab afterward.'] };
}

const AP_FRAME = { 4: 1, 6: 2, 8: 3 };
const AP_SERIAL = { TELEM1: 1, TELEM2: 2, GPS1: 3, GPS2: 4 };

function ardupilot(sel, ports) {
  const c = CELLS[sel.battery.ch];
  const n = sel.battery.c;
  const v = (x) => +(x * n).toFixed(2);
  const lines = [];
  const manual = [...COMMON_MANUAL];
  const pix = sel.fc.mount === 'pixhawk';
  const aio = isIncluded(sel, 'esc');
  const hasPos = !!sel.gps;
  lines.push('# Frame', `FRAME_CLASS,${AP_FRAME[sel.frame?.mc || 4]}`, 'FRAME_TYPE,1');
  lines.push(`# Battery: ${n}S ${sel.battery.ch}`);
  lines.push(`MOT_BAT_VOLT_MAX,${v(c.full)}`, `MOT_BAT_VOLT_MIN,${v(c.min)}`, `BATT_CAPACITY,${sel.battery.cap}`, `BATT_LOW_VOLT,${v(c.min + 0.3)}`, `BATT_CRT_VOLT,${v(c.min + 0.2)}`);
  lines.push('# Failsafes', `BATT_FS_LOW_ACT,${hasPos ? 2 : 1}`, 'BATT_FS_CRT_ACT,1', `FS_THR_ENABLE,${hasPos ? 1 : 3}`);
  const proto = { rx: 23, gps: 5, companion: 2, video: 42 };
  const label = { rx: 'Receiver', gps: 'GPS', companion: 'Companion computer', video: 'Digital video' };
  const serialLines = [];
  for (const d of ['rx', 'gps', 'companion', 'video']) {
    const port = ports[d];
    if (!port) continue;
    if (d === 'rx' && port === 'RC IN') continue;
    if (d === 'video' && sel.video.sys === 'Analog') { manual.push('Set up video transmitter control by hand if you want it.'); continue; }
    if (pix) serialLines.push(`# ${label[d]} on ${port}`, `SERIAL${AP_SERIAL[port]}_PROTOCOL,${proto[d]}`);
    else {
      serialLines.push(`# ${label[d]} on ${port}: find its SERIAL number on your board's page, then set SERIALn_PROTOCOL to ${proto[d]}`);
      manual.push(`Set the SERIAL protocol for ${label[d].toLowerCase()} to ${proto[d]}. On this board UART numbers and SERIAL numbers do not line up, so use its ArduPilot hardware page.`);
    }
  }
  lines.push(...serialLines);
  if (sel.esc && !aio) {
    if (!sel.esc.dshot) lines.push('# Normal PWM', 'MOT_PWM_TYPE,0');
    else if (!pix) lines.push('# DShot300', 'MOT_PWM_TYPE,5');
    else manual.push('Choose the motor output type. This file leaves it at the default, because DShot depends on which outputs of your Pixhawk you use. PWM ESCs need calibrating.');
  }
  manual.push('Set up the battery monitor (BATT_MONITOR and its scale). It depends on your board and power module, and the battery failsafes do nothing without it.');
  if (sel.video && !['None', 'Analog'].includes(sel.video.sys)) manual.push('Turn on the on-screen display for your video system.');
  if (sel.companion) manual.push('Set the baud rate for the companion computer port to match the computer.');
  manual.push('Run the calibrations and the tuning process in order.');
  return { ext: '.param', comment: '#', lines, manual, tool: 'Mission Planner', steps: ['Load the latest stable Copter firmware.', 'Check that your wiring matches the ports on the wiring page.', 'Take the props off, then connect the board.', 'In Mission Planner, go to Config, then Full Parameter List, then Load from file.', 'Choose this file, press Write Params and reboot.'] };
}

const PX4_PORT = { TELEM1: 101, TELEM2: 102, GPS1: 201, GPS2: 202 };

function px4(sel, ports) {
  const c = CELLS[sel.battery.ch];
  const hasPos = !!sel.gps;
  const pix = sel.fc.mount === 'pixhawk';
  const rows = [
    ['BAT1_N_CELLS', sel.battery.c, 6],
    ['BAT1_CAPACITY', sel.battery.cap, 9],
    ['BAT1_V_EMPTY', sel.battery.ch === 'Li-Ion' ? 2.7 : 3.5, 9],
    ['COM_LOW_BAT_ACT', hasPos ? 3 : 2, 6],
    ['NAV_RCL_ACT', hasPos ? 2 : 3, 6],
  ];
  const manual = ['Choose your airframe in QGroundControl first, because this file does not set it.', ...COMMON_MANUAL];
  if (ports.gps) {
    if (pix && PX4_PORT[ports.gps]) rows.push(['GPS_1_CONFIG', PX4_PORT[ports.gps], 6]);
    else manual.push(`Set GPS_1_CONFIG for ${ports.gps}, using the port names for your board.`);
  }
  if (ports.companion) {
    const ros = /ROS/.test(sel.companion.ros || '');
    const name = ros ? 'UXRCE_DDS_CFG' : 'MAV_1_CONFIG';
    if (pix && PX4_PORT[ports.companion]) rows.push([name, PX4_PORT[ports.companion], 6]);
    else manual.push(`Set ${name} for ${ports.companion}, using the port names for your board.`);
    manual.push('Set the port baud rate to match the companion computer.');
  }
  if (ports.rx && ports.rx !== 'RC IN') manual.push(`Set up your ${sel.rx.proto} receiver on ${ports.rx}, following the PX4 radio guide.`);
  if (ports.video) manual.push('Set up your video system by hand, following the PX4 guide for it.');
  manual.push('Calibrate the battery voltage and current readings for your power module.', 'Assign your motor outputs and choose the ESC protocol in the Actuators tab.', 'Calibrate the sensors and your radio.');
  const lines = [
    '# Vehicle-Id Component-Id Name Value Type',
    ...rows.map(([name, value, type]) => [1, 1, name, value, type].join('\t')),
  ];
  return { ext: '.params', comment: '#', lines, manual, tool: 'QGroundControl', steps: ['Install the latest stable PX4, and choose your airframe.', 'Check that your wiring matches the ports on the wiring page.', 'Take the props off, then connect the board.', 'In QGroundControl, go to Parameters, then Tools, then Load from file.', 'Choose this file and restart the vehicle.'] };
}

const MAKERS = { Betaflight: betaflight, INAV: inav, ArduPilot: ardupilot, PX4: px4 };

/** Returns { ok: false, reason } or { ok: true, text, filename, steps, manual, tool, version }. */
export function starterSettings(project, sel) {
  const { firmware, name } = project;
  const make = MAKERS[firmware];
  if (!make) return { ok: false, reason: `We do not make settings for ${firmware}.` };
  if (!sel.fc || !sel.battery) return { ok: false, reason: 'Pick your flight controller and battery first, because the settings depend on them.' };
  if (sel.fc.fw && !sel.fc.fw.includes(firmware)) return { ok: false, reason: `This flight controller does not run ${firmware}. Change one of them first.` };
  const out = make(sel, assignPorts(sel, project.ports));
  const head = [
    `Thrustworthy starter settings for ${oneLine(name)}`,
    `${firmware} ${VERSIONS[firmware]}. Check every line before you use it.`,
    'Props off. No tuning is included. Not for any other build.',
  ].map((l) => `${out.comment} ${l}`);
  return {
    ok: true,
    text: `${[...head, ...out.lines].join('\n')}\n`,
    filename: fileName(name, out.ext),
    steps: out.steps,
    manual: out.manual,
    tool: out.tool,
    version: VERSIONS[firmware],
  };
}
