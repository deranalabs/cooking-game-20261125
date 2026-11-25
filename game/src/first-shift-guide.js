// SPDX-License-Identifier: MIT
// First-shift guide: in the first kitchen of a new career, names the next real step until the first dish is served.
import { INGREDIENTS, stepsOf } from './recipes.js';
import { nextStep, isReady } from './items.js';
import { ticketForPlate } from './orders.js';

const STATION = { chop: 'CHOP board', pan: 'PAN', pot: 'POT', fry: 'FRYER', bake: 'OVEN', grill: 'GRILL' };
const NAME = (id) => INGREDIENTS[id].name.toUpperCase();

export function guideWanted(game, ledger) {
  return game.kitchenIndex === 0 && !(ledger.shifts > 0) && game.served === 0 && game.phase === 'play';
}

// The step the kitchen is in right now, read from what the chef holds and what lies on the counters.
export function guideStep(game) {
  const hold = game.chef.hold;
  const tiles = game.kitchen.list;
  if (hold && hold.kind === 'plate') {
    if (hold.layers.length && ticketForPlate(game, hold)) return [4, 'Carry the plate to the HATCH (E), then click the hatch to ring the bell'];
    return [3, 'Add each part: E on chopped food, or on a crate that needs no prep'];
  }
  if (hold) {
    const step = nextStep(hold);
    if (step) return [2, `Put the ${NAME(hold.id)} on the ${STATION[step]} (E)${step === 'chop' ? ', then hold SPACE facing it' : ' and let it cook'}`];
    return [3, `Set the ${NAME(hold.id)} down (E), take a plate from PLATES, then E on the food`];
  }
  if (tiles.some((t) => t.type === 'chop' && t.item && nextStep(t.item) === 'chop')) return [2, 'Hold SPACE facing the CHOP board to chop it'];
  if (tiles.some((t) => t.item && (t.item.kind === 'plate' ? t.item.layers.length : isReady(t.item)))) {
    return [3, 'Take a plate from PLATES (E), then press E on the ready food'];
  }
  const ticket = game.tickets.find((t) => t.uid === game.focus) || game.tickets[0];
  const layers = ticket ? ticket.dish.layers : ['tomato'];
  const pick = layers.find((id) => stepsOf(id)[0] === 'chop') || layers[0];
  return [1, `Walk to the glowing ${NAME(pick)} crate and press E to take one`];
}

// A bright banner over the controls bar at the foot of the screen, so it never covers the kitchen.
export function drawGuide(ctx, game, y, w) {
  const [n, say] = guideStep(game);
  ctx.fillStyle = '#7a2418'; ctx.fillRect(0, y, w, 48);
  ctx.fillStyle = '#ffd34d'; ctx.fillRect(0, y, w, 3);
  ctx.beginPath(); ctx.roundRect(12, y + 8, 132, 32, 16); ctx.fillStyle = '#ffd34d'; ctx.fill();
  ctx.font = "bold 18px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#2b1a12'; ctx.fillText(`STEP ${n} OF 4`, 78, y + 25);
  ctx.font = "bold 21px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'left';
  ctx.fillStyle = '#fff6df'; ctx.fillText(say, 160, y + 25);
}
