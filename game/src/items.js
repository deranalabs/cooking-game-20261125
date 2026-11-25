// SPDX-License-Identifier: MIT
// Ingredient and plate state: prep stage, burn, and which layers a plate may take next.
import { stepsOf, dishById } from './recipes.js';

export function makeIngredient(id) {
  return { kind: 'ing', id, stage: 0, progress: 0, overcook: 0, burnt: false, squash: 0 };
}

export function makePlate() {
  return { kind: 'plate', layers: [], serving: 0, pop: 0 };
}

export function nextStep(item) {
  if (!item || item.kind !== 'ing' || item.burnt) return null;
  return stepsOf(item.id)[item.stage] ?? null;
}

export function isReady(item) {
  return !!item && item.kind === 'ing' && !item.burnt && item.stage >= stepsOf(item.id).length;
}

export function lastStep(item) {
  const steps = stepsOf(item.id);
  return item.stage > 0 ? steps[item.stage - 1] : null;
}

export function advanceStep(item) {
  item.stage += 1;
  item.progress = 0;
  item.overcook = 0;
}

function counts(list) {
  const c = {};
  for (const id of list) c[id] = (c[id] || 0) + 1;
  return c;
}

function fitsInside(layers, dishLayers) {
  const have = counts(layers);
  const want = counts(dishLayers);
  return Object.keys(have).every((id) => have[id] <= (want[id] || 0));
}

// A ready ingredient may go on a plate when the plate plus it still fits some dish on the menu.
export function canAddToPlate(plate, item, menu) {
  if (!plate || plate.kind !== 'plate' || !isReady(item)) return false;
  const next = [...plate.layers, item.id];
  return menu.some((dishId) => fitsInside(next, dishById(dishId).layers));
}

export function addToPlate(plate, item) {
  plate.layers.push(item.id);
  plate.pop = 1;
}

// The layers a plate still needs to become a dish, or null when the plate cannot become it.
export function missingLayers(plate, dish) {
  if (!fitsInside(plate.layers, dish.layers)) return null;
  const left = [...dish.layers];
  for (const id of plate.layers) left.splice(left.indexOf(id), 1);
  return left;
}

export function plateMakes(plate, dish) {
  if (plate.layers.length !== dish.layers.length) return false;
  return fitsInside(plate.layers, dish.layers);
}
