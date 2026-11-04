// Who is here, and what would actually help them. This drives the home page, the
// recommended firmware and which builds come first.
export const PERSONAS = [
  {
    id: 'beginner',
    icon: 'spark',
    title: 'I am new to this',
    blurb: 'Curious, excited, and not sure where to start.',
    heroTitle: 'Build your first FPV drone',
    heroSub: 'No jargon, no guessing. We check every part so it works together, then walk you to your first flight.',
    level: 'Beginner',
    firmware: 'Betaflight',
    whyFw: 'Betaflight has the largest community, so nearly any problem you hit already has an answer.',
    first: [
      { title: 'Try a simulator first', text: 'A $20 FPV simulator and a radio controller will save you hundreds in crashed parts. The radio works on your real drone later.' },
      { title: 'Start small', text: 'A tiny whoop is cheap, safe to fly indoors, and teaches the same skills as a big quad.' },
      { title: 'Build when you are ready', text: 'Ready-to-fly is a perfectly good start. Building comes when you want to repair or customize.' },
    ],
  },
  {
    id: 'fpv',
    icon: 'bolt',
    title: 'I fly FPV',
    blurb: 'Freestyle, racing or long-range. You want the next build to be better.',
    heroTitle: 'Your next quad, checked before you buy',
    heroSub: 'Compare motors, ESCs and video systems with live numbers, and catch mismatches before the parts ship.',
    level: 'Intermediate',
    firmware: 'Betaflight',
    whyFw: 'Betaflight gives the best stick feel. Use INAV instead if GPS return-to-home matters most.',
    first: [
      { title: 'Open the configurator', text: 'Start from a reference build and change what you care about.' },
      { title: 'Watch thrust-to-weight and current', text: 'Live checks flag ESC headroom, tip speed and battery limits as you swap parts.' },
      { title: 'Share it', text: 'Every build has a link. Send it to a friend, or to a forum when you want a second opinion.' },
    ],
  },
  {
    id: 'film',
    icon: 'camera',
    title: 'I want to shoot video',
    blurb: 'Smooth footage is the goal. The drone is the tool.',
    heroTitle: 'Build a camera platform that flies smoothly',
    heroSub: 'Cinewhoops and sub-250 g rigs chosen for steady footage, with honest flight times and carrying weights.',
    level: 'Intermediate',
    firmware: 'Betaflight',
    whyFw: 'Betaflight is the standard for cinewhoops, and tuning guides for smooth footage are easy to find.',
    first: [
      { title: 'Choose by the shot', text: 'Tight indoor one-takes suit a cinewhoop. Sweeping outdoor lines suit a light 3.5-inch.' },
      { title: 'Weigh the camera', text: 'Add your action camera in early, since it changes flight time and control more than you would expect.' },
      { title: 'Check your rules', text: 'Filming near people or for clients often has extra requirements in your country.' },
    ],
  },
  {
    id: 'research',
    icon: 'flask',
    title: 'I do research',
    blurb: 'A platform for autonomy, perception, or control experiments.',
    heroTitle: 'A research platform you can reproduce',
    heroSub: 'PX4 or ArduPilot, ROS 2, companion computers and simulation first, with a parts list you can cite.',
    level: 'Intermediate',
    firmware: 'PX4',
    whyFw: 'PX4 has first-class ROS 2 support through uXRCE-DDS and a matching Gazebo simulation. ArduPilot is equally strong if your lab already uses it.',
    first: [
      { title: 'Start in simulation', text: 'Run your code in software-in-the-loop before you buy anything, then move the same code to hardware.' },
      { title: 'Pick for payload', text: 'Weigh your compute and sensors first. Thrust margin decides everything else.' },
      { title: 'Share a reproducible list', text: 'Send your exact parts as a link, or export them as CSV for a paper or a purchase order.' },
    ],
  },
  {
    id: 'teacher',
    icon: 'book',
    title: 'I teach',
    blurb: 'A class, a club, or a lab course that has to run on a budget.',
    heroTitle: 'Drones your students can build and repair',
    heroSub: 'Open frames, cheap spares, plain instructions, and step tracking that works on students\' own phones.',
    level: 'Beginner',
    firmware: 'ArduPilot',
    whyFw: 'ArduPilot shows students the whole system: sensors, modes, missions and logs. Use Betaflight for a pure FPV class.',
    first: [
      { title: 'Start with one working example', text: 'Build one yourself first and keep it as the reference for the class.' },
      { title: 'Plan for repairs', text: 'Budget for spare props, arms and ESCs. Generic parts keep a class running.' },
      { title: 'Set the safety rules', text: 'No props during bench tests, LiPo charging supervised, and flying only with nets or outdoors.' },
    ],
  },
  {
    id: 'pro',
    icon: 'map',
    title: 'I need it for work',
    blurb: 'Mapping, inspection, agriculture, or carrying a payload.',
    heroTitle: 'A work aircraft you control, part by part',
    heroSub: 'Missions, RTK and heavy-lift on ArduPilot or PX4, with cost and endurance worked out before you commit.',
    level: 'Pro',
    firmware: 'ArduPilot',
    whyFw: 'ArduPilot has mature mission planning, terrain following, camera triggers and a long record in commercial use.',
    first: [
      { title: 'Check the rules first', text: 'Commercial flying usually needs a certificate, and may require certified or registered aircraft.' },
      { title: 'Size for payload and reserve', text: 'Add your payload weight and plan missions around 70 percent of estimated endurance.' },
      { title: 'Consider buying instead', text: 'If uptime matters more than control, a commercial airframe may cost less overall. Build when you need something you cannot buy.' },
    ],
  },
];

