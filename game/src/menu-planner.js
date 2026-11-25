// SPDX-License-Identifier: MIT
// Menu planning: which dishes a kitchen has unlocked, and picking the four the shift will serve.
import { KITCHENS } from './kitchens/roster.js';
import { dishById, stepsOf, lettersFor } from './recipes.js';

export const MENU_SIZE = 4;

// A kitchen can cook a dish when its plan has every crate and station the dish's layers need.
export function canCook(kitchenDef, dish) {
  const letters = new Set(kitchenDef.plan.join(''));
  return [...lettersFor(dish)].every((ch) => letters.has(ch));
}

// Every dish unlocked by this kitchen and the ones before it that this kitchen can cook, in unlock order.
export function unlockedDishes(kitchenIndex) {
  const here = KITCHENS[kitchenIndex];
  return KITCHENS.slice(0, kitchenIndex + 1).flatMap((k) => k.unlocks).filter((id) => canCook(here, dishById(id)));
}

// The first plan offered: the kitchen's own new dishes first, then the newest older ones.
export function defaultMenu(kitchenIndex) {
  const own = KITCHENS[kitchenIndex].unlocks.filter((id) => canCook(KITCHENS[kitchenIndex], dishById(id)));
  const rest = unlockedDishes(kitchenIndex).filter((id) => !own.includes(id)).reverse();
  return [...own, ...rest].slice(0, MENU_SIZE);
}

// Clicking a dish card: drop it if planned, add it if there is room, else leave the plan as it is.
export function toggleDish(plan, id, kitchenIndex) {
  if (plan.includes(id)) return plan.filter((d) => d !== id);
  if (plan.length >= MENU_SIZE || !unlockedDishes(kitchenIndex).includes(id)) return plan;
  return [...plan, id];
}

// Difficulty 1 to 3 from the number of prep steps the dish needs.
export function dishDifficulty(dish) {
  const steps = dish.layers.reduce((n, id) => n + stepsOf(id).length, 0);
  return steps <= 2 ? 1 : steps <= 4 ? 2 : 3;
}

export function planIsReady(plan) {
  return plan.length >= 2 && plan.every((id) => !!dishById(id));
}
