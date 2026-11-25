// SPDX-License-Identifier: MIT
// Upgrade shop screen: six tools with prices, what the wallet can afford, and what is already owned.
import { UPGRADES, canAfford } from './shop.js';
import { KITCHENS } from './kitchens/roster.js';
import { INK, card, label, title, coin, button, backdrop } from './draw-ui.js';

export function shopCardRect(i) {
  return { x: 150 + (i % 3) * 335, y: 200 + Math.floor(i / 3) * 210, w: 310, h: 190 };
}

export function shopDoneButton() {
  return { x: 465, y: 650, w: 350, h: 60, label: 'ENTER  Plan the menu' };
}

function drawTool(ctx, id, x, y) {
  ctx.lineWidth = 3; ctx.strokeStyle = INK;
  ctx.save(); ctx.translate(x, y);
  if (id === 'knife') {
    ctx.rotate(-0.6);
    ctx.fillStyle = '#dfe6ec'; ctx.beginPath(); ctx.moveTo(-8, -30); ctx.quadraticCurveTo(14, -10, 8, 10); ctx.lineTo(-8, 10); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-4, -22, 3, 26);
    ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.roundRect(-9, 10, 18, 26, 5); ctx.fill(); ctx.stroke();
  } else if (id === 'pot') {
    ctx.fillStyle = '#d0783a'; ctx.beginPath(); ctx.roundRect(-30, -16, 60, 40, 8); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#f0a060'; ctx.fillRect(-24, -12, 8, 30);
    ctx.fillStyle = '#9a4a1a'; ctx.beginPath(); ctx.roundRect(-34, -22, 68, 10, 4); ctx.fill(); ctx.stroke();
  } else if (id === 'warmer') {
    ctx.fillStyle = '#c84a2a'; ctx.beginPath(); ctx.roundRect(-30, 4, 60, 20, 6); ctx.fill(); ctx.stroke();
    for (let k = 0; k < 3; k++) { ctx.fillStyle = '#fbfaf5'; ctx.beginPath(); ctx.ellipse(0, 0 - k * 7, 28, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.strokeStyle = '#ff8a3a';
    for (const k of [-12, 0, 12]) { ctx.beginPath(); ctx.moveTo(k, -22); ctx.quadraticCurveTo(k + 6, -30, k, -38); ctx.stroke(); }
  } else if (id === 'jar') {
    ctx.fillStyle = 'rgba(200,230,240,0.8)'; ctx.beginPath(); ctx.roundRect(-22, -22, 44, 50, 10); ctx.fill(); ctx.stroke();
    coin(ctx, -6, 14, 9); coin(ctx, 8, 6, 9); coin(ctx, -2, -4, 9);
  } else if (id === 'clogs') {
    ctx.fillStyle = '#c8945a'; ctx.beginPath(); ctx.ellipse(0, 10, 32, 14, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#5a8a3a'; ctx.beginPath(); ctx.ellipse(-6, 0, 22, 14, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
  } else {
    ctx.fillStyle = '#c9963f'; ctx.beginPath(); ctx.moveTo(-18, -28); ctx.lineTo(18, -28); ctx.lineTo(-18, 28); ctx.lineTo(18, 28); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#ffe9a0'; ctx.beginPath(); ctx.moveTo(-8, 20); ctx.lineTo(8, 20); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

export function drawShop(ctx, ledger, nextKitchen, t, W, H) {
  backdrop(ctx, W, H);
  title(ctx, 'LANTERN SUPPLY CO.', W / 2, 70, 52, '#ffd34d', 'center', 10);
  label(ctx, `Spend your tips before ${KITCHENS[nextKitchen].name}`, W / 2, 122, 22, '#fff2d0', 'center');
  card(ctx, W / 2 - 120, 140, 240, 44, 22, '#2a1a12', 3, '#c9963f');
  coin(ctx, W / 2 - 92, 162, 15);
  label(ctx, `Wallet $${ledger.wallet}`, W / 2 + 10, 163, 24, '#ffd34d', 'center');
  UPGRADES.forEach((u, i) => {
    const r = shopCardRect(i);
    const owned = ledger.owned.includes(u.id);
    const can = canAfford(ledger, u.id);
    card(ctx, r.x, r.y, r.w, r.h, 16, owned ? '#cfe8c4' : can ? '#fff6df' : '#d8c8a8', can ? 5 : 3, can ? '#ffb02e' : INK);
    card(ctx, r.x + 14, r.y + 18, 90, 90, 12, '#f3e3c0', 2);
    drawTool(ctx, u.id, r.x + 59, r.y + 63);
    label(ctx, `${i + 1}`, r.x + 22, r.y + 28, 14, '#8a6a4a');
    label(ctx, u.name, r.x + 116, r.y + 36, 20, INK);
    ctx.font = "15px 'Trebuchet MS', Verdana, sans-serif";
    label(ctx, u.says, r.x + 116, r.y + 66, 15, '#5a3524', 'left', 'normal');
    const tag = owned ? 'OWNED' : can ? `BUY  $${u.price}` : `$${u.price}  need $${u.price - ledger.wallet}`;
    const pulse = can ? 1 + Math.sin(t * 5 + i) * 0.03 : 1;
    ctx.save(); ctx.translate(r.x + r.w / 2, r.y + 150); ctx.scale(pulse, pulse);
    card(ctx, -130, -22, 260, 44, 22, owned ? '#4aa84a' : can ? '#ff9a2a' : '#8a7a62', 3);
    label(ctx, tag, 0, 1, 20, owned || !can ? '#fff8e8' : INK, 'center');
    ctx.restore();
  });
  button(ctx, shopDoneButton());
  label(ctx, 'click a tool or press 1-6 to buy · money carries over between shifts', W / 2, 735, 16, '#e9d3a8', 'center', 'normal');
}
