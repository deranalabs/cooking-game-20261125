// SPDX-License-Identifier: MIT
// The Tin Conveyor Diner: a split counter with a belt that carries whatever you set on it toward the hatch.

// ---- tuning -------------------------------------------------------------------------------------------
const BELT_STEP = 1.1;       // seconds for the belt to move an item one tile
const RUSH_STEP = 0.8;       // the belt speeds up in the rush
const CHEVRON_SPEED = 40;    // px/s the painted chevrons crawl
const CHEVRON_GAP = 22;      // px between chevrons

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, A plating, H hatch, X trash, R rack, '>' belt; crates lower-case.
// A wall splits the top of the diner in two; the belt runs left to right under it, so a plate set down at the
// plating end rides across the room while you work.
const PLAN = [
  '#bltcm#ofsrn#R#HH',
  'K.......#.......#',
  'K.......#.......X',
  '#.AAA>>>>>>>>>>.#',
  '#...............#',
  '#..PP#K#UU#PP#UU#',
  '#...............#',
  '#################',
];

const STATIONS = [
  { what: 'chop board', count: 3, note: 'two by the left wall, one on the stove line' },
  { what: 'pan', count: 4, note: 'two pairs on the stove line' },
  { what: 'pot', count: 4, note: 'two pairs on the stove line' },
  { what: 'plating counter', count: 3, note: 'at the head of the belt' },
  { what: 'conveyor belt', count: 10, note: 'carries plates and food to the right' },
  { what: 'hatch', count: 2, note: 'top right corner' },
];

// ---- the belt -----------------------------------------------------------------------------------------
// Each step, everything on the belt moves one tile right if the next belt tile is free, back to front so a
// queue of plates moves together.
function moveBelt(game, kit) {
  const belts = kit.findTiles(game.kitchen, 'belt').sort((a, b) => b.col - a.col);
  let moved = 0;
  for (const tile of belts) {
    const next = kit.tileAt(game.kitchen, tile.col + 1, tile.row);
    if (tile.item && next && next.type === 'belt' && !next.item) {
      next.item = tile.item; tile.item = null; moved += 1;
      if (next.item.kind === 'plate') next.item.pop = 0.4;
    }
  }
  return moved;
}

// The belt never stops: it runs on its own clock, faster in the rush.
function tick(game, h, dt, kit) {
  h.beltT += dt;
  const step = game.rush ? RUSH_STEP : BELT_STEP;
  while (h.beltT >= step) { h.beltT -= step; h.moves = (h.moves || 0) + moveBelt(game, kit); }
}

function trigger() { return null; }

function status(game, h) {
  return { label: h.label, text: game.rush ? 'FAST!' : 'running', active: true };
}

// Dark rubber with chevrons that crawl toward the hatch, under whatever rides on it.
function under(ctx, game, t, paint) {
  const H = paint.H;
  for (const tile of game.kitchen.list) {
    if (tile.type !== 'belt') continue;
    const x = tile.col * H; const y = tile.y - H / 2;
    paint.rr(ctx, x + 1, y + 6, H - 2, H - 16, 4, '#2c3036', 3);
    ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 8, H - 4, H - 20); ctx.clip();
    const off = (t * CHEVRON_SPEED * (game.rush ? 1.4 : 1)) % CHEVRON_GAP;
    ctx.strokeStyle = '#ffb02e'; ctx.lineWidth = 3;
    for (let k = -CHEVRON_GAP; k < H; k += CHEVRON_GAP) {
      const cx = x + k + off;
      ctx.beginPath(); ctx.moveTo(cx, y + 14); ctx.lineTo(cx + 8, y + 26); ctx.lineTo(cx, y + 38); ctx.stroke();
    }
    ctx.restore();
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(x + 1, y + H - 12, H - 2, 4);
  }
}

function draw() {}

export default {
  id: 'conveyor-diner',
  name: 'Tin Conveyor Diner',
  place: 'all-night diner, Ninth Street',
  blurb: 'Split counter. The belt carries plates right, toward the hatch.',
  intro: 'An all-night diner with a belt down the middle. Set a plate on it and it rides to the far side.',
  story: 'Kofi Osei eats here before every night shift. Tonight the cook quit, so the apron is yours.',
  tips: ['Build plates at the head of the belt and let it carry them.', 'The wall splits the room: walk round the end of the belt.', 'In the rush the belt runs faster.'],
  hazard: { kind: 'belt', label: 'BELT', every: BELT_STEP, lasts: 0, continuous: true,
    tell: 'the belt never stops', trigger, tick, status, under, draw },
  palette: { floorA: '#e6dcc8', floorB: '#a9b4bc', grout: '#5a646c', top: '#e3eef0', side: '#c8452e', wall: '#8a2a20' },
  unlocks: ['forest', 'fisher'],
  guests: ['osei', 'pip', 'ada'],
  stations: STATIONS,
  length: 165, maxTickets: 4, patience: 68, spawnGap: [12, 17],
  par: 230, stars: [120, 230, 340],
  reviews: [
    'The belt brought me everything but my order.',
    'A diner that works if you do not look too close.',
    'Plates riding the belt like trams at rush hour. Lovely.',
    'Ninth Street has a new best counter. Go at midnight.',
  ],
  plan: PLAN,
};
