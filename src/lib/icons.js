// One icon set for the whole site: a 24 px grid, drawn with a single stroke weight.
// No React here, so a test can check that everything points at an icon that exists.

const c = (x, y, r) => `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;

export const PATHS = {
  home: 'M3 11l9-8 9 8M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5',
  list: 'M4 6h16M4 12h16M4 18h10',
  build: 'M14.7 6.3a4 4 0 00-5.4 5.1L3 17.7V21h3.3l6.3-6.3a4 4 0 005.1-5.4l-2.6 2.6-2.3-.5-.5-2.3z',
  fly: 'M12 3v6m0 0l-8 5v2l8-3 8 3v-2l-8-5zm0 4v8m-3 3l3-1 3 1',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9a8 8 0 0116 0',
  chev: 'M9 5l7 7-7 7',
  back: 'M15 5l-7 7 7 7',
  close: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  spark: 'M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z',
  bolt: 'M13 3L5 14h6l-1 7 8-11h-6l1-7z',
  camera: 'M4 7h3l2-3h6l2 3h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1zm8 10a4 4 0 100-8 4 4 0 000 8z',
  flask: 'M9 3h6M10 3v6L4.5 18.5A1.7 1.7 0 006 21h12a1.7 1.7 0 001.5-2.5L14 9V3M7.5 15h9',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zm0 14a2 2 0 012-2h13v4H6a2 2 0 01-2-2z',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zm0 0v14m6-12v14',
  share: 'M12 15V3m0 0L8 7m4-4l4 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7',
  globe: 'M12 21a9 9 0 100-18 9 9 0 000 18zM3 12h18M12 3c2.5 2.5 3.5 5.5 3.5 9s-1 6.500-3.500 9c-2.500-2.500-3.500-5.500-3.500-9s1-6.500 3.500-9z',
  ext: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1h5',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  edit: 'M4 20h4L19 9a2.800 2.800 0 00-4-4L4 16v4zM13.500 6.500l4 4',
  cog: 'M4 7h9M17 7h3M4 17h3M11 17h9M15 5v4M9 15v4',
  sun: 'M12 16a4 4 0 100-8 4 4 0 000 8zM12 3v2m0 14v2M3 12h2m14 0h2M5.600 5.600L7 7m10 10l1.400 1.400M5.600 18.400L7 17m10-10l1.400-1.400',
  moon: 'M20 14.500A8.500 8.500 0 019.500 4a8.500 8.500 0 1010.500 10.500z',
  cpu: 'M8 8h8v8H8zM9 3v3m6-3v3M9 18v3m6-3v3M3 9h3m-3 6h3m12-6h3m-3 6h3',

  frame: `M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6${c(6, 6, 3)}${c(18, 6, 3)}${c(6, 18, 3)}${c(18, 18, 3)}`,
  motor: `${c(12, 12, 8)}${c(12, 12, 2.5)}M12 4v3M12 17v3M4 12h3M17 12h3`,
  esc: 'M5 6h14a1 1 0 011 1v10a1 1 0 01-1 1H5a1 1 0 01-1-1V7a1 1 0 011-1zM13 8.500l-3 4h4l-3 3.500',
  prop: `M12 10.500C9.500 8 9 4.500 10.500 3c2.500 0 3.500 4 1.500 7.500zM12 13.500c2.500 2.500 3 6 1.500 7.500-2.500 0-3.500-4-1.500-7.500z${c(12, 12, 1.5)}`,
  battery: 'M3 8h15a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V9a1 1 0 011-1zM22 11v2M6 11v2M10 11v2',
  video: 'M3 7h11a1 1 0 011 1v8a1 1 0 01-1 1H3a1 1 0 01-1-1V8a1 1 0 011-1zM15 11l6-3v8l-6-3',
  antenna: `${c(12, 10, 1.5)}M12 11.500V21M8.500 6.500a5 5 0 000 7M15.500 6.500a5 5 0 010 7M5.500 3.500a9 9 0 000 13M18.500 3.500a9 9 0 010 13`,
  pin: `M12 21s7-6.200 7-11.500a7 7 0 10-14 0C5 14.800 12 21 12 21z${c(12, 9.5, 2.5)}`,
  board: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zM7 9h4v4H7zM15 9h2M15 13h2M7 16h10',
  loop: 'M2.500 18.500c5 1 9.500-.5 12-5 2-3.700.5-9.500-3.500-9.500s-5.500 5-3 9c2.800 4.500 9 5.500 14 2.500',
  flag: 'M5 21V4M5 4c3-1.500 5-1 7 0s4 1.500 7 0v10c-3 1.500-5 1-7 0s-4-1.500-7 0',
  route: `${c(6, 19, 2)}${c(18, 5, 2)}M8 19h7.500a3.500 3.500 0 000-7h-7a3.500 3.500 0 010-7H16`,
  box: 'M12 3l8 4.500v9L12 21l-8-4.500v-9L12 3zM4 7.500l8 4.500 8-4.500M12 12v9',
  toolbox: 'M4 9h16a1 1 0 011 1v9a1 1 0 01-1 1H4a1 1 0 01-1-1v-9a1 1 0 011-1zM9 9V6a1 1 0 011-1h4a1 1 0 011 1v3M3 14h18',
  plug: 'M9 3v5M15 3v5M7 8h10v3a5 5 0 01-10 0V8zM12 16v2a3 3 0 003 3h4',
  shield: 'M12 3l8 3v6c0 4.500-3.200 7.800-8 9-4.800-1.200-8-4.500-8-9V6l8-3zM8.500 12l2.500 2.500 4.500-5',
  columns: 'M5 4h5a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5a1 1 0 011-1zM14 4h5a1 1 0 011 1v14a1 1 0 01-1 1h-5a1 1 0 01-1-1V5a1 1 0 011-1zM6.500 9h2M15.500 9h2M6.500 13h2M15.500 13h2',
  tasks: 'M4 6l1.500 1.500L8 5M4 12l1.500 1.500L8 11M4 18l1.500 1.500L8 17M11 6.500h9M11 12.500h9M11 18.500h9',
  trophy: 'M8 4h8v6a4 4 0 01-8 0V4zM8 6H4v2a3 3 0 003 3M16 6h4v2a3 3 0 01-3 3M12 14v4M8 20h8',
  lock: 'M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1zM8 11V8a4 4 0 018 0v3',
  flip: 'M4 12a8 8 0 0114-5.300L20 9M20 4v5h-5M20 12a8 8 0 01-14 5.300L4 15M4 20v-5h5',
  flame: 'M12 3c1 4 5 5.500 5 10.500a5 5 0 01-10 0c0-2 1-3.500 2-4.500 0 2 1 3 2 3 .5-3-.5-6 1-9z',
};

export const GOAL_ICON = { whoop: 'home', freestyle: 'loop', race: 'flag', cine: 'camera', longrange: 'route', lab: 'flask', heavy: 'box' };
export const SLOT_ICON = { frame: 'frame', motor: 'motor', esc: 'esc', fc: 'cpu', prop: 'prop', battery: 'battery', video: 'video', rx: 'antenna', gps: 'pin', companion: 'board', payload: 'box' };
export const STAGE_ICON = { configure: 'cog', parts: 'tasks', build: 'build', software: 'cpu', fly: 'fly', share: 'share' };
export const BADGE_ICON = { planner: 'tasks', gathered: 'box', builder: 'build', flashed: 'cpu', pilot: 'fly', sharer: 'share', ten: 'trophy' };
export const SYMPTOM_ICON = { 'wont-arm': 'lock', flips: 'flip', 'no-link': 'antenna', 'no-video': 'video', 'hot-motors': 'flame', 'short-flight': 'battery', gps: 'pin' };
