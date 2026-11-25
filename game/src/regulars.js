// SPDX-License-Identifier: MIT
// The regulars and critics at the order board: who they are, the trait that changes play, live mood and lines.

// trait changes play:
//   tipper    tips double and then some             impatient  waits 35% less, tips 30% more
//   fan       orders dishes with `loves`, tips 50% more when it is on the plate
//   fussy     a critic who wants one ingredient left out of the dish (the ticket says which)
//   rival     Critic Sable Rook, who follows you between two kitchens; the ledger keeps the running tally
// critic: pays more and judges the plate's freshness. lines are spoken on the ticket in each mood; `react`
// is said with a flourish when the plate lands.
export const REGULARS = [
  { id: 'marlow', name: 'Old Marlow', color: '#3f7fbf', skin: '#e8b98f', hat: 'cap',
    react: 'Same again tomorrow, chef.',
    lines: { patient: 'No rush, lad. The river waits.', hungry: 'Getting peckish over here...', furious: 'My tea went cold an hour ago!', delighted: 'Now that is a proper plate.' } },
  { id: 'pip', name: 'Pip Tallow', color: '#e0702a', skin: '#f2cfa8', hat: 'bow', trait: 'impatient',
    react: 'FAST! You are SO fast!',
    lines: { patient: 'Quick quick quick!', hungry: 'Is it nearly done? Is it?', furious: 'I am TELLING my mum!', delighted: 'Best. Lunch. Ever!' } },
  { id: 'greta', name: 'Greta Fenn', color: '#5a9a4a', skin: '#d9a77c', hat: 'scarf',
    react: 'I shall tell the knitting club.',
    lines: { patient: 'Take your time, dear.', hungry: 'My knitting club is waiting.', furious: 'In my day cooks were quick!', delighted: 'Just like my mother made.' } },
  { id: 'osei', name: 'Kofi Osei', color: '#8a4ab0', skin: '#8a5a3a', hat: 'beanie',
    react: 'Clocking in happy tonight.',
    lines: { patient: 'Smells good from out here.', hungry: 'Shift starts in ten, chef.', furious: 'I am going to be late!', delighted: 'You saved my whole night.' } },
  { id: 'luz', name: 'Luz Arroyo', color: '#d0405a', skin: '#c98d62', hat: 'flower', trait: 'fan', loves: 'tomato',
    react: 'Tomato! My heart sings!',
    lines: { patient: 'More tomato, always.', hungry: 'My stomach is singing...', furious: 'This is a tragedy!', delighted: 'Bravo! Bravissimo!' } },
  { id: 'brom', name: 'Brom the Docker', color: '#6a6a72', skin: '#e0a882', hat: 'none', trait: 'fan', loves: 'beef',
    react: 'BEEF. Good. Hah!',
    lines: { patient: 'Beef. Real big beef.', hungry: 'Hungry enough to eat a crate.', furious: 'GRRR. Food. Now.', delighted: 'Hah! That hits the spot.' } },
  { id: 'dot', name: 'Dot Hensley', color: '#2f9a8a', skin: '#f0c9a0', hat: 'flower', trait: 'tipper', tipMult: 2.2,
    react: 'Keep the change, sweetheart!',
    lines: { patient: 'I tip well for a hot plate.', hungry: 'My purse is open, chef...', furious: 'Not one penny like this!', delighted: 'Here, take a little extra.' } },
  { id: 'ada', name: 'Nurse Ada Moss', color: '#4a6ad0', skin: '#b97a52', hat: 'cap', trait: 'impatient',
    react: 'Back to the ward, fed!',
    lines: { patient: 'Twenty-minute break, chef.', hungry: 'My pager is buzzing...', furious: 'I have patients waiting!', delighted: 'You are a lifesaver.' } },
  { id: 'vale', name: 'Critic Ines Vale', color: '#1f1f2a', skin: '#efd2b4', hat: 'beret', critic: true, trait: 'fussy',
    react: 'Precisely as I asked.',
    lines: { patient: 'Exactly as I ordered, please.', hungry: 'Service is... leisurely.', furious: 'One star. Perhaps none.', delighted: 'Exquisite. Truly.' } },
  { id: 'quill', name: 'Critic B. Quill', color: '#b08a2a', skin: '#d6a274', hat: 'top', critic: true,
    react: 'I may write a sonnet.',
    lines: { patient: 'Impress me, if you can.', hungry: 'The clock is ticking, chef.', furious: 'Appalling. Simply appalling.', delighted: 'A rare pleasure.' } },
  { id: 'rook', name: 'Critic Sable Rook', color: '#5a1a3a', skin: '#e6c3a0', hat: 'top', critic: true, trait: 'rival',
    react: 'Hm. You win this round.',
    lines: { patient: 'We meet again, chef.', hungry: 'Slower than last time.', furious: 'My column writes itself.', delighted: 'Grudgingly: superb.' } },
];

