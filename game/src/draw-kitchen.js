// SPDX-License-Identifier: MIT
// Kitchen renderer: tiled floor, counters, crates, boards, stoves, hatch, the chef and progress bars.
import { TILE, KITCHEN_Y, COLS, ROWS, isHeat } from './kitchen-layout.js';
import { drawIngredient, drawPlate, readyStage } from './draw-food.js';
import { nextStep, isReady, lastStep, missingLayers } from './items.js';
import { burnShare, WARN_AT } from './stations.js';
import { facingTile } from './chef.js';
import { RUSH_SECONDS } from './recipes.js';

const INK = '#2b1a12';
const H = TILE;

function rr(ctx, x, y, w, h, r, fill, line = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill; ctx.fill();
  if (line) { ctx.lineWidth = line; ctx.strokeStyle = INK; ctx.stroke(); }
}

// A bold rounded label (OUT, DOUSED, FLARE x2) a kitchen's hazard art pins over a tile.
function tag(ctx, str, x, y, fill) {
  ctx.font = "bold 14px 'Trebuchet MS', sans-serif";
  const w = Math.max(44, ctx.measureText(str).width + 18);
  rr(ctx, x - w / 2, y - 11, w, 22, 9, fill, 2.5);
  ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y + 0.5);
}

// What a kitchen file's draw hooks are handed: shapes, tile size and the room's bounds.
const PAINT = { rr, tag, H, INK, width: COLS * H, height: ROWS * H, top: KITCHEN_Y };

// Bought tools show in the kitchen: the level of one, 0 when not bought.
let LV = {};

// The kitchen being drawn sets the palette: floor tiles, grout, counter tops and sides.
let PAL = { floorA: '#f0d3a6', floorB: '#c9774f', grout: '#5b3a2a', top: '#f6e9cc', side: '#b9784a' };

// Checker tiles with grout lines, a worn speckle and a soft sheen so the floor reads as a surface.
function drawFloor(ctx) {
  ctx.fillStyle = PAL.grout;
  ctx.fillRect(0, KITCHEN_Y, COLS * H, ROWS * H);
  const half = H / 2;
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (let k = 0; k < 4; k++) {
        const x = c * H + (k % 2) * half; const y = KITCHEN_Y + r * H + Math.floor(k / 2) * half;
        ctx.fillStyle = (k === 0 || k === 3) ? PAL.floorA : PAL.floorB;
        ctx.fillRect(x + 1, y + 1, half - 2, half - 2);
        const n = (c * 73 + r * 151 + k * 37) % 17;
        ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.fillRect(x + 3, y + 3, half - 10, 3);
        ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + 4 + n, y + 8 + (n % 9) * 2, 3, 2);
      }
    }
  }
}

// A counter: wood-grain side, a top with a lit front edge and a faint grain line.
function counterBase(ctx, x, y, top = PAL.top) {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, PAL.side);
  ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 6, y + H - 10, H - 12, 3);
  rr(ctx, x + 2, y + 2, H - 4, H - 14, 8, top);
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(x + 8, y + 5, H - 16, 3);
  ctx.fillStyle = 'rgba(120,80,40,0.10)'; ctx.fillRect(x + 10, y + 22, H - 26, 2); ctx.fillRect(x + 16, y + 34, H - 30, 2);
}

// Warm lantern light from above with darker corners; the edges glow hotter as the rush runs on.
export function drawVignette(ctx, game) {
  const w = COLS * H; const h = ROWS * H; const cx = w / 2; const cy = KITCHEN_Y + h / 2;
  const heat = game.rush ? Math.min(1, 1 - game.timeLeft / RUSH_SECONDS) : 0;
  const g = ctx.createRadialGradient(cx, cy - 40, h * 0.25, cx, cy, w * 0.62);
  g.addColorStop(0, `rgba(255,200,120,${0.07 + heat * 0.06})`); g.addColorStop(0.6, 'rgba(40,20,10,0)');
  g.addColorStop(1, game.rush ? `rgba(${120 + heat * 80},${20 + heat * 30},0,${0.42 + heat * 0.12})` : 'rgba(20,8,2,0.42)');
  ctx.fillStyle = g; ctx.fillRect(0, KITCHEN_Y, w, h);
}

