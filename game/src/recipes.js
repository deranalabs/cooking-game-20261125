// SPDX-License-Identifier: MIT
// Recipe book: the ten ingredients, the prep steps each needs, the eight dishes and the three shifts.

// steps: 'chop' at a board, 'pan' or 'pot' on the stove; an ingredient is ready once every step is done.
export const INGREDIENTS = {
  bun:      { name: 'Bun',      steps: [] },
  cheese:   { name: 'Cheese',   steps: [] },
  tomato:   { name: 'Tomato',   steps: ['chop'] },
  lettuce:  { name: 'Lettuce',  steps: ['chop'] },
  beef:     { name: 'Beef',     steps: ['pan'] },
  onion:    { name: 'Onion',    steps: ['chop', 'pan'] },
  fish:     { name: 'Fish',     steps: ['chop', 'pan'] },
  mushroom: { name: 'Mushroom', steps: ['chop', 'pot'] },
  rice:     { name: 'Rice',     steps: ['pot'] },
  noodles:  { name: 'Noodles',  steps: ['pot'] },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

// layers are listed bottom first: the plate draws them in the order they are added.
export const DISHES = [
  { id: 'salad',   name: 'Market Salad',   layers: ['lettuce', 'tomato', 'cheese'] },
  { id: 'melt',    name: 'Cheese Melt',    layers: ['bun', 'cheese', 'onion'] },
  { id: 'burger',  name: 'Dock Burger',    layers: ['bun', 'beef', 'lettuce', 'tomato'] },
  { id: 'lantern', name: 'Lantern Rice',   layers: ['rice', 'fish', 'onion'] },
  { id: 'forest',  name: 'Forest Noodles', layers: ['noodles', 'mushroom', 'onion'] },
  { id: 'harbor',  name: 'Harbor Bowl',    layers: ['rice', 'fish', 'lettuce'] },
  { id: 'ember',   name: 'Ember Stack',    layers: ['bun', 'beef', 'cheese', 'mushroom'] },
  { id: 'garden',  name: 'Garden Noodles', layers: ['noodles', 'tomato', 'lettuce'] },
];

export function stepsOf(ingredientId) {
  return INGREDIENTS[ingredientId].steps;
}

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

// A dish pays 12 plus 9 for every prep step its layers need, so long routes pay more.
export function dishPrice(dish) {
  return 12 + dish.layers.reduce((sum, id) => sum + stepsOf(id).length * 9, 0);
}

// Shifts: menu grows, more tickets at once, less patience. Pressure only, never new chores.
export const SHIFTS = [
  { name: 'Morning Market', length: 150, menu: ['salad', 'melt', 'burger'],
    maxTickets: 3, patience: 75, spawnGap: [15, 21], stars: [90, 180, 270] },
  { name: 'Harbor Lunch', length: 165, menu: ['salad', 'melt', 'burger', 'lantern', 'forest'],
    maxTickets: 4, patience: 66, spawnGap: [12, 17], stars: [120, 230, 340] },
  { name: 'Lantern Night', length: 180, menu: DISHES.map((d) => d.id),
    maxTickets: 4, patience: 58, spawnGap: [10, 14], stars: [150, 280, 410] },
];

export const RUSH_SECONDS = 35;     // the last stretch of a shift is the rush
export const RUSH_PATIENCE = 0.72;  // tickets in the rush have this share of patience
export const RUSH_GAP = 0.55;       // and arrive this much sooner
