[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/deranalabs/cooking-game-20261125/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/deranalabs/cooking-game-20261125/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

# Copper Lantern Kitchen

A top-down kitchen rush in plain canvas: chop, pan-fry, boil, deep-fry, bake and grill eighteen dishes from fourteen ingredients while eleven named regulars and critics wait at the order board.
A career runs through seven kitchens, each its own file under `game/src/kitchens/` with its layout, stations, tuning and hazard: the Galley Boat (swells roll you and loose food), Dunmore Market Stall (a shutter over the hatch), Tin Conveyor Diner (a belt), Saffron Rooftop (gusts blow out burners), Ember Hot Line (flare-ups over a charcoal grill), Gilded Banquet Hall (feast calls, pie ovens) and the Lantern Night Market (rain douses burners and floods the floor).
Guests have traits that change play: a big tipper, two in a hurry, two fans of one ingredient, a fussy critic who wants one ingredient left out, and Critic Sable Rook, a rival who follows you between two kitchens with a running tally.
Before each shift you plan a menu of four dishes the kitchen can cook; after it, the stars ledger shows stars, dishes, tips, burnt plates, best combo, the rival tally and the critic's word, and tips buy eight tools in two tiers each (knife, pot lid, skillet, plate warmer, tip jar, clogs, egg timer, hatch bell), each visible in the kitchen once bought.
Play it with `node serve.ts`; run the tests with `node --test test/*.mjs`.

MIT, see LICENSE
