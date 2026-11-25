// SPDX-License-Identifier: MIT
// Lantern Night Market: a stall under the rail bridge with fryers, ovens and a grill, where squalls of rain douse burners.

// ---- tuning -------------------------------------------------------------------------------------------
const RAIN_EVERY = 18;       // seconds between squalls
const RAIN_LASTS = 7;        // seconds a squall pours
const DOUSE = 2;             // heat stations a squall puts out (3 in the rush)
const DOUSE_RUSH = 3;
const PUDDLES = 5;           // floor tiles that flood during a squall
const PUDDLE_DRAG = 0.6;     // walking speed in a puddle
const DRY_AFTER = 5;         // seconds puddles take to drain after the rain stops
const DROPS = 90;            // rain streaks drawn across the stall
const LANTERNS = 11;         // paper lanterns strung under the bridge

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, F fryer, O oven, G grill, A plating, H hatch, X trash, R rack,
// '~' counter under the awning; crates lower-case (p potato, k chicken, d dough, e pepper, t tomato, c cheese,
// l lettuce, f fish, r rice, o onion, b bun, m beef, s mushroom). Three kinds of heat on three walls: every
// night-market dish crosses the stall at least once.
const PLAN = [
  '#pkde#HHH#tclfro#',
  'K...............X',
  '#..AAA.....AAA..R',
  'G...............R',
  'G..FF#K.K#PPUU..#',
  '#...............#',
  'O...............#',
  '#OO#~~~~~~~~~bms#',
];

const STATIONS = [
  { what: 'fryer', count: 2, note: 'middle island, west' },
  { what: 'grill', count: 2, note: 'west wall under the bridge arch' },
  { what: 'oven', count: 3, note: 'south-west corner' },
  { what: 'pan', count: 2, note: 'middle island, east' },
  { what: 'pot', count: 2, note: 'middle island, east end' },
  { what: 'chop board', count: 3, note: 'two on the island, one by the crates' },
  { what: 'plating counter', count: 6, note: 'two stalls of three under the hatch' },
  { what: 'hatch', count: 3, note: 'the serving window to the crowd' },
];

// ---- the rain -----------------------------------------------------------------------------------------
// A squall douses the busiest heat stations (they will not heat until it passes) and floods a few floor
// tiles; the cook wades slowly through puddles until they drain.
function trigger(game, h, kit) {
  h.doused = [];
  const n = game.rush ? DOUSE_RUSH : DOUSE;
  for (let k = 0; k < n; k++) {
    const stove = kit.pickStove(game, h.doused);
    if (stove) h.doused.push(stove);
  }
  const floor = kit.findTiles(game.kitchen, 'floor');
  h.puddles = [];
  for (let k = 0; k < PUDDLES && floor.length; k++) h.puddles.push(floor.splice(Math.floor(game.rng.next() * floor.length), 1)[0]);
  h.dry = 0;
  h.target = h.doused[0] || null;
  return h.target || { x: game.chef.x, y: game.chef.y };
}

function end(game, h) {
  h.doused = [];
  h.dry = DRY_AFTER;
}

// Puddles drain after the rain stops.
function tick(game, h, dt) {
  if (h.active > 0 || !h.puddles.length) return;
  h.dry -= dt;
  if (h.dry <= 0) h.puddles = [];
}

function heat(game, h, tile) {
  return h.active > 0 && h.doused.includes(tile) ? 0 : 1;
}

// Speed factor for the cook: slow on a flooded tile.
function footing(game, h) {
  const col = Math.floor(game.chef.x / 64); const row = Math.floor((game.chef.y - 176) / 64);
  return h.puddles.some((t) => t.col === col && t.row === row) ? PUDDLE_DRAG : 1;
}

