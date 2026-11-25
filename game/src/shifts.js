// SPDX-License-Identifier: MIT
// Shift flow: open a kitchen with the planned menu and bought upgrades, run its clock, rush and hazard, score stars.
import { KITCHENS } from './kitchens/roster.js';
import { RUSH_SECONDS, dishById } from './recipes.js';
import { buildKitchen, startTile } from './kitchen-layout.js';
import { createChef, moveChef } from './chef.js';
import { tickOrders, addTicket } from './orders.js';
import { tickStations, chopAt } from './stations.js';
import { createHazard, tickHazard } from './hazards.js';
import { defaultMenu } from './menu-planner.js';
import { modsFor } from './shop.js';
import { createRng } from './rng.js';

// The shift a kitchen runs: its clock and star lines with the four dishes the player planned.
export function shiftFor(kitchenIndex, menu) {
  const k = KITCHENS[kitchenIndex];
  return { name: k.name, place: k.place, length: k.length, menu, maxTickets: k.maxTickets,
    patience: k.patience, spawnGap: k.spawnGap, stars: k.stars };
}

export function createGame(kitchenIndex, seed, opts = {}) {
  const def = KITCHENS[kitchenIndex];
  const menu = opts.menu || defaultMenu(kitchenIndex);
  const shift = shiftFor(kitchenIndex, menu);
  const kitchen = buildKitchen(def.plan);
  const start = startTile(kitchen);
  const game = {
    kitchenIndex, shiftIndex: kitchenIndex, def, shift, seed,
    rng: createRng(seed * 977 + kitchenIndex * 31 + 5),
    mods: opts.mods || modsFor([]),
    kitchen, hazard: createHazard(def),
    chef: createChef(start.x, start.y),
    tickets: [], focus: null, uid: 0, lastDish: null,
    clock: 0, timeLeft: shift.length, rush: false, frozen: false,
    score: 0, tips: 0, served: 0, missed: 0, burnt: 0, combo: 0, bestCombo: 0, critics: [],
    spawnIn: 6, phase: 'play', events: [],
  };
  addTicket(game, dishById(menu[0]));
  addTicket(game, dishById(menu[1 % menu.length]));
  return game;
}

export function starsFor(game) {
  return game.shift.stars.filter((need) => game.score >= need).length;
}

export function tickGame(game, dt, input) {
  if (game.phase !== 'play' || game.frozen) return;
  game.clock += dt;
  game.timeLeft = Math.max(0, game.timeLeft - dt);
  if (!game.rush && game.timeLeft <= RUSH_SECONDS) {
    game.rush = true;
    game.events.push({ type: 'rush' });
  }
  const chopping = chopAt(game, dt, input.chopHeld);
  moveChef(game, dt, chopping ? { x: 0, y: 0 } : input.move);
  tickHazard(game, dt);
  tickStations(game, dt);
  tickOrders(game, dt);
  if (game.timeLeft <= 0) {
    game.phase = 'result';
    game.stars = starsFor(game);
    game.events.push({ type: 'end', stars: game.stars });
  }
}

export function shiftCount() {
  return KITCHENS.length;
}
