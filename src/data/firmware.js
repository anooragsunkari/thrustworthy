// Firmware guides. Versions and links were checked on 2026-11-04.
const BF = 'https://betaflight.com/docs/wiki';
const IN = 'https://github.com/iNavFlight/inav';
const AP = 'https://ardupilot.org/copter/docs';
const APD = 'https://ardupilot.org/dev/docs';
const PX = 'https://docs.px4.io/main/en';

export const CHECKED = 'November 2026';

const commonPreflight = [
  'Props are tight, undamaged and on the correct motors',
  'Battery is charged, not puffed, and strapped down',
  'Radio is on before the drone gets power',
  'Failsafe tested with props off',
  'Antennas are secure and clear of props',
  'People, pets and cars are clear of the area',
  'Weather and airspace are checked for today',
];

export const FW = {
  Betaflight: {
    id: 'Betaflight',
    name: 'Betaflight',
    tag: 'The FPV standard, for freestyle and racing, with the largest community.',
    version: '2026.6',
    bestFor: ['Freestyle, racing and cinewhoops', 'Sharp stick feel', 'Finding answers fast, thanks to a huge community'],
    notFor: ['Waypoint missions', 'Autonomy or ROS'],
    tool: { name: 'Betaflight App', url: 'https://app.betaflight.com' },
    toolNote: 'It runs in a Chromium browser with no install. Desktop builds also exist on the release page.',
    links: [
      ['Documentation', BF],
      ['Tuning guide', `${BF}/guides/current/PID-Tuning-Guide`],
      ['Supported boards', 'https://betaflight.com/docs/category/boards'],
      ['Simulation (SITL)', 'https://betaflight.com/docs/development/SITL'],
    ],
    steps: [
      { id: 'flash', title: 'Flash the firmware', do: ['Open the Betaflight App and connect the board over USB.', 'In the Firmware Flasher, pick the exact target for your board, with the latest stable release.', 'Include the radio protocol and options you need when it asks, then flash.'], link: `${BF}/getting-started/firmware-installation` },
      { id: 'ports', title: 'Set your ports', do: ['Turn on Serial RX for the UART your receiver is on.', 'Turn on your video control protocol and GPS on their UARTs.', 'Save and reboot.'], link: `${BF}/getting-started/setup-guide` },
      { id: 'config', title: 'Configure the basics', do: ['Set ESC protocol to DShot300 or DShot600 and turn on bidirectional DShot.', 'Set board alignment if the arrow is not facing forward.', 'Calibrate the accelerometer on a level surface.'], link: `${BF}/getting-started/setup-guide` },
      { id: 'radio', title: 'Set up the radio', do: ['Bind the receiver and check that sticks move in the Receiver tab in the right order.', 'Set a switch to arm in Modes, and add a mode such as Angle for learning.', 'Set failsafe and test it with props off.'], link: `${BF}/getting-started/setup-guide` },
      { id: 'motors', title: 'Test motors with props off', do: ['Enable motor test and spin one motor at a time at low speed.', 'Compare order and direction with the on-screen diagram.', 'Fix direction in ESC settings or by swapping two motor wires.'], link: `${BF}/app/motors-tab` },
      { id: 'video', title: 'Set up video and battery alarm', do: ['Set the on-screen display elements in the OSD tab.', 'Set your VTX channel and power to legal values for your country.', 'Set the low-voltage warning.'], link: `${BF}/getting-started/setup-guide` },
      { id: 'tune', title: 'Do a first hover', do: ['Fly on default tuning in an open area.', 'Land after 60 seconds and check motor temperature by touch.', 'Only tune once it flies well on the defaults.'], link: `${BF}/guides/current/PID-Tuning-Guide` },
    ],
    preflight: ['Bidirectional DShot and RPM filter are on', 'Arm switch is off'],
  },
  INAV: {
    id: 'INAV',
    name: 'INAV',
    tag: 'FPV with GPS: return-to-home, position hold and waypoints.',
    version: '9.1',
    bestFor: ['Long-range and exploring', 'Return-to-home on signal loss', 'Waypoint missions on FPV hardware'],
    notFor: ['Top-tier freestyle feel', 'Research with ROS 2'],
    tool: { name: 'INAV Configurator', url: 'https://github.com/iNavFlight/inav-configurator/releases' },
    toolNote: 'The major version of the Configurator must match your firmware. INAV dropped F411 from official releases, so choose an F405, F722 or H7 board.',
    links: [
      ['Documentation', `${IN}/wiki`],
      ['Tuning guide', `${IN}/wiki/PID-tuning`],
      ['Supported hardware', `${IN}/wiki/Hardware-support`],
      ['Simulation (SITL)', `${IN}/blob/master/docs/SITL/SITL.md`],
    ],
    steps: [
      { id: 'flash', title: 'Flash the firmware', do: ['Install INAV Configurator, then open Firmware Flasher.', 'Select your board target and the latest stable version, then flash.', 'Use full chip erase if you are moving from another firmware.'], link: `${IN}/blob/master/docs/Installation.md` },
      { id: 'wizard', title: 'Run the setup wizard', do: ['Choose the multirotor preset closest to your size.', 'Set your receiver, GPS and battery in the wizard.', 'Save and reboot.'], link: `${IN}/wiki/Getting-started` },
      { id: 'cal', title: 'Calibrate the sensors', do: ['Run the six-position accelerometer calibration.', 'Calibrate the compass outside, away from metal.', 'Check the on-screen model follows the real drone.'], link: `${IN}/wiki/Getting-started` },
      { id: 'motors', title: 'Test motors with props off', do: ['Use the Outputs tab and spin one motor at a time.', 'Check order and direction against the mixer diagram.'], link: `${IN}/blob/master/docs/Mixer.md` },
      { id: 'modes', title: 'Set flight modes', do: ['Assign switches for Arm, Angle, Altitude Hold and Position Hold.', 'Assign a switch for Return-to-Home.', 'Set up failsafe to return home, and test it with props off.'], link: `${IN}/wiki/Getting-started` },
      { id: 'gps', title: 'Get a GPS lock and test', do: ['Wait for a solid satellite count outside.', 'Hover first, then try Altitude Hold and Position Hold.', 'Test Return-to-Home at short range before you trust it.'], link: `${IN}/wiki/Getting-started` },
    ],
    preflight: ['GPS has a solid fix and home is set', 'Return-to-Home altitude clears nearby trees', 'Compass direction matches the real heading'],
  },
  ArduPilot: {
    id: 'ArduPilot',
    name: 'ArduPilot',
    tag: 'The full autopilot, for missions, payloads and many vehicle types.',
    version: 'Copter 4.7',
    bestFor: ['Mapping and missions', 'Commercial and heavy-lift aircraft', 'Teaching a complete autopilot', 'ROS 2 and companion computers'],
    notFor: ['Quick acrobatic setup', 'Boards with less than 1 MB of flash'],
    tool: { name: 'Mission Planner', url: 'https://ardupilot.org/planner' },
    toolNote: 'Mission Planner runs on Windows. QGroundControl works on Windows, macOS, Linux, iOS and Android.',
    links: [
      ['Documentation', 'https://ardupilot.org/copter/'],
      ['Tuning process', `${AP}/tuning-process-instructions.html`],
      ['Supported boards', `${AP}/common-autopilots.html`],
      ['Simulation (SITL)', `${APD}/sitl-simulator-software-in-the-loop.html`],
    ],
    research: [
      ['ROS 2 guide', `${APD}/ros2.html`],
      ['ROS 2 with SITL', `${APD}/ros2-sitl.html`],
      ['ROS 2 with Gazebo', `${APD}/ros2-gazebo.html`],
      ['pymavlink', 'https://github.com/ArduPilot/pymavlink'],
      ['MAVSDK', 'https://mavsdk.mavlink.io/main/en/'],
    ],
    steps: [
      { id: 'flash', title: 'Load the firmware', do: ['Install Mission Planner or QGroundControl.', 'Connect over USB and use Install Firmware to load Copter.', 'Pick your frame type: quad, hex or octo.'], link: `${AP}/common-loading-firmware-onto-pixhawk.html` },
      { id: 'frame', title: 'Set frame and accelerometer', do: ['Set the frame class and type to match your aircraft.', 'Run the accelerometer calibration, then the level calibration.'], link: `${AP}/initial-setup.html` },
      { id: 'compass', title: 'Calibrate the compass', do: ['Run the onboard compass calibration outside, away from metal.', 'Rotate the drone through all axes until it finishes.', 'Reboot.'], link: `${AP}/initial-setup.html` },
      { id: 'radio', title: 'Calibrate the radio', do: ['Move each stick and switch to its full range.', 'Assign flight modes such as Stabilize, AltHold, Loiter and RTL.', 'Set up the radio failsafe and the battery failsafe.'], link: `${AP}/initial-setup.html` },
      { id: 'esc', title: 'Set up ESCs and test motors', do: ['Props off. Calibrate ESCs if yours use PWM, or set up DShot.', 'Use Motor Test to spin each one and check order against the frame diagram.', 'Note that ArduPilot motor numbers may not match other firmware.'], link: `${AP}/connect-escs-and-motors.html` },
      { id: 'hover', title: 'First hover and autotune', do: ['Hover in Stabilize, then land and review the log for vibration.', 'Run the tuning process step by step.', 'Try AltHold and Loiter once it feels stable.'], link: `${AP}/tuning-process-instructions.html` },
    ],
    preflight: ['No red PreArm messages', 'GPS has a good fix and EKF status is healthy', 'Geofence and RTL altitude are set', 'Battery failsafe is set'],
  },
  PX4: {
    id: 'PX4',
    name: 'PX4',
    tag: 'The research favorite, with strong ROS 2 and simulation support.',
    version: '1.17',
    bestFor: ['Robotics research and autonomy', 'ROS 2 with uXRCE-DDS', 'Moving code from simulation to hardware'],
    notFor: ['Acrobatic FPV', 'Quick builds on small FPV boards'],
    tool: { name: 'QGroundControl', url: 'https://qgroundcontrol.com' },
    toolNote: 'QGroundControl runs on Windows, macOS, Linux, iOS and Android.',
    links: [
      ['Documentation', `${PX}/`],
      ['Tuning guide', `${PX}/config_mc/pid_tuning_guide_multicopter`],
      ['Supported boards', `${PX}/flight_controller/`],
      ['Simulation', `${PX}/simulation/`],
    ],
    research: [
      ['ROS 2 user guide', `${PX}/ros2/user_guide`],
      ['uXRCE-DDS bridge', `${PX}/middleware/uxrce_dds`],
      ['Gazebo simulation', `${PX}/sim_gazebo_gz/`],
      ['Hardware-in-the-loop', `${PX}/simulation/hitl`],
      ['MAVSDK', 'https://mavsdk.mavlink.io/main/en/'],
    ],
    steps: [
      { id: 'sim', title: 'Run it in simulation first', do: ['Set up PX4 SITL with Gazebo on a Linux machine.', 'Fly the X500 model, which closely matches the physical frame.', 'Test your ROS 2 or MAVSDK code here before any real flight.'], link: `${PX}/simulation/` },
      { id: 'flash', title: 'Load the firmware', do: ['Open QGroundControl and connect over USB.', 'Use Vehicle Setup, then Firmware, to install the latest stable PX4.'], link: `${PX}/config/firmware` },
      { id: 'airframe', title: 'Choose the airframe', do: ['Pick the airframe that matches yours, such as the Holybro X500 V2.', 'Apply and let it restart.'], link: `${PX}/config/` },
      { id: 'cal', title: 'Calibrate the sensors', do: ['Calibrate the compass, gyroscope, accelerometer and level horizon.', 'Calibrate outside, away from metal, for the compass.'], link: `${PX}/config/` },
      { id: 'radio', title: 'Set up radio and modes', do: ['Calibrate your radio.', 'Assign switches for arm, Position mode, Return and kill.', 'Set safety and failsafe behavior.'], link: `${PX}/config/` },
      { id: 'act', title: 'Assign and test actuators', do: ['Props off. Assign outputs and choose your ESC protocol.', 'Use the Actuator Testing sliders to check each motor and its direction.'], link: `${PX}/config/actuators` },
      { id: 'tune', title: 'First flight and tuning', do: ['Hover in Position or Stabilized mode in the open.', 'Upload your log to Flight Review to check vibration.', 'Autotune or adjust by hand if it needs it.'], link: `${PX}/config_mc/pid_tuning_guide_multicopter` },
      { id: 'ros', title: 'Connect your companion computer', do: ['Run the uXRCE-DDS client over serial or Ethernet.', 'Start the agent on the computer and check topics in ROS 2.', 'Test offboard mode in the simulator first, and keep a pilot on the sticks.'], link: `${PX}/ros2/user_guide` },
    ],
    preflight: ['QGroundControl shows Ready To Fly', 'A kill switch is assigned and tested', 'Offboard code is tested in simulation', 'A safety pilot is on the sticks'],
  },
  Cleanflight: {
    id: 'Cleanflight',
    name: 'Cleanflight',
    tag: 'A historic project. Its last stable release was in 2019.',
    legacy: true,
    version: '2.5 (2019)',
    bestFor: ['An old board that already runs it'],
    notFor: ['Any new build'],
    links: [['Project on GitHub', 'https://github.com/cleanflight/cleanflight']],
    steps: [],
    preflight: [],
    legacyNote: 'Betaflight began as a fork of Cleanflight. Its last stable release was version 2.5.0 in January 2019, and we found no recent development. For freestyle or racing, use Betaflight. For GPS and navigation, use INAV. Both will likely run on the same board, if the board is new enough.',
  },
};

