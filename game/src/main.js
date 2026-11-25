// SPDX-License-Identifier: MIT
// Boot and game loop: screens (title, menu plan, shift, stars ledger, shop), input routing, update and draw order.
// Content first (kitchens, characters, shop, recipes, planner, ledger), then the engine and the renderers.
import { KITCHENS } from './kitchens/roster.js';
import { REGULARS } from './regulars.js';
import { buyUpgrade, modsFor, UPGRADES } from './shop.js';
import { DISHES } from './recipes.js';
import { defaultMenu, toggleDish, unlockedDishes, planIsReady } from './menu-planner.js';
import { recordShift, loadLedger, saveLedger } from './ledger.js';
import { createGame, tickGame } from './shifts.js';
import { interact, canChopHere, serveNow } from './stations.js';
import { focusTicket } from './orders.js';
import { tileAtPoint, screenToKitchen, VIEW, KITCHEN_Y } from './kitchen-layout.js';
import { createInput, inside } from './input.js';
import { createAudio } from './audio.js';
import { createFx, handleEvents, tickFx, drawFx } from './effects.js';
import { drawKitchen, drawTileBars, drawVignette } from './draw-kitchen.js';
import { drawBoard, drawRushBanner, drawHintBar, drawReactions, ticketRect, W, HGT } from './draw-hud.js';
import { drawTitle, kitchenCardRect, startButton } from './draw-title.js';
import { drawMenuPlanner, planCardRect, planStartButton } from './draw-menu-planner.js';
import { drawShop, shopCardRect, shopDoneButton } from './draw-shop.js';
import { drawLedger, ledgerButtons } from './draw-ledger.js';
import { stageShot } from './shot-mode.js';

const canvas = document.getElementById('kitchen');
const ctx = canvas.getContext('2d');
canvas.width = W; canvas.height = HGT;

function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / HGT);
  canvas.style.width = `${W * s}px`; canvas.style.height = `${HGT * s}px`;
}
window.addEventListener('resize', fit); fit();

const params = new URLSearchParams(location.search);
const seed = Number(params.get('seed')) || 1;
const audio = createAudio();
const input = createInput(canvas, () => audio.unlock());
const storage = (() => { try { return window.localStorage; } catch { return null; } })();

const app = { screen: 'title', chosen: 0, runs: 0, paused: false, still: false, t: 0,
  ledger: storage ? loadLedger(storage) : loadLedger({ getItem: () => null }),
  plan: defaultMenu(0), planKitchen: 0, nextKitchen: 0,
  game: createGame(0, seed), fx: createFx(seed) };
app.game.frozen = true;

if (params.get('shot')) {
  Object.assign(app, stageShot(params.get('shot'), seed));
  app.still = true;
}

function save() { if (storage) saveLedger(storage, app.ledger); }

function openPlanner(i) {
  app.planKitchen = i;
  app.plan = defaultMenu(i);
  app.screen = 'plan';
}

function startShift() {
  app.runs += 1;
  app.game = createGame(app.planKitchen, seed + app.runs * 101,
    { menu: app.plan, mods: modsFor(app.ledger.levels || app.ledger.owned), rival: app.ledger.rival });
  app.fx = createFx(seed + app.runs);
  app.screen = 'play'; app.paused = false;
}

function finishShift() {
  recordShift(app.ledger, app.game);
  save();
  app.screen = 'ledger';
}

function ledgerAction(id) {
  const i = app.game.kitchenIndex;
  if (id === 'retry') { openPlanner(i); return; }
  app.nextKitchen = id === 'next' ? i + 1 : i;
  app.screen = 'shop';
}

function updateTitle(presses, clicks) {
  const top = app.ledger.unlocked;
  for (const code of presses) {
    if (code === 'ArrowLeft' || code === 'KeyA') app.chosen = Math.max(0, app.chosen - 1);
    if (code === 'ArrowRight' || code === 'KeyD') app.chosen = Math.min(top, app.chosen + 1);
    if (code === 'Enter' || code === 'Space') openPlanner(app.chosen);
  }
  for (const c of clicks) {
    KITCHENS.forEach((_, i) => { if (i <= top && inside(c, kitchenCardRect(i))) app.chosen = i; });
    if (inside(c, startButton())) openPlanner(app.chosen);
  }
}

function updatePlan(presses, clicks) {
  const dishes = unlockedDishes(app.planKitchen);
  const toggle = (id) => { app.plan = toggleDish(app.plan, id, app.planKitchen); audio.play('pick'); };
  for (const code of presses) {
    const n = code.startsWith('Digit') ? Number(code.slice(5)) : 0;
    if (n >= 1 && n <= dishes.length) toggle(dishes[n - 1]);
    if (code === 'Enter' && planIsReady(app.plan)) startShift();
    if (code === 'Escape') app.screen = 'title';
  }
  for (const c of clicks) {
    dishes.forEach((id, i) => { if (inside(c, planCardRect(i))) toggle(id); });
    if (inside(c, planStartButton()) && planIsReady(app.plan)) startShift();
  }
}

