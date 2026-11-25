// SPDX-License-Identifier: MIT
// The chef: walking with collision against counters, facing, and the station in front of them.
import { TILE, tileAt, tileAtPoint, isSolid } from './kitchen-layout.js';

const SPEED = 300;
const RADIUS = 24;
const REACH = 46;

export function createChef(x, y) {
  return { x, y, face: { x: 0, y: -1 }, hold: null, walk: 0, chopping: false, carryBob: 0 };
}

function blocked(kitchen, x, y) {
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, -1], [0, 1], [-1, 0], [1, 0]]) {
    if (isSolid(tileAtPoint(kitchen, x + dx * RADIUS * 0.92, y + dy * RADIUS * 0.92))) return true;
  }
  return false;
}

export function moveChef(game, dt, move) {
  const chef = game.chef;
  let { x: mx, y: my } = move;
  const len = Math.hypot(mx, my);
  if (len === 0) { chef.walk = 0; return; }
  mx /= len; my /= len;
  chef.face = Math.abs(mx) > Math.abs(my) ? { x: Math.sign(mx), y: 0 } : { x: 0, y: Math.sign(my) };
  const speed = SPEED * (game.mods ? game.mods.speed : 1) * (game.footing ?? 1);
  nudgeChef(game, mx * speed * dt, my * speed * dt);
  chef.walk += dt * 10;
}

// Moves the chef by a step, sliding along counters instead of passing through them (also used by the swell).
export function nudgeChef(game, dx, dy) {
  const chef = game.chef;
  if (dx && !blocked(game.kitchen, chef.x + dx, chef.y)) chef.x += dx;
  if (dy && !blocked(game.kitchen, chef.x, chef.y + dy)) chef.y += dy;
}

// The station tile right in front of the chef, or null when they face open floor.
export function facingTile(game) {
  const { chef, kitchen } = game;
  const t = tileAtPoint(kitchen, chef.x + chef.face.x * REACH, chef.y + chef.face.y * REACH);
  return t && t.type !== 'floor' ? t : null;
}

// Puts the chef on a floor tile next to a station, facing it (used by tests and screenshot staging).
export function standFacing(game, tile) {
  for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
    const floor = tileAt(game.kitchen, tile.col + dx, tile.row + dy);
    if (floor && floor.type === 'floor') {
      game.chef.x = floor.col * TILE + TILE / 2;
      game.chef.y = floor.y;
      game.chef.face = { x: -dx, y: -dy };
      return floor;
    }
  }
  throw new Error('no floor next to ' + tile.type);
}
