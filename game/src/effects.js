// SPDX-License-Identifier: MIT
// Juice: turns game events into sounds, chop bits, steam, smoke, serve flashes and floating score text.
import { createRng } from './rng.js';
import { nextStep, isReady, lastStep } from './items.js';
import { burnShare, WARN_AT } from './stations.js';
import { TILE, KITCHEN_Y, isHeat } from './kitchen-layout.js';

const BIT = { tomato: '#e0392b', lettuce: '#6cc443', onion: '#d58cc8', fish: '#f39a7b', mushroom: '#c9935a',
  potato: '#f3e0a6', pepper: '#e0382a' };
const FONT = "'Trebuchet MS', Verdana, sans-serif";
const CONFETTI = ['#ffd34d', '#ff6ad0', '#4cc24a', '#4ab8f0', '#ff7a2a', '#ffffff'];

export function createFx(seed) {
  return { rng: createRng(seed * 7 + 99), parts: [], floats: [], boardFlash: 0, hatchFlash: 0, banner: 0,
    shake: 0, shakeX: 0, shakeY: 0, burnFlash: 0, reactions: [] };
}

// Paper confetti from the hatch when a plate goes out: spinning rectangles that drift down.
function confetti(fx, x, y, n) {
  for (let i = 0; i < n; i++) {
    const a = fx.rng.range(-Math.PI * 0.95, -Math.PI * 0.05); const v = fx.rng.range(160, 420);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1.4, max: 1.4, size: fx.rng.range(4, 7),
      color: CONFETTI[i % CONFETTI.length], gravity: 520, grow: 0, rect: true, spin: fx.rng.range(-12, 12), rot: 0 });
  }
}

// A guest's reaction when their plate lands: face, their line, and what their trait paid, by their ticket slot.
function react(fx, e) {
  if (!e.guest) return;
  let extra = '';
  if (e.guest.trait === 'tipper') extra = `+$${e.tip} TIP!`;
  if (e.guest.trait === 'fan' && e.dish.layers.includes(e.guest.loves)) extra = `loves the ${e.guest.loves}!`;
  if (e.rival) extra = e.rival.won ? 'ROUND TO YOU' : 'ROUND TO ROOK';
  if (e.critic && !e.rival) extra = `rates it ${Math.round(e.quality * 100)}%`;
  const line = e.rival && !e.rival.won ? e.guest.lines.furious : e.guest.react || e.guest.lines.delighted;
  fx.reactions.push({ guest: e.guest, line, extra, slot: e.slot ?? 0, life: 2.6, max: 2.6, mood: e.rival && !e.rival.won ? 'furious' : 'delighted' });
  fx.reactions = fx.reactions.slice(-3);
}

function burst(fx, x, y, n, color, speed, life, size, gravity = 300) {
  for (let i = 0; i < n; i++) {
    const a = fx.rng.range(0, Math.PI * 2); const v = fx.rng.range(speed * 0.4, speed);
    fx.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - speed * 0.4, life, max: life, size, color, gravity, grow: 0 });
  }
}
function puff(fx, x, y, color, size, life) {
  fx.parts.push({ x: x + fx.rng.range(-10, 10), y, vx: fx.rng.range(-8, 8), vy: fx.rng.range(-55, -30),
    life, max: life, size, color, gravity: 0, grow: 18 });
}
export function floatText(fx, x, y, str, color, size = 26) {
  fx.floats.push({ x, y, str, color, size, life: 1.4, max: 1.4 });
}

// Where the last plate went out: flashes and pay text rise from that hatch tile.
const HATCH = { x: 15 * TILE, y: KITCHEN_Y + TILE / 2 };
const HAZARD_COLOR = { swell: '#8fd0ff', shutter: '#d0d8e0', gust: '#c8ecff', flare: '#ff8a3a', feast: '#ffd34d', belt: '#ffd34d' };

