// SPDX-License-Identifier: MIT
// Kitchen floor plan: the tile grid of counters, crates and stations, and lookups into it.
import { INGREDIENTS } from './recipes.js';

export const TILE = 64;
export const KITCHEN_Y = 176;
export const COLS = 17;
export const ROWS = 8;

// Where the kitchen lands on screen: game logic works in 64px tiles, the view draws them at 72px.
export const VIEW = { x: 28, y: KITCHEN_Y, scale: 1.125 };

export function screenToKitchen(p) {
  return { x: (p.x - VIEW.x) / VIEW.scale, y: KITCHEN_Y + (p.y - VIEW.y) / VIEW.scale };
}

// Plans live in kitchens/*.js: '#' counter, '.' floor, K chop board, P pan, U pot, A plating counter,
// H serving hatch, X trash, R plate rack, '>' conveyor belt, F fryer, O oven, G grill, '~' awning counter;
// lower-case letters are ingredient crates (see recipes.js, INGREDIENTS[id].crate).
const CRATES = Object.fromEntries(Object.entries(INGREDIENTS).map(([id, ing]) => [ing.crate, id]));
const TYPES = { '#': 'counter', '.': 'floor', K: 'chop', P: 'pan', U: 'pot', A: 'plating',
  H: 'hatch', X: 'trash', R: 'rack', '>': 'belt', F: 'fry', O: 'bake', G: 'grill', '~': 'counter' };

// Stations that hold food over heat: the cook time and burn clock run on these.
export const HEAT_TILES = new Set(['pan', 'pot', 'fry', 'bake', 'grill']);
export function isHeat(tile) {
  return !!tile && HEAT_TILES.has(tile.type);
}

export function buildKitchen(plan) {
  const grid = [];
  const list = [];
  plan.forEach((line, row) => {
    grid.push([...line].map((ch, col) => {
      const tile = {
        col, row, type: CRATES[ch] ? 'crate' : TYPES[ch], ingredient: CRATES[ch] || null, item: null, awning: ch === '~',
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

// The floor tile nearest the middle of the room, where the chef starts a shift.
export function startTile(kitchen) {
  const floors = findTiles(kitchen, 'floor');
  const d = (t) => Math.hypot(t.col - 8, t.row - 4.6);
  return floors.reduce((a, b) => (d(a) <= d(b) ? a : b));
}
