// "Am I legal?" turns the country notes in regions.js into a list for one exact build.
// It only repeats what the regional research found, checked in November 2026.
// kind: 'must' is a stated rule. 'check' means we could not confirm it, so ask the regulator.

const must = (id, title, detail) => ({ id, kind: 'must', title, detail });
const check = (id, title, detail) => ({ id, kind: 'check', title, detail });

const RULES = {
  us: (f) => [
    must('trust', 'Pass the TRUST test', 'Required for recreational flyers. It is free and online.'),
    f.g >= 250 && must('register', 'Register with the FAA', 'Required at 250 g or more. Your build is over the line.'),
    f.g >= 250 && must('rid', 'Meet Remote ID', 'A home-built drone needs a broadcast module and must stay in line of sight, or must fly at a FAA-recognized area (FRIA).'),
    f.fpv && must('observer', 'Fly with a visual observer', 'With goggles on, someone next to you, in direct communication, must keep the drone in sight.'),
    f.video && must('ham', 'Get an amateur radio licence', 'Most FPV video gear needs one in the US, according to the Academy of Model Aeronautics.'),
    must('alt', 'Stay under 400 ft', 'In uncontrolled airspace. Check the airspace where you fly.'),
    f.sub && must('band', 'Set your radio to 915 MHz', 'The device must be FCC certified.'),
    f.work && must('107', 'Hold a Part 107 certificate', 'Flying for work falls under FAA Part 107, not the recreational rules.'),
  ],
  ca: (f) => [
    f.g >= 250 && must('register', 'Register your drone', 'Required at 250 g or more with Transport Canada.'),
    f.g >= 250 && must('basic', 'Hold a Basic certificate or higher', 'Required at 250 g or more, from age 14.'),
    f.fpv && must('observer', 'Fly with a visual observer', 'With an FPV display, someone must watch the airspace for you.'),
    must('alt', 'Stay under 122 m', 'Check the airspace where you fly.'),
    f.video && check('radio', 'Check your video power', 'We could not confirm a specific FPV limit. Ask ISED, the Canadian radio regulator.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can have further requirements. Ask Transport Canada.'),
  ],
  uk: (f) => [
    f.g >= 100 && must('flyer', 'Get a Flyer ID', 'Required from 100 g.'),
    (f.g >= 250 || (f.g >= 100 && f.camera)) && must('operator', 'Get an Operator ID', 'Required from 250 g, or from 100 g with a camera.'),
    f.g >= 250 && must('a3', 'Fly in the A3 category', 'Privately built drones under 25 kg fly in A3, away from people.'),
    f.fpv && must('observer', 'Fly with an observer', 'With FPV goggles you need an observer with you.'),
    must('rid', 'Turn on Remote ID if your drone has it', 'Required since January 2026 where the drone has the function.'),
    f.video && must('power', 'Set video power to 25 mW', 'The limit at 5.8 GHz. Higher power needs an amateur licence.'),
    f.sub && must('band', 'Set your radio to 868 MHz', 'The 915–918 MHz rules here do not suit typical 900 MHz links.'),
    must('alt', 'Stay under 120 m', 'Check the airspace where you fly.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can have further requirements. Ask the CAA.'),
  ],
  eu: (f) => [
    must('operator', 'Register as an operator', 'Put your operator number on every drone, including privately built ones.'),
    must('training', 'Take the A1/A3 training and test', 'Most flyers take this online. We confirmed this from secondary sources.'),
    f.g < 250
      ? must('cat', 'Fly in category A1', 'Privately built drones under 250 g can fly here.')
      : must('cat', 'Fly in category A3', 'Privately built drones of 250 g or more fly here, up to 25 kg, away from people.'),
    f.fpv && must('observer', 'Fly with an observer', 'In the open category with FPV, an observer alongside you is required.'),
    f.video && must('power', 'Set video power to 25 mW EIRP', 'The limit at 5.8 GHz. Higher power needs an amateur licence where available.'),
    f.sub && must('band', 'Set your radio to 868 MHz', 'A full 902–928 MHz link is not covered here.'),
    must('alt', 'Stay under 120 m', 'Check the airspace where you fly.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can have further requirements. Ask your national authority.'),
  ],
  cn: (f) => [
    f.g >= 250 && must('register', 'Register under your real name', 'Required for owners under the Interim Regulations.'),
    f.g < 250 && check('register', 'Check whether you must register', 'Sources conflict on registration below 250 g. Ask CAAC.'),
    f.g < 250 && must('micro', 'Stay within the micro limits', 'Up to 50 m, up to 40 km/h and in line of sight.'),
    f.g >= 250 && must('alt', 'Stay under 120 m', 'Above that is controlled airspace.'),
    must('beijing', 'Do not fly in Beijing without checking first', 'Press reports describe a citywide ban on possessing and storing drones from 15 November 2026. Check the official notice.'),
    f.sub && must('band', 'Change to a 2.4 GHz receiver', '915 MHz is not among the bands listed for drones.'),
    check('home', 'Ask how home-built drones are treated', 'We could not settle how the 2026 standards treat them, or whether DIY FPV counts as a model aircraft. Ask CAAC.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can have further requirements. Ask CAAC.'),
  ],
  in: (f) => [
    f.g > 250 && check('register', 'Check your registration with DGCA', 'Above 250 g you are out of the nano class. Non-commercial micro drones need no pilot licence, but check registration.'),
    f.g <= 250 && check('uin', 'Ask whether you need a UIN', 'Nano drones need no pilot licence, but sources disagree about a UIN.'),
    must('zones', 'Fly in green zones, up to 120 m', 'Check the zone before each flight.'),
    must('import', 'Do not import a complete drone or kit', 'Complete drones and kits cannot be imported, but individual components can.'),
    f.sub && check('band', 'Check that sub-GHz radio is allowed', 'We could not confirm the bands the WPC allows. A 2.4 GHz link is the safer choice.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can need a pilot certificate. Ask DGCA.'),
  ],
  au: (f) => [
    f.fpv && must('club', 'Join an approved club, or get CASA approval', 'FPV relying only on the camera needs one of these.'),
    must('alt', 'Stay under 120 m', 'From secondary sources. Check with CASA.'),
    f.video && must('power', 'Set video power to 25 mW', 'The limit at 5.8 GHz without a licence. Check with ACMA.'),
    f.sub && must('band', 'Set your radio to 915 MHz', 'The class licence allows up to 1 W for frequency-hopping links.'),
    f.g > 250 && check('register', 'Check that recreational registration is still paused', 'It was paused when we checked, and reforms were mentioned that we could not confirm.'),
    f.work && must('work', 'Register for commercial flying', 'Commercial registration still applies. Check your accreditation with CASA.'),
  ],
  jp: (f) => [
    f.g >= 100 && must('register', 'Register your drone with Remote ID', 'Required from 100 g.'),
    f.g >= 100 && must('self', 'Declare it as self-built, with a Remote ID unit', 'Self-built drones generally need an external unit.'),
    f.fpv && must('ham', 'Get an amateur qualification and a station licence', 'Needed for FPV video, and it does not allow commercial use.'),
    f.fpv && f.g >= 100 && must('mod', 'Register FPV as a major modification', 'Adding FPV requires registering as self-built.'),
    f.fpv && check('bvlos', 'Ask about permission to fly with goggles', 'Goggles very likely count as beyond line of sight. Ask MLIT.'),
    must('alt', 'Stay under 150 m', 'Flying at 150 m or above needs permission.'),
    f.sub && must('band', 'Change to a 2.4 GHz receiver', '915 MHz is not listed here. Check for Japanese technical conformity.'),
    f.work && must('work', 'Do not use amateur video for work', 'Commercial use needs a different radio licence.'),
  ],
  br: (f) => [
    f.g > 250 && must('sisant', 'Register in SISANT', 'Required above 250 g, including model aircraft.'),
    must('alt', 'Stay under 120 m', 'Airspace is handled by DECEA.'),
    must('anatel', 'Check Anatel approval for imported radios', 'Customs can hold radio equipment without homologation. A personal-use declaration exists.'),
    f.sub && must('band', 'Set your radio to 915 MHz', '868 MHz is not on the list of allowed bands we found.'),
    f.fpv && check('observer', 'Ask about an observer for FPV', 'We could not confirm the rule. Ask ANAC.'),
    f.work && check('work', 'Check the rules for work flights', 'Commercial flying can have further requirements. Ask ANAC.'),
  ],
};

/** What about this build affects the rules. Payload counts toward weight. */
export function buildFacts(sel, flight, { work = false } = {}) {
  const hasVideo = !!sel.video && sel.video.sys !== 'None';
  const builtIn = !!sel.fc?.includes?.includes('video');
  const camera = hasVideo || builtIn || (sel.payload?.items || []).some((i) => /camera/i.test(i.name));
  return {
    g: flight ? flight.auw : 0,
    fpv: hasVideo || builtIn,
    video: hasVideo || builtIn,
    camera,
    sub: sel.rx?.band === 'sub',
    work,
  };
}

export function legalChecklist(regionId, facts) {
  const rules = RULES[regionId];
  return rules ? rules(facts).filter(Boolean) : [];
}