export function handleEvents(fx, game, audio) {
  for (const e of game.events) {
    switch (e.type) {
      case 'chop': audio.play('chop'); burst(fx, e.x, e.y - 6, 4, BIT[game.kitchen.list.find((t) => t.x === e.x && t.y === e.y)?.item?.id] || '#f3e3c0', 160, 0.35, 4); break;
      case 'chopped': audio.play('done'); floatText(fx, e.x, e.y - 40, 'Chopped!', '#9fe08a', 22); break;
      case 'pick': audio.play('pick'); break;
      case 'drop': audio.play('drop'); break;
      case 'trash': audio.play('drop'); burst(fx, e.x, e.y, 6, '#7a6a60', 120, 0.4, 4); break;
      case 'plate': audio.play('plate'); burst(fx, e.x, e.y - 8, 8, '#fff2a0', 150, 0.45, 3, 0); break;
      case 'nope': audio.play('nope'); floatText(fx, e.x, e.y - 34, e.text || 'Not here', '#ff8a7a', 20); break;
      case 'cooked': audio.play('ding'); floatText(fx, e.x, e.y - 50, 'Done!', '#9fe08a', 22); break;
      case 'warn': audio.play('warn'); floatText(fx, e.x - 40, e.y - 50, 'Burning!', '#ff6a4a', 24); break;
      case 'burnt':
        audio.play('burnt'); fx.shake = 0.45; fx.burnFlash = 1;
        for (let i = 0; i < 12; i++) puff(fx, e.x, e.y, '#3a3230', 14, 1.6);
        burst(fx, e.x, e.y - 10, 10, '#ff7a2a', 200, 0.5, 4, -60);
        floatText(fx, e.x, e.y - 56, 'BURNT!', '#ff5a3a', 30);
        break;
      case 'ready': audio.play('ready'); fx.hatchFlash = 0.6; break;
      case 'serve': {
        audio.play('bell'); fx.hatchFlash = 1;
        if (e.x !== null && e.x !== undefined) { HATCH.x = Math.min(e.x, 15.4 * TILE); HATCH.y = e.y; }
        floatText(fx, HATCH.x, HATCH.y + 50, `+${e.gain}`, '#ffd34d', 40);
        if (e.tip > 0) floatText(fx, HATCH.x, HATCH.y + 92, `tip $${e.tip}${e.mult > 1 ? ' x' + e.mult.toFixed(2) : ''}`, '#9fe08a', 22);
        confetti(fx, HATCH.x, HATCH.y + 10, 36);
        react(fx, e);
        if (e.guest && e.guest.trait === 'tipper') audio.play('coins');
        break;
      }
      case 'hazard':
        audio.play('warn');
        floatText(fx, Math.max(170, Math.min(e.x, 980)), e.y - 50, e.text, HAZARD_COLOR[e.kind] || '#ffffff', 26);
        if (e.kind === 'gust') for (let i = 0; i < 10; i++) puff(fx, e.x, e.y, 'rgba(220,240,255,0.7)', 6, 0.8);
        if (e.kind === 'rain') { audio.play('rain'); for (let i = 0; i < 14; i++) puff(fx, e.x, e.y, 'rgba(230,236,240,0.8)', 8, 1.1); }
        if (e.kind === 'swell') fx.shake = Math.max(fx.shake, 0.3);
        if (e.kind === 'flare') burst(fx, e.x, e.y - 10, 16, '#ff8a2a', 220, 0.6, 5, -100);
        break;
      case 'served': burst(fx, e.x, e.y, 18, '#ffd34d', 260, 0.7, 5); break;
      case 'expire': audio.play('expire'); fx.boardFlash = 1; floatText(fx, 470, 140, `${e.guest ? e.guest.name : e.dish.name} walked out!  -10`, '#ff6a4a', 30); break;
      case 'rush': audio.play('rush'); fx.banner = 3; break;
      case 'ticket': audio.play('ticket'); break;
      case 'end': audio.play(e.stars > 0 ? 'win' : 'lose'); break;
      default: break;
    }
  }
  game.events.length = 0;
}

