// Parts database. Started from Anoorag Sunkari's Multirotor.build database and restructured
// so each part states what the checker needs: cell range, mounting pattern and firmware support.
//
// `stock: 'low'` marks parts the maker or main retailers listed as discontinued or unavailable
// in November 2026. The checker tells people about it rather than hiding the part.
//
// All figures are typical values for comparison. Prices are rough USD street prices, and
// thrust figures come from manufacturer or community bench tests at the `ref` setup.
//
// motor.ref = { c: cells, d: prop inches, t: thrust per motor (g), a: peak amps per motor }

export const FRAMES = [
  { id: 'f-m65', b: 'BETAFPV', m: 'Meteor65 Pro', cat: 'whoop', mc: 4, wheel: 65, minProp: 1.1, maxProp: 1.3, w: 5, mount: ['6.6'], stack: ['25.5'], plug: 'BT2.0', p: 9 },
  { id: 'f-m75', b: 'BETAFPV', m: 'Meteor75 Pro', cat: 'whoop', mc: 4, wheel: 75, minProp: 1.4, maxProp: 1.7, w: 7, mount: ['6.6', '9'], stack: ['25.5'], plug: 'BT2.0', p: 10 },
  { id: 'f-smart35', b: 'GEPRC', m: 'SMART 35', cat: 'ultralight', mc: 4, wheel: 147, minProp: 3, maxProp: 3.5, w: 38, mount: ['9', '12'], stack: ['20', '25.5'], p: 45 },
  { id: 'f-protek35', b: 'iFlight', m: 'ProTek35', cat: 'cinewhoop', mc: 4, wheel: 151, minProp: 3.5, maxProp: 3.5, w: 95, mount: ['12', '16'], stack: ['20', '25.5', '30.5'], p: 60 },
  { id: 'f-cinelog35', b: 'GEPRC', m: 'Cinelog35', cat: 'cinewhoop', mc: 4, wheel: 142, minProp: 3.5, maxProp: 3.5, w: 80, mount: ['12', '16'], stack: ['20', '25.5', '30.5'], p: 70 },
  { id: 'f-source5', b: 'TBS', m: 'Source One V5 5"', cat: 'freestyle', mc: 4, wheel: 226, minProp: 4.5, maxProp: 5.1, w: 110, mount: ['16'], stack: ['20', '30.5'], p: 35 },
  { id: 'f-apex', b: 'ImpulseRC', m: 'Apex 5"', cat: 'freestyle', mc: 4, wheel: 224, minProp: 4.5, maxProp: 5.1, w: 125, mount: ['16'], stack: ['20', '30.5'], p: 75 },
  { id: 'f-nazgul5', b: 'iFlight', m: 'Nazgul Evoque F5', cat: 'freestyle', mc: 4, wheel: 223, minProp: 4.5, maxProp: 5.1, w: 130, mount: ['16'], stack: ['20', '30.5'], p: 60 },
  { id: 'f-source7', b: 'TBS', m: 'Source One V5 7"', cat: 'longrange', mc: 4, wheel: 295, minProp: 6, maxProp: 7.5, w: 150, mount: ['16', '19'], stack: ['20', '30.5'], p: 50 },
  { id: 'f-chimera7', b: 'iFlight', m: 'Chimera7 Pro', cat: 'longrange', mc: 4, wheel: 327, minProp: 6, maxProp: 7.5, w: 180, mount: ['16', '19'], stack: ['20', '30.5'], p: 90 },
  { id: 'f-x500', b: 'Holybro', m: 'X500 V2', cat: 'lab', mc: 4, wheel: 500, minProp: 9, maxProp: 11, w: 610, mount: ['16', '19', '25'], stack: ['30.5', 'pixhawk'], p: 150 },
  { id: 'f-f450', b: 'Generic', m: 'F450', cat: 'lab', mc: 4, wheel: 450, minProp: 8, maxProp: 10.5, w: 280, mount: ['16', '19'], stack: ['30.5', 'pixhawk'], p: 25 },
  { id: 'f-s500', b: 'Generic', m: 'S500', cat: 'lab', mc: 4, wheel: 500, minProp: 9, maxProp: 11, w: 405, mount: ['16', '19'], stack: ['30.5', 'pixhawk'], p: 45 },
  { id: 'f-t650', b: 'Tarot', m: 'Iron Man 650', cat: 'heavy', mc: 4, wheel: 650, minProp: 13, maxProp: 16, w: 480, mount: ['16', '19', '25'], stack: ['30.5', 'pixhawk'], p: 110 },
  { id: 'f-t680', b: 'Tarot', m: '680 Pro Hex', cat: 'heavy', mc: 6, wheel: 680, minProp: 11, maxProp: 13, w: 540, mount: ['16', '19', '25'], stack: ['30.5', 'pixhawk'], p: 140 },
  { id: 'f-tx8', b: 'Tarot', m: 'X8 Octo', cat: 'heavy', mc: 8, wheel: 1050, minProp: 15, maxProp: 18, w: 1500, mount: ['19', '25'], stack: ['30.5', 'pixhawk'], p: 350 },
];

