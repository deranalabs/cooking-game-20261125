// SPDX-License-Identifier: MIT
// Recipe book: fourteen ingredients, the prep steps each needs, eighteen dishes, prices and station letters.

// steps: 'chop' at a board; 'pan', 'pot', 'fry', 'bake' or 'grill' at a heat station, where food can burn.
// crate: the plan letter of the ingredient's crate in a kitchen's layout (kitchens/*.js).
export const INGREDIENTS = {
  bun:      { name: 'Bun',      crate: 'b', steps: [] },
  cheese:   { name: 'Cheese',   crate: 'c', steps: [] },
  tomato:   { name: 'Tomato',   crate: 't', steps: ['chop'] },
  lettuce:  { name: 'Lettuce',  crate: 'l', steps: ['chop'] },
  beef:     { name: 'Beef',     crate: 'm', steps: ['pan'] },
  onion:    { name: 'Onion',    crate: 'o', steps: ['chop', 'pan'] },
  fish:     { name: 'Fish',     crate: 'f', steps: ['chop', 'pan'] },
  mushroom: { name: 'Mushroom', crate: 's', steps: ['chop', 'pot'] },
  rice:     { name: 'Rice',     crate: 'r', steps: ['pot'] },
  noodles:  { name: 'Noodles',  crate: 'n', steps: ['pot'] },
  potato:   { name: 'Potato',   crate: 'p', steps: ['chop', 'fry'] },
  dough:    { name: 'Dough',    crate: 'd', steps: ['bake'] },
  chicken:  { name: 'Chicken',  crate: 'k', steps: ['grill'] },
  pepper:   { name: 'Pepper',   crate: 'e', steps: ['chop', 'grill'] },
};

export const INGREDIENT_IDS = Object.keys(INGREDIENTS);

// Every step that happens on heat, with the plan letter of its station.
export const HEAT_STEPS = ['pan', 'pot', 'fry', 'bake', 'grill'];
export const STATION_LETTER = { chop: 'K', pan: 'P', pot: 'U', fry: 'F', bake: 'O', grill: 'G' };
export const STEP_NAME = { chop: 'Chop', pan: 'Pan-fry', pot: 'Boil', fry: 'Deep-fry', bake: 'Bake', grill: 'Grill' };

// layers are listed bottom first: the plate draws them in the order they are added.
export const DISHES = [
  { id: 'salad',     name: 'Market Salad',     layers: ['lettuce', 'tomato', 'cheese'] },
  { id: 'melt',      name: 'Cheese Melt',      layers: ['bun', 'cheese', 'onion'] },
  { id: 'burger',    name: 'Dock Burger',      layers: ['bun', 'beef', 'lettuce', 'tomato'] },
  { id: 'lantern',   name: 'Lantern Rice',     layers: ['rice', 'fish', 'onion'] },
  { id: 'forest',    name: 'Forest Noodles',   layers: ['noodles', 'mushroom', 'onion'] },
  { id: 'harbor',    name: 'Harbor Bowl',      layers: ['rice', 'fish', 'lettuce'] },
  { id: 'ember',     name: 'Ember Stack',      layers: ['bun', 'beef', 'cheese', 'mushroom'] },
  { id: 'garden',    name: 'Garden Noodles',   layers: ['noodles', 'tomato', 'lettuce'] },
  { id: 'fisher',    name: 'Fisher Roll',      layers: ['bun', 'fish', 'lettuce', 'tomato'] },
  { id: 'risotto',   name: 'Roof Risotto',     layers: ['rice', 'mushroom', 'cheese'] },
  { id: 'ramen',     name: 'Foundry Ramen',    layers: ['noodles', 'beef', 'onion', 'mushroom'] },
  { id: 'smoke',     name: 'Smokehouse Bun',   layers: ['bun', 'beef', 'onion', 'cheese'] },
  { id: 'platter',   name: 'Guild Platter',    layers: ['rice', 'beef', 'mushroom', 'tomato'] },
  { id: 'skewer',    name: 'Coal Skewers',     layers: ['chicken', 'pepper', 'onion'] },
  { id: 'pie',       name: 'Guildhall Pie',    layers: ['dough', 'beef', 'mushroom'] },
  { id: 'chips',     name: 'Fish & Chips',     layers: ['potato', 'fish', 'lettuce'] },
  { id: 'flatbread', name: 'Lantern Flatbread', layers: ['dough', 'tomato', 'cheese', 'pepper'] },
  { id: 'nightbowl', name: 'Rainy Night Bowl', layers: ['rice', 'chicken', 'potato'] },
];

export function stepsOf(ingredientId) {
  return INGREDIENTS[ingredientId].steps;
}

export function dishById(id) {
  return DISHES.find((d) => d.id === id);
}

// The stations and crates a dish needs, as plan letters: a kitchen can serve it only if its plan has them all.
export function lettersFor(dish) {
  const need = new Set();
  for (const id of dish.layers) {
    need.add(INGREDIENTS[id].crate);
    for (const step of stepsOf(id)) need.add(STATION_LETTER[step]);
  }
  return need;
}

// A dish pays 12 plus 9 for every prep step its layers need, so long routes pay more.
export function dishPrice(dish) {
  return 12 + dish.layers.reduce((sum, id) => sum + stepsOf(id).length * 9, 0);
}

// Each kitchen (kitchens/) sets its own clock, patience and star lines; the rush rules are shared.
export const RUSH_SECONDS = 35;     // the last stretch of a shift is the rush
export const RUSH_PATIENCE = 0.72;  // tickets in the rush have this share of patience
export const RUSH_GAP = 0.55;       // and arrive this much sooner
