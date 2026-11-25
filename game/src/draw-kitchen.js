// SPDX-License-Identifier: MIT
// Kitchen renderer: tiled floor, counters, crates, boards, stoves, hatch, the chef and progress bars.
import { TILE, KITCHEN_Y, COLS, ROWS } from './kitchen-layout.js';
import { drawIngredient, drawPlate } from './draw-food.js';
import { nextStep, isReady, lastStep } from './items.js';
import { burnShare, WARN_AT } from './stations.js';
import { facingTile } from './chef.js';

const INK = '#2b1a12';
const H = TILE;

function rr(ctx, x, y, w, h, r, fill, line = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
}

function drawFloor(ctx) {
  ctx.fillStyle = '#5b3a2a';
  ctx.fillRect(0, KITCHEN_Y, COLS * H, ROWS * H);
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const half = H / 2;
      for (let k = 0; k < 4; k++) {
        const x = c * H + (k % 2) * half; const y = KITCHEN_Y + r * H + Math.floor(k / 2) * half;
        ctx.fillStyle = (k === 0 || k === 3) ? '#f0d3a6' : '#c9774f';
        ctx.fillRect(x, y, half, half);
      }
    }
  }
}

function counterBase(ctx, x, y, top = '#f6e9cc') {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, '#b9784a');
  rr(ctx, x + 2, y + 2, H - 4, H - 14, 8, top);
}

function drawCrate(ctx, tile, x, y, glow) {
  rr(ctx, x + 3, y + 3, H - 6, H - 6, 6, '#a8693a');
  ctx.strokeStyle = '#6e3f1f'; ctx.lineWidth = 2;
  for (const k of [20, 40]) { ctx.beginPath(); ctx.moveTo(x + 6, y + k); ctx.lineTo(x + H - 6, y + k); ctx.stroke(); }
  rr(ctx, x + 10, y + 8, H - 20, H - 18, 10, '#f3e2bd', 2.5);
  drawIngredient(ctx, tile.ingredient, 0, x + H / 2, y + H / 2 - 2, 17);
  if (glow) {
    ctx.lineWidth = 5; ctx.strokeStyle = `rgba(255,214,64,${glow})`;
    ctx.beginPath(); ctx.roundRect(x + 1, y + 1, H - 2, H - 2, 9); ctx.stroke();
  }
}

function drawStove(ctx, tile, x, y, t) {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, '#3c4150');
  const hot = tile.item && (nextStep(tile.item) === tile.type || (isReady(tile.item) && lastStep(tile.item) === tile.type));
  ctx.beginPath(); ctx.arc(x + H / 2, y + H / 2, 25, 0, Math.PI * 2);
  ctx.strokeStyle = hot ? `rgba(255,${90 + Math.sin(t * 9) * 40},40,1)` : '#6b7080'; ctx.lineWidth = 4; ctx.stroke();
  if (tile.type === 'pan') {
    ctx.save(); ctx.translate(x + H / 2, y + H / 2);
    ctx.fillStyle = '#23252c'; ctx.beginPath(); ctx.roundRect(18, -5, 22, 10, 4); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 23, 0, Math.PI * 2); ctx.fillStyle = '#1d1f25'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fillStyle = '#353943'; ctx.fill();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(x + H / 2, y + H / 2);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-29, -5, 6, 10); ctx.fillRect(23, -5, 6, 10);
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fillStyle = '#b9c2cc'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fillStyle = hot ? '#e8dcc0' : '#8fb9cf'; ctx.fill();
    ctx.restore();
  }
}