export const MOTORS = [
  { id: 'm-ex0802', b: 'HappyModel', m: 'EX0802 19000KV', kv: 19000, sz: '0802', cMin: 1, cMax: 1, mount: '6.6', w: 2.5, ref: { c: 1, d: 1.22, t: 35, a: 4 }, p: 7 },
  { id: 'm-1102', b: 'BETAFPV', m: '1102 18000KV', kv: 18000, sz: '1102', cMin: 1, cMax: 1, mount: '6.6', w: 3.3, ref: { c: 1, d: 1.57, t: 55, a: 6 }, p: 9 },
  { id: 'm-th1103', b: 'EMAX', m: 'TH1103 7000KV', kv: 7000, sz: '1103', cMin: 1, cMax: 2, mount: '9', w: 4.5, ref: { c: 2, d: 2, t: 90, a: 7 }, p: 12 },
  { id: 'm-xing1404', b: 'iFlight', m: 'XING2 1404 3800KV', kv: 3800, sz: '1404', cMin: 3, cMax: 4, mount: '12', w: 9, ref: { c: 4, d: 3.5, t: 420, a: 15 }, p: 18 },
  { id: 'm-bf1404', b: 'BETAFPV', m: '1404 3800KV', kv: 3800, sz: '1404', cMin: 3, cMax: 4, mount: '12', w: 9, ref: { c: 4, d: 3.5, t: 400, a: 14 }, p: 15 },
  { id: 'm-f1507', b: 'T-Motor', m: 'F1507 3800KV', kv: 3800, sz: '1507', cMin: 3, cMax: 4, mount: '12', w: 14, ref: { c: 4, d: 3.5, t: 620, a: 22 }, p: 22 },
  { id: 'm-eco2207-4s', b: 'EMAX', m: 'ECO II 2207 2400KV', kv: 2400, sz: '2207', cMin: 3, cMax: 4, mount: '16', w: 33, ref: { c: 4, d: 5, t: 1400, a: 38 }, p: 16 },
  { id: 'm-eco2207', b: 'EMAX', m: 'ECO II 2207 1900KV', kv: 1900, sz: '2207', cMin: 4, cMax: 6, mount: '16', w: 33, ref: { c: 6, d: 5, t: 1420, a: 35 }, p: 17 },
  { id: 'm-eco2306', b: 'EMAX', m: 'ECO II 2306 1700KV', kv: 1700, sz: '2306', cMin: 4, cMax: 6, mount: '16', w: 32, ref: { c: 6, d: 5, t: 1400, a: 33 }, p: 18 },
  { id: 'm-xing2207', b: 'iFlight', m: 'XING2 2207 1855KV', kv: 1855, sz: '2207', cMin: 4, cMax: 6, mount: '16', w: 31.5, ref: { c: 6, d: 5, t: 1640, a: 40 }, p: 23 },
  { id: 'm-velox', b: 'T-Motor', m: 'Velox V3 2207 1950KV', kv: 1950, sz: '2207', cMin: 4, cMax: 6, mount: '16', w: 31, ref: { c: 6, d: 5, t: 1680, a: 40 }, p: 27 },
  { id: 'm-f60', b: 'T-Motor', m: 'F60 Pro V 1750KV', kv: 1750, sz: '2207', cMin: 4, cMax: 6, mount: '16', w: 34, ref: { c: 6, d: 5, t: 1750, a: 42 }, p: 35 },
  { id: 'm-speedx', b: 'GEPRC', m: 'SPEEDX2 2207.5 1960KV', kv: 1960, sz: '2207', cMin: 4, cMax: 6, mount: '16', w: 30, ref: { c: 6, d: 5, t: 1600, a: 38 }, p: 22 },
  { id: 'm-xing2806', b: 'iFlight', m: 'XING2 2806.5 1350KV', kv: 1350, sz: '2806', cMin: 4, cMax: 6, mount: '16', w: 42, ref: { c: 6, d: 7, t: 1900, a: 38 }, p: 28 },
  { id: 'm-avenger', b: 'BrotherHobby', m: 'Avenger 2812 900KV', kv: 900, sz: '2812', cMin: 4, cMax: 6, mount: '19', w: 48, ref: { c: 6, d: 7, t: 2100, a: 32 }, p: 45 },
  { id: 'm-x2216-920', b: 'Holybro', m: '2216 920KV', kv: 920, sz: '2216', cMin: 3, cMax: 4, mount: '19', w: 62, ref: { c: 4, d: 10, t: 900, a: 20 }, p: 25 },
  { id: 'm-2212', b: 'Generic', m: '2212 920KV', kv: 920, sz: '2212', cMin: 3, cMax: 4, mount: '16', w: 52, ref: { c: 3, d: 10, t: 800, a: 15 }, p: 10 },
  { id: 'm-x2216-1250', b: 'SunnySky', m: 'X2216 1250KV', kv: 1250, sz: '2216', cMin: 3, cMax: 4, mount: '19', w: 58, ref: { c: 4, d: 9, t: 1000, a: 22 }, p: 28 },
  { id: 'm-mn3508', b: 'T-Motor', m: 'MN3508 380KV', kv: 380, sz: '3508', cMin: 4, cMax: 6, mount: '25', w: 102, ref: { c: 6, d: 15, t: 2400, a: 18 }, p: 79 },
  { id: 'm-mn4014', b: 'T-Motor', m: 'MN4014 330KV', kv: 330, sz: '4014', cMin: 4, cMax: 6, mount: '25', w: 150, ref: { c: 6, d: 15, t: 3000, a: 30 }, p: 120 },
];

