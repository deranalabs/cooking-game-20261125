// SPDX-License-Identifier: MIT
// Order board: a regular or critic orders, patience drains, and a served plate pays price, tip and combo.
import { dishById, dishPrice, stepsOf, RUSH_PATIENCE, RUSH_GAP } from './recipes.js';
import { plateMakes } from './items.js';
import { pickGuest, CRITIC_PAY, fussyDish, traitPatience, traitTip, RIVAL_WIN } from './regulars.js';

export const MISS_PENALTY = 10;

function patienceFor(game, dish) {
  const steps = dish.layers.reduce((n, id) => n + stepsOf(id).length, 0);
  const base = (game.shift.patience + steps * 4) * (game.mods ? game.mods.patience : 1);
  return base * (game.rush ? RUSH_PATIENCE : 1);
}

export function addTicket(game, dish, guest = pickGuest(game)) {
  if (guest.trait === 'fussy' && dish.layers.length > 2 && !dish.without) dish = fussyDish(dish, game.rng);
  const max = patienceFor(game, dish) * traitPatience(guest);
  const ticket = { uid: ++game.uid, dish, guest, patience: max, max, flash: 0, slide: 1 };
  game.tickets.push(ticket);
  game.events.push({ type: 'ticket', uid: ticket.uid, critic: !!guest.critic });
  return ticket;
}

// A new ticket prefers a dish not already on the board, so routes keep changing.
// A fan asks for a dish with the ingredient they love whenever the menu has one.
export function pickDish(game, guest = null) {
  const onBoard = new Set(game.tickets.map((t) => t.dish.base || t.dish.id));
  let fresh = game.shift.menu.filter((id) => !onBoard.has(id) && id !== game.lastDish);
  if (guest && guest.trait === 'fan') {
    const loved = game.shift.menu.filter((id) => dishById(id).layers.includes(guest.loves));
    if (loved.length) fresh = loved;
  }
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
    if (t.guest.trait === 'rival') game.rival = { won: false, dish: t.dish.name };
    game.events.push({ type: 'expire', dish: t.dish, guest: t.guest });
  }
  game.spawnIn -= dt;
  if (game.tickets.length === 0) game.spawnIn = Math.min(game.spawnIn, 1.5);
  if (game.spawnIn <= 0 && game.tickets.length < game.shift.maxTickets) {
    const guest = pickGuest(game);
    addTicket(game, pickDish(game, guest), guest);
    game.spawnIn = nextGap(game);
  }
}

// The ticket a plate would serve: the focused one if it matches, else the one closest to walking out.
export function ticketForPlate(game, plate) {
  const fits = game.tickets.filter((t) => plateMakes(plate, t.dish));
  if (fits.length === 0) return null;
  return fits.find((t) => t.uid === game.focus) ?? fits.reduce((a, b) => (a.patience <= b.patience ? a : b));
}

// quality 0..1 is how fresh the plate's layers were (see items.plateQuality); critics pay by it.
export function serveTicket(game, ticket, quality = 1, at = null) {
  const price = dishPrice(ticket.dish);
  const critic = !!ticket.guest.critic;
  const jar = game.mods ? game.mods.jar : 0;
  const share = Math.max(0, ticket.patience / ticket.max);
  let tip = Math.round(price * 0.8 * share * traitTip(ticket.guest, ticket.dish)) + jar;
  if (critic) tip = Math.round(tip * CRITIC_PAY * (0.5 + quality));
  if (ticket.guest.trait === 'rival') {
    game.rival = { won: quality >= RIVAL_WIN.quality && share >= RIVAL_WIN.patience, dish: ticket.dish.name };
  }
  game.combo += 1;
  game.bestCombo = Math.max(game.bestCombo, game.combo);
  const mult = 1 + Math.min(game.combo - 1, game.mods && game.mods.comboCap ? game.mods.comboCap : 4) * 0.25;
  const pay = critic ? price * CRITIC_PAY * (0.5 + quality) : price;
  const bonus = game.def && game.def.payBonus ? game.def.payBonus(ticket) : 1;
  const gain = Math.round((pay + tip) * mult * bonus);
  game.score += gain;
  game.tips += tip;
  game.served += 1;
  if (critic) game.critics.push({ name: ticket.guest.name, dish: ticket.dish.name, quality });
  const slot = game.tickets.indexOf(ticket);
  game.tickets.splice(slot, 1);
  if (game.focus === ticket.uid) game.focus = null;
  game.events.push({ type: 'serve', gain, tip, mult, dish: ticket.dish, guest: ticket.guest, critic, quality,
    slot: Math.max(0, slot), rival: ticket.guest.trait === 'rival' ? game.rival : null,
    x: at ? at.x : null, y: at ? at.y : null });
}

export function focusTicket(game, uid) {
  game.focus = game.focus === uid ? null : uid;
}
