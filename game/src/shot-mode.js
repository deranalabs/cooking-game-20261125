// SPDX-License-Identifier: MIT
// Screenshot mode (?shot=name&seed=n): stages real game state for a fixed, reproducible frame.
import { createGame, starsFor } from './shifts.js';
import { addTicket, focusTicket } from './orders.js';
import { dishById } from './recipes.js';
import { REGULARS } from './regulars.js';
import { createLedger } from './ledger.js';
import { defaultMenu } from './menu-planner.js';
import { makeIngredient, makePlate, advanceStep } from './items.js';
import { tileAt, TILE, KITCHEN_Y } from './kitchen-layout.js';
import { createFx, tickFx, floatText, handleEvents } from './effects.js';
import { KITCHENS } from './kitchens/roster.js';
import { modsFor } from './shop.js';
import { KIT } from './hazards.js';

function ing(id, stage, extra = {}) {
  const item = makeIngredient(id);
  for (let i = 0; i < stage; i++) advanceStep(item);
  return Object.assign(item, extra);
}
function plate(layers, extra = {}) {
  return Object.assign(makePlate(), { layers: [...layers] }, extra);
}
function put(game, col, row, item) {
  tileAt(game.kitchen, col, row).item = item;
}
function guest(id) {
  return REGULARS.find((r) => r.id === id);
}
// [dish, patience share, guest id] for each ticket on the board.
function tickets(game, list) {
  game.tickets.length = 0;
  for (const [id, share, who] of list) {
    const t = addTicket(game, dishById(id), guest(who));
    t.patience = t.max * share; t.slide = 0;
  }
  game.events.length = 0;
  return game.tickets;
}
function chefAt(game, col, row, face, hold) {
  Object.assign(game.chef, { x: (col + 0.5) * TILE, y: KITCHEN_Y + (row + 0.5) * TILE, face, hold });
}
function career(o) {
  return Object.assign(createLedger(), o);
}