// t: '4in1' | 'single'. Single ESC prices are per ESC.
export const ESCS = [
  { id: 'e-bls35', b: 'SpeedyBee', m: 'BLS 35A Mini V2', t: '4in1', cMin: 3, cMax: 6, a: 35, fw: 'Bluejay', dshot: true, mount: '20', w: 7, p: 35 },
  { id: 'e-bls55', b: 'SpeedyBee', m: 'BLS 55A', t: '4in1', cMin: 3, cMax: 6, a: 55, fw: 'Bluejay', dshot: true, mount: '30.5', w: 14, p: 45, stock: 'low' },
  { id: 'e-tekko', b: 'Holybro', m: 'Tekko32 F4 45A', t: '4in1', cMin: 3, cMax: 6, a: 45, fw: 'BLHeli_32', dshot: true, mount: '30.5', w: 10, p: 42, legacy: true },
  { id: 'e-f55', b: 'T-Motor', m: 'F55A Pro II', t: '4in1', cMin: 3, cMax: 6, a: 55, fw: 'BLHeli_32', dshot: true, mount: '30.5', w: 14, p: 55, legacy: true },
  { id: 'e-xrotor60', b: 'Hobbywing', m: 'XRotor 60A 4in1', t: '4in1', cMin: 3, cMax: 6, a: 60, fw: 'BLHeli_32', dshot: true, mount: '30.5', w: 12, p: 65, legacy: true },
  { id: 'e-zeus80', b: 'HGLRC', m: 'Zeus 80A AM32', t: '4in1', cMin: 3, cMax: 8, a: 80, fw: 'AM32', dshot: true, mount: '30.5', w: 17, p: 62 },
  { id: 'e-blitz80', b: 'iFlight', m: 'BLITZ E80', t: '4in1', cMin: 3, cMax: 8, a: 80, fw: 'AM32', dshot: true, mount: '30.5', w: 18, p: 65 },
  { id: 'e-hb20', b: 'Holybro', m: 'BLHeli_S 20A', t: 'single', cMin: 2, cMax: 6, a: 20, fw: 'BLHeli_S', dshot: true, mount: 'arm', w: 9, p: 12 },
  { id: 'e-xr40', b: 'Hobbywing', m: 'XRotor Micro 40A', t: 'single', cMin: 3, cMax: 6, a: 40, fw: 'BLHeli_S', dshot: true, mount: 'arm', w: 12, p: 25 },
  { id: 'e-apd', b: 'APD', m: 'F Series 80F3', t: 'single', cMin: 4, cMax: 14, a: 80, fw: 'APD', dshot: true, mount: 'arm', w: 35, p: 149 },
  { id: 'e-alpha', b: 'T-Motor', m: 'ALPHA 60A', t: 'single', cMin: 6, cMax: 14, a: 60, fw: 'T-Motor FOC', dshot: false, mount: 'arm', w: 75, p: 129 },
  { id: 'e-pwm30', b: 'Generic', m: '30A PWM (SimonK)', t: 'single', cMin: 2, cMax: 4, a: 30, fw: 'SimonK', dshot: false, mount: 'arm', w: 25, p: 8 },
];

