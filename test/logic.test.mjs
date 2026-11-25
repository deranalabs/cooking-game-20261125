// SPDX-License-Identifier: MIT
// Logic harness: drives the DOM-free game modules through a real order, run with `node --test test/`.
import test from 'node:test';
import assert from 'node:assert/strict';
import { DISHES, INGREDIENT_IDS, SHIFTS, dishById } from '../game/src/recipes.js';
import { makeIngredient, makePlate, isReady, canAddToPlate } from '../game/src/items.js';
import { findTiles } from '../game/src/kitchen-layout.js';
import { createGame, tickGame } from '../game/src/shifts.js';
import { interact } from '../game/src/stations.js';
import { standFacing } from '../game/src/chef.js';
import { addTicket } from '../game/src/orders.js';

const idle = { move: { x: 0, y: 0 }, chopHeld: false };

function at(game, type, n = 0) {
  const t = findTiles(game.kitchen, type)[n];
  standFacing(game, t);
  return t;
}
function crate(game, id) {
  const t = findTiles(game.kitchen, 'crate').find((c) => c.ingredient === id);
  standFacing(game, t);
  return t;
}
function run(game, seconds, input = idle) {
  for (let s = 0; s < seconds; s += 1 / 60) tickGame(game, 1 / 60, input);
}

test('recipe book is big enough', () => {
  assert.ok(DISHES.length >= 6);
  assert.ok(INGREDIENT_IDS.length >= 8);
  assert.equal(SHIFTS.length, 3);
});

test('plate only takes ready layers that fit a dish on the menu', () => {
  const plate = makePlate();
  const tomato = makeIngredient('tomato');
  assert.equal(isReady(tomato), false);
  assert.equal(canAddToPlate(plate, tomato, ['salad']), false);
  tomato.stage = 1;
  assert.equal(canAddToPlate(plate, tomato, ['salad']), true);
  plate.layers.push('tomato');
  assert.equal(canAddToPlate(plate, tomato, ['salad']), false, 'salad has one tomato');
  assert.equal(canAddToPlate(plate, makeIngredient('bun'), ['salad']), false);
});

test('a salad goes from crates to the hatch and scores', () => {
  const game = createGame(0, 1);
  game.tickets.length = 0;
  addTicket(game, dishById('salad'));
  const plateSpot = at(game, 'plating');
  // plate on the island
  at(game, 'rack'); interact(game);
  assert.equal(game.chef.hold.kind, 'plate');
  standFacing(game, plateSpot); interact(game);
  assert.equal(game.chef.hold, null);
  for (const id of ['lettuce', 'tomato']) {
    crate(game, id); interact(game);
    const board = at(game, 'chop'); interact(game);
    assert.equal(board.item.id, id);
    run(game, 2, { move: { x: 0, y: 0 }, chopHeld: true });
    assert.ok(isReady(board.item), id + ' chopped');
    interact(game);
    standFacing(game, plateSpot); interact(game);
  }
  crate(game, 'cheese'); interact(game);
  standFacing(game, plateSpot); interact(game);
  assert.deepEqual(plateSpot.item.layers, ['lettuce', 'tomato', 'cheese']);
  interact(game);
  at(game, 'hatch'); interact(game);
  run(game, 2);
  assert.equal(game.served, 1);
  assert.equal(game.tickets.length >= 0, true);
  assert.ok(game.score > 0);
});

test('the pan cooks, then burns if left', () => {
  const game = createGame(0, 1);
  crate(game, 'beef'); interact(game);
  const pan = at(game, 'pan'); interact(game);
  run(game, 6);
  assert.ok(isReady(pan.item), 'cooked');
  run(game, 9);
  assert.equal(pan.item.burnt, true);
});

test('tickets expire and break the combo', () => {
  const game = createGame(0, 1);
  game.combo = 3;
  run(game, 90);
  assert.ok(game.missed >= 1);
  assert.equal(game.combo, 0);
});

test('same seed, same ticket sequence', () => {
  const a = createGame(2, 7); const b = createGame(2, 7);
  run(a, 60); run(b, 60);
  assert.deepEqual(a.tickets.map((t) => t.dish.id), b.tickets.map((t) => t.dish.id));
});
