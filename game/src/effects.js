// SPDX-License-Identifier: MIT
// Juice: turns game events into sounds, chop bits, steam, smoke, serve flashes and floating score text.
import { createRng } from './rng.js';
import { nextStep, isReady, lastStep } from './items.js';
import { burnShare, WARN_AT } from './stations.js';
import { TILE, KITCHEN_Y } from './kitchen-layout.js';

const BIT = { tomato: '#e0392b', lettuce: '#6cc443', onion: '#d58cc8', fish: '#f39a7b', mushroom: '#c9935a' };
const FONT = "'Trebuchet MS', Verdana, sans-serif";

export function createFx(seed) {
  return { rng: createRng(seed * 7 + 99), parts: [], floats: [], boardFlash: 0, hatchFlash: 0, banner: 0 };
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
      case 'burnt': audio.play('burnt'); for (let i = 0; i < 8; i++) puff(fx, e.x, e.y, '#3a3230', 14, 1.4); break;
      case 'ready': audio.play('ready'); fx.hatchFlash = 0.6; break;
      case 'serve': {
        audio.play('bell'); fx.hatchFlash = 1;
        if (e.x !== null && e.x !== undefined) { HATCH.x = Math.min(e.x, 15.4 * TILE); HATCH.y = e.y; }
        floatText(fx, HATCH.x, HATCH.y + 50, `+${e.gain}`, '#ffd34d', 40);
        if (e.tip > 0) floatText(fx, HATCH.x, HATCH.y + 92, `tip $${e.tip}${e.mult > 1 ? ' x' + e.mult.toFixed(2) : ''}`, '#9fe08a', 22);
        if (e.guest) floatText(fx, 470, 150, `${e.guest.name}: “${e.guest.lines.delighted}”`, e.critic ? '#ffd34d' : '#ffb0e8', 22);
        if (e.critic) floatText(fx, HATCH.x - 120, HATCH.y + 130, `critic rates it ${Math.round(e.quality * 100)}%`, '#ffd34d', 22);
        break;
      }
      case 'hazard':
        audio.play('warn');
        floatText(fx, Math.max(170, Math.min(e.x, 980)), e.y - 50, e.text, HAZARD_COLOR[e.kind] || '#ffffff', 26);
        if (e.kind === 'gust') for (let i = 0; i < 10; i++) puff(fx, e.x, e.y, 'rgba(220,240,255,0.7)', 6, 0.8);
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
  fx.hatchFlash = Math.max(0, fx.hatchFlash - dt * 1.5);
  fx.banner = Math.max(0, fx.banner - dt);
  for (const tile of game.kitchen.list) {
    const item = tile.item;
    if (!item || (tile.type !== 'pan' && tile.type !== 'pot')) continue;
    if (item.burnt) { if (fx.rng.next() < dt * 10) puff(fx, tile.x, tile.y - 10, '#3a3230', 10, 1.3); continue; }
    if (nextStep(item) === tile.type && fx.rng.next() < dt * 9) puff(fx, tile.x, tile.y - 12, 'rgba(255,255,255,0.6)', 7, 1.0);
    if (isReady(item) && lastStep(item) === tile.type) {
      const hot = burnShare(item) >= WARN_AT;
      if (fx.rng.next() < dt * (hot ? 14 : 6)) puff(fx, tile.x, tile.y - 12, hot ? 'rgba(120,110,100,0.8)' : 'rgba(255,255,255,0.75)', 9, 1.2);
    }
  }
  for (const p of fx.parts) {
    p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.gravity * dt; p.life -= dt; p.size += p.grow * dt;
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
