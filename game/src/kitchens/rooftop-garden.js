// SPDX-License-Identifier: MIT
// Saffron Rooftop: a garden kitchen on a roof where gusts blow out one burner at a time.

export default {
  id: 'rooftop-garden',
  name: 'Saffron Rooftop',
  place: 'roof garden above the tram depot',
  blurb: 'Gusts blow a burner out: it will not heat until the wind drops.',
  hazard: { kind: 'gust', label: 'GUST', every: 16, lasts: 6, tell: 'gust! a burner blew out' },
  palette: { floorA: '#a9b98a', floorB: '#7f925f', grout: '#4c5a36', top: '#efe6cc', side: '#6a4a8a', wall: '#3a5a7a' },
  unlocks: ['ember', 'risotto'],
  length: 170, maxTickets: 4, patience: 64, spawnGap: [11, 16], stars: [140, 260, 380],
  plan: [
    '#bl#tc#mo#fs#rn##',
    'K...............H',
    '#..AAA.....AAA..H',
    'K..PPU.....UPP..X',
    '#...............#',
    '#..AAA..K..AAA..#',
    '#...............#',
    '######RR#########',
  ],
};
