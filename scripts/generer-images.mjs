/**
 * Génère les images dérivées du symbole GLM dans public/ :
 * favicon.ico (16, 32, 48 px), apple-touch-icon.png (180 px), favicon-512.png et og-image.png (1200 × 630).
 *
 * Usage : node scripts/generer-images.mjs
 * (Chromium via Playwright ; à relancer uniquement si le logo ou l'image de partage change.)
 */
import { chromium } from '@playwright/test';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('..', import.meta.url));
const symbole = await readFile(`${racine}public/favicon.svg`, 'utf8');
async function policeBase64(chemin) {
  return `data:font/woff2;base64,${(await readFile(`${racine}node_modules/${chemin}`)).toString('base64')}`;
}

const caslon = await policeBase64(
  '@fontsource/libre-caslon-display/files/libre-caslon-display-latin-400-normal.woff2',
);
const plex = await policeBase64('@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2');

// CHROMIUM_PATH (facultatif) : chemin d'un Chromium déjà installé, si Playwright n'a pas téléchargé le sien.
const navigateur = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const page = await navigateur.newPage();

async function capturer(html, largeur, hauteur) {
  await page.setViewportSize({ width: largeur, height: hauteur });
  await page.setContent(html);
  await page.evaluate(() => document.fonts.ready);
  return page.screenshot({ type: 'png' });
}

const icone = (taille) =>
  `<style>html,body{margin:0}svg{display:block;width:${taille}px;height:${taille}px}</style>${symbole}`;

// Icônes carrées
const png = {};
for (const taille of [16, 32, 48, 180, 512]) png[taille] = await capturer(icone(taille), taille, taille);
await writeFile(`${racine}public/apple-touch-icon.png`, png[180]);
await writeFile(`${racine}public/favicon-512.png`, png[512]);

// favicon.ico : conteneur ICO avec images PNG embarquées (format accepté par tous les navigateurs actuels).
const tailles = [16, 32, 48];
const entete = Buffer.alloc(6 + 16 * tailles.length);
entete.writeUInt16LE(0, 0);
entete.writeUInt16LE(1, 2);
entete.writeUInt16LE(tailles.length, 4);
let decalage = entete.length;
tailles.forEach((taille, i) => {
  const o = 6 + 16 * i;
  entete.writeUInt8(taille, o);
  entete.writeUInt8(taille, o + 1);
  entete.writeUInt16LE(1, o + 4);
  entete.writeUInt16LE(32, o + 6);
  entete.writeUInt32LE(png[taille].length, o + 8);
  entete.writeUInt32LE(decalage, o + 12);
  decalage += png[taille].length;
});
await writeFile(`${racine}public/favicon.ico`, Buffer.concat([entete, ...tailles.map((t) => png[t])]));

// Image Open Graph : fond Nuit, symbole (le carré se fond dans le fond), logotype et surtitre avec filet.
const og = `
<style>
  @font-face { font-family: Caslon; src: url(${caslon}); }
  @font-face { font-family: Plex; src: url(${plex}); font-weight: 600; }
  html, body { margin: 0; }
  body { width: 1200px; height: 630px; background: #0B1533; color: #F4EFE4; display: flex; align-items: center; gap: 72px; padding: 0 112px; box-sizing: border-box; }
  svg { width: 300px; height: 300px; flex-shrink: 0; }
  .nom { font-family: Caslon; font-size: 150px; letter-spacing: 0.14em; line-height: 1; }
  .sur { display: flex; align-items: center; gap: 18px; margin-top: 40px; font-family: Plex; font-weight: 600; font-size: 26px; letter-spacing: 0.14em; text-transform: uppercase; }
  .filet { display: flex; } .filet i { width: 22px; height: 5px; display: block; }
</style>
${symbole}
<div>
  <div class="nom">GLM</div>
  <div class="sur"><span class="filet"><i style="background:#E9674F"></i><i style="background:#2FA877"></i><i style="background:#3F63F2"></i></span>Architectes de la tech</div>
</div>`;
await writeFile(`${racine}public/og-image.png`, await capturer(og, 1200, 630));

await navigateur.close();
process.stdout.write('Images générées dans public/\n');
