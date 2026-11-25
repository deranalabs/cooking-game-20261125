// SPDX-License-Identifier: MIT
// The six kitchens in the order a career visits them, one file each under kitchens/.
import galleyBoat from './galley-boat.js';
import marketStall from './market-stall.js';
import conveyorDiner from './conveyor-diner.js';
import rooftopGarden from './rooftop-garden.js';
import hotLine from './hot-line.js';
import banquetHall from './banquet-hall.js';

export const KITCHENS = [galleyBoat, marketStall, conveyorDiner, rooftopGarden, hotLine, banquetHall];

export function kitchenById(id) {
  return KITCHENS.find((k) => k.id === id);
}
