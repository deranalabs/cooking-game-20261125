// SPDX-License-Identifier: MIT
// Dunmore Market Stall: an open-air stall whose serving shutter rattles shut for a few seconds now and then.

export default {
  id: 'market-stall',
  name: 'Dunmore Market Stall',
  place: 'covered market, stall 14',
  blurb: 'The shutter drops: no plates through while it is down.',
  hazard: { kind: 'shutter', label: 'SHUTTER', every: 22, lasts: 5, tell: 'shutter down: hold your plates!' },
  palette: { floorA: '#d8c9a8', floorB: '#b7a27a', grout: '#7a6446', top: '#f6ecd2', side: '#6f8a4a', wall: '#4f6a32' },
  unlocks: ['harbor', 'lantern'],
  length: 155, maxTickets: 3, patience: 74, spawnGap: [14, 20], stars: [100, 200, 300],
  plan: [
    '#bltc#mofs#rn#HHH',
    'K...............#',
    'K...AAAAAAAA....X',
    '#...............#',
    '#...PP#K#KUU....#',
    '#...............#',
    '#...............#',
    '######RR#########',
  ],
};
