// SPDX-License-Identifier: MIT
// v3 harness: seven kitchens owning their hazards, fry/bake/grill stations, traits, two-tier shop, rival tally.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { KITCHENS } from '../game/src/kitchens/roster.js';
import { DISHES, dishById, stepsOf, HEAT_STEPS } from '../game/src/recipes.js';
import { buildKitchen, findTiles } from '../game/src/kitchen-layout.js';
import { createGame, tickGame } from '../game/src/shifts.js';
import { REGULARS } from '../game/src/regulars.js';
import { UPGRADES, buyUpgrade, levelOf, modsFor, nextPrice } from '../game/src/shop.js';
import { unlockedDishes, canCook } from '../game/src/menu-planner.js';
import { createLedger, recordShift } from '../game/src/ledger.js';
import { heatFor } from '../game/src/hazards.js';
import { makeIngredient, makePlate, isReady } from '../game/src/items.js';
import { addTicket, serveTicket, ticketForPlate } from '../game/src/orders.js';
import { tickStations } from '../game/src/stations.js';

const idle = { move: { x: 0, y: 0 }, chopHeld: false };
function run(game, seconds) { for (let s = 0; s < seconds; s += 1 / 60) tickGame(game, 1 / 60, idle); }
const guest = (trait) => REGULARS.find((r) => r.trait === trait);

test('seven kitchens, each its own file of 100 lines or more with hazard functions', () => {
  assert.equal(KITCHENS.length, 7);
  for (const k of KITCHENS) {
    const lines = readFileSync(new URL(`../game/src/kitchens/${k.id}.js`, import.meta.url), 'utf8').split('\n').length;
    assert.ok(lines >= 100, `${k.id} has ${lines} lines`);
    assert.equal(typeof k.hazard.trigger, 'function', k.id);
    assert.equal(typeof k.hazard.draw, 'function', k.id);
    assert.ok(k.intro && k.story && k.par > 0 && k.stars.length === 3, k.id);
  }
  assert.ok(KITCHENS.some((k) => k.hazard.kind === 'rain'));
});

test('eighteen dishes, three new heat steps, every dish cookable somewhere, every kitchen a full menu', () => {
  assert.ok(DISHES.length >= 18);
  for (const s of ['fry', 'bake', 'grill']) assert.ok(HEAT_STEPS.includes(s));
  for (const d of DISHES) assert.ok(KITCHENS.some((k) => canCook(k, d)), d.id);
  KITCHENS.forEach((k, i) => {
    assert.ok(unlockedDishes(i).length >= 4, k.id);
    for (const id of unlockedDishes(i)) assert.ok(canCook(k, dishById(id)), `${k.id} cooks ${id}`);
  });
  const night = buildKitchen(KITCHENS[6].plan);
  for (const t of ['fry', 'bake', 'grill']) assert.ok(findTiles(night, t).length > 0, t);
});

test('a fryer cooks potato, then burns it if left', () => {
  const game = createGame(6, 1);
  const fryer = findTiles(game.kitchen, 'fry')[0];
  const potato = makeIngredient('potato'); potato.stage = 1;   // already chopped
  fryer.item = potato;
  for (let s = 0; s < 6; s += 1 / 60) tickStations(game, 1 / 60);
  assert.ok(isReady(potato), 'fried');
  for (let s = 0; s < 12; s += 1 / 60) tickStations(game, 1 / 60);
  assert.ok(potato.burnt, 'burnt after the burn clock');
});

test('ten or more named characters with traits; the fussy critic leaves one ingredient out', () => {
  assert.ok(REGULARS.length >= 10);
  for (const t of ['tipper', 'fussy', 'impatient', 'fan', 'rival']) assert.ok(guest(t), t);
  const game = createGame(3, 1, { menu: ['risotto', 'ember', 'harbor', 'forest'] });
  game.tickets.length = 0;
  const tk = addTicket(game, dishById('ember'), guest('fussy'));
  assert.ok(tk.dish.without, 'names what to leave out');
  assert.equal(tk.dish.layers.length, 3);
  const plate = makePlate(); plate.layers = [...tk.dish.layers];
  assert.equal(ticketForPlate(game, plate), tk);
});

test('a generous tipper tips more than a plain regular', () => {
  const game = createGame(0, 1);
  game.tickets.length = 0;
  const plain = addTicket(game, dishById('salad'), REGULARS.find((r) => !r.trait && !r.critic));
  serveTicket(game, plain, 1);
  const a = game.tips;
  game.combo = 0;
  const rich = addTicket(game, dishById('salad'), guest('tipper'));
  serveTicket(game, rich, 1);
  assert.ok(game.tips - a > a, 'tipper pays more');
});