// The deep fryer: a steel basin of golden oil that bubbles while food is in it.
function drawFryer(ctx, tile, x, y, t, hot) {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, '#5a626e');
  rr(ctx, x + 8, y + 8, H - 16, H - 20, 6, '#2a2e36', 2.5);
  const oil = ctx.createLinearGradient(0, y + 10, 0, y + H - 14);
  oil.addColorStop(0, hot ? '#ffcf4a' : '#d9a83a'); oil.addColorStop(1, hot ? '#e08a1a' : '#a8782a');
  rr(ctx, x + 11, y + 11, H - 22, H - 26, 4, oil, 0);
  if (hot) for (let k = 0; k < 5; k++) {
    const b = (t * 2.2 + k * 0.37) % 1;
    ctx.beginPath(); ctx.arc(x + 16 + ((k * 13) % 32), y + H - 18 - b * 24, 2 + b * 2, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,248,210,${1 - b})`; ctx.lineWidth = 1.5; ctx.stroke();
  }
  ctx.fillStyle = '#c0c8d2'; ctx.fillRect(x + 14, y + H - 12, H - 28, 4);   // basket handle
  if (LV.skillet) { ctx.strokeStyle = '#d0783a'; ctx.lineWidth = 3; ctx.strokeRect(x + 7, y + 7, H - 14, H - 18); }
}

// The brick oven: an arched mouth that glows orange while something bakes.
function drawOven(ctx, tile, x, y, t, hot) {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, '#9a4a32');
  ctx.strokeStyle = 'rgba(60,20,10,0.5)'; ctx.lineWidth = 1.5;
  for (let r = 0; r < 4; r++) { ctx.beginPath(); ctx.moveTo(x + 4, y + 12 + r * 13); ctx.lineTo(x + H - 4, y + 12 + r * 13); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x + 12, y + H - 12); ctx.lineTo(x + 12, y + 28); ctx.arc(x + H / 2, y + 28, 20, Math.PI, 0); ctx.lineTo(x + H - 12, y + H - 12); ctx.closePath();
  const mouth = ctx.createRadialGradient(x + H / 2, y + H - 18, 2, x + H / 2, y + H - 18, 34);
  mouth.addColorStop(0, hot ? `rgba(255,${190 + Math.sin(t * 6) * 30},80,1)` : '#3a2018'); mouth.addColorStop(1, hot ? '#a8301a' : '#1e100c');
  ctx.fillStyle = mouth; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  if (LV.skillet) { ctx.fillStyle = '#d0783a'; ctx.fillRect(x + 10, y + H - 12, H - 20, 4); }
}

// The charcoal grill: dark bars over coals (the hot-line file pulses the coals).
function drawGrill(ctx, tile, x, y, t, hot) {
  rr(ctx, x + 2, y + 2, H - 4, H - 4, 8, '#3a3434');
  rr(ctx, x + 7, y + 7, H - 14, H - 18, 5, hot ? '#5a2a18' : '#241e1e', 2.5);
  if (hot) {
    const g = ctx.createRadialGradient(x + H / 2, y + H / 2 - 4, 2, x + H / 2, y + H / 2 - 4, 26);
    g.addColorStop(0, `rgba(255,${120 + Math.sin(t * 8) * 40},40,0.9)`); g.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = g; ctx.fillRect(x + 8, y + 8, H - 16, H - 20);
  }
  ctx.strokeStyle = LV.skillet ? '#d0783a' : '#9aa3ad'; ctx.lineWidth = 3;
  for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(x + 13 + k * 9.5, y + 10); ctx.lineTo(x + 13 + k * 9.5, y + H - 14); ctx.stroke(); }
}

// A brass egg timer bought from the shop ticks beside food that is done and waiting on the heat.
function drawEggTimer(ctx, x, y, t) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 10) * 0.15);
  ctx.beginPath(); ctx.moveTo(-6, -9); ctx.lineTo(6, -9); ctx.lineTo(-6, 9); ctx.lineTo(6, 9); ctx.closePath();
  ctx.fillStyle = '#e8b84a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.restore();
}

// The tip jar (coins rise with its tier) and the hatch bell, both on the first hatch tile.
function drawHatchTools(ctx, tile, t) {
  const x = tile.col * H; const y = tile.y - H / 2;
  if (LV.jar) {
    rr(ctx, x + 4, y + H - 30, 18, 24, 5, 'rgba(210,240,255,0.75)', 2);
    for (let k = 0; k < LV.jar * 3; k++) {
      ctx.beginPath(); ctx.ellipse(x + 9 + (k % 2) * 7, y + H - 10 - Math.floor(k / 2) * 4, 4, 2, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffd34d'; ctx.fill(); ctx.lineWidth = 1; ctx.strokeStyle = '#8a6a10'; ctx.stroke();
    }
  }
  if (LV.bell) {
    const bx = x + H - 13; const by = y + H - 16;
    ctx.beginPath(); ctx.moveTo(bx - 9, by + 6); ctx.quadraticCurveTo(bx - 9, by - 10, bx, by - 10); ctx.quadraticCurveTo(bx + 9, by - 10, bx + 9, by + 6); ctx.closePath();
    ctx.fillStyle = LV.bell > 1 ? '#ffd34d' : '#d9a13b'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = INK; ctx.fillRect(bx - 2, by - 14, 4, 4);
  }
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
    ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI * 1.05, Math.PI * 1.45); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI * 0.1, Math.PI * 0.25); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.stroke();
    ctx.restore();
  } else {
    ctx.save(); ctx.translate(x + H / 2, y + H / 2);
    ctx.fillStyle = '#9aa3ad'; ctx.fillRect(-29, -5, 6, 10); ctx.fillRect(23, -5, 6, 10);
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fillStyle = '#b9c2cc'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 19, 0, Math.PI * 2); ctx.fillStyle = hot ? '#e8dcc0' : '#8fb9cf'; ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0, 23, Math.PI * 1.1, Math.PI * 1.5); ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 3; ctx.stroke();
    ctx.restore();
  }
  if (tile.type === 'pan' && LV.skillet) {
    ctx.beginPath(); ctx.arc(x + H / 2, y + H / 2, 23, 0, Math.PI * 2); ctx.strokeStyle = '#d0783a'; ctx.lineWidth = 3; ctx.stroke();
  }
}

// A copper lid from the shop, tilted open on the pot's rim and rattling while it boils.
function drawLid(ctx, tile, t) {
  const hot = tile.item && nextStep(tile.item) === 'pot';
  const lift = hot ? Math.abs(Math.sin(t * 16)) * 2 : 0;
  ctx.beginPath(); ctx.ellipse(tile.x + 18, tile.y - 22 - lift, 15, 6, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = LV.lid > 1 ? '#e0904a' : '#c87a3a'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  ctx.beginPath(); ctx.arc(tile.x + 18, tile.y - 26 - lift, 3, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();
}

// A stall counter under a striped canvas awning: red and cream stripes with a scalloped front edge.
function drawAwning(ctx, x, y, col) {
  for (let k = 0; k < 4; k++) {
    ctx.fillStyle = (k + col) % 2 ? '#f3e6cc' : '#c8402a';
    ctx.fillRect(x + 2 + k * 15, y + 2, 15, 14);
  }
  for (let k = 0; k < 4; k++) {
    ctx.beginPath(); ctx.arc(x + 9.5 + k * 15, y + 16, 7.5, 0, Math.PI);
    ctx.fillStyle = (k + col) % 2 ? '#f3e6cc' : '#c8402a'; ctx.fill();
    ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
  }
  ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.strokeRect(x + 2, y + 2, H - 4, 14);
}

function heatOn(tile) {
  return !!tile.item && (nextStep(tile.item) === tile.type || (isReady(tile.item) && lastStep(tile.item) === tile.type));
}

function drawStation(ctx, tile, t, glow) {
  const x = tile.col * H; const y = tile.y - H / 2;
  switch (tile.type) {
    case 'floor': return;
    case 'crate': drawCrate(ctx, tile, x, y, glow); return;
    case 'pan': case 'pot': drawStove(ctx, tile, x, y, t); return;
    case 'fry': drawFryer(ctx, tile, x, y, t, heatOn(tile)); return;
    case 'bake': drawOven(ctx, tile, x, y, t, heatOn(tile)); return;
    case 'grill': drawGrill(ctx, tile, x, y, t, heatOn(tile)); return;
    case 'belt': return;   // the diner's own file draws its belt
    case 'chop':
      counterBase(ctx, x, y);
      rr(ctx, x + 8, y + 7, H - 16, H - 26, 6, '#e2b170', 2.5);
      ctx.fillStyle = '#c9934f'; ctx.fillRect(x + 12, y + 12, H - 24, 3);
      return;
    case 'plating':
      counterBase(ctx, x, y);
      rr(ctx, x + 7, y + 6, H - 14, H - 24, 5, LV.warmer ? '#3a9a82' : '#2f8f88', 2);
      if (LV.warmer) {
        const w = ctx.createRadialGradient(x + H / 2, y + H / 2 - 6, 2, x + H / 2, y + H / 2 - 6, 30);
        w.addColorStop(0, `rgba(255,150,60,${0.2 + LV.warmer * 0.1})`); w.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = w; ctx.fillRect(x + 7, y + 6, H - 14, H - 24);
      }
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
    default:
      counterBase(ctx, x, y);
      if (tile.awning) drawAwning(ctx, x, y, tile.col);
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
  // a soft contact shadow so food sits on the counter instead of floating over it
  ctx.beginPath(); ctx.ellipse(cx + 3, cy + 16, 22, 7, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(30,15,5,0.22)'; ctx.fill();
  if (item.kind === 'plate') {
    const hatch = tile.type === 'hatch';
    drawPlate(ctx, item.layers, cx, cy + (hatch ? 4 : 0), hatch ? 26 : 25, { glow: hatch });
    if (item.pop > 0) {
      ctx.beginPath(); ctx.arc(cx, cy, 26 + item.pop * 14, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,255,255,${item.pop})`; ctx.lineWidth = 4; ctx.stroke();
    }
    return;
  }
  drawIngredient(ctx, item.id, item.stage, cx, cy, isHeat(tile) ? 16 : 18, item.burnt, item.squash);
}

