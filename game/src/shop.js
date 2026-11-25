// SPDX-License-Identifier: MIT
// Upgrade shop between shifts: eight tools in two tiers, bought with tips, and the kitchen modifiers they give.

// Each tool has two tiers bought in order; `says` is what the tier does, shown on the shop card.
// `seen` is how the tool shows up during a shift, so a bought tier is visible in play.
export const UPGRADES = [
  { id: 'knife', name: 'Whetted Knife', icon: 'knife', seen: 'blade flashes as you chop',
    tiers: [{ price: 45, says: 'chop 30% faster' }, { price: 110, says: 'chop 55% faster' }] },
  { id: 'lid', name: 'Copper Pot Lid', icon: 'pot', seen: 'lids rattle on the pots',
    tiers: [{ price: 50, says: 'pots boil 25% faster' }, { price: 120, says: 'pots boil 45% faster' }] },
  { id: 'skillet', name: 'Cast Skillet', icon: 'skillet', seen: 'copper rims on pans, fryer and grill',
    tiers: [{ price: 60, says: 'pan, fry, grill 20% faster' }, { price: 140, says: 'pan, fry, grill 35% faster' }] },
  { id: 'warmer', name: 'Plate Warmer', icon: 'warmer', seen: 'plating counters glow warm',
    tiers: [{ price: 55, says: 'guests wait 15% longer' }, { price: 125, says: 'guests wait 30% longer' }] },
  { id: 'jar', name: 'Tip Jar', icon: 'jar', seen: 'a coin jar fills at the hatch',
    tiers: [{ price: 40, says: '+$3 tip on every dish' }, { price: 100, says: '+$7 tip on every dish' }] },
  { id: 'clogs', name: 'Cork Clogs', icon: 'clogs', seen: 'cork soles kick up dust',
    tiers: [{ price: 50, says: 'walk 12% faster' }, { price: 115, says: 'walk 25% faster' }] },
  { id: 'timer', name: 'Brass Egg Timer', icon: 'timer', seen: 'timers tick on hot stations',
    tiers: [{ price: 70, says: 'food burns 35% slower' }, { price: 150, says: 'food burns 70% slower' }] },
  { id: 'bell', name: 'Hatch Bell', icon: 'bell', seen: 'a brass bell rings at the hatch',
    tiers: [{ price: 45, says: 'plates go out 40% sooner' }, { price: 105, says: 'sooner, combo pays to x2.25' }] },
];

export const MAX_TIER = 2;

export function upgradeById(id) {
  return UPGRADES.find((u) => u.id === id);
}

// Tier owned, 0 to 2; a v2 save that only listed `owned` ids counts as tier 1 of each.
export function levelOf(ledger, id) {
  if (ledger.levels && ledger.levels[id] !== undefined) return ledger.levels[id];
  return (ledger.owned || []).includes(id) ? 1 : 0;
}

// Price of the next tier, or null at the top tier.
export function nextPrice(ledger, id) {
  const u = upgradeById(id);
  const lvl = levelOf(ledger, id);
  return u && lvl < u.tiers.length ? u.tiers[lvl].price : null;
}

export function canAfford(ledger, id) {
  const price = nextPrice(ledger, id);
  return price !== null && ledger.wallet >= price;
}

export function buyUpgrade(ledger, id) {
  if (!canAfford(ledger, id)) return false;
  ledger.wallet -= nextPrice(ledger, id);
  ledger.levels = { ...(ledger.levels || {}), [id]: levelOf(ledger, id) + 1 };
  if (!(ledger.owned ||= []).includes(id)) ledger.owned.push(id);
  return true;
}

// Picks the tier's number from a two-entry table: lvl 0 gives `none`.
function tier(levels, id, none, one, two) {
  const lvl = levels[id] || 0;
  return lvl >= 2 ? two : lvl === 1 ? one : none;
}

// Multipliers the shift reads. Accepts a levels object ({knife: 2}) or a v2 list of owned ids (tier 1 each).
export function modsFor(owned = {}) {
  const levels = Array.isArray(owned) ? Object.fromEntries(owned.map((id) => [id, 1])) : owned;
  const skillet = tier(levels, 'skillet', 1, 0.8, 0.65);
  return {
    levels,
    chop: tier(levels, 'knife', 1, 0.7, 0.45),
    cookBy: { pot: tier(levels, 'lid', 1, 0.75, 0.55), pan: skillet, fry: skillet, grill: skillet, bake: skillet },
    patience: tier(levels, 'warmer', 1, 1.15, 1.3),
    jar: tier(levels, 'jar', 0, 3, 7),
    speed: tier(levels, 'clogs', 1, 1.12, 1.25),
    burn: tier(levels, 'timer', 1, 1.35, 1.7),
    serve: tier(levels, 'bell', 1, 0.6, 0.5),
    comboCap: tier(levels, 'bell', 4, 4, 5),
  };
}