export const CRITIC_PAY = 1.6;
export const RIVAL_WIN = { quality: 0.7, patience: 0.3 };   // a fresh plate with patience to spare beats the rival

export function guestById(id) {
  return REGULARS.find((r) => r.id === id);
}

// Who walks up next: no one already at the board; critics from the second kitchen on; the rival once a
// shift in a kitchen that names it, after the first twenty seconds; a kitchen may favour its own regulars.
export function pickGuest(game) {
  const here = new Set(game.tickets.map((t) => t.guest && t.guest.id));
  const rival = guestById('rook');
  if (game.def.rival && !game.rivalSeen && game.clock > 20 && !here.has('rook')) { game.rivalSeen = true; return rival; }
  const critics = game.kitchenIndex >= 1 && game.rng.next() < 0.2;
  const pool = REGULARS.filter((r) => !here.has(r.id) && !!r.critic === critics && r.trait !== 'rival');
  const local = pool.filter((r) => (game.def.guests || []).includes(r.id));
  const pickFrom = local.length && game.rng.next() < 0.5 ? local : pool;
  return game.rng.pick(pickFrom.length ? pickFrom : REGULARS.filter((r) => !r.critic));
}

// The fussy critic's version of a dish: one topping (never the base layer) left out, named on the ticket.
export function fussyDish(dish, rng) {
  const choices = dish.layers.slice(1);
  const without = choices[Math.floor(rng.next() * choices.length)];
  const layers = [...dish.layers]; layers.splice(layers.indexOf(without), 1);
  return { ...dish, id: `${dish.id}-no-${without}`, base: dish.id, name: `${dish.name}, no ${without}`, layers, without };
}

// Patience and tip multipliers a trait brings.
export function traitPatience(guest) {
  return guest.trait === 'impatient' ? 0.65 : guest.critic ? 0.85 : 1;
}
export function traitTip(guest, dish) {
  if (guest.trait === 'tipper') return guest.tipMult || 2;
  if (guest.trait === 'impatient') return 1.3;
  if (guest.trait === 'fan') return dish.layers.includes(guest.loves) ? 1.5 : 0.8;
  return 1;
}

// The tag a ticket wears for its guest's trait, read at a glance on the board.
export function traitTag(guest, ticket, tally) {
  switch (guest.trait) {
    case 'tipper': return { text: 'BIG TIPPER', color: '#ffd34d' };
    case 'impatient': return { text: 'IN A HURRY', color: '#ff9a7a' };
    case 'fan': return { text: `LOVES ${guest.loves.toUpperCase()}`, color: '#ffb0e8' };
    case 'fussy': return { text: `NO ${(ticket.dish.without || '').toUpperCase()}`, color: '#ff6a4a' };
    case 'rival': return { text: `RIVAL ${tally ? tally.won : 0}-${tally ? tally.lost : 0}`, color: '#d9a0ff' };
    default: return null;
  }
}

// Mood from what is happening to their order: plate at the hatch, or how much patience is left.
export function moodOf(game, ticket) {
  const atHatch = game.kitchen.list.some((t) => t.type === 'hatch' && t.item && t.item.ticketUid === ticket.uid);
  if (atHatch) return 'delighted';
  const share = ticket.patience / ticket.max;
  return share > 0.6 ? 'patient' : share > 0.3 ? 'hungry' : 'furious';
}

export function guestLine(game, ticket) {
  return ticket.guest.lines[moodOf(game, ticket)];
}

export const MOOD_COLOR = { patient: '#4cc24a', hungry: '#ffb02e', furious: '#ff3b2f', delighted: '#ff6ad0' };
