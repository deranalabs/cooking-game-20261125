// SPDX-License-Identifier: MIT
// Menu planning screen: the kitchen's brief and hazard, every unlocked dish with price and difficulty, pick four.
import { KITCHENS } from './kitchens/roster.js';
import { dishById, dishPrice, stepsOf } from './recipes.js';
import { unlockedDishes, dishDifficulty, MENU_SIZE } from './menu-planner.js';
import { drawPlate } from './draw-food.js';
import { INK, card, label, title, button, backdrop } from './draw-ui.js';

export function planCardRect(i) {
  return { x: 70 + (i % 5) * 230, y: 246 + Math.floor(i / 5) * 148, w: 214, h: 138 };
}

export function planStartButton() {
  return { x: 440, y: 700, w: 400, h: 60, label: 'ENTER  Open the kitchen' };
}

function chili(ctx, x, y, on) {
  ctx.beginPath(); ctx.ellipse(x, y, 5, 9, 0.5, 0, Math.PI * 2);
  ctx.fillStyle = on ? '#e0392b' : '#d8c8a8'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.fillStyle = on ? '#4a9a3a' : '#b8a888'; ctx.fillRect(x + 2, y - 11, 4, 4);
}

export function drawMenuPlanner(ctx, kitchenIndex, plan, t, W, H) {
  backdrop(ctx, W, H);
  const k = KITCHENS[kitchenIndex];
  title(ctx, `KITCHEN ${kitchenIndex + 1}: ${k.name.toUpperCase()}`, W / 2, 56, 40, '#ffd34d', 'center', 9);
  label(ctx, k.story, W / 2, 96, 18, '#fff2d0', 'center', 'italic');
  card(ctx, 240, 116, 800, 46, 23, '#c8261a', 3);
  label(ctx, `⚠ ${k.hazard.label}: ${k.blurb}`, W / 2, 140, 19, '#fff2d0', 'center');
  label(ctx, `PLAN TODAY'S MENU  ${plan.length} / ${MENU_SIZE}`, W / 2, 196, 26, plan.length === MENU_SIZE ? '#9fe08a' : '#ffd34d', 'center');
  label(ctx, 'bigger dishes pay more, but take more stops; new dishes from this kitchen are marked NEW', W / 2, 224, 15, '#e9d3a8', 'center', 'normal');
  unlockedDishes(kitchenIndex).forEach((id, i) => {
    const d = dishById(id); const r = planCardRect(i);
    const on = plan.includes(id);
    card(ctx, r.x, r.y, r.w, r.h, 14, on ? '#fff6df' : '#cdbb98', on ? 5 : 3, on ? '#ffd23a' : INK);
    drawPlate(ctx, d.layers, r.x + 56, r.y + 70, 34, { complete: true });
    label(ctx, d.name, r.x + r.w / 2, r.y + 20, 17, INK, 'center');
    card(ctx, r.x + 110, r.y + 44, 90, 28, 14, '#ffd34d', 2.5);
    label(ctx, '$' + dishPrice(d), r.x + 155, r.y + 59, 18, INK, 'center');
    for (let s = 0; s < 3; s++) chili(ctx, r.x + 128 + s * 18, r.y + 96, s < dishDifficulty(d));
    const steps = d.layers.reduce((n, l) => n + stepsOf(l).length, 0);
    label(ctx, `${d.layers.length} parts · ${steps} prep`, r.x + 155, r.y + 120, 13, '#5a3524', 'center', 'normal');
    if (k.unlocks.includes(id)) { card(ctx, r.x - 6, r.y - 8, 50, 22, 11, '#2f8f88', 2); label(ctx, 'NEW', r.x + 19, r.y + 3, 13, '#fff8e8', 'center'); }
    if (on) {
      const cx = r.x + r.w - 4; const cy = r.y + 4;
      ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fillStyle = '#3fbf4f'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx - 7, cy); ctx.lineTo(cx - 1, cy + 6); ctx.lineTo(cx + 8, cy - 6);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3.5; ctx.stroke();
    }
  });
  const b = planStartButton();
  const pulse = plan.length >= 2 ? 1 + Math.sin(t * 4) * 0.03 : 1;
  ctx.save(); ctx.translate(b.x + b.w / 2, b.y + b.h / 2); ctx.scale(pulse, pulse);
  button(ctx, { ...b, x: -b.w / 2, y: -b.h / 2 }, plan.length >= 2 ? '#ff9a2a' : '#8a7a62');
  ctx.restore();
}
