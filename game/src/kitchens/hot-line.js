// SPDX-License-Identifier: MIT
// The Ember Hot Line: a long stove line where one burner flares and burns food twice as fast.

export default {
  id: 'hot-line',
  name: 'Ember Hot Line',
  place: 'grill house, Foundry Lane',
  blurb: 'A burner flares up: anything on it burns twice as fast.',
  hazard: { kind: 'flare', label: 'FLARE', every: 15, lasts: 5, tell: 'flare-up! that burner runs hot' },
  palette: { floorA: '#4a4040', floorB: '#2e2626', grout: '#171212', top: '#d9d2c8', side: '#6a2a1a', wall: '#3a1a12' },
  unlocks: ['ramen', 'smoke'],
  length: 175, maxTickets: 4, patience: 60, spawnGap: [10, 15], stars: [150, 280, 410],
  plan: [
    '#PPUUPPUUPP#R#HH#',
    'K...............X',
    'K...............#',
    '#..AAAA...AAAA..#',
    '#...............#',
    '#...............#',
    '#...K.......K...#',
    '#bltcmo###fsrn###',
  ],
};
