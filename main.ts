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

// The scorer's caps: refuse here what the gate would refuse there (3 to 4 screenshots of 256 KiB at most,
// game/ at most 993 entries and 48 MiB, paths at most 1000 bytes, dossier text cut at 160 KiB).
const LIMITS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// The kitchen itself: index.html and its modules, copied as plain files.
function copyKitchen(from: string, to: string): void {
  mkdirSync(to, { recursive: true });
  cpSync(join(from, 'game'), join(to, 'game'), { recursive: true });
}

// The cover and the other shots the judge's contact sheet is made from.
function copyScreenshots(from: string, to: string): void {
  mkdirSync(join(to, 'screenshots'), { recursive: true });
  if (existsSync(join(from, 'screenshots'))) cpSync(join(from, 'screenshots'), join(to, 'screenshots'), { recursive: true });
}

// dossier.json, written by the kit's own library so the gate can rebuild it byte for byte.
function writeDossier(to: string): void {
  writeFileSync(join(to, 'dossier.json'), buildDossier(to, LIMITS));
}

copyKitchen(repoRoot, outputDir);
copyScreenshots(repoRoot, outputDir);
writeDossier(outputDir);
