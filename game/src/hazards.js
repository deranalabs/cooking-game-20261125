// SPDX-License-Identifier: MIT
// Hazard runner: the clock that fires each kitchen's own hazard (kitchens/*.js) and the hooks the game asks.
import { findTiles, tileAt, isHeat } from './kitchen-layout.js';
import { nudgeChef } from './chef.js';
import { addTicket, pickDish } from './orders.js';
import { pickGuest } from './regulars.js';

// Heat stations in a kitchen: what the gust, the flare and the rain go for.
function stoves(game) {
  return game.kitchen.list.filter(isHeat);
}

// A stove with food on it is the one a hazard goes for, so the hazard always matters.
function pickStove(game, avoid = []) {
  const list = stoves(game).filter((t) => !avoid.includes(t));
  const busy = list.filter((t) => t.item);
  return list.length ? game.rng.pick(busy.length ? busy : list) : null;
}

// The helpers a kitchen's hazard functions are handed, so each kitchen file needs no imports of its own.
export const KIT = { findTiles, tileAt, nudgeChef, addTicket, pickDish, pickGuest, stoves, pickStove };

export function createHazard(kitchenDef) {
  const h = kitchenDef.hazard;
  return { kind: h.kind, label: h.label, tell: h.tell, every: h.every, lasts: h.lasts,
    clock: h.every * (h.firstAt ?? 0.6), active: 0, target: null, beltT: 0, doused: [], puddles: [], fired: 0 };
}

// Every frame: the kitchen's own tick runs, an active hazard winds down, and the clock fires the next one.
export function tickHazard(game, dt) {
  const def = game.def.hazard;
  const h = game.hazard;
  if (def.tick) def.tick(game, h, dt, KIT);
  if (def.continuous) return;
  if (h.active > 0) {
    h.active -= dt;
    if (h.active <= 0) {
      h.active = 0;
      if (def.end) def.end(game, h, KIT);
      h.target = null;
    }
  }
  h.clock -= dt;
  if (h.clock <= 0) {
    h.clock = h.every * (game.rush && def.rushEvery ? def.rushEvery : 1);
    h.active = h.lasts;
    h.fired += 1;
    const at = def.trigger(game, h, KIT) || { x: game.chef.x, y: game.chef.y };
    game.events.push({ type: 'hazard', kind: h.kind, text: h.tell, x: at.x, y: at.y });
  }
}

export function hatchOpen(game) {
  const def = game.def && game.def.hazard;
  return !(def && def.hatchOpen) || def.hatchOpen(game, game.hazard);
}

// Heat factor of a stove right now: 0 put out, 2 flaring, 1 normal; the kitchen decides.
export function heatFor(game, tile) {
  const def = game.def && game.def.hazard;
  if (!def || !def.heat) return 1;
  return def.heat(game, game.hazard, tile) ?? 1;
}

// Walking speed factor where the chef stands (rain puddles slow you down).
export function footingFor(game) {
  const def = game.def && game.def.hazard;
  return def && def.footing ? def.footing(game, game.hazard) : 1;
}

// One line for the HUD: what the hazard is doing now, or how soon it comes back.
export function hazardStatus(game) {
  const h = game.hazard;
  const def = game.def.hazard;
  if (def.status) return def.status(game, h);
  if (h.active > 0) return { label: h.label, text: 'NOW!', active: true };
  return { label: h.label, text: `in ${Math.ceil(h.clock)}s`, active: false };
}
