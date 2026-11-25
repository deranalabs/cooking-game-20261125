// SPDX-License-Identifier: MIT
// HUD renderer: order board tickets, clock dial, score, tips and combo, rush banner, title and result screens.
import { drawIngredient, drawPlate, readyStage } from './draw-food.js';
import { stepsOf, dishPrice, SHIFTS, INGREDIENTS } from './recipes.js';
import { KITCHEN_Y } from './kitchen-layout.js';

const INK = '#2b1a12';
const FONT = "'Trebuchet MS', Verdana, sans-serif";
export const W = 1280;
export const HGT = 800;
export const TICKET = { x: 14, y: 12, w: 226, h: 152, gap: 10 };

function rr(ctx, x, y, w, h, r, fill, line = 3, stroke = INK) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line) { ctx.lineWidth = line; ctx.strokeStyle = stroke; ctx.stroke(); }
}
function text(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}
function outlined(ctx, str, x, y, size, color, align = 'center', line = 6) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.strokeText(str, x, y);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

function stepBadge(ctx, step, x, y) {
  const fill = { chop: '#9fb0bd', pan: '#ff8a2a', pot: '#4aa3d8' }[step];
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = INK; ctx.font = `bold 9px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText({ chop: 'K', pan: 'F', pot: 'P' }[step], x, y + 0.5);
}

export function ticketRect(i) {
  return { x: TICKET.x + i * (TICKET.w + TICKET.gap), y: TICKET.y, w: TICKET.w, h: TICKET.h };
}

function drawTicket(ctx, ticket, i, game, t) {
  const r = ticketRect(i);
  const share = Math.max(0, ticket.patience / ticket.max);
  const urgent = share < 0.3;
  const shake = urgent ? Math.sin(t * 40) * 2 : 0;
  const x = r.x + shake; const y = r.y - ticket.slide * 160;
  const focused = game.focus === ticket.uid;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 5, y + 6, r.w, r.h);
  rr(ctx, x, y, r.w, r.h, 8, '#fff6df', 3);
  const head = urgent ? '#d23a2a' : (focused ? '#2f8f88' : '#b4532f');
  rr(ctx, x, y, r.w, 34, [8, 8, 0, 0], head, 3);
  text(ctx, ticket.dish.name, x + 10, y + 18, 21, '#fff8e8');
  // dish picture and price
  drawPlate(ctx, ticket.dish.layers, x + 52, y + 80, 31, { complete: true });
  rr(ctx, x + 22, y + 108, 58, 22, 11, '#ffd34d', 2.5);
  text(ctx, '$' + dishPrice(ticket.dish), x + 51, y + 120, 16, INK, 'center');
  // ingredient row with prep badges
  ticket.dish.layers.forEach((id, k) => {
    const cx = x + 118 + (k % 2) * 52; const cy = y + 56 + Math.floor(k / 2) * 40;
    rr(ctx, cx - 20, cy - 17, 40, 34, 7, '#f3e3c0', 2);
    drawIngredient(ctx, id, readyStage(id), cx, cy, 12);
    stepsOf(id).forEach((s, j) => stepBadge(ctx, s, cx + 16 - j * 13, cy + 14));
  });
  // patience bar
  const barColor = share > 0.55 ? '#4cc24a' : share > 0.3 ? '#ffb02e' : '#ff3b2f';
  rr(ctx, x + 10, y + r.h - 20, r.w - 20, 14, 7, '#3a2a20', 2.5);
  rr(ctx, x + 12, y + r.h - 18, Math.max(6, (r.w - 24) * share), 10, 5, barColor, 0);
  if (focused) {
    rr(ctx, x - 4, y - 4, r.w + 8, r.h + 8, 11, null, 5, '#ffd23a');
  }
}

export function drawBoard(ctx, game, fx, t) {
  const grad = ctx.createLinearGradient(0, 0, 0, KITCHEN_Y);
  grad.addColorStop(0, game.rush ? '#7a2418' : '#5a3524'); grad.addColorStop(1, game.rush ? '#4a140d' : '#3b2216');
  ctx.fillStyle = grad; ctx.fillRect(0, 0, W, KITCHEN_Y);
  ctx.fillStyle = '#c9963f'; ctx.fillRect(0, KITCHEN_Y - 8, W, 8);
  if (fx.boardFlash > 0) {
    ctx.fillStyle = `rgba(255,40,30,${fx.boardFlash * 0.55})`; ctx.fillRect(0, 0, 950, KITCHEN_Y);
  }
  for (let i = 0; i < game.shift.maxTickets; i++) {
    const r = ticketRect(i);
    if (!game.tickets[i]) {
      rr(ctx, r.x, r.y, r.w, r.h, 8, 'rgba(255,255,255,0.06)', 2, 'rgba(255,240,200,0.3)');
      text(ctx, 'next order…', r.x + r.w / 2, r.y + r.h / 2, 18, 'rgba(255,240,200,0.45)', 'center');
    }
  }
  game.tickets.forEach((tk, i) => drawTicket(ctx, tk, i, game, t));
  drawPanel(ctx, game, fx, t);
}

function drawPanel(ctx, game, fx, t) {
  const x0 = 960; const w = W - x0 - 10;
  rr(ctx, x0, 10, w, 156, 12, '#2a1a12', 3, game.rush && Math.sin(t * 8) > 0 ? '#ff4a2a' : '#c9963f');
  text(ctx, game.rush ? 'SERVICE RUSH!' : `SHIFT ${game.shiftIndex + 1}  ${game.shift.name}`, x0 + 14, 30,
    game.rush ? 20 : 17, game.rush ? '#ff8a5a' : '#f6e2b8');
  // clock dial
  const cx = x0 + 60; const cy = 100; const share = game.timeLeft / game.shift.length;
  ctx.beginPath(); ctx.arc(cx, cy, 46, 0, Math.PI * 2); ctx.fillStyle = '#fff6df'; ctx.fill();
  ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * share);
  ctx.closePath(); ctx.fillStyle = game.rush ? '#ff5a3a' : '#5cc05a'; ctx.fill();
  ctx.beginPath(); ctx.arc(cx, cy, 27, 0, Math.PI * 2); ctx.fillStyle = '#fff6df'; ctx.fill();
  const secs = Math.ceil(game.timeLeft);
  const label = `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`;
  const pulse = game.rush ? 1 + Math.max(0, Math.sin(t * 6.3)) * 0.12 : 1;
  ctx.save(); ctx.translate(cx, cy); ctx.scale(pulse, pulse);
  text(ctx, label, 0, 1, 22, game.rush ? '#c4201a' : INK, 'center');
  ctx.restore();
  // score, tips, combo
  const sx = x0 + 122;
  text(ctx, 'SCORE', sx, 62, 15, '#d9c08e');
  text(ctx, String(game.score), sx, 92, 38, '#ffd34d');
  text(ctx, `TIPS $${game.tips}`, sx, 124, 17, '#9fe08a');
  const mult = 1 + Math.min(Math.max(game.combo - 1, 0), 4) * 0.25;
  rr(ctx, sx, 138, 162, 22, 11, '#4a2a1a', 2, '#c9963f');
  rr(ctx, sx + 2, 140, Math.max(10, 158 * Math.min(game.combo, 5) / 5), 18, 9, game.combo >= 3 ? '#ff7a2a' : '#e0b040', 0);
  text(ctx, `COMBO x${game.combo} · pay x${mult.toFixed(2)}`, sx + 81, 150, 13, '#fff8e8', 'center');
}

export function drawRushBanner(ctx, fx, game, t) {
  if (!game.rush || fx.banner <= 0) return;
  const a = Math.min(1, fx.banner * 2);
  ctx.save();
  ctx.globalAlpha = a;
  ctx.translate(W / 2, KITCHEN_Y + 494); ctx.rotate(-0.03);
  const s = 1 + Math.sin(t * 9) * 0.03;
  ctx.scale(s, s);
  rr(ctx, -470, -58, 940, 116, 18, '#c8261a', 6);
  rr(ctx, -452, -44, 904, 88, 12, null, 3, '#ffd34d');
  outlined(ctx, 'LANTERN RUSH!', 0, -6, 64, '#ffd34d', 'center', 9);
  text(ctx, 'tickets come faster and walk out sooner: keep the combo!', 0, 34, 20, '#fff2d0', 'center');
  ctx.restore();
}

export function drawHintBar(ctx, game) {
  const y = KITCHEN_Y + 8 * 72;
  ctx.fillStyle = '#24160f'; ctx.fillRect(0, y, W, HGT - y);
  text(ctx, 'WASD / arrows move   E pick up · drop   hold SPACE chop   click ticket = focus   click hatch = ring bell',
    16, y + 24, 16, '#e9d3a8', 'left', 'normal');
  const h = game.chef.hold;
  let label = 'Hands empty';
  if (h && h.kind === 'plate') label = h.layers.length ? `Plate: ${h.layers.map((id) => INGREDIENTS[id].name).join(' + ')}` : 'Clean plate';
  else if (h) label = `${h.burnt ? 'Burnt' : ['Raw', 'Chopped', 'Cooked'][Math.min(h.stage, 2)]} ${INGREDIENTS[h.id].name}`;
  text(ctx, label, W - 16, y + 24, 18, '#ffd34d', 'right');
}

function star(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffcf2e' : '#5a4636'; ctx.fill();
  ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
}

export function resultButtons(game) {
  const last = game.shiftIndex === SHIFTS.length - 1;
  const passed = game.stars >= 1;
  return [
    { id: passed ? (last ? 'again' : 'next') : 'retry', label: passed ? (last ? 'ENTER  Play again' : 'ENTER  Next shift') : 'ENTER  Retry', x: 380, y: 612, w: 250, h: 58 },
    { id: 'retry', label: 'R  Retry shift', x: 650, y: 612, w: 250, h: 58 },
  ];
}

export function drawResult(ctx, game, t) {
  ctx.fillStyle = 'rgba(30,14,8,0.72)'; ctx.fillRect(0, 0, W, HGT);
  const passed = game.stars >= 1;
  rr(ctx, 340, 110, 600, 590, 22, '#fff6df', 5);
  rr(ctx, 340, 110, 600, 86, [22, 22, 0, 0], passed ? '#2f8f88' : '#c8261a', 5);
  outlined(ctx, passed ? 'SHIFT COMPLETE!' : 'SHIFT FAILED', 640, 154, 46, '#ffd34d', 'center', 8);
  text(ctx, `Shift ${game.shiftIndex + 1}: ${game.shift.name}`, 640, 220, 24, INK, 'center');
  for (let i = 0; i < 3; i++) {
    const pop = i < game.stars ? 1 + Math.sin(t * 4 + i) * 0.05 : 1;
    star(ctx, 520 + i * 120, 296 - (i === 1 ? 14 : 0), 46 * pop, i < game.stars);
  }
  const rows = [
    ['Dishes served', String(game.served)],
    ['Tips earned', '$' + game.tips],
    ['Best combo', 'x' + game.bestCombo],
    ['Tickets walked out', String(game.missed)],
  ];
  rows.forEach(([k, v], i) => {
    const y = 380 + i * 40;
    text(ctx, k, 400, y, 24, '#5a3524');
    text(ctx, v, 880, y, 26, INK, 'right');
    ctx.fillStyle = '#e8d6b0'; ctx.fillRect(400, y + 19, 480, 2);
  });
  text(ctx, 'SCORE', 400, 556, 26, '#5a3524');
  outlined(ctx, String(game.score), 880, 556, 46, '#ffcf2e', 'right', 7);
  text(ctx, `stars at ${game.shift.stars.join(' / ')}`, 640, 590, 16, '#8a6a4a', 'center', 'normal');
  for (const b of resultButtons(game)) {
    rr(ctx, b.x, b.y, b.w, b.h, 14, b.id === 'retry' && b.x > 600 ? '#e8d6b0' : '#ff9a2a', 4);
    text(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2, 22, INK, 'center');
  }
}

export function startButton() {
  return { x: 470, y: 560, w: 340, h: 70 };
}

export function drawTitle(ctx, progress, chosen, t) {
  ctx.fillStyle = 'rgba(30,14,8,0.7)'; ctx.fillRect(0, 0, W, HGT);
  ctx.save(); ctx.translate(W / 2, 150); ctx.rotate(-0.03);
  outlined(ctx, 'COPPER LANTERN', 0, 0, 84, '#ffd34d', 'center', 12);
  outlined(ctx, 'KITCHEN', 0, 86, 96, '#ff8a3a', 'center', 12);
  ctx.restore();
  text(ctx, 'Chop, cook and plate before the tickets walk out.', W / 2, 300, 26, '#fff2d0', 'center');
  SHIFTS.forEach((s, i) => {
    const x = 250 + i * 270; const y = 350;
    const sel = i === chosen; const open = i <= progress.unlocked;
    rr(ctx, x, y, 240, 170, 14, open ? (sel ? '#fff6df' : '#e8d6b0') : '#6a5848', sel ? 6 : 3, sel ? '#ffd23a' : INK);
    text(ctx, `SHIFT ${i + 1}`, x + 120, y + 28, 18, '#8a5a3a', 'center');
    text(ctx, s.name, x + 120, y + 60, 24, INK, 'center');
    if (open) text(ctx, `${s.menu.length} dishes · ${s.maxTickets} tickets`, x + 120, y + 92, 16, '#5a3524', 'center', 'normal');
    for (let k = 0; k < 3; k++) star(ctx, x + 75 + k * 45, y + 132, 16, k < (progress.stars[i] || 0));
    if (!open) text(ctx, 'LOCKED', x + 120, y + 92, 28, '#fff2d0', 'center');
  });
  const b = startButton();
  const pulse = 1 + Math.sin(t * 4) * 0.03;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  rr(ctx, -b.w / 2, -b.h / 2, b.w, b.h, 18, '#ff9a2a', 5);
  text(ctx, 'ENTER  Open the kitchen', 0, 2, 26, INK, 'center');
  ctx.restore();
  text(ctx, '← → pick a shift    WASD move · E pick up/drop · hold SPACE chop · click tickets to focus',
    W / 2, 680, 18, '#e9d3a8', 'center', 'normal');
}
