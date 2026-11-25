// SPDX-License-Identifier: MIT
// Title screen: the game's name, the six kitchens of the career with their stars, and the wallet.
import { KITCHENS } from './kitchens/roster.js';
import { totalStars } from './ledger.js';
import { INK, card, label, title, star, coin, button, backdrop } from './draw-ui.js';

// Four cards on the top row, three centred under them.
export function kitchenCardRect(i) {
  const row = Math.floor(i / 4); const col = i % 4;
  return { x: 40 + col * 305 + (row ? 152 : 0), y: 330 + row * 150, w: 290, h: 134 };
}

export function startButton() {
  return { x: 470, y: 650, w: 340, h: 64, label: 'ENTER  Open the kitchen', size: 24 };
}

export function drawTitle(ctx, ledger, chosen, t, W, H) {
  backdrop(ctx, W, H);
  ctx.save(); ctx.translate(W / 2, 100); ctx.rotate(-0.03);
  title(ctx, 'COPPER LANTERN', 0, 0, 72, '#ffd34d', 'center', 12);
  title(ctx, 'KITCHEN', 0, 74, 84, '#ff8a3a', 'center', 12);
  ctx.restore();
  label(ctx, 'Seven kitchens, eleven regulars and critics, one rival. Chop, fry, bake and grill before they walk out.', W / 2, 252, 20, '#fff2d0', 'center');
  card(ctx, W / 2 - 170, 276, 340, 38, 19, '#2a1a12', 3, '#c9963f');
  coin(ctx, W / 2 - 145, 295, 13);
  label(ctx, `Wallet $${ledger.wallet}   ★ ${totalStars(ledger)} / ${KITCHENS.length * 3}`, W / 2 + 12, 296, 19, '#ffd34d', 'center');
  KITCHENS.forEach((k, i) => {
    const r = kitchenCardRect(i);
    const sel = i === chosen; const open = i <= ledger.unlocked;
    card(ctx, r.x, r.y, r.w, r.h, 14, open ? (sel ? '#fff6df' : '#e8d6b0') : '#6a5848', sel ? 6 : 3, sel ? '#ffd23a' : INK);
    card(ctx, r.x + 12, r.y + 12, 26, 26, 6, k.palette.side, 2);
    label(ctx, String(i + 1), r.x + 25, r.y + 26, 15, '#fff8e8', 'center');
    label(ctx, k.name, r.x + 48, r.y + 26, k.name.length > 18 ? 17 : 20, open ? INK : '#d8c8a8');
    label(ctx, open ? `⚠ ${k.hazard.label}` : 'LOCKED: earn a star in the kitchen before', r.x + 16, r.y + 58, open ? 16 : 13, open ? '#b0301a' : '#fff2d0', 'left');
    if (open) label(ctx, k.place, r.x + 16, r.y + 82, 14, '#5a3524', 'left', 'normal');
    for (let s = 0; s < 3; s++) star(ctx, r.x + r.w - 82 + s * 30, r.y + 108, 12, s < (ledger.stars[i] || 0));
  });
  const b = startButton();
  const pulse = 1 + Math.sin(t * 4) * 0.03;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  button(ctx, { ...b, x: -b.w / 2, y: -b.h / 2 });
  ctx.restore();
  label(ctx, '← → pick a kitchen   WASD move · E pick up/drop · hold SPACE chop · click tickets to focus',
    W / 2, 744, 17, '#e9d3a8', 'center', 'normal');
}
