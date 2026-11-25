// SPDX-License-Identifier: MIT
// Saffron Rooftop: a garden kitchen on a roof where gusts blow out burners until the wind drops.

// ---- tuning -------------------------------------------------------------------------------------------
const GUST_EVERY = 16;       // seconds between gusts
const GUST_LASTS = 6;        // seconds a burner stays out
const RUSH_BURNERS = 2;      // burners a gust puts out in the rush (one before it)
const RUSH_EVERY = 0.85;     // gusts come a little sooner in the rush
const WIND_LINES = 3;        // wind streaks drawn over each blown-out burner

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, A plating, H hatch, X trash, R rack; crates lower-case.
// Two stove islands in the open air, planters (crates) along the parapet, the hatch down the stairwell side.
const PLAN = [
  '#bl#tc#mo#fs#rn##',
  'K...............H',
  '#..AAA.....AAA..H',
  'K..PPU.....UPP..X',
  '#...............#',
  '#..AAA..K..AAA..#',
  '#...............#',
  '######RR#########',
];

const STATIONS = [
  { what: 'chop board', count: 3, note: 'two on the west wall, one between the islands' },
  { what: 'pan', count: 4, note: 'two on each island' },
  { what: 'pot', count: 2, note: 'one on each island, facing in' },
  { what: 'plating counter', count: 12, note: 'two islands of three, front and back' },
  { what: 'hatch', count: 2, note: 'the stairwell door, east side' },
  { what: 'plate rack', count: 2, note: 'south parapet' },
];

// ---- the gust -----------------------------------------------------------------------------------------
// A gust puts out the busiest burner (two in the rush); it will not heat until the wind drops.
function trigger(game, h, kit) {
  h.doused = [];
  const n = game.rush ? RUSH_BURNERS : 1;
  for (let k = 0; k < n; k++) {
    const stove = kit.pickStove(game, h.doused);
    if (stove) h.doused.push(stove);
  }
  h.target = h.doused[0] || null;
  return h.target;
}

function end(game, h) {
  h.doused = [];
}

function heat(game, h, tile) {
  return h.active > 0 && h.doused.includes(tile) ? 0 : 1;
}

function status(game, h) {
  if (h.active > 0) return { label: h.label, text: `${h.doused.length} OUT`, active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}

// Wind streaks over each blown-out burner and an OUT tag, plus leaves skating across the roof.
function draw(ctx, game, t, paint) {
  const h = game.hazard;
  if (h.active <= 0) return;
  for (const tile of h.doused) {
    const x = tile.x; const y = tile.y;
    ctx.strokeStyle = 'rgba(220,240,255,0.95)'; ctx.lineWidth = 4;
    for (let k = 0; k < WIND_LINES; k++) {
      const o = ((t * 60 + k * 22) % 66) - 33;
      ctx.beginPath(); ctx.moveTo(x - 34 + o, y - 20 + k * 14); ctx.quadraticCurveTo(x + o, y - 32 + k * 14, x + 30 + o, y - 18 + k * 14); ctx.stroke();
    }
    paint.tag(ctx, 'OUT', x, y - 36, '#4aa3d8');
  }
  for (let k = 0; k < 7; k++) {
    const lx = ((t * 220 + k * 173) % (paint.width + 80)) - 40;
    const ly = paint.top + 60 + ((k * 97) % 420) + Math.sin(t * 5 + k) * 14;
    ctx.save(); ctx.translate(lx, ly); ctx.rotate(t * 4 + k);
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 4, 0, 0, Math.PI * 2);
    ctx.fillStyle = k % 2 ? '#7fae3a' : '#c9a02a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = '#2b1a12'; ctx.stroke();
    ctx.restore();
  }
}

export default {
  id: 'rooftop-garden',
  name: 'Saffron Rooftop',
  place: 'roof garden above the tram depot',
  blurb: 'Gusts blow burners out: they will not heat until the wind drops.',
  intro: 'A roof garden with two stove islands in the open air. The wind picks the busiest burner.',
  story: 'Critic Sable Rook dines up here. Rook wrote the review that closed your old boss: beat Rook.',
  tips: ['Spread food over both islands so one gust cannot stop everything.', 'A blown-out burner keeps your food safe: it cannot burn either.', 'Rook judges freshness and speed: serve Rook first.'],
  hazard: { kind: 'gust', label: 'GUST', every: GUST_EVERY, lasts: GUST_LASTS, rushEvery: RUSH_EVERY,
    tell: 'gust! a burner blew out', trigger, end, heat, status, draw },
  palette: { floorA: '#a9b98a', floorB: '#7f925f', grout: '#4c5a36', top: '#efe6cc', side: '#6a4a8a', wall: '#3a5a7a' },
  unlocks: ['ember', 'risotto'],
  guests: ['luz', 'quill', 'dot'],
  rival: true,
  stations: STATIONS,
  length: 170, maxTickets: 4, patience: 64, spawnGap: [11, 16],
  par: 260, stars: [140, 260, 380],
  reviews: [
    'The wind served better than the kitchen did.',
    'A pleasant roof, an uneven stove.',
    'They cooked through a gale and kept smiling.',
    'The best view in Ostra, and the plates matched it.',
  ],
  plan: PLAN,
};