function updatePlay(dt, presses, clicks) {
  const g = app.game;
  for (const code of presses) {
    if (code === 'Escape' || code === 'KeyP') app.paused = !app.paused;
    if (code === 'KeyM') audio.toggleMute();
    if (app.paused) continue;
    if (code === 'KeyE' || (code === 'Space' && !canChopHere(g))) interact(g);
  }
  for (const c of clicks) {
    g.tickets.forEach((tk, i) => { if (inside(c, ticketRect(i))) { focusTicket(g, tk.uid); audio.play('pick'); } });
    const k = screenToKitchen(c);
    serveNow(g, tileAtPoint(g.kitchen, k.x, k.y));
  }
  if (app.paused) return;
  tickGame(g, dt, { move: input.move(), chopHeld: input.held('Space') });
  handleEvents(app.fx, g, audio);
  tickFx(app.fx, dt, g);
  if (g.phase === 'result') finishShift();
}

function updateLedger(dt, presses, clicks) {
  for (const code of presses) {
    if (code === 'Enter') ledgerAction(ledgerButtons(app.game)[0].id);
    if (code === 'KeyR') ledgerAction('retry');
    if (code === 'Escape') app.screen = 'title';
  }
  for (const c of clicks) for (const b of ledgerButtons(app.game)) if (inside(c, b)) ledgerAction(b.id);
  tickFx(app.fx, dt, app.game);
}

function updateShop(presses, clicks) {
  const buy = (u) => { audio.play(buyUpgrade(app.ledger, u.id) ? 'bell' : 'nope'); save(); };
  for (const code of presses) {
    const n = code.startsWith('Digit') ? Number(code.slice(5)) : 0;
    if (n >= 1 && n <= UPGRADES.length) buy(UPGRADES[n - 1]);
    if (code === 'Enter') openPlanner(app.nextKitchen);
  }
  for (const c of clicks) {
    UPGRADES.forEach((u, i) => { if (inside(c, shopCardRect(i))) buy(u); });
    if (inside(c, shopDoneButton())) openPlanner(app.nextKitchen);
  }
}

function neededIngredients(g) {
  const focused = g.tickets.find((t) => t.uid === g.focus);
  return new Set(focused ? focused.dish.layers : []);
}

function draw() {
  const g = app.game;
  const t = app.t;
  const fx = app.fx;
  ctx.fillStyle = g.def.palette.wall; ctx.fillRect(0, 0, W, HGT);
  ctx.save();
  if (app.screen === 'play') ctx.translate(fx.shakeX || 0, fx.shakeY || 0);   // a burn shakes the room
  drawBoard(ctx, g, fx, t);
  ctx.save();
  ctx.translate(VIEW.x, VIEW.y); ctx.scale(VIEW.scale, VIEW.scale); ctx.translate(0, -KITCHEN_Y);
  drawKitchen(ctx, g, t, neededIngredients(g));
  drawFx(ctx, fx);
  drawVignette(ctx, g);
  drawTileBars(ctx, g, t);
  ctx.restore();
  ctx.restore();
  if (fx.burnFlash > 0) { ctx.fillStyle = `rgba(255,60,20,${fx.burnFlash * 0.28})`; ctx.fillRect(0, 0, W, HGT); }
  drawReactions(ctx, fx, t);
  drawRushBanner(ctx, fx, g, t);
  drawHintBar(ctx, g);
  if (app.screen === 'title') drawTitle(ctx, app.ledger, app.chosen, t, W, HGT);
  if (app.screen === 'plan') drawMenuPlanner(ctx, app.planKitchen, app.plan, t, W, HGT);
  if (app.screen === 'ledger') drawLedger(ctx, g, app.ledger, t, W, HGT);
  if (app.screen === 'shop') drawShop(ctx, app.ledger, app.nextKitchen, t, W, HGT);
  if (app.paused) {
    ctx.fillStyle = 'rgba(20,10,5,0.6)'; ctx.fillRect(0, 0, W, HGT);
    ctx.fillStyle = '#ffd34d'; ctx.font = "bold 72px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, HGT / 2);
  }
}

// For the play-test harness: read-only view of the current screen and shift.
window.__kitchen = { app, regulars: REGULARS.length, kitchens: KITCHENS.length, dishes: DISHES.length };

let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  if (!app.still) {
    app.t += dt;
    const presses = input.takePresses(); const clicks = input.takeClicks();
    if (app.screen === 'title') updateTitle(presses, clicks);
    else if (app.screen === 'plan') updatePlan(presses, clicks);
    else if (app.screen === 'play') updatePlay(dt, presses, clicks);
    else if (app.screen === 'shop') updateShop(presses, clicks);
    else updateLedger(dt, presses, clicks);
  }
  draw();
  requestAnimationFrame(frame);
}
draw();
requestAnimationFrame(frame);
