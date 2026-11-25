// SPDX-License-Identifier: MIT
// Keyboard and mouse: held keys for walking and chopping, queued presses and clicks in canvas pixels.

const BLOCK = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

export function createInput(canvas, onFirst) {
  const down = new Set();
  const presses = [];
  const clicks = [];
  window.addEventListener('keydown', (e) => {
    if (BLOCK.has(e.code)) e.preventDefault();
    onFirst();
    if (!e.repeat) presses.push(e.code);
    down.add(e.code);
  });
  window.addEventListener('keyup', (e) => down.delete(e.code));
  window.addEventListener('blur', () => down.clear());
  canvas.addEventListener('mousedown', (e) => {
    onFirst();
    const r = canvas.getBoundingClientRect();
    clicks.push({ x: ((e.clientX - r.left) / r.width) * canvas.width, y: ((e.clientY - r.top) / r.height) * canvas.height });
  });
  const any = (...codes) => codes.some((c) => down.has(c));
  return {
    move() {
      return {
        x: (any('KeyD', 'ArrowRight') ? 1 : 0) - (any('KeyA', 'ArrowLeft') ? 1 : 0),
        y: (any('KeyS', 'ArrowDown') ? 1 : 0) - (any('KeyW', 'ArrowUp') ? 1 : 0),
      };
    },
    held: (code) => down.has(code),
    takePresses: () => presses.splice(0),
    takeClicks: () => clicks.splice(0),
  };
}

export function inside(p, r) {
  return p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h;
}