export function tickFx(fx, dt, game) {
  fx.boardFlash = Math.max(0, fx.boardFlash - dt * 1.6);
  fx.burnFlash = Math.max(0, fx.burnFlash - dt * 2.5);
  fx.shake = Math.max(0, fx.shake - dt);
  const amp = fx.shake * 18;
  fx.shakeX = amp ? fx.rng.range(-amp, amp) : 0; fx.shakeY = amp ? fx.rng.range(-amp, amp) : 0;
  for (const r of fx.reactions) r.life -= dt;
  fx.reactions = fx.reactions.filter((r) => r.life > 0);
  const lv = game.mods && game.mods.levels;
  if (lv && lv.clogs && game.chef.walk && fx.rng.next() < dt * 8) puff(fx, game.chef.x, game.chef.y + 20, 'rgba(200,170,120,0.6)', 5, 0.5);
  fx.hatchFlash = Math.max(0, fx.hatchFlash - dt * 1.5);
  fx.banner = Math.max(0, fx.banner - dt);
  for (const tile of game.kitchen.list) {
    const item = tile.item;
    if (!item || !isHeat(tile)) continue;
    if (tile.type === 'grill' && nextStep(item) === 'grill' && fx.rng.next() < dt * 6) puff(fx, tile.x, tile.y - 12, 'rgba(110,100,95,0.6)', 8, 1.2);
    if (tile.type === 'fry' && nextStep(item) === 'fry' && fx.rng.next() < dt * 12) burst(fx, tile.x, tile.y - 6, 1, '#fff2b0', 90, 0.3, 2);
    if (item.burnt) { if (fx.rng.next() < dt * 10) puff(fx, tile.x, tile.y - 10, '#3a3230', 10, 1.3); continue; }
    if (nextStep(item) === tile.type && fx.rng.next() < dt * 9) puff(fx, tile.x, tile.y - 12, 'rgba(255,255,255,0.6)', 7, 1.0);
    if (isReady(item) && lastStep(item) === tile.type) {
      const hot = burnShare(item) >= WARN_AT;
      if (fx.rng.next() < dt * (hot ? 14 : 6)) puff(fx, tile.x, tile.y - 12, hot ? 'rgba(120,110,100,0.8)' : 'rgba(255,255,255,0.75)', 9, 1.2);
    }
  }
  for (const p of fx.parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.life -= dt; p.size += p.grow * dt;
    if (p.spin) { p.rot += p.spin * dt; p.vx *= 1 - dt * 1.5; }
  }
  fx.parts = fx.parts.filter((p) => p.life > 0).slice(-400);
  for (const f of fx.floats) { f.y -= 40 * dt; f.life -= dt; }
  fx.floats = fx.floats.filter((f) => f.life > 0);
}

export function drawFx(ctx, fx) {
  if (fx.hatchFlash > 0) {
    const g = ctx.createRadialGradient(HATCH.x, HATCH.y, 10, HATCH.x, HATCH.y, 190);
    g.addColorStop(0, `rgba(255,236,140,${fx.hatchFlash * 0.85})`); g.addColorStop(1, 'rgba(255,236,140,0)');
    ctx.fillStyle = g; ctx.fillRect(HATCH.x - 200, HATCH.y - 200, 400, 400);
  }
  for (const p of fx.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    if (p.rect) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.rot * 1.7));
      ctx.fillStyle = p.color; ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      ctx.restore();
      continue;
    }
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fillStyle = p.color; ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const f of fx.floats) {
    ctx.globalAlpha = Math.min(1, f.life / f.max * 2);
    ctx.font = `bold ${f.size}px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round'; ctx.lineWidth = 6; ctx.strokeStyle = '#2b1a12'; ctx.strokeText(f.str, f.x, f.y);
    ctx.fillStyle = f.color; ctx.fillText(f.str, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}
