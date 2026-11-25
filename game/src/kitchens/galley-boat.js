// SPDX-License-Identifier: MIT
// The Galley Boat: a narrow ferry galley on the river; every swell rolls the cook and loose food toward port.

// ---- tuning -------------------------------------------------------------------------------------------
const SWELL_EVERY = 14;      // seconds between swells
const SWELL_LASTS = 2.4;     // how long the deck tilts
const SLIDE_SPEED = 150;     // px/s the cook slides at the top of a roll
const ROLL_CHANCE = 0.5;     // chance a loose ingredient on a counter rolls one tile to port
const TILT = 0.012;          // radians the whole galley sways while the swell runs
const RUSH_EVERY = 0.75;     // swells come this much sooner in the rush

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, A plating, H hatch, X trash, R rack; crates lower-case
// (b bun, l lettuce, t tomato, c cheese, m beef, o onion, f fish, s mushroom, r rice, n noodles).
// A long deck with plating counters down the middle: you cross the boat for every plate.
const PLAN = [
  '#blt#cmo#fsrn#HH#',
  'K...............X',
  '#AAAAAA...AAAAAA#',
  'K...............#',
  '#PPUU#K.K#UU.PP##',
  '#...............R',
  '#...............R',
  '#################',
];

// What the galley has, in words for the menu planner.
const STATIONS = [
  { what: 'chop board', count: 4, note: 'two at the bow, two amidships' },
  { what: 'pan', count: 4, note: 'paired at each end of the stove row' },
  { what: 'pot', count: 4, note: 'in the middle of the stove row' },
  { what: 'plating counter', count: 12, note: 'a long table down the deck' },
  { what: 'hatch', count: 2, note: 'up top, starboard of the crates' },
  { what: 'plate rack', count: 2, note: 'stern, starboard side' },
];

// ---- the swell ----------------------------------------------------------------------------------------
// The deck rolls: loose ingredients on plain counters may roll one tile to port if that tile is free.
function rollLooseFood(game, kit) {
  const loose = game.kitchen.list.filter((t) => (t.type === 'counter' || t.type === 'plating') && t.item && t.item.kind === 'ing');
  for (const tile of loose.sort((a, b) => a.col - b.col)) {
    const port = kit.tileAt(game.kitchen, tile.col - 1, tile.row);
    if (port && (port.type === 'counter' || port.type === 'plating') && !port.item && game.rng.next() < ROLL_CHANCE) {
      port.item = tile.item; tile.item = null;
      port.item.squash = 1;
    }
  }
}

function trigger(game, h, kit) {
  rollLooseFood(game, kit);
  return { x: game.chef.x, y: game.chef.y };
}

// While the swell runs, the cook slides toward port, hardest in the middle of the roll.
function tick(game, h, dt, kit) {
  if (h.active <= 0) return;
  const roll = Math.sin(Math.PI * Math.max(0, h.active) / h.lasts);
  kit.nudgeChef(game, -SLIDE_SPEED * dt * roll, 0);
}

// The whole galley sways while the swell runs.
function tilt(game, t) {
  return game.hazard.active > 0 ? Math.sin(t * 3) * TILT : 0;
}

// River water lapping at the hull below the floor, and spray over the deck while it rolls.
function draw(ctx, game, t, paint) {
  if (game.hazard.active <= 0) return;
  const w = paint.width; const y0 = paint.top;
  ctx.strokeStyle = 'rgba(170,220,255,0.55)'; ctx.lineWidth = 4;
  for (let k = 0; k < 6; k++) {
    const y = y0 + 40 + k * 80 + Math.sin(t * 4 + k) * 8;
    ctx.beginPath(); ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 32) ctx.lineTo(x, y + Math.sin(x / 50 + t * 6 + k) * 6);
    ctx.stroke();
  }
  paint.tag(ctx, '<< ROLLING TO PORT', game.chef.x, game.chef.y - 64, '#4aa3d8');
}

export default {
  id: 'galley-boat',
  name: 'The Galley Boat',
  place: 'ferry galley, River Ostra',
  blurb: 'A narrow deck. Swells roll you and loose food toward port.',
  intro: 'Your first kitchen is a ferry galley. Learn the loop: crate, board, stove, plate, hatch.',
  story: 'Old Marlow ran this galley for forty years. He is retiring, and he wants to see you cook first.',
  tips: ['Keep ingredients on plates, not counters: the swell rolls loose food.', 'Pans and pots sit together: start both, then chop.', 'Burgers need no stove for the bun: plate it first.'],
  hazard: { kind: 'swell', label: 'SWELL', every: SWELL_EVERY, lasts: SWELL_LASTS, rushEvery: RUSH_EVERY,
    tell: 'the deck rolls: you slide port!', trigger, tick, tilt, draw },
  palette: { floorA: '#c9a36e', floorB: '#a87c4c', grout: '#6e4a2a', top: '#f1e2c2', side: '#8a5a32', wall: '#2f4a5a' },
  unlocks: ['salad', 'melt', 'burger', 'garden'],
  guests: ['marlow', 'brom', 'greta'],
  stations: STATIONS,
  length: 150, maxTickets: 3, patience: 78, spawnGap: [15, 21],
  par: 160, stars: [90, 180, 270],
  reviews: [
    'Seasick service. The plates slid more than the ferry.',
    'Honest river food, if a little wobbly.',
    'The galley hums like the engine. I came back twice.',
    'Not one plate lost to the river. A born ferry cook.',
  ],
  plan: PLAN,
};
