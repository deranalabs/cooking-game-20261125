// SPDX-License-Identifier: MIT
// The Tin Conveyor Diner: a split counter with a belt that carries whatever you set on it toward the hatch.

export default {
  id: 'conveyor-diner',
  name: 'Tin Conveyor Diner',
  place: 'all-night diner, Ninth Street',
  blurb: 'Split counter. The belt carries plates right, toward the hatch.',
  hazard: { kind: 'belt', label: 'BELT', every: 1.1, lasts: 0, tell: 'the belt never stops' },
  palette: { floorA: '#e6dcc8', floorB: '#a9b4bc', grout: '#5a646c', top: '#e3eef0', side: '#c8452e', wall: '#8a2a20' },
  unlocks: ['forest', 'fisher'],
  length: 165, maxTickets: 4, patience: 68, spawnGap: [12, 17], stars: [120, 230, 340],
  plan: [
    '#bltcm#ofsrn#R#HH',
    'K.......#.......#',
    'K.......#.......X',
    '#.AAA>>>>>>>>>>.#',
    '#...............#',
    '#..PP#K#UU#PP#UU#',
    '#...............#',
    '#################',
  ],
};
