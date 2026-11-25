// SPDX-License-Identifier: MIT
// Order board: tickets arrive, their patience drains, and a served plate pays price, tip and combo.
import { dishById, dishPrice, stepsOf, RUSH_PATIENCE, RUSH_GAP } from './recipes.js';
import { plateMakes } from './items.js';

export const MISS_PENALTY = 10;

function patienceFor(game, dish) {
  const steps = dish.layers.reduce((n, id) => n + stepsOf(id).length, 0);
  const base = game.shift.patience + steps * 4;
  return base * (game.rush ? RUSH_PATIENCE : 1);
}

export function addTicket(game, dish) {
  const max = patienceFor(game, dish);
  const ticket = { uid: ++game.uid, dish, patience: max, max, flash: 0, slide: 1 };
  game.tickets.push(ticket);
  game.events.push({ type: 'ticket', uid: ticket.uid });
  return ticket;
}

// A new ticket prefers a dish not already on the board, so routes keep changing.
function pickDish(game) {
  const onBoard = new Set(game.tickets.map((t) => t.dish.id));
  const fresh = game.shift.menu.filter((id) => !onBoard.has(id) && id !== game.lastDish);
  const id = game.rng.pick(fresh.length ? fresh : game.shift.menu);
  game.lastDish = id;
  return dishById(id);
}

function nextGap(game) {
  const [lo, hi] = game.shift.spawnGap;
  return game.rng.range(lo, hi) * (game.rush ? RUSH_GAP : 1);
}

export function tickOrders(game, dt) {
  for (const t of game.tickets) {
    t.patience -= dt;
    t.slide = Math.max(0, t.slide - dt * 3);
  }
  for (const t of game.tickets.filter((x) => x.patience <= 0)) {
    game.tickets.splice(game.tickets.indexOf(t), 1);
    game.missed += 1;
    game.combo = 0;
    game.score = Math.max(0, game.score - MISS_PENALTY);
    if (game.focus === t.uid) game.focus = null;
    game.events.push({ type: 'expire', dish: t.dish });
  }
  game.spawnIn -= dt;
  if (game.tickets.length === 0) game.spawnIn = Math.min(game.spawnIn, 1.5);
  if (game.spawnIn <= 0 && game.tickets.length < game.shift.maxTickets) {
    addTicket(game, pickDish(game));
    game.spawnIn = nextGap(game);
  }
}

// The ticket a plate would serve: the focused one if it matches, else the one closest to walking out.
export function ticketForPlate(game, plate) {
  const fits = game.tickets.filter((t) => plateMakes(plate, t.dish));
  if (fits.length === 0) return null;
  return fits.find((t) => t.uid === game.focus) ?? fits.reduce((a, b) => (a.patience <= b.patience ? a : b));
}

export function serveTicket(game, ticket) {
  const price = dishPrice(ticket.dish);
  const tip = Math.round(price * 0.8 * Math.max(0, ticket.patience / ticket.max));
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const mult = 1 + Math.min(game.combo - 1, 4) * 0.25;
  const gain = Math.round((price + tip) * mult);
  game.score += gain;
  game.tips += tip;
  game.served += 1;
  game.tickets.splice(game.tickets.indexOf(ticket), 1);
  if (game.focus === ticket.uid) game.focus = null;
  game.events.push({ type: 'serve', gain, tip, mult, dish: ticket.dish });
}

export function focusTicket(game, uid) {
  game.focus = game.focus === uid ? null : uid;
}
