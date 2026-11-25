// SPDX-License-Identifier: MIT
// The Ember Hot Line: a long stove line with a charcoal grill, where one burner flares and burns food twice as fast.

// ---- tuning -------------------------------------------------------------------------------------------
const FLARE_EVERY = 15;      // seconds between flare-ups
const FLARE_LASTS = 5;       // seconds a flare burns
const FLARE_HEAT = 2;        // a flaring burner cooks and burns this many times faster
const RUSH_LASTS = 7;        // flares burn longer in the rush
const FLAMES = 5;            // tongues of flame drawn over a flaring burner

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, G grill, A plating, H hatch, X trash, R rack; crates lower-case
// (k chicken, e pepper). Every heat station sits on one wall: the walk is short, but a flare hits the whole line.
const PLAN = [
  '#PPUUGGUUPP#R#HH#',
  'K...............X',
  'K...............#',
  '#..AAAA...AAAA..#',
  '#...............#',
  '#...............#',
  '#...K.......K...#',
  '#bltcmoke#fsrn###',
];

const STATIONS = [
  { what: 'pan', count: 4, note: 'both ends of the line' },
  { what: 'pot', count: 4, note: 'inside the pans' },
  { what: 'charcoal grill', count: 2, note: 'the heart of the line, for skewers' },
  { what: 'chop board', count: 4, note: 'west wall and the south crates' },
  { what: 'plating counter', count: 8, note: 'two pass tables in the middle' },
  { what: 'hatch', count: 2, note: 'end of the line' },
];

// ---- the flare ----------------------------------------------------------------------------------------
// A flare picks the busiest station on the line; the rush makes it last longer. Cooked food left sitting on
// the flaring station is scorched at once, a head start on its burn clock.
function trigger(game, h, kit) {
  h.active = game.rush ? RUSH_LASTS : FLARE_LASTS;
  h.lasts = h.active;
  h.target = kit.pickStove(game);
  scorch(h.target);
  return h.target;
}

const SCORCH = 1.5;          // seconds of burn a flare adds at once to food already done
function scorch(tile) {
  const item = tile && tile.item;
  if (item && item.kind === 'ing' && item.progress === 0 && item.stage > 0) item.overcook += SCORCH;
}

// Live coals under the grill bars, pulsing brighter while food is on them.
function under(ctx, game, t) {
  for (const tile of game.kitchen.list) {
    if (tile.type !== 'grill') continue;
    const busy = !!tile.item;
    for (let k = 0; k < 6; k++) {
      const x = tile.x - 20 + (k % 3) * 20; const y = tile.y - 8 + Math.floor(k / 3) * 16;
      const pulse = 0.5 + 0.5 * Math.sin(t * (busy ? 7 : 2) + k * 1.7);
      ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,${80 + pulse * 90},30,${0.35 + pulse * 0.4})`; ctx.fill();
    }
  }
}

function heat(game, h, tile) {
  return h.active > 0 && h.target === tile ? FLARE_HEAT : 1;
}

function status(game, h) {
  if (h.active > 0) return { label: h.label, text: `x${FLARE_HEAT} HEAT`, active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}

// Tongues of flame licking over the flaring burner, and a heat shimmer on the wall behind it.
function draw(ctx, game, t, paint) {
  const h = game.hazard;
  if (h.active <= 0 || !h.target) return;
  const x = h.target.x; const y = h.target.y;
  const glow = ctx.createRadialGradient(x, y, 6, x, y, 90);
  glow.addColorStop(0, 'rgba(255,140,40,0.45)'); glow.addColorStop(1, 'rgba(255,140,40,0)');
  ctx.fillStyle = glow; ctx.fillRect(x - 90, y - 90, 180, 180);
  for (let k = 0; k < FLAMES; k++) {
    const a = k / (FLAMES - 1) - 0.5; const fh = 44 + Math.sin(t * 18 + k * 2) * 10;
    ctx.beginPath(); ctx.moveTo(x + a * 56 - 11, y + 14); ctx.quadraticCurveTo(x + a * 64, y - fh, x + a * 56 + 11, y + 14);
    ctx.fillStyle = k % 2 ? 'rgba(255,200,40,0.85)' : 'rgba(255,90,30,0.85)'; ctx.fill();
  }
  paint.tag(ctx, 'FLARE x2', x, y + 44, '#ff6a1a');
}

export default {
  id: 'hot-line',
  name: 'Ember Hot Line',
  place: 'grill house, Foundry Lane',
  blurb: 'A burner flares up: anything on it burns twice as fast.',
  intro: 'A foundry grill house: every stove on one wall, and a charcoal grill for skewers.',
  story: 'Brom and the dockers come off the late shift starving. Feed the foundry, and Quill will hear of it.',
  tips: ['Never leave cooked food on the line: a flare burns it in seconds.', 'Skewers need the grill for chicken and pepper.', 'Pots on the line are safest: start rice and noodles early.'],
  hazard: { kind: 'flare', label: 'FLARE', every: FLARE_EVERY, lasts: FLARE_LASTS,
    tell: 'flare-up! that burner runs hot', trigger, heat, status, under, draw },
  palette: { floorA: '#4a4040', floorB: '#2e2626', grout: '#171212', top: '#d9d2c8', side: '#6a2a1a', wall: '#3a1a12' },
  unlocks: ['ramen', 'smoke', 'skewer'],
  guests: ['brom', 'osei', 'quill'],
  stations: STATIONS,
  length: 175, maxTickets: 4, patience: 60, spawnGap: [10, 15],
  par: 280, stars: [150, 280, 410],
  reviews: [
    'Charcoal, mostly. Some of it had been food.',
    'Hot, quick and a little scorched.',
    'The line roared and the plates came out clean.',
    'Foundry Lane has never eaten this well.',
  ],
  plan: PLAN,
};
