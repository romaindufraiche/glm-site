/**
 * Garde-fou avant mise en ligne : échoue si le site construit (dist/) contient encore
 * un contenu provisoire (« TODO », projet d'exemple, domaine provisoire).
 *
 * Usage : npm run build && npm run verifier:production
 */
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const MOTIFS = [
  { motif: /TODO/, raison: 'contenu marqué TODO' },
  { motif: /class="carte__exemple"/, raison: 'projet d’exemple (retirer « exemple: true »)' },
  { motif: /todo-domaine/i, raison: 'nom de domaine provisoire' },
];

async function* fichiers(dossier) {
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = join(dossier, entree.name);
    if (entree.isDirectory()) yield* fichiers(chemin);
    else if (/\.(html|xml|txt)$/.test(entree.name)) yield chemin;
  }
}

const problemes = [];
for await (const fichier of fichiers('dist')) {
  const contenu = await readFile(fichier, 'utf8');
  for (const { motif, raison } of MOTIFS) if (motif.test(contenu)) problemes.push(`${fichier} : ${raison}`);
}

if (problemes.length > 0) {
  process.stderr.write(`Le site n’est pas prêt pour la production :\n  ${problemes.join('\n  ')}\n`);
  process.exit(1);
}
process.stdout.write('Aucun contenu provisoire détecté dans dist/.\n');
