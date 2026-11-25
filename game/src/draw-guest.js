// SPDX-License-Identifier: MIT
// Guest portraits: a regular's or critic's face, hat and live mood expression for the order board.

const INK = '#2b1a12';

function hat(ctx, kind, color, x, y, r) {
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.fillStyle = color;
  ctx.beginPath();
  switch (kind) {
    case 'cap': ctx.ellipse(x, y - r * 0.55, r * 0.95, r * 0.5, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x + r * 0.6, y - r * 0.55, r * 0.6, r * 0.16, 0, 0, Math.PI * 2); break;
    case 'bow': ctx.moveTo(x + r * 0.2, y - r * 0.9); ctx.lineTo(x + r * 0.9, y - r * 1.3); ctx.lineTo(x + r * 0.9, y - r * 0.5);
      ctx.closePath(); ctx.moveTo(x + r * 0.2, y - r * 0.9); ctx.lineTo(x - r * 0.5, y - r * 1.3); ctx.lineTo(x - r * 0.5, y - r * 0.5); ctx.closePath(); break;
    case 'scarf': ctx.roundRect(x - r * 0.9, y + r * 0.6, r * 1.8, r * 0.45, 4); break;
    case 'beanie': ctx.ellipse(x, y - r * 0.45, r, r * 0.65, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, y - r * 1.15, r * 0.25, 0, Math.PI * 2); break;
    case 'flower': ctx.arc(x - r * 0.6, y - r * 0.75, r * 0.32, 0, Math.PI * 2); break;
    case 'beret': ctx.ellipse(x - r * 0.15, y - r * 0.7, r * 1.05, r * 0.42, -0.2, 0, Math.PI * 2); break;
    case 'top': ctx.rect(x - r * 0.55, y - r * 1.75, r * 1.1, r * 1.05); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(x, y - r * 0.72, r * 0.95, r * 0.2, 0, 0, Math.PI * 2); break;
    default: return;
  }
  ctx.fill(); ctx.stroke();
}

// mood: patient (calm smile), hungry (flat mouth, side glance), furious (brows, red cheeks), delighted (grin).
export function drawGuestFace(ctx, guest, mood, x, y, r, t = 0) {
  const bounce = mood === 'delighted' ? Math.abs(Math.sin(t * 8)) * 3 : mood === 'furious' ? Math.sin(t * 30) * 1.5 : 0;
  const cy = y - (mood === 'delighted' ? bounce : 0); const cx = x + (mood === 'furious' ? bounce : 0);
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = mood === 'furious' ? '#e88a6a' : guest.skin; ctx.fill();
  ctx.lineWidth = 2.5; ctx.strokeStyle = INK; ctx.stroke();
  // soft shade on the lower half and a highlight up top
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r - 1.5, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = 'rgba(80,30,10,0.16)'; ctx.beginPath(); ctx.arc(cx + r * 0.35, cy + r * 0.45, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.ellipse(cx - r * 0.35, cy - r * 0.45, r * 0.28, r * 0.16, -0.5, 0, Math.PI * 2); ctx.fill();
  const eye = r * 0.32; const ey = cy - r * 0.08;
  const look = mood === 'hungry' ? r * 0.12 : 0;
  ctx.fillStyle = INK;
  for (const k of [-1, 1]) {
    ctx.beginPath();
    if (mood === 'delighted') { ctx.lineWidth = 2; ctx.arc(cx + k * eye, ey + 1, r * 0.13, Math.PI, 0); ctx.stroke(); }
    else { ctx.arc(cx + k * eye + look, ey, r * 0.11, 0, Math.PI * 2); ctx.fill(); }
  }
  if (mood === 'furious') {
    ctx.lineWidth = 2.5;
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + k * eye * 1.6, ey - r * 0.32); ctx.lineTo(cx + k * eye * 0.4, ey - r * 0.16); ctx.stroke(); }
  }
  if (mood === 'furious' || mood === 'delighted') {
    ctx.fillStyle = mood === 'furious' ? 'rgba(220,40,30,0.5)' : 'rgba(255,110,150,0.5)';
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + k * r * 0.55, cy + r * 0.25, r * 0.16, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.lineWidth = 2.2; ctx.beginPath();
  const my = cy + r * 0.42;
  if (mood === 'patient') ctx.arc(cx, my - r * 0.12, r * 0.26, 0.2 * Math.PI, 0.8 * Math.PI);
  else if (mood === 'hungry') { ctx.moveTo(cx - r * 0.22, my); ctx.lineTo(cx + r * 0.22, my); }
  else if (mood === 'furious') ctx.arc(cx, my + r * 0.12, r * 0.24, 1.15 * Math.PI, 1.85 * Math.PI);
  else { ctx.arc(cx, my - r * 0.15, r * 0.3, 0, Math.PI); ctx.fillStyle = '#7a1a1a'; ctx.fill(); }
  ctx.stroke();
  hat(ctx, guest.hat, guest.color, cx, cy, r);
}
