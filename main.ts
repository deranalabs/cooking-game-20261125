// Hand-in for "Copper Lantern Kitchen", a make.fun best-cooking-game entry (Node 22, standard library only).
// The game is game/: a top-down kitchen rush in plain canvas ES modules, no library, no network. You chop,
// cook and plate eight dishes from ten ingredients over three shifts against an order board of tickets.
// This program copies game/ and screenshots/ to /output (or MAKEFUN_OUTPUT_DIR) and writes dossier.json
// with the kit's unchanged buildDossier.
//
//   node serve.ts                                      play at http://localhost:8080
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts  build the hand-in locally

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
