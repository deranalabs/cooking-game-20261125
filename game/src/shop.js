// SPDX-License-Identifier: MIT
// Upgrade shop between shifts: tools bought with tips from the ledger, and the kitchen modifiers they give.

export const UPGRADES = [
  { id: 'knife', name: 'Whetted Knife', price: 45, says: 'chop 40% faster', icon: 'knife' },
  { id: 'pot', name: 'Copper Stockpot', price: 60, says: 'stove cooks 25% faster', icon: 'pot' },
  { id: 'warmer', name: 'Plate Warmer', price: 55, says: 'tickets wait 15% longer', icon: 'warmer' },
  { id: 'jar', name: 'Tip Jar', price: 40, says: '+$3 tip on every dish', icon: 'jar' },
  { id: 'clogs', name: 'Cork Clogs', price: 50, says: 'walk 15% faster', icon: 'clogs' },
  { id: 'timer', name: 'Brass Egg Timer', price: 70, says: 'food burns 40% slower', icon: 'timer' },
];

export function upgradeById(id) {
  return UPGRADES.find((u) => u.id === id);
}

export function canAfford(ledger, id) {
  const u = upgradeById(id);
  return !!u && !ledger.owned.includes(id) && ledger.wallet >= u.price;
}

export function buyUpgrade(ledger, id) {
  if (!canAfford(ledger, id)) return false;
  ledger.wallet -= upgradeById(id).price;
  ledger.owned.push(id);
  return true;
}

// Multipliers the shift reads: chop and cook are time factors, burn stretches the burn clock.
export function modsFor(owned = []) {
  const has = (id) => owned.includes(id);
  return {
    chop: has('knife') ? 0.6 : 1,
    cook: has('pot') ? 0.75 : 1,
    patience: has('warmer') ? 1.15 : 1,
    jar: has('jar') ? 3 : 0,
    speed: has('clogs') ? 1.15 : 1,
    burn: has('timer') ? 1.4 : 1,
  };
}
