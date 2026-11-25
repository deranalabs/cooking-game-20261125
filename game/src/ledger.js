// SPDX-License-Identifier: MIT
// The stars ledger: wallet of tips across shifts, stars per kitchen, totals, and the critic's verdict.
import { KITCHENS } from './kitchens/roster.js';

export function createLedger() {
  return { wallet: 0, owned: [], levels: {}, stars: [], best: [], unlocked: 0, served: 0, shifts: 0,
    rival: { won: 0, lost: 0, log: [] } };
}

// After a shift: tips go in the wallet, best stars and scores are kept, one star opens the next kitchen,
// and a visit from Critic Sable Rook goes on the running tally.
export function recordShift(ledger, game) {
  ledger.wallet += game.tips;
  ledger.served += game.served;
  ledger.shifts += 1;
  ledger.best ||= [];
  ledger.best[game.kitchenIndex] = Math.max(ledger.best[game.kitchenIndex] || 0, game.score);
  ledger.rival ||= { won: 0, lost: 0, log: [] };
  if (game.rival) {
    ledger.rival[game.rival.won ? 'won' : 'lost'] += 1;
    ledger.rival.log = [...(ledger.rival.log || []), { kitchen: game.def.name, dish: game.rival.dish, won: game.rival.won }].slice(-6);
  }
  const i = game.kitchenIndex;
  ledger.stars[i] = Math.max(ledger.stars[i] || 0, game.stars);
  if (game.stars >= 1) ledger.unlocked = Math.max(ledger.unlocked, Math.min(i + 1, KITCHENS.length - 1));
  return ledger;
}

export function totalStars(ledger) {
  return ledger.stars.reduce((a, b) => a + (b || 0), 0);
}

const VERDICTS = [
  'Cold plates and long faces. I left hungry.',
  'Honest food, shaky service. Room to grow.',
  'A kitchen that hums. I would come back.',
  'Dazzling. The tickets never stood a chance.',
];

// What the critic writes about the shift: their own plate rating if one was served, else the stars.
export function criticComment(game) {
  const rated = game.critics && game.critics.length ? game.critics[game.critics.length - 1] : null;
  const lines = (game.def && game.def.reviews) || VERDICTS;
  const base = lines[Math.max(0, Math.min(3, game.stars || 0))];
  if (!rated) return `"${base}" (house review)`;
  return `"${base} The ${rated.dish} was ${rated.quality >= 0.85 ? 'perfect' : rated.quality >= 0.6 ? 'fine' : 'tired'}." (${rated.name})`;
}

// Saved between visits; a broken or missing save starts a fresh career.
export function loadLedger(storage) {
  try {
    const raw = JSON.parse(storage.getItem('copper-lantern-ledger-v3'));
    return raw && Array.isArray(raw.owned) ? Object.assign(createLedger(), raw) : createLedger();
  } catch { return createLedger(); }
}

export function saveLedger(storage, ledger) {
  try { storage.setItem('copper-lantern-ledger-v3', JSON.stringify(ledger)); } catch { /* private window */ }
}
