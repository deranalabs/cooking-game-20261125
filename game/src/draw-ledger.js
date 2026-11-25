// SPDX-License-Identifier: MIT
// Stars ledger screen after a shift: stars, served, tips, burnt, best combo, the career so far and the critic's word.
import { KITCHENS, rankFor } from './kitchens/roster.js';
import { REGULARS } from './regulars.js';
import { criticComment, totalStars } from './ledger.js';
import { drawGuestFace } from './draw-guest.js';
import { INK, card, label, title, star, coin, button, backdrop } from './draw-ui.js';

export function ledgerButtons(game) {
  const last = game.kitchenIndex === KITCHENS.length - 1;
  const passed = game.stars >= 1;
  const go = passed ? (last ? 'ENTER  Shop & encore' : 'ENTER  Shop & next kitchen') : 'ENTER  Shop & retry';
  return [
    { id: passed && !last ? 'next' : 'again', label: go, x: 300, y: 668, w: 330, h: 56 },
    { id: 'retry', label: 'R  Retry this kitchen', x: 650, y: 668, w: 330, h: 56 },
  ];
}

function wrap(ctx, str, maxW) {
  const words = str.split(' '); const lines = []; let line = '';
  for (const w of words) {
    const next = line ? line + ' ' + w : w;
    if (ctx.measureText(next).width > maxW && line) { lines.push(line); line = w; } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

export function drawLedger(ctx, game, ledger, t, W, H) {
  backdrop(ctx, W, H);
  const passed = game.stars >= 1;
  card(ctx, 250, 52, 780, 690, 22, '#fff6df', 5);
  card(ctx, 250, 52, 780, 84, [22, 22, 0, 0], passed ? '#2f8f88' : '#c8261a', 5);
  title(ctx, 'STARS LEDGER', 640, 84, 40, '#ffd34d');
  label(ctx, `${game.shift.name} · ${game.def.place}`, 640, 120, 18, '#fff2d0', 'center');
  for (let i = 0; i < 3; i++) {
    const pop = i < game.stars ? 1 + Math.sin(t * 4 + i) * 0.05 : 1;
    star(ctx, 360 + i * 105, 196 - (i === 1 ? 12 : 0), 40 * pop, i < game.stars);
  }
  const rows = [
    ['Dishes served', String(game.served)],
    ['Tips earned', '$' + game.tips],
    ['Burnt', String(game.burnt)],
    ['Best combo', 'x' + game.bestCombo],
    ['Walked out', String(game.missed)],
    ['Critic plates', String(game.critics.length)],
    ['Rival Sable Rook', `${((ledger.rival || {}).log || []).map((v) => (v.won ? 'W' : 'L')).join(' ')}   ${(ledger.rival || {}).won || 0}-${(ledger.rival || {}).lost || 0}`],
  ];
  rows.forEach(([k, v], i) => {
    const y = 262 + i * 32;
    label(ctx, k, 290, y, 21, '#5a3524');
    label(ctx, v, 610, y, 23, INK, 'right');
    ctx.fillStyle = '#e8d6b0'; ctx.fillRect(290, y + 16, 320, 2);
  });
  label(ctx, 'SCORE', 290, 500, 24, '#5a3524');
  title(ctx, String(game.score), 610, 500, 42, '#ffcf2e', 'right', 7);
  label(ctx, `stars at ${game.shift.stars.join(' / ')}`, 450, 532, 14, '#8a6a4a', 'center', 'normal');
  // career column: every kitchen with its best stars, and the wallet the shop spends
  card(ctx, 650, 160, 350, 386, 14, '#f3e3c0', 3);
  const rank = rankFor(totalStars(ledger));
  label(ctx, `★ ${totalStars(ledger)} / ${KITCHENS.length * 3}  ·  ${rank.title.toUpperCase()}`, 825, 180, 17, INK, 'center');
  if (rank.next) label(ctx, `${rank.need} more ★ to ${rank.next}`, 825, 198, 12, '#8a6a4a', 'center', 'normal');
  KITCHENS.forEach((k, i) => {
    const y = 226 + i * 35;
    const open = i <= ledger.unlocked;
    card(ctx, 664, y - 15, 322, 30, 8, i === game.kitchenIndex ? '#ffe7a0' : open ? '#fff6df' : '#d8c8a8', 2);
    label(ctx, open ? k.name : 'locked kitchen', 676, y, 15, open ? INK : '#8a7a62');
    for (let s = 0; s < 3; s++) star(ctx, 910 + s * 24, y, 10, s < (ledger.stars[i] || 0));
    const best = Math.max((ledger.best || [])[i] || 0, i === game.kitchenIndex ? game.score : 0);
    if (open && best) label(ctx, String(best), 888, y, 12, '#8a6a4a', 'right');
    if (k.rival) { card(ctx, 846, y - 9, 18, 18, 9, '#5a1a3a', 1.5); label(ctx, 'R', 855, y + 0.5, 11, '#ffd34d', 'center'); }
  });
  coin(ctx, 690, 486, 20);
  label(ctx, `Wallet $${ledger.wallet}`, 720, 480, 24, INK);
  label(ctx, `+$${game.tips} tips this shift`, 720, 508, 15, '#3a8a3a', 'left', 'normal');
  // the critic's word on the shift
  const critic = REGULARS.find((r) => r.critic && game.critics.some((c) => c.name === r.name)) || REGULARS.find((r) => r.critic);
  card(ctx, 290, 560, 710, 92, 14, '#2a1a12', 3);
  drawGuestFace(ctx, critic, game.stars >= 2 ? 'delighted' : game.stars === 1 ? 'patient' : 'furious', 336, 608, 26, t);
  ctx.font = "italic bold 17px 'Trebuchet MS', Verdana, sans-serif";
  wrap(ctx, criticComment(game), 610).slice(0, 3).forEach((line, i) => label(ctx, line, 376, 584 + i * 22, 17, '#ffe7b0', 'left', 'italic bold'));
  for (const b of ledgerButtons(game)) button(ctx, b, b.id === 'retry' ? '#e8d6b0' : '#ff9a2a');
}