function status(game, h) {
  if (h.active > 0) return { label: h.label, text: `POURING · ${h.doused.length} OUT`, active: true };
  if (h.puddles.length) return { label: h.label, text: 'puddles', active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}

// Puddles on the floor, under the food and the cook.
function under(ctx, game, t) {
  const h = game.hazard;
  for (const tile of h.puddles) {
    const fade = h.active > 0 ? 1 : Math.max(0, h.dry / DRY_AFTER);
    ctx.beginPath(); ctx.ellipse(tile.x, tile.y + 6, 28 * fade + 6, 14 * fade + 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(90,150,210,0.55)'; ctx.fill();
    const ring = (t * 1.6 + tile.col * 0.3) % 1;
    ctx.beginPath(); ctx.ellipse(tile.x, tile.y + 6, 24 * ring + 4, 10 * ring + 2, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(220,240,255,${0.8 * (1 - ring)})`; ctx.lineWidth = 2; ctx.stroke();
  }
}

// Paper lanterns strung under the bridge, rain streaks while it pours, DOUSED tags on the put-out stations.
function draw(ctx, game, t, paint) {
  const h = game.hazard;
  // the string runs over the open floor of row 5, so no lantern hides a crate or a station
  const y0 = paint.top + 5 * paint.H + 14;
  ctx.strokeStyle = 'rgba(26,20,16,0.8)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(paint.H, y0); ctx.quadraticCurveTo(paint.width / 2, y0 + 30, paint.width - paint.H, y0); ctx.stroke();
  for (let k = 1; k < LANTERNS; k++) {
    const u = k / LANTERNS; const x = paint.H + u * (paint.width - 2 * paint.H); const y = y0 + 4 * u * (1 - u) * 15 + 8 + Math.sin(t * 2 + k) * 2;
    const glow = ctx.createRadialGradient(x, y, 2, x, y, 40);
    glow.addColorStop(0, 'rgba(255,170,70,0.35)'); glow.addColorStop(1, 'rgba(255,170,70,0)');
    ctx.fillStyle = glow; ctx.fillRect(x - 40, y - 40, 80, 80);
    ctx.beginPath(); ctx.ellipse(x, y, 11, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = k % 3 === 0 ? '#e8503a' : k % 3 === 1 ? '#ffb43a' : '#f07a2a'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#2b1a12'; ctx.stroke();
    ctx.fillStyle = 'rgba(255,240,200,0.6)'; ctx.fillRect(x - 3, y - 10, 2, 20);
  }
  if (h.active <= 0) return;
  ctx.strokeStyle = 'rgba(190,215,255,0.55)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let k = 0; k < DROPS; k++) {
    const x = ((k * 137.5 + t * 90) % (paint.width + 60)) - 30;
    const y = paint.top + ((k * 61.3 + t * 620) % paint.height);
    ctx.moveTo(x, y); ctx.lineTo(x - 7, y + 20);
  }
  ctx.stroke();
  for (const tile of h.doused) {
    for (let k = 0; k < 3; k++) {
      const r = ((t * 30 + k * 12) % 36);
      ctx.beginPath(); ctx.arc(tile.x - 10 + k * 10, tile.y - 14 - r, 5 + r * 0.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(230,236,240,${0.6 * (1 - r / 36)})`; ctx.fill();
    }
    paint.tag(ctx, 'DOUSED', tile.x, tile.y - 36, '#3a7ad8');
  }
}

export default {
  id: 'night-market',
  name: 'Lantern Night Market',
  place: 'under the rail bridge, Ostra night market',
  blurb: 'Fryers, ovens and a grill. Squalls douse burners and flood the floor.',
  intro: 'A night stall under the rail bridge: deep-fry, bake and grill, and keep cooking through the rain.',
  story: 'Sable Rook is back for the rematch, and the whole night market has come to watch.',
  tips: ['Chips need the board, then the fryer; skewers need the grill.', 'When rain douses a station, move the food to a dry one.', 'Puddles slow you: walk round them.'],
  hazard: { kind: 'rain', label: 'RAIN', every: RAIN_EVERY, lasts: RAIN_LASTS, firstAt: 0.5,
    tell: 'squall! burners doused', trigger, end, tick, heat, footing, status, under, draw },
  palette: { floorA: '#4a5468', floorB: '#343c4e', grout: '#161c26', top: '#ece0c6', side: '#a8402a', wall: '#141a2a' },
  unlocks: ['chips', 'flatbread', 'nightbowl'],
  guests: ['ada', 'pip', 'dot', 'osei'],
  rival: true,
  stations: STATIONS,
  length: 180, maxTickets: 4, patience: 62, spawnGap: [10, 15],
  par: 320, stars: [170, 320, 470],
  reviews: [
    'Soggy chips and a soggier cook.',
    'Good fryer work. The rain won a round or two.',
    'Hot food in cold rain. The market cheered.',
    'The best stall under the bridge. Rain or shine.',
  ],
  plan: PLAN,
};
