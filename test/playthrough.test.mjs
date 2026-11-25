// SPDX-License-Identifier: MIT
// Bot playthrough: a scripted cook works a 90-second shift in each of the seven kitchens and must serve dishes.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KITCHENS } from '../game/src/kitchens/roster.js';
import { createGame, tickGame } from '../game/src/shifts.js';
import { interact } from '../game/src/stations.js';
import { standFacing } from '../game/src/chef.js';
import { nextStep, isReady } from '../game/src/items.js';
import { tileAt } from '../game/src/kitchen-layout.js';
import { hatchOpen } from '../game/src/hazards.js';

const DT = 1 / 30;
const STILL = { move: { x: 0, y: 0 }, chopHeld: false };
const OVER = Symbol('shift over');

// Tiles the bot can reach: something to stand on beside them.
function reachable(game, tile) {
  return [[0, 1], [0, -1], [1, 0], [-1, 0]].some(([dx, dy]) => tileAt(game.kitchen, tile.col + dx, tile.row + dy)?.type === 'floor');
}

function makeBot(game) {
  let ticks = 0;
  const step = (input = STILL) => {
    if (game.phase !== 'play') throw OVER;
    tickGame(game, DT, input);
    game.events.length = 0;
    if (++ticks > 90 * 30 * 3) throw new Error('bot ran past its tick budget');
  };
  const waitFor = (ok, seconds, input) => { for (let s = 0; s < seconds && !ok(); s += DT) step(input); return ok(); };
  const free = (pred) => game.kitchen.list.find((t) => pred(t) && !t.item && reachable(game, t));
  const use = (tile) => { standFacing(game, tile); return interact(game); };
  const where = (item) => game.kitchen.list.find((t) => t.item === item);

  // Brings one layer to the plate: take it, chop and cook it as its steps say, then put it on the plate.
  function prepare(id, plate) {
    use(game.kitchen.list.find((t) => t.ingredient === id && reachable(game, t)));
    const item = game.chef.hold;
    if (!item) return false;
    for (let guard = 0; nextStep(item) && guard < 4; guard++) {
      const kind = nextStep(item);
      const spot = free((t) => t.type === kind);
      if (!spot || !use(spot)) { use(game.kitchen.list.find((t) => t.type === 'trash')); return false; }
      if (kind === 'chop') waitFor(() => !nextStep(item) || nextStep(item) !== 'chop', 4, { ...STILL, chopHeld: true });
      else waitFor(() => isReady(item) || nextStep(item) !== kind, 20);
      const at = where(item);
      if (!at) return false;
      use(at);
    }
    const plateAt = where(plate);
    if (!plateAt) { use(game.kitchen.list.find((t) => t.type === 'trash')); return false; }
    return use(plateAt);
  }

  // One whole dish for the first ticket: plate down, every layer prepared onto it, carried to the hatch.
  function cookOne() {
    const ticket = game.tickets[0];
    if (!ticket) { step(); return; }
    use(game.kitchen.list.find((t) => t.type === 'rack' && reachable(game, t)));
    const plate = game.chef.hold;
    const spot = free((t) => t.type === 'plating') || free((t) => t.type === 'counter');
    if (!plate || !spot || !use(spot)) { game.chef.hold = null; step(); return; }
    for (const id of ticket.dish.layers) if (!prepare(id, plate)) break;
    const at = where(plate);
    if (!at) return;
    use(at);
    waitFor(() => hatchOpen(game), 12);
    const hatch = free((t) => t.type === 'hatch');
    if (!hatch || !use(hatch)) { use(game.kitchen.list.find((t) => t.type === 'trash')); game.chef.hold = null; }
    waitFor(() => !game.kitchen.list.some((t) => t.type === 'hatch' && t.item), 3);
  }

  return () => {
    try { for (;;) cookOne(); } catch (e) { if (e !== OVER) throw e; }
  };
}

test('every crate can be reached and every station type has a tile the cook can stand at', () => {
  for (const [i, kitchen] of KITCHENS.entries()) {
    const game = createGame(i, 1);
    for (const tile of game.kitchen.list) {
      if (tile.type === 'crate') assert.ok(reachable(game, tile), `${kitchen.id} ${tile.ingredient} crate`);
    }
    for (const type of new Set(game.kitchen.list.map((t) => t.type))) {
      if (type === 'floor' || type === 'counter') continue;
      assert.ok(game.kitchen.list.some((t) => t.type === type && reachable(game, t)), `${kitchen.id} ${type}`);
    }
  }
});

for (const [i, kitchen] of KITCHENS.entries()) {
  test(`bot works a 90-second shift in kitchen ${i + 1} (${kitchen.id}) and serves dishes`, () => {
    const game = createGame(i, 7);
    game.timeLeft = 90;
    makeBot(game)();
    assert.equal(game.phase, 'result', kitchen.id);
    assert.ok(game.clock >= 89.9 && game.clock < 91, `${kitchen.id} clock ${game.clock}`);
    assert.ok(game.served >= 1, `${kitchen.id} served ${game.served}`);
    console.log(`  ${kitchen.id}: served ${game.served}, score ${game.score}, burnt ${game.burnt}, stars ${game.stars}`);
  });
}