function drawStation(ctx, tile, t, glow) {
  const x = tile.col * H; const y = tile.y - H / 2;
  switch (tile.type) {
    case 'floor': return;
    case 'crate': drawCrate(ctx, tile, x, y, glow); return;
    case 'pan': case 'pot': drawStove(ctx, tile, x, y, t); return;
    case 'chop':
      counterBase(ctx, x, y);
      rr(ctx, x + 8, y + 7, H - 16, H - 26, 6, '#e2b170', 2.5);
      ctx.fillStyle = '#c9934f'; ctx.fillRect(x + 12, y + 12, H - 24, 3);
      return;
    case 'plating':
      counterBase(ctx, x, y);
      rr(ctx, x + 7, y + 6, H - 14, H - 24, 5, '#2f8f88', 2);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 10, y + 12); ctx.lineTo(x + H - 10, y + 12); ctx.stroke();
      return;
    case 'hatch': {
      rr(ctx, x + 1, y + 2, H - 2, H - 4, 6, '#d9a13b');
      rr(ctx, x + 6, y + 6, H - 12, H - 20, 4, '#fff2c4', 2);
      const lamp = ctx.createRadialGradient(x + H / 2, y + H / 2, 4, x + H / 2, y + H / 2, 36);
      lamp.addColorStop(0, 'rgba(255,170,60,0.55)'); lamp.addColorStop(1, 'rgba(255,170,60,0)');
      ctx.fillStyle = lamp; ctx.fillRect(x, y, H, H);
      return;
    }
    case 'trash':
      counterBase(ctx, x, y);
      ctx.beginPath(); ctx.arc(x + H / 2, y + H / 2 - 5, 21, 0, Math.PI * 2); ctx.fillStyle = '#5d6b70'; ctx.fill();
      ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.arc(x + H / 2, y + H / 2 - 5, 13, 0, Math.PI * 2); ctx.fillStyle = '#2a3134'; ctx.fill();
      return;
    case 'rack':
      counterBase(ctx, x, y, '#e7eef0');
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.ellipse(x + H / 2, y + 36 - i * 6, 23, 9, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#fbfaf5'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
      }
      return;
    default: counterBase(ctx, x, y);
  }
}

export function drawBar(ctx, x, y, w, share, color, back = '#2b1a12') {
  rr(ctx, x - w / 2, y, w, 13, 6, back, 2.5);
  if (share > 0) rr(ctx, x - w / 2 + 2, y + 2, Math.max(4, (w - 4) * Math.min(1, share)), 9, 4, color, 0);
}

