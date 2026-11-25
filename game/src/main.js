// SPDX-License-Identifier: MIT
// Boot and game loop: screens (title, shift, result), input routing, update and draw order.
import { createGame, tickGame } from './shifts.js';
import { SHIFTS } from './recipes.js';
import { interact, canChopHere, serveNow } from './stations.js';
import { focusTicket } from './orders.js';
import { tileAtPoint, screenToKitchen, VIEW, KITCHEN_Y } from './kitchen-layout.js';
import { createInput, inside } from './input.js';
import { createAudio } from './audio.js';
import { createFx, handleEvents, tickFx, drawFx } from './effects.js';
import { drawKitchen, drawTileBars } from './draw-kitchen.js';
import { drawBoard, drawRushBanner, drawHintBar, drawResult, drawTitle, ticketRect, resultButtons, startButton, W, HGT } from './draw-hud.js';
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

function loadProgress() {
  try { return JSON.parse(localStorage.getItem('copper-lantern-progress')) || { unlocked: 0, stars: [] }; } catch { return { unlocked: 0, stars: [] }; }
}
function saveProgress(p) {
  try { localStorage.setItem('copper-lantern-progress', JSON.stringify(p)); } catch { /* private window */ }
}

const app = { screen: 'title', chosen: 0, runs: 0, paused: false, still: false, t: 0,
  progress: loadProgress(), game: createGame(0, seed), fx: createFx(seed) };
app.game.frozen = true;

if (params.get('shot')) {
  Object.assign(app, stageShot(params.get('shot'), seed));
  app.still = true;
}

function startShift(i) {
  app.runs += 1;
  app.chosen = i;
  app.game = createGame(i, seed + app.runs * 101);
  app.fx = createFx(seed + app.runs);
  app.screen = 'play'; app.paused = false;
}

function finishShift() {
  const g = app.game;
  app.progress.stars[g.shiftIndex] = Math.max(app.progress.stars[g.shiftIndex] || 0, g.stars);
  if (g.stars >= 1) app.progress.unlocked = Math.max(app.progress.unlocked, Math.min(g.shiftIndex + 1, SHIFTS.length - 1));
  saveProgress(app.progress);
  app.screen = 'result';
}

function resultAction(id) {
  const i = app.game.shiftIndex;
  if (id === 'next') startShift(i + 1);
  else if (id === 'again') startShift(0);
  else startShift(i);
}

function updateTitle(presses, clicks) {
  for (const code of presses) {
    if (code === 'ArrowLeft' || code === 'KeyA') app.chosen = Math.max(0, app.chosen - 1);
    if (code === 'ArrowRight' || code === 'KeyD') app.chosen = Math.min(app.progress.unlocked, app.chosen + 1);
    if (code === 'Enter' || code === 'Space') startShift(app.chosen);
  }
  for (const c of clicks) {
    SHIFTS.forEach((_, i) => {
      if (i <= app.progress.unlocked && inside(c, { x: 250 + i * 270, y: 350, w: 240, h: 170 })) app.chosen = i;
    });
    if (inside(c, startButton())) startShift(app.chosen);
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

function updateResult(dt, presses, clicks) {
  for (const code of presses) {
    if (code === 'Enter') resultAction(resultButtons(app.game)[0].id);
    if (code === 'KeyR') startShift(app.game.shiftIndex);
    if (code === 'Escape') app.screen = 'title';
  }
  for (const c of clicks) for (const b of resultButtons(app.game)) if (inside(c, b)) resultAction(b.id);
  tickFx(app.fx, dt, app.game);
}

function neededIngredients(g) {
  const focused = g.tickets.find((t) => t.uid === g.focus);
  return new Set(focused ? focused.dish.layers : []);
}

function draw() {
  const g = app.game;
  const t = app.t;
  ctx.fillStyle = '#3b2216'; ctx.fillRect(0, 0, W, HGT);
  drawBoard(ctx, g, app.fx, t);
  ctx.save();
  ctx.translate(VIEW.x, VIEW.y); ctx.scale(VIEW.scale, VIEW.scale); ctx.translate(0, -KITCHEN_Y);
  drawKitchen(ctx, g, t, neededIngredients(g));
  drawFx(ctx, app.fx);
  drawTileBars(ctx, g, t);
  ctx.restore();
  drawRushBanner(ctx, app.fx, g, t);
  drawHintBar(ctx, g);
  if (app.screen === 'title') drawTitle(ctx, app.progress, app.chosen, t);
  if (app.screen === 'result') drawResult(ctx, g, t);
  if (app.paused) {
    ctx.fillStyle = 'rgba(20,10,5,0.6)'; ctx.fillRect(0, 0, W, HGT);
    ctx.fillStyle = '#ffd34d'; ctx.font = "bold 72px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center';
    ctx.fillText('PAUSED', W / 2, HGT / 2);
  }
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(1 / 30, (now - last) / 1000);
  last = now;
  if (!app.still) {
    app.t += dt;
    const presses = input.takePresses(); const clicks = input.takeClicks();
    if (app.screen === 'title') updateTitle(presses, clicks);
    else if (app.screen === 'play') updatePlay(dt, presses, clicks);
    else updateResult(dt, presses, clicks);
  }
  draw();
  requestAnimationFrame(frame);
}
draw();
requestAnimationFrame(frame);
