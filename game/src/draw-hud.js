// SPDX-License-Identifier: MIT
// HUD renderer: order board tickets with guests and moods, clock dial, score, tips, combo, hazard and rush banner.
import { drawIngredient, drawPlate, readyStage } from './draw-food.js';
import { stepsOf, dishPrice, INGREDIENTS } from './recipes.js';
import { KITCHEN_Y } from './kitchen-layout.js';
import { KITCHENS } from './kitchens/roster.js';
import { moodOf, guestLine, MOOD_COLOR } from './regulars.js';
import { hazardStatus } from './hazards.js';
import { drawGuestFace } from './draw-guest.js';

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

// A ticket: who ordered (face, name, live mood), what they said, the dish, its parts and their patience.
function drawTicket(ctx, ticket, i, game, t) {
  const r = ticketRect(i);
  const share = Math.max(0, ticket.patience / ticket.max);
  const mood = moodOf(game, ticket);
  const g = ticket.guest;
  const urgent = mood === 'furious';
  const shake = urgent ? Math.sin(t * 40) * 2 : 0;
  const x = r.x + shake; const y = r.y - ticket.slide * 160;
  const focused = game.focus === ticket.uid;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x + 5, y + 6, r.w, r.h);
  rr(ctx, x, y, r.w, r.h, 8, g.critic ? '#fff1c8' : '#fff6df', 3);
  rr(ctx, x, y, r.w, 32, [8, 8, 0, 0], g.color, 3);
  if (g.critic) { ctx.fillStyle = '#ffd34d'; ctx.fillRect(x + 2, y + 28, r.w - 4, 3); }
  drawGuestFace(ctx, g, mood, x + 22, y + 22, 17, t);
  text(ctx, g.name, x + 44, y + 16, g.name.length > 13 ? 14 : 16, '#fff8e8');
  rr(ctx, x + r.w - 70, y + 6, 64, 20, 10, MOOD_COLOR[mood], 2);
  text(ctx, mood.toUpperCase(), x + r.w - 38, y + 16.5, 11, INK, 'center');
  // dish name, price (critics pay more) and picture
  text(ctx, ticket.dish.name, x + 10, y + 45, 15, INK);
  rr(ctx, x + r.w - 56, y + 36, 50, 19, 9, g.critic ? '#ff9a2a' : '#ffd34d', 2);
  text(ctx, (g.critic ? '★$' : '$') + Math.round(dishPrice(ticket.dish) * (g.critic ? 1.6 : 1)), x + r.w - 31, y + 46, 13, INK, 'center');
  drawPlate(ctx, ticket.dish.layers, x + 40, y + 84, 25, { complete: true });
  ticket.dish.layers.forEach((id, k) => {
    const cx = x + 104 + (k % 2) * 58; const cy = y + 72 + Math.floor(k / 2) * 28;
    rr(ctx, cx - 22, cy - 12, 52, 25, 6, '#f3e3c0', 2);
    drawIngredient(ctx, id, readyStage(id), cx - 6, cy, 10);
    stepsOf(id).forEach((s, j) => stepBadge(ctx, s, cx + 20 - j * 13, cy + 1));
  });
  // what they say, in their mood
  ctx.save(); ctx.beginPath(); ctx.rect(x + 4, y + 112, r.w - 8, 20); ctx.clip();
  text(ctx, `“${guestLine(game, ticket)}”`, x + 10, y + 123, 13, mood === 'furious' ? '#b0201a' : '#5a3524', 'left', 'italic bold');
  ctx.restore();
  // patience bar
  rr(ctx, x + 10, y + r.h - 18, r.w - 20, 12, 6, '#3a2a20', 2.5);
  rr(ctx, x + 12, y + r.h - 16, Math.max(6, (r.w - 24) * share), 8, 4, MOOD_COLOR[mood === 'delighted' ? 'patient' : mood], 0);
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
  text(ctx, game.rush ? 'SERVICE RUSH!' : `${game.kitchenIndex + 1}/6  ${game.shift.name}`, x0 + 12, 26,
    game.rush ? 20 : 15, game.rush ? '#ff8a5a' : '#f6e2b8');
  const hz = hazardStatus(game);
  rr(ctx, x0 + 122, 38, 176, 20, 10, hz.active ? '#c8261a' : '#4a2a1a', 2, '#c9963f');
  text(ctx, `⚠ ${hz.label} ${hz.text}`, x0 + 210, 48.5, 12, hz.active ? '#ffd34d' : '#f6e2b8', 'center');
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
  text(ctx, 'SCORE', sx, 70, 13, '#d9c08e');
  text(ctx, String(game.score), sx + 58, 96, 36, '#ffd34d');
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
