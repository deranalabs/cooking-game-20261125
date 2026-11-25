// SPDX-License-Identifier: MIT
// Kitchen floor plan: the tile grid of counters, crates and stations, and lookups into it.

export const TILE = 64;
export const KITCHEN_Y = 176;
export const COLS = 17;
export const ROWS = 8;

// Where the kitchen lands on screen: game logic works in 64px tiles, the view draws them at 72px.
export const VIEW = { x: 28, y: KITCHEN_Y, scale: 1.125 };

export function screenToKitchen(p) {
  return { x: (p.x - VIEW.x) / VIEW.scale, y: KITCHEN_Y + (p.y - VIEW.y) / VIEW.scale };
}

// '#' counter, '.' floor, K chop board, P pan, U pot, A plating counter, H serving hatch,
// X trash, R plate rack; lower-case letters are ingredient crates.
const PLAN = [
  '#btlcm#ofsrnR#HH#',
  'K...............#',
  'K...............X',
  '#...AAAAAAAA....#',
  '#...PP#K#KUU....#',
  '#...............#',
  '#...............#',
  '######RR#########',
];

const CRATES = { b: 'bun', t: 'tomato', l: 'lettuce', c: 'cheese', m: 'beef',
  o: 'onion', f: 'fish', s: 'mushroom', r: 'rice', n: 'noodles' };
const TYPES = { '#': 'counter', '.': 'floor', K: 'chop', P: 'pan', U: 'pot', A: 'plating',
  H: 'hatch', X: 'trash', R: 'rack' };

export function buildKitchen() {
  const grid = [];
  const list = [];
  PLAN.forEach((line, row) => {
    grid.push([...line].map((ch, col) => {
      const tile = {
        col, row, type: CRATES[ch] ? 'crate' : TYPES[ch], ingredient: CRATES[ch] || null, item: null,
        x: col * TILE + TILE / 2, y: KITCHEN_Y + row * TILE + TILE / 2,
      };
      list.push(tile);
      return tile;
    }));
  });
  return { grid, list };
}

export function tileAt(kitchen, col, row) {
  return kitchen.grid[row]?.[col] ?? null;
}

export function tileAtPoint(kitchen, x, y) {
  return tileAt(kitchen, Math.floor(x / TILE), Math.floor((y - KITCHEN_Y) / TILE));
}

export function isSolid(tile) {
  return !tile || tile.type !== 'floor';
}

export function findTiles(kitchen, type) {
  return kitchen.list.filter((t) => t.type === type);
}
