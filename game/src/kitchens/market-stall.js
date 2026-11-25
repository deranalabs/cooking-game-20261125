// SPDX-License-Identifier: MIT
// Dunmore Market Stall: an open-air stall whose serving shutter rattles shut for a few seconds now and then.

// ---- tuning -------------------------------------------------------------------------------------------
const SHUTTER_EVERY = 22;    // seconds between drops
const SHUTTER_LASTS = 5;     // seconds the shutter stays down
const CROWD_CALM = 0.5;      // share of patience drain the crowd forgives while it can see the shutter is down
const RATTLE_WARN = 2.5;     // seconds before a drop when the shutter starts to rattle
const RUSH_EVERY = 0.8;      // drops come sooner in the rush

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, A plating, H hatch, X trash, R rack; crates lower-case.
// A wide plating bar in the middle, a three-tile hatch in the corner, and the plate racks at the back gate.
const PLAN = [
  '#bltc#mofs#rn#HHH',
  'K...............#',
  'K...AAAAAAAA....X',
  '#...............#',
  '#...PP#K#KUU....#',
  '#...............#',
  '#...............#',
  '######RR#########',
];

const STATIONS = [
  { what: 'chop board', count: 4, note: 'two by the crates, two by the stove' },
  { what: 'pan', count: 2, note: 'left of the stove block' },
  { what: 'pot', count: 2, note: 'right of the stove block' },
  { what: 'plating bar', count: 8, note: 'the long bar in the middle' },
  { what: 'hatch', count: 3, note: 'the corner shutter' },
  { what: 'plate rack', count: 2, note: 'at the back gate, far from the hatch' },
];

// ---- the shutter --------------------------------------------------------------------------------------
function hatches(game, kit) {
  return kit.findTiles(game.kitchen, 'hatch');
}

function trigger(game, h, kit) {
  const list = hatches(game, kit);
  return list[Math.floor(list.length / 2)];
}

// While the shutter is down the crowd can see why: tickets drain at half speed.
// Just before a drop the shutter rattles (h.rattle) so a careful cook holds the plate back.
function tick(game, h, dt) {
  h.rattle = h.active <= 0 && h.clock < RATTLE_WARN ? 1 - h.clock / RATTLE_WARN : 0;
  if (h.active <= 0) return;
  for (const ticket of game.tickets) ticket.patience += dt * CROWD_CALM;
}

// No plates through the hatch while the shutter is down.
function hatchOpen(game, h) {
  return !(h.active > 0);
}

function status(game, h) {
  if (h.active > 0) return { label: h.label, text: 'DOWN!', active: true };
  if (h.rattle > 0) return { label: h.label, text: 'rattling...', active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}

// Corrugated slats pulled down over each hatch tile, or shaking in their rail when about to drop.
function drawShutter(ctx, x, y, H, drop, paint) {
  const h = (H - 6) * drop;
  paint.rr(ctx, x + 1, y + 1, H - 2, Math.max(8, h), 4, '#8a9298', 3);
  for (let k = 8; k < h - 6; k += 9) { ctx.fillStyle = '#5d666c'; ctx.fillRect(x + 4, y + k, H - 8, 3); }
  ctx.fillStyle = '#c8261a'; ctx.fillRect(x + H / 2 - 10, y + Math.max(2, h - 12), 20, 6);
}

function draw(ctx, game, t, paint) {
  const h = game.hazard;
  const list = game.kitchen.list.filter((tile) => tile.type === 'hatch');
  for (const tile of list) {
    const x = tile.col * paint.H; const y = tile.y - paint.H / 2;
    if (h.active > 0) drawShutter(ctx, x, y, paint.H, 1, paint);
    else if (h.rattle > 0) drawShutter(ctx, x + Math.sin(t * 50) * 2 * h.rattle, y, paint.H, 0.12 + h.rattle * 0.1, paint);
  }
  if (h.active > 0 && list.length) paint.tag(ctx, 'SHUTTER DOWN', list[1].x, list[1].y + 44, '#c8261a');
}

export default {
  id: 'market-stall',
  name: 'Dunmore Market Stall',
  place: 'covered market, stall 14',
  blurb: 'The shutter drops: no plates through while it is down.',
  intro: 'A stall in the covered market. The hatch shutter sticks, so time your plates around it.',
  story: 'Greta Fenn sold wool here for thirty years and swapped her pitch for your lunches.',
  tips: ['When the shutter rattles, hold the plate: it is about to drop.', 'The crowd waits calmer while the shutter is down.', 'The racks are at the back gate: grab two plates at a time.'],
  hazard: { kind: 'shutter', label: 'SHUTTER', every: SHUTTER_EVERY, lasts: SHUTTER_LASTS, rushEvery: RUSH_EVERY,
    tell: 'shutter down: hold your plates!', trigger, tick, hatchOpen, status, draw },
  palette: { floorA: '#d8c9a8', floorB: '#b7a27a', grout: '#7a6446', top: '#f6ecd2', side: '#6f8a4a', wall: '#4f6a32' },
  unlocks: ['harbor', 'lantern'],
  guests: ['greta', 'luz', 'dot'],
  stations: STATIONS,
  length: 155, maxTickets: 3, patience: 74, spawnGap: [14, 20],
  par: 200, stars: [100, 200, 300],
  reviews: [
    'The shutter fell on my lunch, and so did my mood.',
    'Market food with market manners. Fair.',
    'Quick hands behind a stubborn shutter.',
    'They cooked around that shutter like it was not there.',
  ],
  plan: PLAN,
};
