// A symptom opens an ordered list, most likely cause first, one fix at a time.
// `only` limits a step to particular firmware.
const SP = ['Betaflight', 'INAV'];
const AP = ['ArduPilot', 'PX4'];

export const SYMPTOMS = [
  {
    id: 'wont-arm',
    title: 'It will not arm',
    hint: 'The stick or switch does nothing, or it beeps at you.',
    steps: [
      { title: 'Read the reason from the tool', text: 'Betaflight: type "status" in the CLI and read the arming-disable flags. RXLOSS means no radio, THROTTLE means your throttle is not low, and ANGLE means the drone is tilted.', only: ['Betaflight'] },
      { title: 'Check the arming flags', text: 'In INAV, the status bar and the "status" CLI command show which checks are blocking arming. "No fix" and "Nav unsafe" are common.', only: ['INAV'] },
      { title: 'Read the PreArm message', text: 'Mission Planner shows "PreArm: ..." in red on the map screen. Search that exact message in the ArduPilot docs. Compass and GPS messages are the usual ones.', only: ['ArduPilot'] },
      { title: 'Read the preflight failure', text: 'QGroundControl speaks and shows the failing check, such as "Accel not calibrated". The commander status in the MAVLink console has more detail.', only: ['PX4'] },
      { title: 'Lower your throttle and level the drone', text: 'Keep the throttle fully down, hold the sticks centered, and rest the drone on a flat surface.' },
      { title: 'Check the arm switch', text: 'In the receiver tab, flip your arm switch and confirm its channel moves past the arming range.', only: SP },
      { title: 'Unplug USB', text: 'Betaflight usually refuses to arm with USB connected or the configurator open. Run from battery only.', only: ['Betaflight'] },
      { title: 'Finish calibration', text: 'Calibrate the accelerometer, compass and radio. Reboot, and wait for the board to finish its startup checks.', only: AP },
    ],
  },
  {
    id: 'flips',
    title: 'It flips on takeoff',
    hint: 'It lifts for a moment and then rolls over hard.',
    steps: [
      { title: 'Remove the props before anything else', text: 'All the checks here are done with props off.' },
      { title: 'Check motor order', text: 'Use the motor test. The motor you command must be the one in that position on your firmware\'s diagram. This is the most common cause.' },
      { title: 'Check motor direction', text: 'Each motor must spin the way the diagram shows. Fix it in ESC settings or by swapping two motor wires.' },
      { title: 'Check prop direction', text: 'The leading edge should go into the air first. Reversed props give almost no lift on that corner and flip the drone.' },
      { title: 'Check board orientation', text: 'Tilt the drone forward and confirm the on-screen model tilts forward. If not, set the board alignment yaw, often 90 or 180 degrees.' },
      { title: 'Check the airframe setting', text: 'Your configured airframe must match the real frame: quad X vs. plus, for example.', only: AP },
    ],
  },
  {
    id: 'no-link',
    title: 'The radio will not connect',
    hint: 'No receiver movement in the tool, or a failsafe warning.',
    steps: [
      { title: 'Check the wiring', text: 'Receiver TX goes to flight controller RX, and receiver RX goes to TX. Swap them if unsure. It will not cause harm.' },
      { title: 'Set the UART and protocol', text: 'Turn on Serial RX on the right UART and choose CRSF for ELRS and Crossfire, or SBUS for SBUS receivers. Save and reboot.', only: SP },
      { title: 'Set the radio input', text: 'On ArduPilot, set SERIALx_PROTOCOL=23 for CRSF/ELRS on the correct UART. On PX4, set RC_CRSF_PRT_CFG to the right port.', only: AP },
      { title: 'Match ExpressLRS versions and bind phrase', text: 'Transmitter and receiver need the same major ELRS version and the same binding phrase. Mismatched major versions will not connect.' },
      { title: 'Bind again', text: 'Put the receiver in bind mode and bind from your radio. For ELRS, flashing both with the same phrase makes this automatic.' },
      { title: 'Check antenna and band', text: 'A 2.4 GHz radio cannot talk to a sub-GHz receiver. Confirm the band, and check the antenna is firmly seated.' },
    ],
  },
  {
    id: 'no-video',
    title: 'No video, or a noisy picture',
    hint: 'Black screen, static, or lines moving with the throttle.',
    steps: [
      { title: 'Match the channel', text: 'VTX and goggles must be on the same channel. With digital systems, bind goggles and air unit first.' },
      { title: 'Lines that move with throttle mean power noise', text: 'Add a low-ESR capacitor at the ESC, and power the camera from a clean 5 V pad or a filter.' },
      { title: 'Check the camera wire', text: 'Video out from the camera must reach the VTX or flight controller video input. Swap the camera to test.' },
      { title: 'Check the antenna', text: 'Damaged or loose antennas cause short range and static. Replace them, they are cheap.' },
      { title: 'Digital: Update firmware', text: 'Air unit and goggles should run compatible firmware. Update both with the manufacturer\'s app.' },
    ],
  },
  {
    id: 'hot-motors',
    title: 'Motors are hot or twitchy',
    hint: 'Too hot to touch after a short flight, or it shakes.',
    steps: [
      { title: 'Check for bent props and motors', text: 'Change the props and spin each motor by hand. A bent shaft or chipped prop causes vibration that heats the motors.' },
      { title: 'Check frame and screws', text: 'Loose arms, motors and standoffs let the frame vibrate and the gyro get confused.' },
      { title: 'Turn on RPM filtering', text: 'Use bidirectional DShot with RPM filtering. It is the biggest single fix for noise on modern setups.', only: ['Betaflight'] },
      { title: 'Review the vibration logs', text: 'Look at vibration levels in your logs. On Copter, keep VibeX, Y and Z below 30 m/s/s. On PX4, read the flight review vibration chart.', only: AP },
      { title: 'Lower your D term', text: 'Hot motors after flights without visible vibration usually mean high D gain. Lower it a little at a time and test again.', only: SP },
      { title: 'Check the setup', text: 'If motors stay hot, your KV, voltage or prop combination may be too aggressive. The configurator can check this for you.' },
    ],
  },
  {
    id: 'short-flight',
    title: 'Flight time is too short',
    hint: 'Much less than the estimate here.',
    steps: [
      { title: 'Compare like with like', text: 'Our range uses your flying style. Hard flying can use three times the hover power.' },
      { title: 'Check the battery', text: 'Old or heavily used packs lose capacity and sag. Use a battery checker for cell health, and retire puffed packs.' },
      { title: 'Weigh the drone', text: 'Weight has the largest effect on endurance. Check your real all-up weight against the estimate.' },
      { title: 'Set your low-voltage alarm', text: 'A conservative alarm is good, but make sure you are not landing far too early. Most LiPo builds land around 3.5 V per cell.' },
      { title: 'Try different props', text: 'Lower pitch props usually save energy for cruising.' },
    ],
  },
  {
    id: 'gps',
    title: 'GPS problems or it wanders in circles',
    hint: 'No fix, or it circles more and more when holding position.',
    only: ['INAV', 'ArduPilot', 'PX4'],
    steps: [
      { title: 'Move outside and wait', text: 'A first fix can take a few minutes under open sky. Indoor or tree-covered testing will not work.' },
      { title: 'Move it away from noise', text: 'Keep it clear of video transmitters and USB 3 ports. Turn video off to test whether it is the cause.' },
      { title: 'Calibrate the compass outside', text: 'Stand away from metal and cars. A circling drone ("toilet bowl") usually points to a bad compass or wrong orientation.' },
      { title: 'Check compass orientation', text: 'Tilt and rotate the drone and confirm the compass direction on screen tracks correctly. Set the external compass rotation if not.' },
      { title: 'Check the GPS wiring and port', text: 'TX to RX, RX to TX. Confirm the correct serial protocol is set for that port.' },
    ],
  },
];
