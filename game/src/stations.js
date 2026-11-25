// SPDX-License-Identifier: MIT
// Stations: pick up and drop at crates, rack, counters, chop board, stove, trash and serving hatch.
import { makeIngredient, makePlate, nextStep, isReady, lastStep, advanceStep, canAddToPlate, addToPlate, plateQuality } from './items.js';
import { ticketForPlate, serveTicket } from './orders.js';
import { facingTile } from './chef.js';
import { hatchOpen, heatFor } from './hazards.js';
import { isHeat } from './kitchen-layout.js';

// Seconds each heat step takes at normal heat: the fryer is quick, the oven slow, the grill in between.
export const COOK_TIME = { pan: 4.5, pot: 5.5, fry: 4.0, bake: 6.5, grill: 5.0 };
export const BURN_TIME = 7;          // seconds a done item survives on the heat
export const WARN_AT = 0.45;         // share of BURN_TIME when the warning starts
export const CHOP_TIME = 1.0;
const CHOP_BEAT = 0.16;
const SERVE_DELAY = 0.8;

function say(game, type, tile, extra = {}) {
  game.events.push({ type, x: tile.x, y: tile.y, ...extra });
}

function holderAccepts(tile, item) {
  if (tile.type === 'chop') return item.kind === 'ing';
  if (isHeat(tile)) return nextStep(item) === tile.type;
  return tile.type === 'counter' || tile.type === 'plating' || tile.type === 'belt';
}

// One press of E (or a tap of Space away from a board): the whole pick/drop/plate rule.
export function interact(game) {
  const tile = facingTile(game);
  if (!tile) return false;
  const chef = game.chef;
  const hold = chef.hold;
  const menu = game.shift.menu;

  if (tile.type === 'crate') {
    if (!hold) { chef.hold = makeIngredient(tile.ingredient); say(game, 'pick', tile); return true; }
    if (hold.kind === 'ing' && hold.id === tile.ingredient && hold.stage === 0) { chef.hold = null; say(game, 'drop', tile); return true; }
    if (hold.kind === 'plate') {
      const fresh = makeIngredient(tile.ingredient);
      if (canAddToPlate(hold, fresh, menu)) { addToPlate(hold, fresh); say(game, 'plate', tile); return true; }
    }
    say(game, 'nope', tile); return false;
  }
  if (tile.type === 'rack') {
    if (!hold) { chef.hold = makePlate(); say(game, 'pick', tile); return true; }
    if (hold.kind === 'plate' && hold.layers.length === 0) { chef.hold = null; say(game, 'drop', tile); return true; }
    return false;
  }
  if (tile.type === 'trash') {
    if (!hold) return false;
    if (hold.kind === 'plate') { hold.layers = []; hold.fresh = []; } else chef.hold = null;
    say(game, 'trash', tile); return true;
  }
  if (tile.type === 'hatch') {
    if (!hold || hold.kind !== 'plate' || tile.item) return false;
    if (!hatchOpen(game)) { say(game, 'nope', tile, { text: 'Shutter is down!' }); return false; }
    const ticket = ticketForPlate(game, hold);
    if (!ticket) { say(game, 'nope', tile, { text: 'No ticket wants that' }); return false; }
    hold.serving = SERVE_DELAY * (game.mods && game.mods.serve ? game.mods.serve : 1);
    hold.ticketUid = ticket.uid;
    tile.item = hold; chef.hold = null;
    say(game, 'ready', tile); return true;
  }

  const here = tile.item;
  if (!hold && here) { chef.hold = here; tile.item = null; say(game, 'pick', tile); return true; }
  if (hold && !here && holderAccepts(tile, hold)) { tile.item = hold; chef.hold = null; say(game, 'drop', tile); return true; }
  if (hold && hold.kind === 'ing' && here && here.kind === 'plate' && canAddToPlate(here, hold, menu)) {
    addToPlate(here, hold); chef.hold = null; say(game, 'plate', tile); return true;
  }
  if (hold && hold.kind === 'plate' && here && here.kind === 'ing' && canAddToPlate(hold, here, menu)) {
    addToPlate(hold, here); tile.item = null; say(game, 'plate', tile); return true;
  }
  say(game, 'nope', tile);
  return false;
}

// Holding Space at a board with something to chop, empty-handed: true while chopping.
export function chopAt(game, dt, held) {
  const tile = facingTile(game);
  const chef = game.chef;
  chef.chopping = false;
  if (!held || chef.hold || !tile || tile.type !== 'chop' || nextStep(tile.item) !== 'chop') {
    chef.chopBeat = 0;
    return false;
  }
  chef.chopping = true;
  const item = tile.item;
  item.progress += dt / (CHOP_TIME * (game.mods ? game.mods.chop : 1));
  chef.chopBeat = (chef.chopBeat || 0) + dt;
  if (chef.chopBeat >= CHOP_BEAT) { chef.chopBeat -= CHOP_BEAT; item.squash = 1; say(game, 'chop', tile); }
  if (item.progress >= 1) { advanceStep(item); item.squash = 1; say(game, 'chopped', tile); }
  return true;
}

export function canChopHere(game) {
  const tile = facingTile(game);
  return !game.chef.hold && !!tile && tile.type === 'chop' && nextStep(tile.item) === 'chop';
}

// Shop tools shorten cook times: the pot lid for the pot, the cast skillet for pan, fryer and grill.
export function cookFactor(game, step) {
  const m = game.mods;
  if (!m) return 1;
  if (m.cookBy && m.cookBy[step] !== undefined) return m.cookBy[step];
  return m.cook ?? 1;
}

export function burnShare(item) {
  return item.overcook / BURN_TIME;
}

export function tickStations(game, dt) {
  for (const tile of game.kitchen.list) {
    const item = tile.item;
    if (!item) continue;
    if (item.squash > 0) item.squash = Math.max(0, item.squash - dt * 6);
    if (item.pop > 0) item.pop = Math.max(0, item.pop - dt * 4);
    if (isHeat(tile)) {
      const heat = heatFor(game, tile);
      if (nextStep(item) === tile.type) {
        item.progress += (dt * heat) / (COOK_TIME[tile.type] * cookFactor(game, tile.type));
        if (item.progress >= 1) { advanceStep(item); say(game, 'cooked', tile); }
      } else if (isReady(item) && lastStep(item) === tile.type) {
        const before = burnShare(item);
        item.overcook += (dt * heat) / (game.mods ? game.mods.burn : 1);
        if (before < WARN_AT && burnShare(item) >= WARN_AT) say(game, 'warn', tile);
        if (item.overcook >= BURN_TIME) { item.burnt = true; game.burnt += 1; say(game, 'burnt', tile); }
      }
    }
    if (tile.type === 'hatch' && item.kind === 'plate') {
      if (!hatchOpen(game)) continue;
      item.serving -= dt;
      if (item.serving <= 0) {
        const ticket = game.tickets.find((t) => t.uid === item.ticketUid) ?? ticketForPlate(game, item);
        tile.item = null;
        if (ticket) { serveTicket(game, ticket, plateQuality(item), tile); say(game, 'served', tile); }
        else say(game, 'nope', tile, { text: 'Ticket walked out' });
      }
    }
  }
  if (game.chef.hold && game.chef.hold.pop > 0) game.chef.hold.pop = Math.max(0, game.chef.hold.pop - dt * 4);
}

// Clicking a plate waiting at the hatch rings the bell at once.
export function serveNow(game, tile) {
  if (tile && tile.type === 'hatch' && tile.item && tile.item.kind === 'plate') tile.item.serving = 0;
}
