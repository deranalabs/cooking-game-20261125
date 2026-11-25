// SPDX-License-Identifier: MIT
// The Gilded Banquet Hall: a long serving hatch and feast calls that bring two tickets at once.

export default {
  id: 'banquet-hall',
  name: 'Gilded Banquet Hall',
  place: 'the Ostra guildhall, wedding night',
  blurb: 'A long hatch, and feast calls bring two tickets at once.',
  hazard: { kind: 'feast', label: 'FEAST CALL', every: 26, lasts: 0, tell: 'feast call: two tables at once!' },
  palette: { floorA: '#7a2e3a', floorB: '#5a1e2a', grout: '#3a0e18', top: '#f6ead0', side: '#b08a3a', wall: '#3a1a2a' },
  unlocks: ['platter'],
  length: 180, maxTickets: 4, patience: 58, spawnGap: [10, 14], stars: [160, 300, 440],
  plan: [
    '#HHHHHHHHHHHHHHH#',
    '#...............#',
    'K..AAAAA#AAAAA..X',
    'K...............#',
    '#.PP#UU#K#UU#PP.#',
    '#...............#',
    '#...............R',
    '#bltcmo###fsrn#R#',
  ],
};
