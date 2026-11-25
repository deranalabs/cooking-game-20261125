// SPDX-License-Identifier: MIT
// The regulars and critics at the order board: who orders, their colour, their live mood and what they say.

// critic: pays more and judges the plate's freshness; lines are spoken on the ticket for each mood.
export const REGULARS = [
  { id: 'marlow', name: 'Old Marlow', color: '#3f7fbf', skin: '#e8b98f', hat: 'cap',
    lines: { patient: 'No rush, lad. The river waits.', hungry: 'Getting peckish over here...', furious: 'My tea went cold an hour ago!', delighted: 'Now that is a proper plate.' } },
  { id: 'pip', name: 'Pip Tallow', color: '#e0702a', skin: '#f2cfa8', hat: 'bow',
    lines: { patient: 'Extra crunchy, please!', hungry: 'Is it nearly done? Is it?', furious: 'I am TELLING my mum!', delighted: 'Best. Lunch. Ever!' } },
  { id: 'greta', name: 'Greta Fenn', color: '#5a9a4a', skin: '#d9a77c', hat: 'scarf',
    lines: { patient: 'Take your time, dear.', hungry: 'My knitting club is waiting.', furious: 'In my day cooks were quick!', delighted: 'Just like my mother made.' } },
  { id: 'osei', name: 'Kofi Osei', color: '#8a4ab0', skin: '#8a5a3a', hat: 'beanie',
    lines: { patient: 'Smells good from out here.', hungry: 'Shift starts in ten, chef.', furious: 'I am going to be late!', delighted: 'You saved my whole night.' } },
  { id: 'luz', name: 'Luz Arroyo', color: '#d0405a', skin: '#c98d62', hat: 'flower',
    lines: { patient: 'Surprise me, chef!', hungry: 'My stomach is singing...', furious: 'This is a tragedy!', delighted: 'Bravo! Bravissimo!' } },
  { id: 'brom', name: 'Brom the Docker', color: '#6a6a72', skin: '#e0a882', hat: 'none',
    lines: { patient: 'Big portion. Real big.', hungry: 'Hungry enough to eat a crate.', furious: 'GRRR. Food. Now.', delighted: 'Hah! That hits the spot.' } },
  { id: 'vale', name: 'Critic Ines Vale', color: '#1f1f2a', skin: '#efd2b4', hat: 'beret', critic: true,
    lines: { patient: 'I shall be taking notes.', hungry: 'Service is... leisurely.', furious: 'One star. Perhaps none.', delighted: 'Exquisite. Truly.' } },
  { id: 'quill', name: 'Critic B. Quill', color: '#b08a2a', skin: '#d6a274', hat: 'top', critic: true,
    lines: { patient: 'Impress me, if you can.', hungry: 'The clock is ticking, chef.', furious: 'Appalling. Simply appalling.', delighted: 'I may write a sonnet.' } },
];

export const CRITIC_PAY = 1.6;

// Who walks up next: no one already at the board, and a critic only from the second kitchen on.
export function pickGuest(game) {
  const here = new Set(game.tickets.map((t) => t.guest && t.guest.id));
  const critics = game.kitchenIndex >= 1 && game.rng.next() < 0.2;
  const pool = REGULARS.filter((r) => !here.has(r.id) && !!r.critic === critics);
  return game.rng.pick(pool.length ? pool : REGULARS.filter((r) => !r.critic));
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
