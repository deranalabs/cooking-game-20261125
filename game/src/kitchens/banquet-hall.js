// SPDX-License-Identifier: MIT
// The Gilded Banquet Hall: a long serving hatch, a pie oven, and feast calls that bring two tickets at once.

// ---- tuning -------------------------------------------------------------------------------------------
const FEAST_EVERY = 26;      // seconds between feast calls
const FEAST_SHOW = 3;        // seconds the feast banner hangs over the hall
const FEAST_TABLES = 2;      // tickets a feast call brings at once
const FEAST_BONUS = 1.15;    // feast tickets wait a little longer: a table is patient together
const RUSH_EVERY = 0.7;      // feast calls come much sooner in the rush

// ---- the floor plan -----------------------------------------------------------------------------------
// '#' counter, '.' floor, K chop, P pan, U pot, O oven, A plating, H hatch, X trash, R rack; crates lower-case
// (d dough). A fifteen-tile hatch along the top of the hall, two plating tables below it, ovens for the pies.
const PLAN = [
  '#HHHHHHHHHHHHHHH#',
  '#...............#',
  'K..AAAAA#AAAAA..X',
  'K...............#',
  '#.PP#UU#K#OO#PP.#',
  '#...............#',
  '#...............R',
  '#bltcmod##fsrn#R#',
];

const STATIONS = [
  { what: 'hatch', count: 15, note: 'the whole north wall' },
  { what: 'plating table', count: 10, note: 'two tables under the hatch' },
  { what: 'pan', count: 4, note: 'both ends of the stove row' },
  { what: 'pot', count: 2, note: 'west of the middle board' },
  { what: 'pie oven', count: 2, note: 'east of the middle board' },
  { what: 'chop board', count: 3, note: 'west wall and the middle of the stove row' },
];

// ---- the feast call -----------------------------------------------------------------------------------
// A feast call seats two tables at once, as long as the board has room; they wait a little longer together.
function trigger(game, h, kit) {
  h.active = FEAST_SHOW; h.lasts = FEAST_SHOW;
  let seated = 0;
  for (let k = 0; k < FEAST_TABLES && game.tickets.length < game.shift.maxTickets; k++) {
    const guest = kit.pickGuest(game);
    const ticket = kit.addTicket(game, kit.pickDish(game, guest), guest);
    ticket.max *= FEAST_BONUS; ticket.patience = ticket.max; ticket.feast = true;
    seated += 1;
  }
  h.seated = seated;
  return { x: 8 * 64, y: 176 + 40 };
}

// A feast table served pays the wedding's share on top: the guild is generous on the night.
const FEAST_PAY = 1.25;
function payBonus(ticket) {
  return ticket.feast ? FEAST_PAY : 1;
}

// Candle light on the plating tables, guttering in the draught from the hatch.
function under(ctx, game, t) {
  for (const tile of game.kitchen.list) {
    if (tile.type !== 'plating' || (tile.col % 2)) continue;
    const f = 0.6 + 0.4 * Math.sin(t * 9 + tile.col * 1.3) * Math.sin(t * 3.1 + tile.col);
    const glow = ctx.createRadialGradient(tile.x, tile.y - 20, 2, tile.x, tile.y - 20, 46);
    glow.addColorStop(0, `rgba(255,210,120,${0.3 * f})`); glow.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = glow; ctx.fillRect(tile.x - 46, tile.y - 66, 92, 92);
  }
}

function status(game, h) {
  if (h.active > 0) return { label: h.label, text: `${h.seated || 0} TABLES!`, active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}

// Bunting strung across the hall, swinging while a feast call is on.
function draw(ctx, game, t, paint) {
  const h = game.hazard;
  const swing = h.active > 0 ? Math.sin(t * 8) * 6 : Math.sin(t * 1.5) * 1.5;
  const y0 = paint.top + 70;
  ctx.strokeStyle = '#3a1a08'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, y0);
  ctx.quadraticCurveTo(paint.width / 2, y0 + 26 + swing, paint.width, y0); ctx.stroke();
  const colors = ['#d8402c', '#ffd34d', '#2f8f88', '#f6ead0'];
  for (let k = 1; k < 24; k++) {
    const u = k / 24; const x = u * paint.width;
    const y = y0 + 4 * u * (1 - u) * (26 + swing);
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x, y + 18 + (h.active > 0 ? Math.sin(t * 10 + k) * 3 : 0)); ctx.closePath();
    ctx.fillStyle = colors[k % 4]; ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke();
  }
  if (h.active > 0) paint.tag(ctx, `FEAST CALL: ${h.seated || 0} TABLES`, paint.width / 2, y0 + 60, '#b0402a');
}

export default {
  id: 'banquet-hall',
  name: 'Gilded Banquet Hall',
  place: 'the Ostra guildhall, wedding night',
  blurb: 'A long hatch, pie ovens, and feast calls bring two tickets at once.',
  intro: 'A wedding in the guildhall. The hatch runs the whole wall, and the ovens bake the guild pie.',
  story: 'Luz Arroyo is getting married, and she asked for you by name. Every critic in Ostra is a guest.',
  tips: ['Feast calls fill the board: keep two plates started.', 'Pies bake slowly: put dough in the oven first.', 'Any hatch tile serves: drop plates at the nearest one.'],
  hazard: { kind: 'feast', label: 'FEAST CALL', every: FEAST_EVERY, lasts: FEAST_SHOW, rushEvery: RUSH_EVERY,
    tell: 'feast call: two tables at once!', trigger, status, under, draw },
  payBonus,
  palette: { floorA: '#7a2e3a', floorB: '#5a1e2a', grout: '#3a0e18', top: '#f6ead0', side: '#b08a3a', wall: '#3a1a2a' },
  unlocks: ['platter', 'pie'],
  guests: ['luz', 'greta', 'quill', 'vale'],
  stations: STATIONS,
  length: 180, maxTickets: 4, patience: 58, spawnGap: [10, 14],
  par: 300, stars: [160, 300, 440],
  reviews: [
    'The bride cried, and not from joy.',
    'A respectable feast with a few cold plates.',
    'Two tables at a time and not a plate late.',
    'The wedding of the year. The food stole the show.',
  ],
  plan: PLAN,
};
