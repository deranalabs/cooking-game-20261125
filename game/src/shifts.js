// SPDX-License-Identifier: MIT
// Shift flow: start a shift, run its clock and rush, end it and score stars for the result screen.
import { SHIFTS, RUSH_SECONDS, dishById } from './recipes.js';
import { buildKitchen, TILE, KITCHEN_Y } from './kitchen-layout.js';
import { createChef, moveChef } from './chef.js';
import { tickOrders, addTicket } from './orders.js';
import { tickStations, chopAt } from './stations.js';
import { createRng } from './rng.js';

export function createGame(shiftIndex, seed) {
  const shift = SHIFTS[shiftIndex];
  const game = {
    shiftIndex, shift, seed, rng: createRng(seed * 977 + shiftIndex * 31 + 5),
    kitchen: buildKitchen(),
    chef: createChef(9.5 * TILE, KITCHEN_Y + 6.5 * TILE),
    tickets: [], focus: null, uid: 0, lastDish: null,
    clock: 0, timeLeft: shift.length, rush: false, frozen: false,
    score: 0, tips: 0, served: 0, missed: 0, combo: 0, bestCombo: 0,
    spawnIn: 6, phase: 'play', events: [],
  };
  addTicket(game, dishById(shift.menu[0]));
  addTicket(game, dishById(shift.menu[1]));
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
  tickStations(game, dt);
  tickOrders(game, dt);
  if (game.timeLeft <= 0) {
    game.phase = 'result';
    game.stars = starsFor(game);
    game.events.push({ type: 'end', stars: game.stars });
  }
}

export function shiftCount() {
  return SHIFTS.length;
}