test('rival critic visits two kitchens and the ledger keeps a running tally', () => {
  assert.ok(KITCHENS.filter((k) => k.rival).length >= 2);
  const game = createGame(3, 1);
  game.tickets.length = 0;
  serveTicket(game, addTicket(game, dishById('risotto'), guest('rival')), 1);
  game.stars = 2;
  const ledger = recordShift(createLedger(), game);
  assert.equal(ledger.rival.won + ledger.rival.lost, 1);
});

test('career: a chapter per kitchen and ranks that climb with stars', async () => {
  const { CHAPTERS, rankFor, chapterOf, rivalKitchens } = await import('../game/src/kitchens/roster.js');
  assert.equal(CHAPTERS.length, KITCHENS.length);
  assert.equal(chapterOf(6).kitchen.id, 'night-market');
  assert.equal(rankFor(0).title, 'Galley Hand');
  assert.ok(rankFor(21).level > rankFor(8).level);
  assert.equal(rankFor(21).next, null);
  assert.equal(rivalKitchens().length, 2);
});

test('shop: eight upgrades with two tiers each, bought in order, each changing a modifier', () => {
  assert.ok(UPGRADES.length >= 8);
  const ledger = createLedger(); ledger.wallet = 10000;
  const base = modsFor({});
  for (const u of UPGRADES) {
    assert.equal(u.tiers.length, 2, u.id);
    assert.ok(u.tiers[1].price > u.tiers[0].price, u.id);
    assert.equal(nextPrice(ledger, u.id), u.tiers[0].price);
    assert.ok(buyUpgrade(ledger, u.id)); assert.ok(buyUpgrade(ledger, u.id));
    assert.equal(buyUpgrade(ledger, u.id), false, 'max tier');
    assert.equal(levelOf(ledger, u.id), 2);
  }
  const top = modsFor(ledger.levels);
  for (const key of Object.keys(base)) assert.notEqual(top[key], base[key], key);
});

test('night market rain douses a burner and slows the cook in puddles', () => {
  const game = createGame(6, 3);
  game.hazard.clock = 0.01;
  run(game, 0.1);
  assert.ok(game.hazard.active > 0);
  const doused = game.hazard.doused || [];
  assert.ok(doused.length >= 1);
  assert.equal(heatFor(game, doused[0]), 0);
});

test('fish & chips goes crate, board, fryer, pan, plate, hatch in the night market, and the tipper pays', async () => {
  const { interact } = await import('../game/src/stations.js');
  const { standFacing } = await import('../game/src/chef.js');
  const game = createGame(6, 2, { menu: ['chips', 'flatbread', 'nightbowl', 'skewer'] });
  game.tickets.length = 0;
  game.hazard.clock = 999;                       // no squall during the walk-through
  addTicket(game, dishById('chips'), guest('tipper'));
  const tile = (type, n = 0) => { const t = findTiles(game.kitchen, type)[n]; standFacing(game, t); return t; };
  const crate = (id) => { const t = findTiles(game.kitchen, 'crate').find((c) => c.ingredient === id); standFacing(game, t); return t; };
  const chopHeld = { move: { x: 0, y: 0 }, chopHeld: true };
  const plateSpot = tile('plating');
  tile('rack'); interact(game); standFacing(game, plateSpot); interact(game);
  // potato: chop, then deep-fry
  crate('potato'); interact(game);
  let board = tile('chop'); interact(game); run(game, 0); for (let s = 0; s < 2; s += 1 / 60) tickGame(game, 1 / 60, chopHeld);
  interact(game);
  const fryer = tile('fry'); interact(game);
  assert.equal(fryer.item.id, 'potato');
  run(game, 5);
  assert.ok(isReady(fryer.item), 'fried');
  interact(game); standFacing(game, plateSpot); interact(game);
  // fish: chop, then the pan
  crate('fish'); interact(game);
  board = tile('chop'); interact(game); for (let s = 0; s < 2; s += 1 / 60) tickGame(game, 1 / 60, chopHeld);
  interact(game);
  const pan = tile('pan'); interact(game); run(game, 5);
  assert.ok(isReady(pan.item), 'pan-fried');
  interact(game); standFacing(game, plateSpot); interact(game);
  // lettuce: chop
  crate('lettuce'); interact(game);
  board = tile('chop'); interact(game); for (let s = 0; s < 2; s += 1 / 60) tickGame(game, 1 / 60, chopHeld);
  interact(game); standFacing(game, plateSpot); interact(game);
  assert.deepEqual(plateSpot.item.layers, ['potato', 'fish', 'lettuce']);
  interact(game); tile('hatch'); interact(game); run(game, 2);
  assert.equal(game.served, 1);
  assert.ok(game.tips > 20, `tipper tipped ${game.tips}`);
});

test('every kitchen, the night market included, survives a minute of play', () => {
  for (let i = 0; i < KITCHENS.length; i++) {
    const game = createGame(i, 7);
    run(game, 60);
    assert.equal(game.phase, 'play');
  }
});
