// Meridian Courier hand-in (Node 22, standard library only): copies the game's
// static files and its screenshots beside this file into /output, then writes
// /output/dossier.json with the vendored make.fun dossier builder, so the
// judge can read the game from its screenshots and its source outline.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function copyTree(source, target) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
}

function handIn() {
  mkdirSync(outputDir, { recursive: true });
  copyTree(join(repoRoot, 'game'), join(outputDir, 'game'));
  if (existsSync(join(repoRoot, 'screenshots'))) {
    copyTree(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'));
  } else {
    mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
  }
  // The scorer's own caps, mirrored from the kit's gate: the dossier text is
  // capped at 160 KiB, at most 4 screenshots of 256 KiB, game/ at most 993
  // files and 48 MiB with paths under 1000 bytes.
  const dossier = buildDossier(outputDir, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  });
  writeFileSync(join(outputDir, 'dossier.json'), dossier);
}

handIn();