const STAGES = {
  // Cover: the Lantern Night Market mid-service. A big tipper, a fan, the fussy critic and the rival on the
  // board; flatbread half-built on the plating counter; fryer, grill, oven, pan and pot all working, one pan
  // about to burn; the cook chopping with a whetted knife; fish & chips ready at the hatch as the bell rings.
  cover(seed) {
    const game = createGame(6, seed, { menu: ['chips', 'flatbread', 'nightbowl', 'skewer'],
      mods: modsFor({ knife: 2, lid: 1, warmer: 1, jar: 2, bell: 1, timer: 1, skillet: 1 }), rival: { won: 1, lost: 1 } });
    const tk = tickets(game, [['chips', 0.84, 'dot'], ['flatbread', 0.5, 'luz'], ['nightbowl', 0.18, 'rook'], ['skewer', 0.72, 'vale']]);
    focusTicket(game, tk[1].uid);
    Object.assign(game, { timeLeft: 84, score: 386, tips: 92, combo: 4, bestCombo: 4, served: 7, clock: 96 });
    put(game, 7, 0, plate(['potato', 'fish', 'lettuce'], { serving: 0.5, ticketUid: tk[0].uid }));
    put(game, 3, 2, plate(['dough', 'tomato']));
    put(game, 4, 2, plate([]));
    put(game, 11, 2, plate(['rice', 'chicken']));
    put(game, 12, 2, ing('cheese', 0));
    put(game, 0, 1, ing('tomato', 0, { progress: 0.35 }));
    put(game, 0, 3, ing('chicken', 0, { progress: 0.45 }));
    put(game, 0, 4, ing('pepper', 1, { progress: 0.62 }));
    put(game, 3, 4, ing('potato', 1, { progress: 0.58 }));
    put(game, 4, 4, ing('potato', 2, { overcook: 1.1 }));
    put(game, 0, 6, ing('dough', 0, { progress: 0.72 }));
    put(game, 1, 7, ing('dough', 1, { overcook: 0.6 }));
    put(game, 10, 4, ing('fish', 1, { progress: 0.5 }));
    put(game, 11, 4, ing('onion', 2, { overcook: 4.3 }));
    put(game, 12, 4, ing('rice', 0, { progress: 0.4 }));
    put(game, 8, 4, ing('pepper', 0, { progress: 0.55 }));
    // prep waiting on the awning counter: a skewer plate started, chicken and potato laid out
    put(game, 5, 7, ing('chicken', 0));
    put(game, 6, 7, ing('potato', 0));
    put(game, 7, 7, plate(['chicken', 'pepper']));
    put(game, 9, 7, ing('pepper', 1));
    put(game, 10, 7, ing('dough', 0));
    chefAt(game, 8, 3, { x: 0, y: 1 }, null);
    game.chef.chopping = true;
    return { game, screen: 'play', t: 1.18, prewarm: 2,
      events: [{ type: 'serve', gain: 58, tip: 14, mult: 1.75, dish: dishById('salad'), guest: guest('pip'), critic: false,
        quality: 1, slot: 3, rival: null, x: 9.3 * TILE, y: KITCHEN_Y + TILE / 2 }] };
  },
  // The Ember Hot Line in the rush: a flare roaring on the grill, skewers and ramen on the line, a furious critic.
  rush(seed) {
    const game = createGame(4, seed, { menu: ['skewer', 'ramen', 'smoke', 'burger'], mods: modsFor({ knife: 1, timer: 1 }) });
    game.rush = true;
    tickets(game, [['skewer', 0.14, 'quill'], ['smoke', 0.5, 'brom'], ['ramen', 0.66, 'ada'], ['burger', 0.9, 'marlow']]);
    Object.assign(game, { timeLeft: 22, score: 431, tips: 128, combo: 5, bestCombo: 6, served: 12 });
    put(game, 5, 0, ing('chicken', 0, { progress: 0.7 }));
    put(game, 6, 0, ing('pepper', 2, { overcook: 3.6 }));
    put(game, 1, 0, ing('beef', 1, { overcook: 2.2 }));
    put(game, 3, 0, ing('noodles', 0, { progress: 0.5 }));
    put(game, 9, 0, ing('onion', 1, { progress: 0.4 }));
    put(game, 3, 3, plate(['chicken', 'onion']));
    put(game, 4, 3, plate(['bun', 'beef', 'onion']));
    put(game, 11, 3, plate(['noodles', 'beef']));
    put(game, 14, 0, plate(['bun', 'beef', 'lettuce', 'tomato'], { serving: 0.4, ticketUid: game.tickets[3].uid }));
    put(game, 4, 6, ing('tomato', 0, { progress: 0.6 }));
    const h = game.hazard;
    h.active = 6; h.lasts = 7; h.target = tileAt(game.kitchen, 6, 0);
    chefAt(game, 9, 2, { x: 1, y: 0 }, plate(['chicken']));
    return { game, screen: 'play', t: 0.6, prewarm: 1.5, banner: 2.2,
      floats: [[400, 300, 'flare-up! that burner runs hot', '#ff8a3a']] };
  },
  // The old diner cover, kept for layout checks of the belt.
  diner(seed) {
    const game = createGame(2, seed, { menu: ['fisher', 'forest', 'lantern', 'burger'] });
    const tk = tickets(game, [['fisher', 0.78, 'pip'], ['forest', 0.48, 'vale'], ['lantern', 0.2, 'brom'], ['burger', 0.6, 'greta']]);
    focusTicket(game, tk[0].uid);
    Object.assign(game, { timeLeft: 96, score: 248, tips: 61, combo: 3, bestCombo: 3, served: 5 });
    put(game, 3, 3, plate(['bun', 'fish', 'lettuce']));
    put(game, 2, 3, plate([]));
    put(game, 7, 3, plate(['noodles']));
    put(game, 10, 3, ing('lettuce', 1));
    put(game, 13, 3, ing('cheese', 0));
    put(game, 15, 0, plate(['bun', 'beef', 'lettuce', 'tomato'], { serving: 0.5, ticketUid: tk[3].uid }));
    put(game, 0, 1, ing('tomato', 0, { progress: 0.6 }));
    put(game, 3, 5, ing('fish', 1, { progress: 0.62 }));
    put(game, 4, 5, ing('beef', 1, { overcook: 1.2 }));
    put(game, 6, 5, ing('onion', 0, { progress: 0.45 }));
    put(game, 8, 5, ing('noodles', 0, { progress: 0.7 }));
    put(game, 9, 5, ing('mushroom', 1, { progress: 0.4 }));
    put(game, 14, 5, ing('rice', 0, { progress: 0.3 }));
    chefAt(game, 5, 4, { x: -1, y: 0 }, ing('tomato', 1));
    game.chef.y += 10;
    return { game, screen: 'play', t: 1.1, prewarm: 2 };
  },
  // Rush in the Gilded Banquet Hall: a feast call, a furious critic, plates crowding the long hatch.
  banquet(seed) {
    const game = createGame(5, seed, { menu: ['platter', 'ramen', 'smoke', 'risotto'] });
    game.rush = true;
    tickets(game, [['ramen', 0.14, 'quill'], ['platter', 0.42, 'luz'], ['smoke', 0.7, 'osei'], ['risotto', 0.92, 'marlow']]);
    Object.assign(game, { timeLeft: 24, score: 412, tips: 138, combo: 5, bestCombo: 6, served: 12 });
    put(game, 4, 2, plate(['rice', 'beef', 'mushroom']));
    put(game, 10, 2, plate(['bun', 'beef', 'onion']));
    put(game, 12, 2, plate(['rice']));
    put(game, 6, 0, plate(['noodles', 'beef', 'onion', 'mushroom'], { serving: 0.4, ticketUid: game.tickets[0].uid }));
    put(game, 2, 4, ing('beef', 1, { overcook: 4.2 }));
    put(game, 3, 4, ing('onion', 1, { progress: 0.5 }));
    put(game, 5, 4, ing('mushroom', 1, { progress: 0.7 }));
    put(game, 6, 4, ing('rice', 1, { overcook: 0.8 }));
    put(game, 8, 4, ing('tomato', 0, { progress: 0.35 }));
    put(game, 13, 4, ing('beef', 0, { progress: 0.55 }));
    chefAt(game, 11, 3, { x: -1, y: 0 }, plate(['rice', 'mushroom']));
    return { game, screen: 'play', t: 0.6, prewarm: 1.5, banner: 2.2,
      floats: [[640, 395, 'feast call: two tables at once!', '#ffd34d']] };
  },
  // The upgrade shop before the night market: two tools at tier II, three at tier I, tips in the wallet.
  shop(seed) {
    const game = createGame(6, seed);
    game.tickets.length = 0;
    const ledger = career({ wallet: 132, owned: ['knife', 'lid', 'jar', 'warmer', 'bell'],
      levels: { knife: 2, lid: 1, jar: 2, warmer: 1, bell: 1 }, stars: [3, 2, 3, 3, 2, 3], unlocked: 6, served: 71, shifts: 6 });
    return { game, screen: 'shop', t: 0.8, prewarm: 0, ledger, nextKitchen: 6 };
  },
  // The stars ledger after a three-star rooftop shift: the rival beaten, critic's verdict, career column.
  ledger(seed) {
    const game = createGame(3, seed, { menu: ['risotto', 'ember', 'harbor', 'forest'] });
    game.tickets.length = 0; game.events.length = 0;
    Object.assign(game, { timeLeft: 0, score: 402, tips: 117, combo: 4, bestCombo: 7, served: 11, missed: 1, burnt: 1,
      phase: 'result', critics: [{ name: 'Critic Sable Rook', dish: 'Roof Risotto', quality: 0.93 }] });
    game.stars = starsFor(game);
    put(game, 4, 2, plate(['rice', 'mushroom', 'cheese']));
    const ledger = career({ wallet: 214, owned: ['knife', 'jar'], levels: { knife: 1, jar: 1 }, stars: [3, 3, 2, 3], unlocked: 4,
      served: 46, shifts: 4, best: [281, 236, 344, 0], rival: { won: 2, lost: 1,
        log: [{ kitchen: 'Saffron Rooftop', won: false }, { kitchen: 'Saffron Rooftop', won: true }, { kitchen: 'Saffron Rooftop', won: true }] } });
    return { game, screen: 'ledger', t: 1.6, prewarm: 0.5, ledger };
  },
  // The menu planner before the Ember Hot Line.
  plan(seed) {
    const game = createGame(4, seed);
    game.tickets.length = 0;
    return { game, screen: 'plan', t: 0.4, prewarm: 0, planKitchen: 4, plan: defaultMenu(4),
      ledger: career({ wallet: 96, stars: [3, 3, 2, 3], unlocked: 4 }) };
  },
  // The title with a career under way.
  title(seed) {
    const game = createGame(0, seed);
    return { game, screen: 'title', t: 0.4, prewarm: 0, chosen: 2,
      ledger: career({ wallet: 74, stars: [3, 2, 1], unlocked: 3 }) };
  },
};

