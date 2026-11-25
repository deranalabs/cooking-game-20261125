// SPDX-License-Identifier: MIT
// v2 harness: six kitchens and their hazards, named regulars and critics, the shop, the menu planner, the ledger.
import test from 'node:test';
import assert from 'node:assert/strict';
import { KITCHENS } from '../game/src/kitchens/roster.js';
import { DISHES, dishById, stepsOf } from '../game/src/recipes.js';
import { buildKitchen, findTiles, COLS, ROWS } from '../game/src/kitchen-layout.js';
import { createGame, tickGame } from '../game/src/shifts.js';
import { REGULARS, moodOf } from '../game/src/regulars.js';
import { UPGRADES, buyUpgrade, canAfford, modsFor } from '../game/src/shop.js';
import { unlockedDishes, defaultMenu, toggleDish, dishDifficulty, MENU_SIZE } from '../game/src/menu-planner.js';
import { createLedger, recordShift, criticComment } from '../game/src/ledger.js';
import { hatchOpen } from '../game/src/hazards.js';
import { makeIngredient, makePlate } from '../game/src/items.js';
import { addTicket, serveTicket } from '../game/src/orders.js';

const idle = { move: { x: 0, y: 0 }, chopHeld: false };
function run(game, seconds) { for (let s = 0; s < seconds; s += 1 / 60) tickGame(game, 1 / 60, idle); }

test('six kitchens, each a full 17x8 plan with every station and a hazard', () => {
  assert.equal(KITCHENS.length, 6);
  const hazards = new Set();
  for (const k of KITCHENS) {
    assert.equal(k.plan.length, ROWS, k.id);
    for (const line of k.plan) assert.equal(line.length, COLS, k.id + ' ' + line);
    const kitchen = buildKitchen(k.plan);
    for (const type of ['chop', 'pan', 'pot', 'plating', 'hatch', 'rack', 'trash']) {
      assert.ok(findTiles(kitchen, type).length > 0, `${k.id} has ${type}`);
    }
    const crates = new Set(findTiles(kitchen, 'crate').map((t) => t.ingredient));
    for (const id of unlockedDishes(KITCHENS.indexOf(k))) {
      for (const ing of dishById(id).layers) assert.ok(crates.has(ing), `${k.id} stocks ${ing}`);
    }
    hazards.add(k.hazard.kind);
  }
  assert.equal(hazards.size, 6, 'every kitchen has its own hazard');
});

test('later kitchens unlock more dishes', () => {
  assert.ok(DISHES.length >= 12);
  assert.ok(unlockedDishes(5).length > unlockedDishes(0).length);
  assert.ok(unlockedDishes(0).length >= MENU_SIZE);
});

test('menu planner keeps exactly four dishes at most and starts with four', () => {
  const plan = defaultMenu(3);
  assert.equal(plan.length, MENU_SIZE);
  const extra = unlockedDishes(3).find((id) => !plan.includes(id));
  assert.equal(toggleDish(plan, extra, 3).length, MENU_SIZE, 'a fifth pick is refused');
  const fewer = toggleDish(plan, plan[0], 3);
  assert.equal(fewer.length, MENU_SIZE - 1);
  assert.ok(dishDifficulty(dishById('ember')) >= dishDifficulty(dishById('salad')));
});

test('a shift serves only the planned menu', () => {
  const menu = defaultMenu(2);
  const game = createGame(2, 3, { menu });
  run(game, 40);
  for (const t of game.tickets) assert.ok(menu.includes(t.dish.id), t.dish.id);
});

test('regulars have names, colours, lines, and two critics among them', () => {
  assert.ok(REGULARS.length >= 6);
  for (const r of REGULARS) {
    assert.ok(r.name && r.color);
    for (const m of ['patient', 'hungry', 'furious', 'delighted']) assert.ok(r.lines[m], r.name + ' ' + m);
  }
  assert.ok(REGULARS.filter((r) => r.critic).length >= 2);
  const game = createGame(0, 1);
  const t = game.tickets[0];
  assert.ok(t.guest && t.guest.name);
  t.patience = t.max * 0.9; assert.equal(moodOf(game, t), 'patient');
  t.patience = t.max * 0.45; assert.equal(moodOf(game, t), 'hungry');
  t.patience = t.max * 0.1; assert.equal(moodOf(game, t), 'furious');
});

test('a critic pays more for a fresh plate than a regular', () => {
  const game = createGame(1, 1);
  game.tickets.length = 0;
  const reg = addTicket(game, dishById('salad'), REGULARS.find((r) => !r.critic));
  serveTicket(game, reg, 1);
  const regularGain = game.score;
  const crit = addTicket(game, dishById('salad'), REGULARS.find((r) => r.critic));
  game.combo = 0;
  serveTicket(game, crit, 1);
  assert.ok(game.score - regularGain > regularGain, 'critic pays more');
  assert.equal(game.critics.length, 1);
});

test('shop: buy only what the ledger affords, money persists, upgrades change the kitchen', () => {
  const ledger = createLedger();
  assert.ok(UPGRADES.length >= 4);
  const knife = UPGRADES.find((u) => u.id === 'knife');
  assert.equal(canAfford(ledger, 'knife'), false);
  ledger.wallet = knife.price + 5;
  assert.equal(buyUpgrade(ledger, 'knife'), true);
  assert.equal(ledger.wallet, 5);
  assert.equal(buyUpgrade(ledger, 'knife'), false, 'owned once');
  assert.ok(modsFor(ledger.owned).chop < 1);
  const game = createGame(0, 1, { mods: modsFor(ledger.owned) });
  assert.ok(game.mods.chop < 1);
});

test('ledger adds tips to the wallet and keeps stars per kitchen', () => {
  const ledger = createLedger();
  const game = createGame(0, 1);
  Object.assign(game, { tips: 40, score: 999, served: 9, stars: 3, burnt: 1, bestCombo: 4 });
  recordShift(ledger, game);
  assert.equal(ledger.wallet, 40);
  assert.equal(ledger.stars[0], 3);
  assert.equal(ledger.unlocked, 1);
  assert.ok(criticComment(game).length > 10);
});

test('market shutter closes the hatch for a while', () => {
  const i = KITCHENS.findIndex((k) => k.hazard.kind === 'shutter');
  const game = createGame(i, 1);
  let closed = false;
  for (let s = 0; s < 60 && !closed; s += 1 / 60) { tickGame(game, 1 / 60, idle); closed = !hatchOpen(game); }
  assert.ok(closed);
});

test('the diner conveyor carries an item along the belt', () => {
  const i = KITCHENS.findIndex((k) => k.hazard.kind === 'belt');
  const game = createGame(i, 1);
  const belts = findTiles(game.kitchen, 'belt');
  assert.ok(belts.length >= 4);
  belts[0].item = makeIngredient('cheese');
  run(game, 3);
  assert.equal(belts[0].item, null);
  assert.ok(belts.some((b) => b.item && b.item.id === 'cheese'));
});

test('every kitchen survives a minute of play', () => {
  KITCHENS.forEach((k, i) => {
    const game = createGame(i, 2);
    game.chef.hold = makePlate();
    run(game, 60);
    assert.equal(game.phase, 'play', k.id);
    assert.ok(Number.isFinite(game.chef.x) && Number.isFinite(game.chef.y), k.id);
  });
  assert.ok(stepsOf('beef').length === 1);
});
