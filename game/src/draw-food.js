// SPDX-License-Identifier: MIT
// Food renderer: every ingredient at every prep stage, plates and bowls with their layers, dish icons.
import { DISHES } from './recipes.js';
import { plateMakes } from './items.js';

const INK = '#2b1a12';

function outline(ctx, s) {
  ctx.lineWidth = Math.max(1.4, s * 0.09);
  ctx.strokeStyle = INK;
  ctx.stroke();
}
function blob(ctx, x, y, rx, ry, fill, s, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (s) outline(ctx, s);
}
function dot(ctx, x, y, r, fill) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
}
function shine(ctx, x, y, rx, ry) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.fill();
}

const DRAW = {
  bun(ctx, s) {
    blob(ctx, 0, s * 0.28, s * 0.95, s * 0.32, '#c9782f', s);
    ctx.beginPath();
    ctx.ellipse(0, s * 0.12, s * 0.95, s * 0.75, 0, Math.PI, 0);
    ctx.closePath();
    ctx.fillStyle = '#eba64a';
    ctx.fill(); outline(ctx, s);
    shine(ctx, -s * 0.35, -s * 0.3, s * 0.28, s * 0.12);
    for (const [a, b] of [[-0.4, -0.25], [0.1, -0.45], [0.45, -0.15], [-0.1, -0.05], [0.25, 0.0]]) {
      blob(ctx, a * s, b * s, s * 0.08, s * 0.045, '#fff3d6', 0, 0.6);
    }
  },
  cheese(ctx, s) {
    ctx.save(); ctx.rotate(-0.15);
    ctx.beginPath(); ctx.roundRect(-s * 0.8, -s * 0.7, s * 1.6, s * 1.4, s * 0.2);
    ctx.fillStyle = '#f7c62f'; ctx.fill(); outline(ctx, s);
    for (const [a, b, r] of [[-0.35, -0.25, 0.18], [0.35, 0.2, 0.14], [0.1, -0.4, 0.09], [-0.3, 0.35, 0.1]]) dot(ctx, a * s, b * s, r * s, '#d99a14');
    ctx.restore();
  },
  tomato(ctx, s, stage) {
    if (stage === 0) {
      blob(ctx, 0, s * 0.08, s * 0.85, s * 0.78, '#e0392b', s);
      shine(ctx, -s * 0.35, -s * 0.2, s * 0.22, s * 0.14);
      ctx.fillStyle = '#3f9a2f';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
        ctx.lineTo(Math.cos(a) * s * 0.36, -s * 0.62 + Math.sin(a) * s * 0.2);
        ctx.lineTo(Math.cos(a + 0.6) * s * 0.1, -s * 0.62 + Math.sin(a + 0.6) * s * 0.06);
      }
      ctx.closePath(); ctx.fill(); outline(ctx, s * 0.6);
      return;
    }
    for (const [ox, oy] of [[-0.42, 0.12], [0.42, -0.1]]) {
      blob(ctx, ox * s, oy * s, s * 0.55, s * 0.55, '#e0392b', s);
      blob(ctx, ox * s, oy * s, s * 0.4, s * 0.4, '#ff7a5c', 0);
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.4;
        blob(ctx, ox * s + Math.cos(a) * s * 0.2, oy * s + Math.sin(a) * s * 0.2, s * 0.09, s * 0.06, '#ffe08a', 0, a);
      }
    }
  },
  lettuce(ctx, s, stage) {
    if (stage === 0) {
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        blob(ctx, Math.cos(a) * s * 0.45, Math.sin(a) * s * 0.4, s * 0.45, s * 0.38, '#4fae36', s, a);
      }
      blob(ctx, 0, 0, s * 0.5, s * 0.45, '#8bd65a', s);
      ctx.beginPath(); ctx.moveTo(0, -s * 0.3); ctx.lineTo(0, s * 0.3);
      ctx.strokeStyle = '#d8f5a8'; ctx.lineWidth = s * 0.08; ctx.stroke();
      return;
    }
    for (const [a, b, r] of [[-0.45, 0.1, 0.4], [0.4, 0.15, 0.42], [0, -0.3, 0.45], [0.05, 0.35, 0.35]]) {
      ctx.beginPath();
      for (let i = 0; i <= 10; i++) {
        const ang = (i / 10) * Math.PI * 2;
        const rr = r * s * (i % 2 ? 0.75 : 1);
        ctx.lineTo(a * s + Math.cos(ang) * rr, b * s + Math.sin(ang) * rr * 0.75);
      }
      ctx.closePath(); ctx.fillStyle = '#6cc443'; ctx.fill(); outline(ctx, s * 0.8);
    }
  },
  beef(ctx, s, stage) {
    const cooked = stage >= 1;
    blob(ctx, 0, 0, s * 0.85, s * 0.68, cooked ? '#7d3f1c' : '#d65a6e', s);
    if (cooked) {
      ctx.strokeStyle = '#3d1b0a'; ctx.lineWidth = s * 0.12;
      for (const k of [-0.4, 0, 0.4]) {
        ctx.beginPath(); ctx.moveTo(k * s - s * 0.25, -s * 0.4); ctx.lineTo(k * s + s * 0.25, s * 0.4); ctx.stroke();
      }
      shine(ctx, -s * 0.35, -s * 0.3, s * 0.2, s * 0.08);
    } else {
      for (const [a, b] of [[-0.3, -0.2], [0.25, 0.15], [0.35, -0.3], [-0.2, 0.3]]) blob(ctx, a * s, b * s, s * 0.14, s * 0.07, '#f6b3bd', 0, a);
    }
  },
  onion(ctx, s, stage) {
    if (stage === 0) {
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.9);
      ctx.bezierCurveTo(s * 0.3, -s * 0.5, s * 0.9, -s * 0.2, s * 0.75, s * 0.35);
      ctx.bezierCurveTo(s * 0.55, s * 0.85, -s * 0.55, s * 0.85, -s * 0.75, s * 0.35);
      ctx.bezierCurveTo(-s * 0.9, -s * 0.2, -s * 0.3, -s * 0.5, 0, -s * 0.9);
      ctx.fillStyle = '#9c4a8e'; ctx.fill(); outline(ctx, s);
      ctx.strokeStyle = '#d58cc8'; ctx.lineWidth = s * 0.07;
      ctx.beginPath(); ctx.moveTo(0, -s * 0.6); ctx.quadraticCurveTo(-s * 0.4, 0, -s * 0.1, s * 0.6); ctx.stroke();
      return;
    }
    const ring = stage === 1 ? '#c070b5' : '#c9852f';
    const inner = stage === 1 ? '#f6e2f1' : '#f0c06a';
    for (const [a, b] of [[-0.35, -0.2], [0.35, -0.15], [0, 0.35]]) {
      blob(ctx, a * s, b * s, s * 0.45, s * 0.42, ring, s * 0.8);
      blob(ctx, a * s, b * s, s * 0.3, s * 0.28, inner, 0);
      blob(ctx, a * s, b * s, s * 0.17, s * 0.15, ring, 0);
    }
  },
  fish(ctx, s, stage) {
    if (stage === 0) {
      ctx.beginPath();
      ctx.moveTo(s * 0.55, 0); ctx.lineTo(s * 0.95, -s * 0.45); ctx.lineTo(s * 0.95, s * 0.45); ctx.closePath();
      ctx.fillStyle = '#4f7f9f'; ctx.fill(); outline(ctx, s);
      blob(ctx, -s * 0.1, 0, s * 0.72, s * 0.42, '#77aacb', s);
      blob(ctx, -s * 0.05, s * 0.12, s * 0.5, s * 0.16, '#cfe6f2', 0);
      dot(ctx, -s * 0.5, -s * 0.08, s * 0.1, INK);
      dot(ctx, -s * 0.53, -s * 0.11, s * 0.035, '#fff');
      return;
    }
    const fill = stage === 1 ? '#f39a7b' : '#d8862f';
    ctx.beginPath(); ctx.roundRect(-s * 0.8, -s * 0.45, s * 1.6, s * 0.9, s * 0.35);
    ctx.fillStyle = fill; ctx.fill(); outline(ctx, s);
    ctx.strokeStyle = stage === 1 ? '#ffd2c2' : '#8a4a14'; ctx.lineWidth = s * 0.09;
    for (const k of [-0.45, -0.1, 0.25, 0.55]) {
      ctx.beginPath(); ctx.moveTo(k * s, -s * 0.35); ctx.quadraticCurveTo(k * s + s * 0.15, 0, k * s, s * 0.35); ctx.stroke();
    }
    if (stage === 2) shine(ctx, -s * 0.4, -s * 0.22, s * 0.22, s * 0.07);
  },
  mushroom(ctx, s, stage) {
    if (stage === 0) {
      ctx.beginPath(); ctx.roundRect(-s * 0.25, -s * 0.05, s * 0.5, s * 0.8, s * 0.15);
      ctx.fillStyle = '#f2e3c4'; ctx.fill(); outline(ctx, s);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.9, s * 0.7, 0, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = '#a8632f'; ctx.fill(); outline(ctx, s);
      for (const [a, b] of [[-0.4, -0.3], [0.2, -0.5], [0.5, -0.2]]) dot(ctx, a * s, b * s, s * 0.09, '#e7c193');
      return;
    }
    const cap = stage === 1 ? '#a8632f' : '#5f3519';
    const flesh = stage === 1 ? '#f2e3c4' : '#9a6a3c';
    for (const [a, b, r] of [[-0.4, -0.15, -0.3], [0.38, -0.05, 0.25], [0, 0.35, 0]]) {
      ctx.save(); ctx.translate(a * s, b * s); ctx.rotate(r);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.45, s * 0.38, 0, Math.PI, 0); ctx.closePath();
      ctx.fillStyle = cap; ctx.fill(); outline(ctx, s * 0.8);
      ctx.beginPath(); ctx.rect(-s * 0.12, 0, s * 0.24, s * 0.3);
      ctx.fillStyle = flesh; ctx.fill(); outline(ctx, s * 0.6);
      ctx.restore();
    }
    if (stage === 2) shine(ctx, -s * 0.3, -s * 0.35, s * 0.15, s * 0.06);
  },
  rice(ctx, s, stage) {
    if (stage === 0) {
      ctx.beginPath();
      ctx.moveTo(-s * 0.6, -s * 0.55); ctx.lineTo(s * 0.6, -s * 0.55);
      ctx.quadraticCurveTo(s * 0.95, s * 0.8, 0, s * 0.8); ctx.quadraticCurveTo(-s * 0.95, s * 0.8, -s * 0.6, -s * 0.55);
      ctx.fillStyle = '#e6cf98'; ctx.fill(); outline(ctx, s);
      blob(ctx, 0, -s * 0.55, s * 0.6, s * 0.18, '#fbf6e8', s);
      ctx.fillStyle = '#b5482f'; ctx.font = `bold ${s * 0.55}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('米', 0, s * 0.2);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(-s * 0.85, s * 0.35);
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI + (i / 8) * Math.PI;
      ctx.lineTo(Math.cos(a) * s * 0.85, s * 0.2 + Math.sin(a) * s * 0.75 + (i % 2 ? -s * 0.05 : 0));
    }
    ctx.closePath(); ctx.fillStyle = '#fdfaf0'; ctx.fill(); outline(ctx, s);
    for (const [a, b] of [[-0.4, -0.1], [0, -0.35], [0.35, 0], [-0.1, 0.1], [0.2, -0.2]]) blob(ctx, a * s, b * s, s * 0.09, s * 0.04, '#e5dcc4', 0, a + 0.5);
  },
  noodles(ctx, s, stage) {
    if (stage === 0) {
      ctx.save(); ctx.rotate(-0.4);
      ctx.beginPath(); ctx.roundRect(-s * 0.9, -s * 0.4, s * 1.8, s * 0.8, s * 0.1);
      ctx.fillStyle = '#f3d266'; ctx.fill(); outline(ctx, s);
      ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = s * 0.06;
      for (const k of [-0.2, 0, 0.2]) { ctx.beginPath(); ctx.moveTo(-s * 0.85, k * s); ctx.lineTo(s * 0.85, k * s); ctx.stroke(); }
      ctx.beginPath(); ctx.rect(-s * 0.15, -s * 0.42, s * 0.3, s * 0.84); ctx.fillStyle = '#c4463a'; ctx.fill(); outline(ctx, s * 0.6);
      ctx.restore();
      return;
    }
    blob(ctx, 0, 0, s * 0.85, s * 0.7, '#f4d773', s);
    ctx.strokeStyle = '#c99a2a'; ctx.lineWidth = s * 0.08;
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      for (let k = 0; k <= 12; k++) {
        const x = -s * 0.65 + (k / 12) * s * 1.3;
        ctx.lineTo(x, -s * 0.38 + i * s * 0.25 + Math.sin(k * 1.3 + i) * s * 0.08);
      }
      ctx.stroke();
    }
  },
  // raw potato with eyes, then pale wedges off the board, then golden fries out of the fryer
  potato(ctx, s, stage) {
    if (stage === 0) {
      blob(ctx, 0, 0, s * 0.85, s * 0.62, '#b8874a', s, 0.2);
      for (const [a, b] of [[-0.35, -0.1], [0.2, 0.2], [0.4, -0.25]]) dot(ctx, a * s, b * s, s * 0.06, '#6e4a22');
      shine(ctx, -s * 0.3, -s * 0.28, s * 0.22, s * 0.1);
      return;
    }
    const fried = stage >= 2;
    for (let i = 0; i < 6; i++) {
      ctx.save(); ctx.rotate(-0.6 + i * 0.24); ctx.translate((i - 2.5) * s * 0.12, 0);
      ctx.beginPath(); ctx.roundRect(-s * 0.1, -s * 0.7, s * 0.2, s * 1.3, s * 0.06);
      ctx.fillStyle = fried ? (i % 2 ? '#f4b83a' : '#e9a22a') : '#f3e0a6'; ctx.fill(); outline(ctx, s * 0.7);
      if (fried) { ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-s * 0.05, -s * 0.6, s * 0.04, s * 0.9); }
      ctx.restore();
    }
  },
  // a floury dough ball, then a blistered golden bread out of the oven
  dough(ctx, s, stage) {
    if (stage === 0) {
      blob(ctx, 0, s * 0.05, s * 0.85, s * 0.7, '#f4e6c8', s);
      for (const [a, b] of [[-0.3, -0.2], [0.25, -0.3], [0.1, 0.2], [-0.15, 0.25]]) dot(ctx, a * s, b * s, s * 0.05, '#ffffff');
      shine(ctx, -s * 0.3, -s * 0.3, s * 0.25, s * 0.12);
      return;
    }
    blob(ctx, 0, 0, s * 0.95, s * 0.8, '#d99a44', s);
    blob(ctx, 0, 0, s * 0.72, s * 0.58, '#eab868', 0);
    for (const [a, b] of [[-0.4, -0.2], [0.3, 0.25], [0.1, -0.35], [-0.2, 0.35], [0.45, -0.1]]) dot(ctx, a * s, b * s, s * 0.08, '#7a4a1a');
    shine(ctx, -s * 0.35, -s * 0.35, s * 0.25, s * 0.1);
  },
  // a pink drumstick, then charred from the grill with bar marks
  chicken(ctx, s, stage) {
    const done = stage >= 1;
    ctx.save(); ctx.rotate(-0.5);
    ctx.beginPath(); ctx.roundRect(s * 0.3, -s * 0.12, s * 0.6, s * 0.24, s * 0.1);
    ctx.fillStyle = '#f6ecd8'; ctx.fill(); outline(ctx, s * 0.7);
    dot(ctx, s * 0.92, -s * 0.12, s * 0.13, '#f6ecd8'); dot(ctx, s * 0.92, s * 0.12, s * 0.13, '#f6ecd8');
    blob(ctx, -s * 0.15, 0, s * 0.62, s * 0.48, done ? '#b8642a' : '#f2a6a0', s);
    if (done) {
      ctx.strokeStyle = '#5a2a10'; ctx.lineWidth = s * 0.09;
      for (const k of [-0.35, -0.05, 0.25]) { ctx.beginPath(); ctx.moveTo(k * s - s * 0.15, -s * 0.35); ctx.lineTo(k * s + s * 0.15, s * 0.35); ctx.stroke(); }
    }
    shine(ctx, -s * 0.35, -s * 0.2, s * 0.2, s * 0.09);
    ctx.restore();
  },
  // a red bell pepper, then sliced into strips, then blistered on the grill
  pepper(ctx, s, stage) {
    if (stage === 0) {
      // a tall bell pepper: three lobes, a deep crease between them, a wide green cap and stalk
      for (const [a, w] of [[-0.42, 0.36], [0.42, 0.36], [0, 0.4]]) blob(ctx, a * s, s * 0.15, w * s, s * 0.78, a ? '#b81e24' : '#d8302a', s);
      ctx.beginPath(); ctx.ellipse(0, -s * 0.6, s * 0.5, s * 0.16, 0, 0, Math.PI * 2); ctx.fillStyle = '#3f8a2f'; ctx.fill(); outline(ctx, s * 0.6);
      ctx.beginPath(); ctx.roundRect(-s * 0.07, -s * 0.98, s * 0.14, s * 0.38, s * 0.05); ctx.fillStyle = '#2f6a22'; ctx.fill(); outline(ctx, s * 0.5);
      shine(ctx, -s * 0.12, -s * 0.15, s * 0.1, s * 0.3);
      return;
    }
    const charred = stage >= 2;
    for (let i = 0; i < 4; i++) {
      ctx.save(); ctx.translate((i - 1.5) * s * 0.34, (i % 2) * s * 0.12); ctx.rotate(0.3 - i * 0.2);
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.14, s * 0.62, 0, 0, Math.PI * 2);
      ctx.fillStyle = charred ? '#b8281e' : '#e0382a'; ctx.fill(); outline(ctx, s * 0.6);
      if (charred) { dot(ctx, 0, -s * 0.2, s * 0.06, '#3a1a10'); dot(ctx, 0, s * 0.25, s * 0.05, '#3a1a10'); }
      ctx.restore();
    }
  },
};

export function drawIngredient(ctx, id, stage, x, y, s, burnt = false, squash = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (squash > 0) ctx.scale(1 + squash * 0.25, 1 - squash * 0.3);
  if (burnt) {
    blob(ctx, 0, 0, s * 0.85, s * 0.65, '#2d2420', s);
    for (const [a, b] of [[-0.3, -0.2], [0.3, 0.1], [0, 0.3]]) dot(ctx, a * s, b * s, s * 0.12, '#55463c');
    ctx.restore();
    return;
  }
  DRAW[id](ctx, s, stage);
  ctx.restore();
}

// Flat layer bands for stacked dishes (bun stacks), bottom up.
const BAND = { beef: ['#7d3f1c', 0.2], cheese: ['#f7c62f', 0.12], lettuce: ['#5bb83a', 0.14],
  tomato: ['#e0392b', 0.13], onion: ['#c9852f', 0.11], mushroom: ['#5f3519', 0.13], fish: ['#e8955f', 0.17] };

function drawBand(ctx, id, x, y, w, s) {
  const [fill, h] = BAND[id];
  ctx.beginPath();
  if (id === 'lettuce' || id === 'cheese') {
    ctx.moveTo(x - w, y - h * s);
    for (let i = 0; i <= 10; i++) ctx.lineTo(x - w * 1.08 + (i / 10) * w * 2.16, y + (i % 2 ? h * s * 1.2 : 0));
    ctx.lineTo(x + w, y - h * s);
  } else {
    ctx.roundRect(x - w, y - h * s, w * 2, h * s * 2, h * s);
  }
  ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); outline(ctx, s * 0.8);
}

function isComplete(layers) {
  return DISHES.some((d) => plateMakes({ layers }, d));
}

function drawStack(ctx, layers, x, y, s, complete) {
  // bottom bun
  ctx.beginPath(); ctx.roundRect(x - s * 0.82, y - s * 0.02, s * 1.64, s * 0.34, s * 0.16);
  ctx.fillStyle = '#e09a42'; ctx.fill(); outline(ctx, s);
  let top = y - s * 0.02;
  for (const id of layers.slice(1)) {
    const h = BAND[id][1] * s;
    top -= h * 1.4;
    drawBand(ctx, id, x, top, s * 0.86, s);
    top -= h * 0.6;
  }
  if (complete) {
    ctx.beginPath(); ctx.ellipse(x, top - s * 0.02, s * 0.84, s * 0.55, 0, Math.PI, 0); ctx.closePath();
    ctx.fillStyle = '#eba64a'; ctx.fill(); outline(ctx, s);
    shine(ctx, x - s * 0.3, top - s * 0.35, s * 0.24, s * 0.09);
    for (const [a, b] of [[-0.35, -0.25], [0.05, -0.4], [0.4, -0.2]]) blob(ctx, x + a * s, top + b * s, s * 0.07, s * 0.04, '#fff3d6', 0, 0.5);
  }
}

const SPOTS = [[0, 0, 0.72], [-0.32, -0.18, 0.5], [0.34, -0.12, 0.5], [0.02, 0.28, 0.46]];

// A plate (or bowl for rice and noodle bases) with its layers so far; a finished bun stack gets its crown.
export function drawPlate(ctx, layers, x, y, s, opts = {}) {
  const bowl = layers[0] === 'rice' || layers[0] === 'noodles';
  ctx.save();
  if (opts.glow) {
    ctx.shadowColor = '#ffd84a'; ctx.shadowBlur = s * 0.9;
  }
  if (bowl) {
    blob(ctx, x, y + s * 0.1, s * 1.05, s * 0.85, '#2f8a92', s);
    blob(ctx, x, y + s * 0.02, s * 0.88, s * 0.68, '#f6efe0', s * 0.6);
  } else {
    blob(ctx, x, y + s * 0.08, s * 1.1, s * 0.88, '#fbfaf5', s);
    ctx.beginPath(); ctx.ellipse(x, y + s * 0.08, s * 0.9, s * 0.7, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#7cb7c9'; ctx.lineWidth = s * 0.07; ctx.stroke();
  }
  ctx.restore();
  if (layers.length === 0) return;
  const complete = opts.complete ?? isComplete(layers);
  if (layers[0] === 'bun') {
    drawStack(ctx, layers, x, y + s * 0.15, s * 0.95, complete);
    return;
  }
  layers.forEach((id, i) => {
    const [ox, oy, k] = SPOTS[Math.min(i, SPOTS.length - 1)];
    drawIngredient(ctx, id, readyStage(id), x + ox * s, y + oy * s, s * k);
  });
}

export function readyStage(id) {
  return { bun: 0, cheese: 0, tomato: 1, lettuce: 1, beef: 1, onion: 2, fish: 2, mushroom: 2, rice: 1, noodles: 1,
    potato: 2, dough: 1, chicken: 1, pepper: 2 }[id];
}
