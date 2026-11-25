// SPDX-License-Identifier: MIT
// Shared drawing helpers for the menu screens: rounded cards, text, outlined titles, stars, coins, buttons.

export const INK = '#2b1a12';
export const FONT = "'Trebuchet MS', Verdana, sans-serif";

export function card(ctx, x, y, w, h, r, fill, line = 3, stroke = INK) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (line) { ctx.lineWidth = line; ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function label(ctx, str, x, y, size, color, align = 'left', weight = 'bold') {
  ctx.font = `${weight} ${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

export function title(ctx, str, x, y, size, color, align = 'center', line = 8) {
  ctx.font = `bold ${size}px ${FONT}`;
  ctx.textAlign = align; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.strokeText(str, x, y);
  ctx.fillStyle = color; ctx.fillText(str, x, y);
}

export function star(ctx, x, y, r, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 ? r * 0.45 : r;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? '#ffcf2e' : '#5a4636'; ctx.fill();
  ctx.lineWidth = Math.max(2, r / 9); ctx.lineJoin = 'round'; ctx.strokeStyle = INK; ctx.stroke();
  if (filled) {
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath(); ctx.ellipse(x - r * 0.2, y - r * 0.25, r * 0.22, r * 0.12, -0.6, 0, Math.PI * 2); ctx.fill();
  }
}

export function coin(ctx, x, y, r) {
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#f2b53a'; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y, r * 0.65, 0, Math.PI * 2); ctx.strokeStyle = '#b07a1a'; ctx.lineWidth = 2; ctx.stroke();
  label(ctx, '$', x, y + 1, r * 1.1, '#7a4a0a', 'center');
}

export function button(ctx, b, fill = '#ff9a2a') {
  card(ctx, b.x, b.y, b.w, b.h, 14, fill, 4);
  label(ctx, b.label, b.x + b.w / 2, b.y + b.h / 2 + 1, b.size || 22, INK, 'center');
}

// The dim warm backdrop all menu screens sit on, over the kitchen.
export function backdrop(ctx, w, h) {
  ctx.fillStyle = 'rgba(30,14,8,0.74)'; ctx.fillRect(0, 0, w, h);
}
