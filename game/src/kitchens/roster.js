// SPDX-License-Identifier: MIT
// The career: seven kitchens in the order you visit them, the chapter each one is, and the cook's rank by stars.
import galleyBoat from './galley-boat.js';
import marketStall from './market-stall.js';
import conveyorDiner from './conveyor-diner.js';
import rooftopGarden from './rooftop-garden.js';
import hotLine from './hot-line.js';
import banquetHall from './banquet-hall.js';
import nightMarket from './night-market.js';

export const KITCHENS = [galleyBoat, marketStall, conveyorDiner, rooftopGarden, hotLine, banquetHall, nightMarket];

// Each kitchen is a chapter of the story: its title is shown when the shift opens.
export const CHAPTERS = [
  'Old Marlow\'s Galley',
  'A Pitch in the Covered Market',
  'The Night the Cook Quit',
  'Rook Comes to Dinner',
  'Feeding the Foundry',
  'Luz Gets Married',
  'The Rematch Under the Bridge',
];

// The cook's rank by stars earned across the career (best stars per kitchen, 21 at most).
export const RANKS = [
  { stars: 0, title: 'Galley Hand' },
  { stars: 3, title: 'Prep Cook' },
  { stars: 7, title: 'Line Cook' },
  { stars: 11, title: 'Sous Chef' },
  { stars: 15, title: 'Head Chef' },
  { stars: 19, title: 'Lantern Master' },
];

export function kitchenById(id) {
  return KITCHENS.find((k) => k.id === id);
}

export function chapterOf(index) {
  return { number: index + 1, title: CHAPTERS[index] || KITCHENS[index].name, kitchen: KITCHENS[index] };
}

// Rank for a star count, and how many stars the next rank needs (null at the top).
export function rankFor(stars) {
  let at = 0;
  RANKS.forEach((r, i) => { if (stars >= r.stars) at = i; });
  const next = RANKS[at + 1];
  return { title: RANKS[at].title, level: at + 1, next: next ? next.title : null, need: next ? next.stars - stars : 0 };
}

// The kitchens where the rival critic dines, in career order: where the running tally is kept.
export function rivalKitchens() {
  return KITCHENS.filter((k) => k.rival).map((k) => k.name);
}
