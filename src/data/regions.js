// Laws, radio limits, shops and currency by country. Researched in November 2026 from
// regulator pages where we could reach them. Where we could not confirm something from a
// primary source, the text says so instead of guessing. Exchange rates are rough on purpose.
export const RULES_CHECKED = 'November 2026';

const ALI = { name: 'AliExpress', home: 'https://www.aliexpress.com', search: (q) => `https://www.aliexpress.com/w/wholesale-${encodeURIComponent(q.replace(/\s+/g, '-'))}.html` };
const HOLYBRO = { name: 'Holybro', home: 'https://holybro.com', search: (q) => `https://holybro.com/search?q=${encodeURIComponent(q)}` };
const shop = (name, home, prefix, suffix = '') => ({ name, home, search: (q) => `${prefix}${encodeURIComponent(q)}${suffix}` });

export const REGIONS = [
  {
    id: 'us',
    name: 'United States',
    currency: 'USD',
    sym: '$',
    rate: 1,
    step: 1,
    regulator: 'FAA and FCC',
    summary: 'Register at 250 g and up, pass the free TRUST test, and check the FCC limits on new foreign-made parts.',
    weights: [
      { min: 0, text: 'Under 250 g, recreational flyers do not register, but still need to pass the TRUST test.' },
      { min: 250, text: 'At 250 g or more, you must register and meet Remote ID. Home-builds use a broadcast module, or fly at a FAA-recognized area (FRIA).' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 915 MHz setting. The device must be FCC certified.',
    vtxNote: 'Most FPV video gear needs an amateur radio licence in the US, according to the Academy of Model Aeronautics.',
    djiNote: 'New DJI models cannot get FCC authorization. Models already authorized can still be sold and used, but DJI\'s US store was out of stock on O4 units in October 2026. Check other sellers.',
    sections: [
      { title: 'Registering and testing', points: ['Register drones of 250 g or more with the FAA.', 'Recreational flyers must pass the TRUST test.', 'If registration applies, so does Remote ID. A home-built drone needs a broadcast module and must stay in line of sight, or must fly at a FRIA.'] },
      { title: 'Flying limits', points: ['Up to 400 ft in uncontrolled airspace.', 'Keep it in visual line of sight. With goggles, an observer next to you, in direct communication, needs to keep watch.'] },
      { title: 'Radio and video', points: ['915 MHz and 5.8 GHz are open to certified devices.', 'Most FPV video transmitters need an amateur radio licence. Getting one is inexpensive.', 'We could not confirm any low-power exemption for uncertified video transmitters.'] },
      { title: 'Buying and importing', points: ['In December 2025, the FCC added all foreign-made drones and their critical components (radios, flight controllers, cameras, batteries, motors) to its Covered List.', 'This applies to new models. Parts already authorized can still be imported, sold and used.', 'Generic batteries are not affected. Components means those designed mainly for drones.', 'New DJI models are blocked. Existing DJI gear can still be used.', 'We found no exemption for hobby builders, and no FCC guidance about home assembly. Stock of new foreign parts may shrink, so buy from US shops where you can.'] },
    ],
    stores: [
      shop('GetFPV', 'https://www.getfpv.com', 'https://www.getfpv.com/catalogsearch/result/?q='),
      shop('RaceDayQuads', 'https://www.racedayquads.com', 'https://www.racedayquads.com/search?q='),
      shop('Pyrodrone', 'https://pyrodrone.com', 'https://pyrodrone.com/search?q='),
      shop('ReadyMadeRC', 'https://www.readymaderc.com', 'https://www.readymaderc.com/search?q='),
    ],
    storeNote: 'Check FCC status before ordering from overseas sellers.',
    sources: [['FAA drones', 'https://www.faa.gov/uas'], ['FAA recreational flyers', 'https://www.faa.gov/uas/recreational_flyers'], ['FAA Remote ID', 'https://www.faa.gov/uas/getting_started/remote_id'], ['FCC notice on foreign-made drones and components', 'https://docs.fcc.gov/public/attachments/DOC-417528A1.pdf']],
  },
  {
    id: 'ca',
    name: 'Canada',
    currency: 'CAD',
    sym: 'C$',
    rate: 1.38,
    step: 1,
    regulator: 'Transport Canada',
    summary: 'Under 250 g needs no registration or certificate. At 250 g and up, register and earn a Basic certificate.',
    weights: [
      { min: 0, text: 'Under 250 g, you need no registration or certificate.' },
      { min: 250, text: 'At 250 g or more, you must register the drone and hold at least a Basic certificate (age 14 or over).' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 915 MHz setting. We could not confirm the radio rules directly with the Canadian regulator.',
    sections: [
      { title: 'Registering and testing', points: ['Under 250 g: no registration or certificate.', 'At 250 g or more: register, and get a Basic certificate or higher.', 'We found no separate rule for hobby home-builds.'] },
      { title: 'Flying limits', points: ['Up to 122 m.', 'With an FPV display, you need a visual observer watching the airspace, except under certain advanced rules.'] },
      { title: 'Radio and video', points: ['Canadian rules cover 902–928 MHz and 5 GHz devices.', 'We could not confirm a specific FPV video power limit. Check with ISED, the Canadian radio regulator.'] },
      { title: 'Buying and importing', points: ['We found no drone-specific import restriction.'] },
    ],
    stores: [
      shop('Rotor Village', 'https://www.rotorvillage.ca', 'https://www.rotorvillage.ca/search.php?search_query='),
      shop('Rotorgeeks', 'https://www.rotorgeeks.com', 'https://www.rotorgeeks.com/index.php?route=product/search&search='),
      ALI,
    ],
    sources: [['Transport Canada drone safety', 'https://tc.canada.ca/en/aviation/drone-safety'], ['Flying your drone safely and legally', 'https://tc.canada.ca/en/aviation/drone-safety/flying-your-drone-safely-legally']],
  },
  {
    id: 'uk',
    name: 'United Kingdom',
    currency: 'GBP',
    sym: '£',
    rate: 0.78,
    step: 1,
    regulator: 'CAA and Ofcom',
    summary: 'Flyer ID from 100 g, Operator ID from 250 g (or 100 g with a camera). FPV needs an observer with you.',
    weights: [
      { min: 0, text: 'Under 100 g, you do not need a Flyer ID or Operator ID.' },
      { min: 100, text: 'From 100 g you need a Flyer ID. You also need an Operator ID if it has a camera, which most FPV drones do.' },
      { min: 250, text: 'From 250 g you need both a Flyer ID and an Operator ID.' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 868 MHz setting. The 915–918 MHz rules here do not suit typical 900 MHz links.',
    vtxNote: 'The UK limit at 5.8 GHz is 25 mW. Set your transmitter to match it. Higher power needs an amateur licence.',
    sections: [
      { title: 'Registering and testing', points: ['Flyer ID from 100 g.', 'Operator ID from 250 g, or from 100 g with a camera.', 'Privately built drones under 25 kg fly in the A3 category.', 'Since January 2026, if a drone has Remote ID, you must turn it on.'] },
      { title: 'Flying limits', points: ['Up to 120 m.', 'With FPV goggles, you need an observer with you.'] },
      { title: 'Radio and video', points: ['5.8 GHz at 25 mW, from a draft of the Ofcom rules. We could not open the latest version, so check it.', '869.4–869.65 MHz up to 500 mW, which suits long-range control links.'] },
      { title: 'Buying and importing', points: ['We found no UK-specific import action.'] },
    ],
    stores: [
      shop('Unmanned Tech', 'https://www.unmannedtechshop.co.uk', 'https://www.unmannedtechshop.co.uk/search?q='),
      shop('HobbyRC', 'https://www.hobbyrc.co.uk', 'https://www.hobbyrc.co.uk/search?q='),
      shop('3DXR', 'https://www.3dxr.co.uk', 'https://www.3dxr.co.uk/search?q='),
      shop('Quadcopters.co.uk', 'https://www.quadcopters.co.uk', 'https://www.quadcopters.co.uk/search/products?q='),
    ],
    sources: [['CAA drones', 'https://www.caa.co.uk/drones/'], ['The Drone Code (March 2026)', 'https://www.caa.co.uk/media/csmfqbs1/the-drone-code-march-2026.pdf']],
  },
  {
    id: 'eu',
    name: 'European Union',
    currency: 'EUR',
    sym: '€',
    rate: 0.9,
    step: 1,
    regulator: 'EASA and national authorities',
    summary: 'Privately built drones fly in A1 up to 250 g, and A3 up to 25 kg. FPV needs an observer alongside you.',
    weights: [
      { min: 0, text: 'A privately built drone under 250 g can fly in category A1. Your operator number goes on every drone.' },
      { min: 250, text: 'A privately built drone of 250 g or more flies in category A3, up to 25 kg, away from people. Your operator number goes on every drone.' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 868 MHz setting. A full 902–928 MHz link is not covered here.',
    vtxNote: 'The European limit at 5.8 GHz is 25 mW EIRP. Set your transmitter to match it. Higher power needs an amateur licence where available.',
    sections: [
      { title: 'Registering and testing', points: ['Register as an operator in your country and put the number on every drone, including privately built ones.', 'Most flyers also take online A1/A3 training and a test. We confirmed this from secondary sources.', 'There may be further rules on privately built drones from 2027. We could not confirm this.'] },
      { title: 'Flying limits', points: ['Up to 120 m.', 'With FPV, an observer alongside you is required in the open category.'] },
      { title: 'Radio and video', points: ['5725–5875 MHz at 25 mW EIRP.', '869.4–869.65 MHz up to 500 mW, or 865–868 MHz at 25 mW with duty limits.', '868 MHz is the safe default. National adoption of 915 MHz varies.'] },
      { title: 'Buying and importing', points: ['We found no EU-wide limit on parts. China\'s export rules can affect orders from Chinese sellers.'] },
    ],
    stores: [
      shop('Drone FPV Racer', 'https://www.drone-fpv-racer.com/en/', 'https://www.drone-fpv-racer.com/en/recherche?search_query='),
      shop('FPV24', 'https://www.fpv24.com/en/', 'https://www.fpv24.com/en/search?sSearch='),
      ALI,
    ],
    sources: [['EASA drone FAQ', 'https://www.easa.europa.eu/en/the-agency/faqs/drones-uas'], ['CEPT radio recommendation ERC 70-03', 'https://docdb.cept.org/download/4635']],
  },
  {
    id: 'cn',
    name: 'China',
    currency: 'CNY',
    sym: '¥',
    rate: 7.1,
    step: 10,
    regulator: 'CAAC',
    summary: 'Owners must register under their real name. Above 120 m is controlled airspace. Beijing has its own strict ban.',
    weights: [
      { min: 0, text: 'Under 0.25 kg counts as micro: up to 50 m, up to 40 km/h and in line of sight, with no licence. Sources conflict on whether registration applies at this size.' },
      { min: 250, text: 'Above 0.25 kg, you must register under your real name. Light drones need no licence, but airspace rules apply.' },
    ],
    sub900: 'caution',
    sub900Note: 'The bands listed for drones here are 1430–1444, 2400–2476 and 5725–5829 MHz. 915 MHz is not among them, so choose 2.4 GHz.',
    vtxNote: 'The band for drones is 5725–5829 MHz. We could not confirm the power limit, so check Ministry of Industry and Information Technology rules.',
    sections: [
      { title: 'Registering and testing', points: ['Under the Interim Regulations (January 2024), owners must register under their real name.', 'Micro and light drones need no licence.', 'Assembling micro, light or small drones needs no airworthiness approval, but mandatory standards apply.', 'New national standards for registration, activation and identification took effect in May 2026. The revised Civil Aviation Law took effect in July 2026.', 'We could not settle how these treat sub-250 g and home-built drones, because sources conflict. Check with CAAC.'] },
      { title: 'Flying limits', points: ['Above 120 m is controlled airspace.', 'Micro drones must stay in line of sight, up to 50 m.', 'Model aircraft are defined separately and fly in designated airspace. We could not confirm whether a DIY FPV drone counts as one.'] },
      { title: 'Beijing', points: ['Beijing limits the sale and rental of drones and core components since May 2026.', 'Press reports describe a citywide ban on possessing and storing drones from 15 November 2026. Check the official notice if you live there.'] },
      { title: 'Radio and video', points: ['Listed drone bands are 1430–1444, 2400–2476 and 5725–5829 MHz, according to a journal summary.', '840 MHz was dropped, and 915 MHz is not listed.'] },
      { title: 'Buying and exporting', points: ['We found no national ban on buying parts, apart from the Beijing rules.', 'New export controls take effect on 18 November 2026. They cover very high-power motors and ESCs (48 V and 3 kW or more), very large carbon props, and drone-specific autopilots.', 'Typical FPV motors and ESCs appear to fall below these limits.', 'If you ship overseas, autopilots have no numeric threshold, so check with your seller. Exports to the US are reviewed more strictly.'] },
    ],
    stores: [
      shop('Taobao', 'https://www.taobao.com', 'https://s.taobao.com/search?q='),
      shop('JD', 'https://www.jd.com', 'https://search.jd.com/Search?keyword='),
      HOLYBRO,
    ],
    storeNote: 'These searches may ask you to sign in.',
    sources: [['CAAC', 'https://www.caac.gov.cn/'], ['Interim Regulations (Order 761)', 'https://www.gov.cn/zhengce/content/202306/content_6888799.htm']],
  },
  {
    id: 'in',
    name: 'India',
    currency: 'INR',
    sym: '₹',
    rate: 85,
    step: 100,
    regulator: 'DGCA',
    summary: 'Complete drones cannot be imported, but components can. Nano drones (up to 250 g) need no pilot licence.',
    weights: [
      { min: 0, text: 'Up to 250 g counts as nano, with no pilot licence. Blogs disagree on whether a nano drone needs a UIN, so check with DGCA.' },
      { min: 251, text: 'Above 250 g, you are out of the nano class. Non-commercial micro drones need no pilot licence, but check registration on DGCA\'s platform.' },
    ],
    sub900: 'caution',
    sub900Note: 'We could not confirm which bands the Indian radio regulator (WPC) allows. Check before using sub-GHz radio.',
    vtxNote: 'We could not confirm the Indian radio rules for video. Imported nano drones need WPC equipment approval.',
    sections: [
      { title: 'Registering and testing', points: ['Nano means 250 g or less.', 'Nano and non-commercial micro drones need no pilot licence.', 'Nano and research or recreation models are exempt from type certification.'] },
      { title: 'Flying limits', points: ['Green zones allow up to 120 m (400 ft).', 'We found no specific FPV rule.'] },
      { title: 'Buying and importing', points: ['Complete drones, including kits in semi or completely knocked-down form, cannot be imported, with exceptions for R&D, government and defence.', 'Individual components are free to import.', 'A shipment that looks like a whole kit could be questioned at customs. Order from Indian shops where you can.'] },
    ],
    stores: [
      shop('Robu', 'https://robu.in', 'https://robu.in/?post_type=product&s='),
      shop('Zbotic', 'https://zbotic.in', 'https://zbotic.in/?post_type=product&s='),
      ALI,
    ],
    sources: [['DGCA', 'https://www.dgca.gov.in/'], ['Drone Rules 2021 summary', 'https://www.pib.gov.in/PressReleasePage.aspx?PRID=1749154&reg=48&lang=2'], ['Drone import notification', 'https://www.civilaviation.gov.in/sites/default/files/migration/Drone_Import_Policy_9_Feb_2022.pdf']],
  },
  {
    id: 'au',
    name: 'Australia',
    currency: 'AUD',
    sym: 'A$',
    rate: 1.5,
    step: 1,
    regulator: 'CASA and ACMA',
    summary: 'Recreational registration is paused. FPV relying only on the camera needs an approved club or CASA approval.',
    weights: [
      { min: 0, text: 'Recreational flying under CASA has no registration at this weight. Commercial flying has its own rules.' },
      { min: 250, text: 'Recreational registration above 250 g is paused at the time of checking. Commercial registration still applies.' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 915 MHz setting. The class licence allows up to 1 W for frequency-hopping links at 915–928 MHz.',
    vtxNote: 'The Australian limit at 5.8 GHz is 25 mW without a licence. We read this from a copy of the class licence, so check it with ACMA.',
    sections: [
      { title: 'Registering and testing', points: ['Registration for recreational flying over 250 g is paused. Commercial registration is unchanged.', 'Some sources mention reforms in 2026–27 that we could not confirm.'] },
      { title: 'Flying limits', points: ['Up to 120 m, from secondary sources.', 'FPV relying only on the camera is allowed as a member of an approved association, or with CASA approval.'] },
      { title: 'Radio and video', points: ['5725–5875 MHz at 25 mW.', '915–928 MHz up to 1 W for frequency-hopping links. Check with ACMA.'] },
      { title: 'Buying and importing', points: ['We found no drone-specific import restriction.'] },
    ],
    stores: [
      shop('FPV Faster', 'https://fpvfaster.com.au', 'https://fpvfaster.com.au/search?q='),
      shop('NextFPV', 'https://www.nextfpv.com', 'https://www.nextfpv.com/search?q='),
      shop('Little Bird', 'https://littlebirdelectronics.com.au', 'https://littlebirdelectronics.com.au/search?q='),
    ],
    sources: [['CASA: Know your drone', 'https://www.casa.gov.au/knowyourdrone'], ['CASA registration and accreditation', 'https://www.casa.gov.au/knowyourdrone/registration-and-accreditation']],
  },
  {
    id: 'jp',
    name: 'Japan',
    currency: 'JPY',
    sym: '¥',
    rate: 150,
    step: 100,
    regulator: 'MLIT and MIC',
    summary: 'Register from 100 g, with Remote ID. FPV needs an amateur radio licence and re-registration as self-built.',
    weights: [
      { min: 0, text: 'Under 100 g, you do not need to register. Radio rules still apply.' },
      { min: 100, text: 'From 100 g, you must register with Remote ID. Declare it as self-built, which generally requires an external Remote ID unit.' },
    ],
    sub900: 'caution',
    sub900Note: '920 MHz at 20 mW is licence-free, and 915 MHz is not listed. Choose 2.4 GHz, and check that your device has Japanese technical conformity.',
    vtxNote: 'FPV video needs an amateur radio qualification and a station licence, with no commercial use. Do not fly until you have them.',
    vtxLevel: 'warn',
    sections: [
      { title: 'Registering and testing', points: ['Drones of 100 g or more must register with Remote ID.', 'Declare self-built drones as such. They generally need an external Remote ID unit.', 'Adding FPV counts as a major modification that requires registering as self-built.', 'We could not confirm whether hobbyists need to pass a test.'] },
      { title: 'Flying limits', points: ['Flying at 150 m or above needs permission.', 'Beyond visual line of sight is a specified flight, and goggles very likely count as this. Check with MLIT.'] },
      { title: 'Radio and video', points: ['Amateur FPV video needs an amateur qualification and a station licence, with no commercial use.', 'Avoid areas near road toll (ETC) systems on 5 GHz.', 'The 5.7 GHz industrial video system needs a third-class special operator certificate.', '920 MHz at 20 mW is licence-free.'] },
      { title: 'Buying and importing', points: ['We found no import ban, and we did not check technical conformity (giteki) rules in detail. Radios without conformity marks may be illegal to transmit with.'] },
    ],
    stores: [
      shop('Switch Science', 'https://www.switch-science.com', 'https://www.switch-science.com/search?q='),
      { name: 'Rakuten', home: 'https://www.rakuten.co.jp', search: (q) => `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(q)}/` },
      ALI,
    ],
    storeNote: 'We did not find a clear FPV specialist to recommend. Tell us if you know one.',
    sources: [['MLIT drone information', 'https://www.mlit.go.jp/en/koku/uas.html'], ['Drone registration', 'https://www.mlit.go.jp/koku/drone/en/'], ['MIC radio rules for drones', 'https://www.tele.soumu.go.jp/j/sys/others/drone/index.htm']],
  },
  {
    id: 'br',
    name: 'Brazil',
    currency: 'BRL',
    sym: 'R$',
    rate: 5.5,
    step: 1,
    regulator: 'ANAC, DECEA and Anatel',
    summary: 'Up to 250 g needs no SISANT registration. Imported radio gear needs Anatel approval to clear customs.',
    weights: [
      { min: 0, text: 'Up to 250 g, press reports say you need no SISANT registration. Up to 120 m.' },
      { min: 251, text: 'Above 250 g, including model aircraft, you must register in SISANT. Up to 120 m.' },
    ],
    sub900: 'band',
    sub900Note: 'Use the 915 MHz setting. 868 MHz is not on the list of allowed bands we found.',
    vtxNote: 'Anatel lists 5725–5850 MHz. We found no power figures, and imported radio gear needs Anatel homologation.',
    sections: [
      { title: 'Registering and testing', points: ['RBAC 100, approved in June 2026, replaces RBAC-E 94.', 'Up to 250 g, no SISANT registration, according to press reports. Model aircraft above 250 g must register.', 'We could not confirm a specific rule for home-built drones.'] },
      { title: 'Flying limits', points: ['Up to 120 m.', 'We could not confirm the FPV observer rule. Airspace is handled by DECEA.'] },
      { title: 'Radio and video', points: ['Anatel lists 902–907.5, 915–928 and 5725–5850 MHz, according to a secondary source.'] },
      { title: 'Buying and importing', points: ['Imported radio equipment needs Anatel homologation. A personal-use declaration exists.', 'Customs can hold items without it.'] },
    ],
    stores: [
      shop('Modelismo BH', 'https://www.modelismobh.com.br', 'https://www.modelismobh.com.br/catalogsearch/result/?q='),
      { name: 'Mercado Livre', home: 'https://www.mercadolivre.com.br', search: (q) => `https://lista.mercadolivre.com.br/${encodeURIComponent(q)}` },
      ALI,
    ],
    storeNote: 'We did not find a clear FPV specialist to recommend. Tell us if you know one.',
    sources: [['ANAC drones', 'https://www.gov.br/anac/pt-br/assuntos/drones'], ['RBAC 100 resolution', 'https://pergamum.anac.gov.br/arquivos/RA2026-0805.pdf']],
  },
];

const WORLD = [shop('GetFPV', 'https://www.getfpv.com', 'https://www.getfpv.com/catalogsearch/result/?q='), ALI];

export const regionById = (id) => REGIONS.find((r) => r.id === id) || null;

/** A suggestion from the device's own time zone. No location lookup and no network request. */
export function guessRegion() {
  let tz = '';
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { return 'us'; }
  if (/Shanghai|Urumqi|Chongqing|Harbin/.test(tz)) return 'cn';
  if (/Kolkata|Calcutta/.test(tz)) return 'in';
  if (/Tokyo/.test(tz)) return 'jp';
  if (/^Australia/.test(tz)) return 'au';
  if (/London|Belfast/.test(tz)) return 'uk';
  if (/^Europe/.test(tz)) return 'eu';
  if (/Sao_Paulo|Fortaleza|Manaus|Recife|Belem|Bahia/.test(tz)) return 'br';
  if (/Toronto|Vancouver|Edmonton|Winnipeg|Halifax|Montreal|St_Johns|Regina/.test(tz)) return 'ca';
  return 'us';
}

export function money(usd, region) {
  const r = region || REGIONS[0];
  const v = Math.round((usd * r.rate) / r.step) * r.step;
  return `${r.sym}${v.toLocaleString()}`;
}

export function storeLinks(region, rawQuery) {
  const query = rawQuery.replace(/^Generic\s+/, '');
  const list = region ? region.stores : WORLD;
  const picks = list.slice(0, 3).map((s) => ({ name: s.name, url: s.search(query) }));
  if (/holybro|pixhawk/i.test(query) && !picks.some((p) => p.name === 'Holybro')) picks.unshift({ name: 'Holybro', url: HOLYBRO.search(query.replace(/^Holybro\s+/i, '')) });
  return picks.slice(0, 3);
}

/** Videos as a search on a site that works in the visitor's country, so a link never rots. */
export function videoSearch(region, query) {
  if (region?.id === 'cn') return { site: 'Bilibili', url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(query)}` };
  return { site: 'YouTube', url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}` };
}

export function weightNote(region, grams) {
  if (!region?.weights) return null;
  const hit = [...region.weights].reverse().find((w) => grams >= w.min);
  return hit ? hit.text : null;
}