export const personaById = (id) => PERSONAS.find((p) => p.id === id) || null;

export const LEVELS = [
  { id: 'Beginner', title: 'Beginner', text: 'I have not built a drone. Soldering is new or rusty.' },
  { id: 'Intermediate', title: 'Intermediate', text: 'I have built or repaired one, or I am comfortable with electronics.' },
  { id: 'Pro', title: 'Pro', text: 'I know what I want. Give me numbers and get out of the way.' },
];

// Things people forget to budget for. `when` reads the traits of the build (see engine.traits).
export const GEAR = [
  { id: 'radio', title: 'Radio controller', detail: 'Choose one that matches your receiver link. It lasts for years across many drones.', p: 90, query: 'RadioMaster Pocket ELRS' },
  { id: 'goggles-analog', title: 'Analog goggles', detail: 'Works with your analog video system.', p: 100, query: 'analog FPV goggles', when: (t) => t.has('analog') },
  { id: 'goggles-digital', title: 'Digital goggles', detail: 'Must be the same brand as your video system. Digital systems do not mix.', p: 400, query: 'FPV digital goggles', when: (t) => t.has('digital') },
  { id: 'charger', title: 'Balance charger', detail: 'Never charge a LiPo without balancing the cells.', p: 60, query: 'LiPo balance charger' },
  { id: 'lipo-bag', title: 'LiPo safety bag', detail: 'Charge and store batteries inside one.', p: 12, query: 'LiPo safety bag' },
  { id: 'iron', title: 'Soldering iron and solder', detail: 'A temperature-controlled iron with fresh tip and 60/40 or lead-free solder.', p: 45, query: 'Pinecil soldering iron', when: (t) => t.has('solder') },
  { id: 'smoke', title: 'Smoke stopper', detail: 'Cuts power before a wiring mistake becomes a fire. Costs far less than the parts it saves.', p: 12, query: 'smoke stopper XT60', when: (t) => t.has('solder') },
  { id: 'tools', title: 'Hex drivers and small tools', detail: '1.5 and 2 mm hex drivers, wire strippers, cable ties, heat shrink and electrical tape.', p: 25, query: 'drone tool kit hex' },
  { id: 'spares', title: 'Spare props', detail: 'Plan on several sets. Props are what you go through most.', p: 15, query: 'FPV props' },
  { id: 'sim', title: 'FPV simulator', detail: 'Practice before you risk parts. Use it with your real radio controller.', p: 20, query: null, when: (t) => !t.has('pixhawk') },
  { id: 'pm', title: 'Power module and power board', detail: 'Pixhawk-class controllers need one. Check its voltage and current rating.', p: 30, query: 'PM02 power module', when: (t) => t.has('pixhawk') },
  { id: 'telemetry', title: 'Telemetry radio or Wi-Fi link', detail: 'A live link to your ground station during flight.', p: 55, query: 'SiK telemetry radio', when: (t) => t.has('pixhawk') },
  { id: 'bec', title: '5 V regulator for the computer', detail: 'Power the companion computer from its own regulator and never from the flight controller.', p: 15, query: '5V 5A BEC', when: (t) => t.has('companion') },
];