function drawItemOn(ctx, tile, t) {
  const item = tile.item;
  if (!item) return;
  const cx = tile.x; const cy = tile.y - 6;
  if (item.kind === 'plate') {
    const hatch = tile.type === 'hatch';
    drawPlate(ctx, item.layers, cx, cy + (hatch ? 4 : 0), hatch ? 26 : 25, { glow: hatch });
    if (item.pop > 0) {
      ctx.beginPath(); ctx.arc(cx, cy, 26 + item.pop * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${item.pop})`; ctx.lineWidth = 4; ctx.stroke();
    }
    return;
  }
  drawIngredient(ctx, item.id, item.stage, cx, cy, tile.type === 'pan' || tile.type === 'pot' ? 16 : 18, item.burnt, item.squash);
}

// Progress bars, done ticks, burn warnings and the hatch's READY tag, drawn above steam and smoke.
export function drawTileBars(ctx, game, t) {
  for (const tile of game.kitchen.list) if (tile.item) drawBarsFor(ctx, tile, t);
}

function drawBarsFor(ctx, tile, t) {
  const item = tile.item;
  const cx = tile.x;
  if (item.kind === 'plate') {
    if (tile.type !== 'hatch') return;
    rr(ctx, cx - 50, tile.y + 30, 100, 30, 15, '#3fbf4f', 3);
    ctx.fillStyle = '#ffffff'; ctx.font = "bold 20px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('READY!', cx, tile.y + 46);
    return;
  }
  const step = nextStep(item);
  const by = tile.y + 16;
  if (step === tile.type || (step === 'chop' && tile.type === 'chop' && item.progress > 0)) {
    drawBar(ctx, cx, by, 56, item.progress, step === 'chop' ? '#7ad04a' : '#ffad33');
  } else if (isReady(item) && (tile.type === 'pan' || tile.type === 'pot') && lastStep(item) === tile.type) {
    const b = burnShare(item);
    const danger = b >= WARN_AT;
    const blink = danger && Math.sin(t * 14) > 0;
    drawBar(ctx, cx, by, 56, 1 - b, danger ? '#ff3b2f' : '#5ad15a', blink ? '#7a1010' : INK);
    if (danger) {
      rr(ctx, cx + 10, tile.y - 34, 26, 28, 7, blink ? '#ff3b2f' : '#ffd23a', 3);
      ctx.fillStyle = INK; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('!', cx + 23, tile.y - 19);
    } else {
      drawCheck(ctx, cx + 20, tile.y - 20);
    }
  } else if (isReady(item) && tile.type === 'chop') {
    drawCheck(ctx, cx + 20, tile.y - 20);
  }
}

function drawCheck(ctx, x, y) {
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fillStyle = '#3fbf4f'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 5, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 5, y - 4);
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke();
}

function drawHeld(ctx, item, x, y) {
  if (item.kind === 'plate') drawPlate(ctx, item.layers, x, y, 19);
  else drawIngredient(ctx, item.id, item.stage, x, y, 17, item.burnt);
}

export function drawChef(ctx, chef, t) {
  const bob = chef.walk ? Math.sin(chef.walk) * 2.5 : 0;
  const { x } = chef; const y = chef.y + bob;
  const fx = chef.face.x; const fy = chef.face.y;
  const handX = x + fx * 26; const handY = y + fy * 20 - 4;
  ctx.beginPath(); ctx.ellipse(chef.x, chef.y + 20, 24, 9, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(40,20,10,0.35)'; ctx.fill();
  if (chef.hold && fy < 0) drawHeld(ctx, chef.hold, handX, handY - 8);
  // body: white coat, red neckerchief
  ctx.beginPath(); ctx.ellipse(x, y + 4, 22, 20, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#fbfbf7'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 12, y - 8); ctx.lineTo(x + 12, y - 8); ctx.lineTo(x, y + 6); ctx.closePath();
  ctx.fillStyle = '#d8402c'; ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  for (const k of [-1, 1]) {
    const chopLift = chef.chopping ? Math.abs(Math.sin(t * 22)) * 8 : 0;
    const ax = x + (fx === 0 ? k * 16 : fx * 18) + (fy === 0 ? 0 : 0);
    const ay = y + (fx === 0 ? fy * 14 : k * 10) - (k === 1 ? chopLift : 0);
    ctx.beginPath(); ctx.arc(ax, ay, 7, 0, Math.PI * 2); ctx.fillStyle = '#f2c49c'; ctx.fill(); ctx.lineWidth = 2.5; ctx.stroke();
  }
  // head and tall hat
  const hx = x + fx * 4; const hy = y - 18 + fy * 3;
  ctx.beginPath(); ctx.arc(hx, hy, 14, 0, Math.PI * 2); ctx.fillStyle = '#f2c49c'; ctx.fill(); ctx.lineWidth = 3; ctx.stroke();
  if (fy >= 0) {
    for (const k of [-5, 5]) { ctx.beginPath(); ctx.arc(hx + k + fx * 4, hy + 2, 2.2, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill(); }
  }
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.roundRect(hx - 11, hy - 26, 22, 16, 3); ctx.fill(); ctx.stroke();
  for (const [a, b, r] of [[-8, -28, 9], [8, -28, 9], [0, -33, 10]]) {
    ctx.beginPath(); ctx.arc(hx + a, hy + b, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.roundRect(hx - 11, hy - 26, 22, 12, 3); ctx.fill();
  if (chef.hold && fy >= 0) drawHeld(ctx, chef.hold, handX, handY + 6);
}

export function drawKitchen(ctx, game, t, needed) {
  drawFloor(ctx);
  const target = game.phase === 'play' ? facingTile(game) : null;
  for (const tile of game.kitchen.list) {
    const glow = tile.type === 'crate' && needed.has(tile.ingredient) ? 0.55 + Math.sin(t * 5) * 0.4 : 0;
    drawStation(ctx, tile, t, glow);
  }
  for (const tile of game.kitchen.list) drawItemOn(ctx, tile, t);
  if (target) {
    ctx.save(); ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30;
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(target.col * H + 2, target.y - H / 2 + 2, H - 4, H - 4, 9); ctx.stroke();
    ctx.restore();
  }
  drawChef(ctx, game.chef, t);
}