// Progress bars, done ticks, burn warnings and the hatch's READY tag, drawn above steam and smoke.
export function drawTileBars(ctx, game, t) {
  const focused = game.tickets.find((tk) => tk.uid === game.focus);
  for (const tile of game.kitchen.list) if (tile.item) drawBarsFor(ctx, tile, t, focused ? focused.dish : null);
}

// A speech bubble over a plate showing what the focused ticket's dish still needs.
function drawNeedBubble(ctx, tile, plate, dish) {
  const left = missingLayers(plate, dish);
  if (!left || left.length === 0 || plate.layers.length === 0) return;
  const w = 30 + left.length * 32; const x = tile.x + 22; const y = tile.y - 64;
  ctx.beginPath(); ctx.moveTo(x + 6, y + 34); ctx.lineTo(x - 6, y + 48); ctx.lineTo(x + 20, y + 34); ctx.closePath();
  ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = INK; ctx.stroke();
  rr(ctx, x, y, w, 36, 12, '#ffffff', 3);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 7, y + 31, 12, 6);
  ctx.fillStyle = '#2f8f88'; ctx.font = "bold 24px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('+', x + 15, y + 18);
  left.forEach((id, i) => drawIngredient(ctx, id, readyStage(id), x + 44 + i * 32, y + 18, 12));
}

