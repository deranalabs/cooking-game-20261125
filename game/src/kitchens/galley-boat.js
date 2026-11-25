// SPDX-License-Identifier: MIT
// The Galley Boat: a narrow ferry galley on the river; every swell rolls the cook sideways across the deck.

export default {
  id: 'galley-boat',
  name: 'The Galley Boat',
  place: 'ferry galley, River Ostra',
  blurb: 'A narrow deck. Swells roll you toward the portside.',
  hazard: { kind: 'swell', label: 'SWELL', every: 14, lasts: 2.4, tell: 'the deck rolls: you slide port!' },
  palette: { floorA: '#c9a36e', floorB: '#a87c4c', grout: '#6e4a2a', top: '#f1e2c2', side: '#8a5a32', wall: '#2f4a5a' },
  unlocks: ['salad', 'melt', 'burger', 'garden'],
  length: 150, maxTickets: 3, patience: 78, spawnGap: [15, 21], stars: [90, 180, 270],
  // '#' counter, '.' floor, K chop, P pan, U pot, A plating, H hatch, X trash, R rack, '>' belt, crates lower-case
  plan: [
    '#blt#cmo#fsrn#HH#',
    'K...............X',
    '#AAAAAA...AAAAAA#',
    'K...............#',
    '#PPUU#K.K#UU.PP##',
    '#...............R',
    '#...............R',
    '#################',
  ],
};
