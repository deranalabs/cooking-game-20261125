// SPDX-License-Identifier: MIT
// Screenshot mode (?shot=name&seed=n): stages real game state for a fixed, reproducible frame.
import { createGame, starsFor } from './shifts.js';
import { addTicket, focusTicket } from './orders.js';
import { dishById } from './recipes.js';
import { makeIngredient, makePlate, advanceStep } from './items.js';
import { tileAt, TILE, KITCHEN_Y } from './kitchen-layout.js';
import { createFx, tickFx, floatText } from './effects.js';

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
function tickets(game, list) {
  game.tickets.length = 0;
  for (const [id, share] of list) {
    const t = addTicket(game, dishById(id));
    t.patience = t.max * share; t.slide = 0;
  }
  game.events.length = 0;
  return game.tickets;
}
function stats(game, o) {
  Object.assign(game, o);
}

const STAGES = {
  // Cover: mid-service, chef carrying a chopped tomato to a burger half-built on the island,
  // fish and beef on the pans, noodles and mushrooms in the pots, a lantern rice plate at the hatch.
  cover(seed) {
    const game = createGame(1, seed);
    const tk = tickets(game, [['burger', 0.72], ['lantern', 0.4], ['forest', 0.9]]);
    focusTicket(game, tk[0].uid);
    stats(game, { timeLeft: 84, score: 236, tips: 58, combo: 3, bestCombo: 3, served: 5 });
    put(game, 8, 3, plate(['bun', 'beef', 'lettuce']));
    put(game, 11, 3, plate(['noodles']));
    put(game, 6, 3, ing('lettuce', 1));
    put(game, 14, 0, plate(['rice', 'fish', 'onion'], { serving: 0.5, ticketUid: tk[1].uid }));
    put(game, 0, 1, ing('onion', 0, { progress: 0.55 }));
    put(game, 7, 4, ing('fish', 0, { progress: 0.3 }));
    put(game, 4, 4, ing('beef', 0, { progress: 0.62 }));
    put(game, 5, 4, ing('fish', 1, { progress: 0.35 }));
    put(game, 10, 4, ing('noodles', 0, { progress: 0.8 }));
    put(game, 11, 4, ing('mushroom', 1, { progress: 0.45 }));
    put(game, 3, 7, ing('cheese', 0));
    const chef = game.chef;
    chef.x = 8.5 * TILE; chef.y = KITCHEN_Y + 2.5 * TILE - 2; chef.face = { x: 0, y: 1 };
    chef.hold = ing('tomato', 1);
    return { game, screen: 'play', t: 1.1, prewarm: 2 };
  },
  // Late shift: full board in the rush, one ticket about to walk out, banner up.
  rush(seed) {
    const game = createGame(2, seed);
    game.rush = true;
    tickets(game, [['ember', 0.12], ['harbor', 0.5], ['garden', 0.78], ['melt', 0.95]]);
    stats(game, { timeLeft: 27, score: 388, tips: 131, combo: 5, bestCombo: 6, served: 11 });
    put(game, 6, 3, plate(['bun', 'beef', 'cheese']));
    put(game, 9, 3, plate(['noodles', 'tomato']));
    put(game, 4, 4, ing('fish', 2, { overcook: 1.2 }));
    put(game, 5, 4, ing('beef', 0, { progress: 0.7 }));
    put(game, 10, 4, ing('rice', 1, { overcook: 2.0 }));
    put(game, 11, 4, ing('mushroom', 1, { progress: 0.5 }));
    put(game, 0, 1, ing('lettuce', 0, { progress: 0.4 }));
    Object.assign(game.chef, { x: 12.5 * TILE, y: KITCHEN_Y + 4.5 * TILE, face: { x: -1, y: 0 } });
    game.chef.hold = plate(['rice', 'fish']);
    return { game, screen: 'play', t: 0.6, prewarm: 1.5, banner: 2.2 };
  },
  // The stove: beef close to burning, fish searing, a burnt pot smoking, chef on the way.
  stove(seed) {
    const game = createGame(1, seed);
    tickets(game, [['lantern', 0.55], ['burger', 0.66], ['salad', 0.3]]);
    stats(game, { timeLeft: 111, score: 142, tips: 37, combo: 2, bestCombo: 2, served: 3 });
    put(game, 4, 4, ing('beef', 1, { overcook: 5.6 }));
    put(game, 5, 4, ing('fish', 1, { progress: 0.55 }));
    put(game, 10, 4, ing('rice', 0, { progress: 0.85 }));
    put(game, 11, 4, ing('mushroom', 2, { burnt: true }));
    put(game, 9, 3, plate(['lettuce', 'tomato']));
    put(game, 7, 3, plate(['bun']));
    put(game, 0, 2, ing('onion', 1));
    Object.assign(game.chef, { x: 3.5 * TILE, y: KITCHEN_Y + 4.5 * TILE, face: { x: 1, y: 0 } });
    game.chef.hold = ing('onion', 1);
    return { game, screen: 'play', t: 0.25, prewarm: 2.5, floats: [[288, 372, 'Burning!', '#ff6a4a']] };
  },
  // Shift result card with stars over the closed kitchen.
  result(seed) {
    const game = createGame(1, seed);
    game.tickets.length = 0; game.events.length = 0;
    stats(game, { timeLeft: 0, score: 297, tips: 104, combo: 4, bestCombo: 6, served: 9, missed: 1, phase: 'result' });
    game.stars = starsFor(game);
    put(game, 8, 3, plate(['rice', 'fish', 'onion']));
    put(game, 4, 4, ing('beef', 1));
    return { game, screen: 'result', t: 1.6, prewarm: 0.5 };
  },
};

export function stageShot(name, seed) {
  const make = STAGES[name] || STAGES.cover;
  const s = make(seed);
  s.game.frozen = true;
  const fx = createFx(seed);
  for (let k = 0; k < s.prewarm * 60; k++) tickFx(fx, 1 / 60, s.game);
  if (s.banner) fx.banner = s.banner;
  for (const [x, y, str, color] of s.floats || []) floatText(fx, x, y, str, color, 26);
  return { game: s.game, fx, screen: s.screen, t: s.t };
}