// Progress bar colour by step, so a glance tells the fryer's bar from the oven's.
const STEP_BAR = { chop: '#7ad04a', pan: '#ffad33', pot: '#4ab8f0', fry: '#ffd23a', bake: '#e8704a', grill: '#ff5a3a' };

function drawBarsFor(ctx, tile, t, focusDish) {
  const item = tile.item;
  const cx = tile.x;
  if (item.kind === 'plate') {
    if (tile.type !== 'hatch') { if (focusDish) drawNeedBubble(ctx, tile, item, focusDish); return; }
    rr(ctx, cx - 50, tile.y + 30, 100, 30, 15, '#3fbf4f', 3);
    ctx.fillStyle = '#ffffff'; ctx.font = "bold 20px 'Trebuchet MS', sans-serif"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('READY!', cx, tile.y + 46);
    return;
  }
  const step = nextStep(item);
  const by = tile.y + 16;
  if (step === tile.type || (step === 'chop' && tile.type === 'chop' && item.progress > 0)) {
    drawBar(ctx, cx, by, 56, item.progress, STEP_BAR[step] || '#ffad33');
  } else if (isReady(item) && isHeat(tile) && lastStep(item) === tile.type) {
    const b = burnShare(item);
    const danger = b >= WARN_AT;
    if (LV.timer) drawEggTimer(ctx, cx - 26, tile.y - 22, t);
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
  // a whetted knife from the shop: the blade catches the light on every chop
  if (chef.chopping && LV.knife) {
    const kx = x + fx * 34 + (fx === 0 ? 14 : 0); const ky = y + fy * 26 - Math.abs(Math.sin(t * 22)) * 8;
    ctx.save(); ctx.translate(kx, ky); ctx.rotate(fx < 0 ? 0.6 : -0.6);
    ctx.beginPath(); ctx.moveTo(-3, 0); ctx.lineTo(18, -4); ctx.lineTo(18, 4); ctx.closePath();
    ctx.fillStyle = '#e8eef2'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke();
    ctx.fillStyle = '#6a3a1a'; ctx.fillRect(-11, -2.5, 9, 5);
    const flash = Math.max(0, Math.sin(t * 22));
    ctx.beginPath(); ctx.arc(14, -2, 3 + flash * 5 * LV.knife, 0, Math.PI * 2); ctx.fillStyle = `rgba(255,255,255,${flash * 0.9})`; ctx.fill();
    ctx.restore();
  }
  if (LV.clogs && chef.walk) {
    for (const k of [-1, 1]) { ctx.beginPath(); ctx.ellipse(chef.x + k * 9, chef.y + 22, 7, 4, 0, 0, Math.PI * 2); ctx.fillStyle = '#c8a46a'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = INK; ctx.stroke(); }
  }
  if (chef.hold && fy >= 0) drawHeld(ctx, chef.hold, handX, handY + 6);
  if (chef.hold && fy < 0) drawHeld(ctx, chef.hold, x, y - 72);   // walking away: carried overhead
}

export function drawKitchen(ctx, game, t, needed) {
  PAL = game.def.palette;
  LV = (game.mods && game.mods.levels) || {};
  const hz = game.def.hazard;
  const tilt = hz.tilt ? hz.tilt(game, t) : 0;
  ctx.save();
  if (tilt) { ctx.translate(COLS * H / 2, KITCHEN_Y + ROWS * H / 2); ctx.rotate(tilt); ctx.translate(-COLS * H / 2, -(KITCHEN_Y + ROWS * H / 2)); }
  drawFloor(ctx);
  const target = game.phase === 'play' ? facingTile(game) : null;
  for (const tile of game.kitchen.list) {
    const glow = tile.type === 'crate' && needed.has(tile.ingredient) ? 0.55 + Math.sin(t * 5) * 0.4 : 0;
    drawStation(ctx, tile, t, glow);
  }
  if (hz.under) hz.under(ctx, game, t, PAINT);
  for (const tile of game.kitchen.list) drawItemOn(ctx, tile, t);
  if (LV.lid) for (const tile of game.kitchen.list) if (tile.type === 'pot') drawLid(ctx, tile, t);
  const firstHatch = game.kitchen.list.find((tile) => tile.type === 'hatch');
  if (firstHatch) drawHatchTools(ctx, firstHatch, t);
  if (hz.draw) hz.draw(ctx, game, t, PAINT);
  if (target) {
    ctx.save(); ctx.setLineDash([8, 6]); ctx.lineDashOffset = -t * 30;
    ctx.lineWidth = 3; ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.roundRect(target.col * H + 2, target.y - H / 2 + 2, H - 4, H - 4, 9); ctx.stroke();
    ctx.restore();
  }
  drawChef(ctx, game.chef, t);
  ctx.restore();
}