// kitchen0 .. kitchen6: each kitchen early in its shift with its own hazard fired, for layout checks.
for (let k = 0; k < KITCHENS.length; k++) {
  STAGES['kitchen' + k] = (seed) => {
    const game = createGame(k, seed, { mods: modsFor({ lid: 1, jar: 1, bell: 2, warmer: 1, skillet: 1 }) });
    const pan = game.kitchen.list.find((t) => t.type === 'pan');
    put(game, pan.col, pan.row, ing('beef', 0, { progress: 0.5 }));
    const h = game.hazard;
    if (!game.def.hazard.continuous) { h.active = h.lasts; game.def.hazard.trigger(game, h, KIT); }
    game.events.length = 0;
    return { game, screen: 'play', t: 0.5, prewarm: 1 };
  };
}

const QUIET = { play() {} };

export function stageShot(name, seed) {
  const make = STAGES[name] || STAGES.cover;
  const s = make(seed);
  s.game.frozen = true;
  const fx = createFx(seed);
  for (let k = 0; k < s.prewarm * 60; k++) tickFx(fx, 1 / 60, s.game);
  if (s.events) {
    s.game.events.push(...s.events);
    handleEvents(fx, s.game, QUIET);
    for (let k = 0; k < 18; k++) tickFx(fx, 1 / 60, s.game);
  }
  if (s.banner) fx.banner = s.banner;
  for (const [x, y, str, color] of s.floats || []) floatText(fx, x, y, str, color, 26);
  const out = { game: s.game, fx, screen: s.screen, t: s.t };
  for (const key of ['ledger', 'nextKitchen', 'planKitchen', 'plan', 'chosen']) if (s[key] !== undefined) out[key] = s[key];
  return out;
}