// aio: board includes an ESC of `aio` amps per motor. includes: other slots it covers.
export const FCS = [
  { id: 'fc-matrix', b: 'BETAFPV', m: 'Matrix 1S AIO', mcu: 'STM32G473', flash: 0.5, imu: 'ICM42688P', cMin: 1, cMax: 1, u: 3, fw: ['Betaflight'], mount: '25.5', w: 3, aio: 5, includes: ['esc', 'rx'], p: 45, stock: 'low' },
  { id: 'fc-f4-2s', b: 'HappyModel', m: 'CrazyF411 ELRS AIO', mcu: 'STM32F411', flash: 0.5, imu: 'ICM42688P', cMin: 1, cMax: 2, u: 2, fw: ['Betaflight'], mount: '25.5', w: 4.5, aio: 12, includes: ['esc', 'rx'], p: 45 },
  { id: 'fc-sb405mini', b: 'SpeedyBee', m: 'F405 Mini', mcu: 'STM32F405', flash: 1, imu: 'ICM42688P', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight', 'INAV', 'ArduPilot'], mount: '20', w: 6, p: 35 },
  { id: 'fc-sb405v5', b: 'SpeedyBee', m: 'F405 V5', mcu: 'STM32F405', flash: 1, imu: 'ICM42688P', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight', 'ArduPilot'], mount: '30.5', w: 7, p: 45 },
  { id: 'fc-sb405', b: 'SpeedyBee', m: 'F405 V4', mcu: 'STM32F405', flash: 1, imu: 'ICM42688P', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight', 'INAV', 'ArduPilot'], mount: '30.5', w: 7, p: 40, stock: 'low' },
  { id: 'fc-kh7mini', b: 'Holybro', m: 'Kakute H7 Mini', mcu: 'STM32H743', flash: 2, imu: 'BMI270', cMin: 2, cMax: 6, u: 6, fw: ['Betaflight', 'INAV', 'ArduPilot', 'PX4'], mount: '20', w: 6, p: 50 },
  { id: 'fc-kh7', b: 'Holybro', m: 'Kakute H7 V2', mcu: 'STM32H743', flash: 2, imu: 'BMI270', cMin: 2, cMax: 6, u: 6, fw: ['Betaflight', 'INAV', 'ArduPilot', 'PX4'], mount: '30.5', w: 8, p: 65, stock: 'low' },
  { id: 'fc-matek', b: 'Matek', m: 'H743-SLIM V3', mcu: 'STM32H743', flash: 2, imu: 'ICM42688P', cMin: 3, cMax: 8, u: 7, fw: ['Betaflight', 'INAV', 'ArduPilot'], mount: '30.5', w: 10, p: 65 },
  { id: 'fc-zeusf7', b: 'iFlight', m: 'Blitz F7 Pro', mcu: 'STM32F722', flash: 0.5, imu: 'BMI270', cMin: 3, cMax: 6, u: 6, fw: ['Betaflight', 'INAV'], mount: '30.5', w: 8, p: 42 },
  { id: 'fc-6c', b: 'Holybro', m: 'Pixhawk 6C', mcu: 'STM32H743', flash: 2, imu: 'ICM42688P + BMI055', cMin: 2, cMax: 12, u: 7, fw: ['PX4', 'ArduPilot'], mount: 'pixhawk', w: 60, needsPM: true, p: 190 },
  { id: 'fc-6x', b: 'Holybro', m: 'Pixhawk 6X', mcu: 'STM32H753', flash: 2, imu: 'Triple redundant', cMin: 2, cMax: 12, u: 8, fw: ['PX4', 'ArduPilot'], mount: 'pixhawk', w: 75, needsPM: true, p: 299 },
  { id: 'fc-cube', b: 'CubePilot', m: 'Cube Orange+', mcu: 'STM32H757', flash: 2, imu: 'Triple redundant', cMin: 2, cMax: 12, u: 8, fw: ['ArduPilot', 'PX4'], mount: 'pixhawk', w: 75, needsPM: true, p: 399 },
];

export const PROPS = [
  { id: 'p-31', b: 'Gemfan', m: '31mm 3-blade', bl: 3, d: 1.22, pi: 0.9, w: 0.25, p: 1 },
  { id: 'p-40', b: 'Gemfan', m: '40mm 4-blade', bl: 4, d: 1.57, pi: 1, w: 0.4, p: 1 },
  { id: 'p-3', b: 'Gemfan', m: '3016 3-blade', bl: 3, d: 3, pi: 1.6, w: 1.6, p: 1 },
  { id: 'p-d90', b: 'Gemfan', m: 'D90 ducted 3.5"', bl: 5, d: 3.5, pi: 2, w: 2.5, p: 2 },
  { id: 'p-hq35', b: 'HQProp', m: 'T3.5x2x3', bl: 3, d: 3.5, pi: 2, w: 1.8, p: 2 },
  { id: 'p-hq5', b: 'HQProp', m: '5x4.3x3 V2S', bl: 3, d: 5, pi: 4.3, w: 4.5, p: 2 },
  { id: 'p-gf5', b: 'Gemfan', m: '51466 Hurricane', bl: 3, d: 5.1, pi: 4.66, w: 4.2, p: 2 },
  { id: 'p-eth5', b: 'Ethix', m: 'S5 Light', bl: 3, d: 5, pi: 4, w: 3.8, p: 3 },
  { id: 'p-gf6', b: 'Gemfan', m: '6030 2-blade', bl: 2, d: 6, pi: 3, w: 5, p: 2 },
  { id: 'p-hq7', b: 'HQProp', m: '7x3.5x3 LR', bl: 3, d: 7, pi: 3.5, w: 8.5, p: 3 },
  { id: 'p-1045', b: 'Generic', m: '1045 2-blade', bl: 2, d: 10, pi: 4.5, w: 12, p: 2 },
  { id: 'p-apc10', b: 'APC', m: '10x4.7 MR', bl: 2, d: 10, pi: 4.7, w: 15, p: 8 },
  { id: 'p-tm13', b: 'T-Motor', m: 'P13x4.4 CF', bl: 2, d: 13, pi: 4.4, w: 18, p: 25 },
  { id: 'p-tm15', b: 'T-Motor', m: 'P15x5 CF', bl: 2, d: 15, pi: 5, w: 22, p: 35 },
  { id: 'p-tm18', b: 'T-Motor', m: 'P18x6.1 CF', bl: 2, d: 18, pi: 6.1, w: 32, p: 55 },
];

// ch: LiPo | LiHV | Li-Ion. dr = rated continuous C.
export const BATTERIES = [
  { id: 'b-1s300', b: 'BETAFPV', m: 'BT2.0 300mAh 1S', c: 1, ch: 'LiHV', cap: 300, dr: 75, w: 8.5, cn: 'BT2.0', p: 6 },
  { id: 'b-1s450', b: 'BETAFPV', m: 'BT2.0 450mAh 1S', c: 1, ch: 'LiHV', cap: 450, dr: 75, w: 12, cn: 'BT2.0', p: 7 },
  { id: 'b-1s530', b: 'GNB', m: '530mAh 1S HV', c: 1, ch: 'LiHV', cap: 530, dr: 90, w: 14, cn: 'BT2.0', p: 8 },
  { id: 'b-2s450', b: 'GNB', m: '450mAh 2S', c: 2, ch: 'LiHV', cap: 450, dr: 90, w: 27, cn: 'XT30', p: 10 },
  { id: 'b-3s850', b: 'GNB', m: '850mAh 3S', c: 3, ch: 'LiPo', cap: 850, dr: 75, w: 65, cn: 'XT30', p: 18 },
  { id: 'b-3s2200', b: 'Gens Ace', m: '2200mAh 3S', c: 3, ch: 'LiPo', cap: 2200, dr: 25, w: 175, cn: 'XT60', p: 25 },
  { id: 'b-3s5000', b: 'Gens Ace', m: '5000mAh 3S', c: 3, ch: 'LiPo', cap: 5000, dr: 45, w: 330, cn: 'XT60', p: 45 },
  { id: 'b-4s660', b: 'GNB', m: '660mAh 4S HV', c: 4, ch: 'LiHV', cap: 660, dr: 90, w: 78, cn: 'XT30', p: 22 },
  { id: 'b-4s850', b: 'Tattu', m: 'R-Line 850mAh 4S', c: 4, ch: 'LiPo', cap: 850, dr: 95, w: 97, cn: 'XT30', p: 26 },
  { id: 'b-4s1050', b: 'Tattu', m: 'R-Line 1050mAh 4S', c: 4, ch: 'LiPo', cap: 1050, dr: 120, w: 118, cn: 'XT60', p: 32 },
  { id: 'b-4s1550', b: 'Ovonic', m: '1550mAh 4S', c: 4, ch: 'LiPo', cap: 1550, dr: 100, w: 174, cn: 'XT60', p: 28 },
  { id: 'b-4s5000', b: 'Gens Ace', m: '5000mAh 4S', c: 4, ch: 'LiPo', cap: 5000, dr: 45, w: 435, cn: 'XT60', p: 60 },
  { id: 'b-4s42', b: 'Molicel', m: 'P42A 4S1P pack', c: 4, ch: 'Li-Ion', cap: 4200, dr: 10, w: 290, cn: 'XT60', p: 55 },
  { id: 'b-6s1300', b: 'Tattu', m: 'R-Line V5 1300mAh 6S', c: 6, ch: 'LiPo', cap: 1300, dr: 150, w: 195, cn: 'XT60', p: 44 },
  { id: 'b-6s1500', b: 'CNHL', m: 'Black 1500mAh 6S', c: 6, ch: 'LiPo', cap: 1500, dr: 100, w: 210, cn: 'XT60', p: 38 },
  { id: 'b-6s1550', b: 'Ovonic', m: '1550mAh 6S', c: 6, ch: 'LiPo', cap: 1550, dr: 100, w: 228, cn: 'XT60', p: 35 },
  { id: 'b-6s42', b: 'Molicel', m: 'P42A 6S1P pack', c: 6, ch: 'Li-Ion', cap: 4200, dr: 10, w: 420, cn: 'XT60', p: 85 },
  { id: 'b-6s84', b: 'Molicel', m: 'P42A 6S2P pack', c: 6, ch: 'Li-Ion', cap: 8400, dr: 10, w: 830, cn: 'XT60', p: 165 },
  { id: 'b-6s10k', b: 'CNHL', m: '10000mAh 6S', c: 6, ch: 'LiPo', cap: 10000, dr: 40, w: 1280, cn: 'XT90', p: 149 },
  { id: 'b-6s16k', b: 'Tattu', m: 'Plus 16000mAh 6S', c: 6, ch: 'LiPo', cap: 16000, dr: 15, w: 1950, cn: 'AS150', p: 289 },
];

// A matched camera and transmitter, so nobody can buy a pair that cannot talk to each other.
export const VIDEO = [
  { id: 'v-none', b: 'None', m: 'No video (line-of-sight or autonomy)', sys: 'None', cMin: 1, cMax: 14, w: 0, mw: 0, lat: 0, pw: 0, p: 0 },
  { id: 'v-whoop', b: 'BETAFPV', m: 'C03 camera + A03 VTX', sys: 'Analog', cMin: 1, cMax: 2, w: 3, mw: 400, lat: 20, pw: 1, p: 35 },
  { id: 'v-analog', b: 'Foxeer + Rush', m: 'Razer Mini + Tank Solo', sys: 'Analog', cMin: 2, cMax: 6, w: 14, mw: 800, lat: 20, pw: 3, p: 50 },
  { id: 'v-hdz', b: 'HDZero', m: 'Race V3 + Micro V3', sys: 'HDZero', cMin: 2, cMax: 6, w: 15, mw: 400, lat: 4, pw: 5, p: 150 },
  { id: 'v-hdzw', b: 'HDZero', m: 'Whoop Lite + Nano', sys: 'HDZero', cMin: 1, cMax: 2, w: 5, mw: 200, lat: 4, pw: 3, p: 110 },
  { id: 'v-ws', b: 'Walksnail', m: 'Avatar HD V2 kit', sys: 'Walksnail', cMin: 2, cMax: 6, w: 30, mw: 1200, lat: 22, pw: 8, p: 180 },
  { id: 'v-o3', b: 'DJI', m: 'O3 Air Unit', sys: 'DJI', cMin: 3, cMax: 6, w: 36, mw: 700, lat: 28, pw: 9, p: 229 },
  { id: 'v-o4', b: 'DJI', m: 'O4 Air Unit', sys: 'DJI', cMin: 2, cMax: 6, w: 10, mw: 700, lat: 22, pw: 5, p: 110 },
  { id: 'v-o4p', b: 'DJI', m: 'O4 Air Unit Pro', sys: 'DJI', cMin: 2, cMax: 6, w: 33, mw: 1000, lat: 22, pw: 10, p: 230 },
];

export const RECEIVERS = [
  { id: 'r-ep2', b: 'HappyModel', m: 'EP2 ELRS 2.4 GHz', proto: 'ELRS', band: '2.4', w: 1, p: 14 },
  { id: 'r-rp1', b: 'RadioMaster', m: 'RP1 ELRS 2.4 GHz', proto: 'ELRS', band: '2.4', w: 1, p: 14 },
  { id: 'r-rp4', b: 'RadioMaster', m: 'RP4TD diversity 2.4 GHz', proto: 'ELRS', band: '2.4', w: 3.5, p: 20 },
  { id: 'r-bf900', b: 'BETAFPV', m: 'Nano ELRS 868/915 MHz', proto: 'ELRS', band: 'sub', w: 2, p: 22 },
  { id: 'r-cf', b: 'TBS', m: 'Crossfire Nano 868/915 MHz', proto: 'CRSF', band: 'sub', w: 2, p: 30 },
  { id: 'r-xsr', b: 'FrSky', m: 'R-XSR (SBUS)', proto: 'SBUS', band: '2.4', w: 1.5, p: 25, legacy: true },
];

export const GPS = [
  { id: 'g-m10q', b: 'Matek', m: 'M10Q-5883 + compass', chip: 'u-blox M10', w: 8, p: 28 },
  { id: 'g-hbm10', b: 'Holybro', m: 'M10 GPS', chip: 'u-blox M10', w: 33, p: 45, conn: 'pixhawk' },
  { id: 'g-bn880', b: 'Beitian', m: 'BN-880', chip: 'u-blox M8', w: 18, p: 22 },
  { id: 'g-rtk', b: 'Holybro', m: 'H-RTK F9P', chip: 'u-blox F9P RTK', w: 52, p: 249, rtk: true, conn: 'pixhawk' },
];

export const COMPANIONS = [
  { id: 'c-pi02', b: 'Raspberry Pi', m: 'Zero 2 W', w: 11, pw: 2.5, ros: 'Telemetry bridge', p: 18 },
  { id: 'c-pi5', b: 'Raspberry Pi', m: 'Pi 5 (4 GB)', w: 46, pw: 7, ros: 'ROS 2, light vision', p: 70 },
  { id: 'c-orin', b: 'NVIDIA', m: 'Jetson Orin Nano + carrier', w: 180, pw: 15, ros: 'ROS 2, onboard neural nets', p: 520 },
];

export const SLOTS = [
  { key: 'frame', label: 'Frame', hint: 'Sets the size of everything else', list: FRAMES, required: true },
  { key: 'motor', label: 'Motors', hint: 'Price shown for the full set', list: MOTORS, required: true },
  { key: 'esc', label: 'ESC', hint: 'Turns flight controller commands into motor power', list: ESCS, required: true },
  { key: 'fc', label: 'Flight controller', hint: 'The brain, and it decides your firmware options', list: FCS, required: true },
  { key: 'prop', label: 'Props', hint: 'Price shown for one flying set', list: PROPS, required: true },
  { key: 'battery', label: 'Battery', hint: 'Sets voltage and flight time', list: BATTERIES, required: true },
  { key: 'video', label: 'Camera and video', hint: 'Sold here as matched pairs', list: VIDEO, required: false },
  { key: 'rx', label: 'Receiver', hint: 'The link to your radio controller', list: RECEIVERS, required: true },
  { key: 'gps', label: 'GPS', hint: 'Return-to-home and missions', list: GPS, required: false },
  { key: 'companion', label: 'Companion computer', hint: 'For ROS 2, vision and autonomy', list: COMPANIONS, required: false },
];

export const FIRMWARES = ['Betaflight', 'INAV', 'ArduPilot', 'PX4'];

export const GOALS = [
  { id: 'whoop', label: 'Indoor and tiny', twr: 2.5, fly: [0.6, 0.8] },
  { id: 'freestyle', label: 'Freestyle', twr: 4, fly: [0.35, 0.5] },
  { id: 'race', label: 'Racing', twr: 6, fly: [0.25, 0.35] },
  { id: 'cine', label: 'Filming', twr: 3, fly: [0.55, 0.7] },
  { id: 'longrange', label: 'Long range', twr: 2.5, fly: [0.8, 1.0] },
  { id: 'lab', label: 'Research and autonomy', twr: 2, fly: [0.85, 0.95] },
  { id: 'heavy', label: 'Payload and mapping', twr: 2, fly: [0.85, 0.95] },
];

const INDEX = {};
for (const s of SLOTS) for (const item of s.list) INDEX[item.id] = { ...item, slot: s.key };
export const partById = (id) => INDEX[id] || null;
export const partName = (p) => (p ? `${p.b} ${p.m}`.replace(/^None /, '') : '');