export const FW_CHOICES = ['Betaflight', 'INAV', 'ArduPilot', 'PX4', 'Cleanflight'];

export const preflightFor = (fw) => [...commonPreflight, ...((FW[fw] && FW[fw].preflight) || [])];

export const ESC_NOTE = {
  title: 'Which ESC firmware?',
  text: 'For new builds, pick a 32-bit ESC with AM32 or an 8-bit ESC with Bluejay. BLHeli_32 was discontinued in 2024, though existing ESCs still work. Flashing AM32 onto a BLHeli_32 ESC cannot be undone.',
  links: [['AM32', 'https://am32.ca'], ['Bluejay', 'https://github.com/bird-sanctuary/bluejay'], ['ESC Configurator', 'https://esc-configurator.com']],
};

export const RADIO_NOTE = {
  title: 'Which radio link?',
  text: 'ExpressLRS at 2.4 GHz suits most people. Choose its sub-GHz version only if you need extreme range or fly in high radio noise, and set the right band for your country.',
  links: [['ExpressLRS', 'https://www.expresslrs.org']],
};

export const LEARNING = {
  en: [
    ['Oscar Liang guides', 'https://oscarliang.com'],
    ['Joshua Bardwell videos', 'https://www.youtube.com/@JoshuaBardwell'],
    ['IntoFPV forum', 'https://intofpv.com'],
    ['ArduPilot forum', 'https://discuss.ardupilot.org'],
    ['PX4 forum', 'https://discuss.px4.io'],
  ],
  zh: [
    ['PX4 官方中文文档', 'https://docs.px4.io/main/zh/'],
    ['QGroundControl 中文文档', 'https://docs.qgroundcontrol.com/master/zh/'],
    ['哔哩哔哩 FPV 教程', 'https://search.bilibili.com/all?keyword=betaflight'],
  ],
};
