// SPDX-License-Identifier: MIT
// Kitchen hazards: swell, shutter, conveyor belt, gust, flare-up and feast call, one per kitchen.
import { findTiles, tileAt } from './kitchen-layout.js';
import { nudgeChef } from './chef.js';
import { addTicket, pickDish } from './orders.js';

export function createHazard(kitchenDef) {
  const h = kitchenDef.hazard;
  return { kind: h.kind, label: h.label, tell: h.tell, every: h.every, lasts: h.lasts,
    clock: h.every * 0.6, active: 0, target: null, beltT: 0 };
}

function stoves(game) {
  return [...findTiles(game.kitchen, 'pan'), ...findTiles(game.kitchen, 'pot')];
}

// A stove with food on it is the one the wind or the flare goes for, so the hazard always matters.
function pickStove(game) {
  const list = stoves(game);
  const busy = list.filter((t) => t.item);
  return game.rng.pick(busy.length ? busy : list);
}

function moveBelt(game) {
  const belts = findTiles(game.kitchen, 'belt').sort((a, b) => b.col - a.col);
  for (const tile of belts) {
    const next = tileAt(game.kitchen, tile.col + 1, tile.row);
    if (tile.item && next && next.type === 'belt' && !next.item) {
      next.item = tile.item; tile.item = null;
      if (next.item.kind === 'plate') next.item.pop = 0.4;
    }
  }
}

function trigger(game, h) {
  h.active = h.lasts;
  let at = { x: game.chef.x, y: game.chef.y };
  if (h.kind === 'gust' || h.kind === 'flare') { h.target = pickStove(game); at = h.target; }
  if (h.kind === 'shutter') at = findTiles(game.kitchen, 'hatch')[0];
  if (h.kind === 'feast') {
    for (let k = 0; k < 2 && game.tickets.length < game.shift.maxTickets; k++) addTicket(game, pickDish(game));
  }
  game.events.push({ type: 'hazard', kind: h.kind, text: h.tell, x: at.x, y: at.y });
}

export function tickHazard(game, dt) {
  const h = game.hazard;
  if (h.kind === 'belt') {
    h.beltT += dt;
    while (h.beltT >= h.every) { h.beltT -= h.every; moveBelt(game); }
    return;
  }
  if (h.active > 0) {
    h.active -= dt;
    if (h.kind === 'swell') nudgeChef(game, -150 * dt * Math.sin(Math.PI * Math.max(0, h.active) / h.lasts), 0);
    if (h.active <= 0) { h.active = 0; h.target = null; }
  }
  h.clock -= dt;
  if (h.clock <= 0) { h.clock = h.every; trigger(game, h); }
}

export function hatchOpen(game) {
  return !(game.hazard && game.hazard.kind === 'shutter' && game.hazard.active > 0);
}

// Heat factor of a stove right now: 0 blown out, 2 flaring, 1 normal.
export function heatFor(game, tile) {
  const h = game.hazard;
  if (!h || h.target !== tile || h.active <= 0) return 1;
  return h.kind === 'gust' ? 0 : h.kind === 'flare' ? 2 : 1;
}

// One line for the HUD: what the hazard is doing now, or how soon it comes back.
export function hazardStatus(game) {
  const h = game.hazard;
  if (h.kind === 'belt') return { label: h.label, text: 'running', active: true };
  if (h.active > 0) return { label: h.label, text: 'NOW!', active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}
