import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteMeta } from './src/data/site';

// Site 100 % statique. Par défaut, construit pour la racine d'un domaine (OVH) ; SITE_URL et BASE_PATH
// l'adaptent à un sous-dossier, comme GitHub Pages (https://romaindufraiche.github.io/glm-site/).
export default defineConfig({
  site: process.env['SITE_URL'] ?? siteMeta.url,
  base: process.env['BASE_PATH'] ?? '/',
  trailingSlash: 'ignore',
  // La compression HTML d'Astro supprime l'espace entre un texte et un lien placé à la ligne :
  // désactivée pour préserver la typographie (le serveur compresse déjà en gzip).
  compressHTML: false,
  build: {
    format: 'directory',
    // Feuilles de style externes : compatibles avec une Content-Security-Policy stricte (voir public/.htaccess).
    inlineStylesheets: 'never',
  },
  vite: {
    build: {
      // Aucun script ni asset inliné : tout le JS est servi depuis /_astro/, autorisé par script-src 'self'.
      assetsInlineLimit: 0,
      // La scène 3D de l’accueil embarque three.js (environ 650 ko, 170 ko compressé), chargé après l’affichage.
      chunkSizeWarningLimit: 700,
    },
  },
  integrations: [
    sitemap({
      // Pages utilitaires exclues du sitemap (elles portent aussi une balise noindex).
      filter: (page) =>
        !['/404', '/message-envoye', '/message-non-envoye'].some((chemin) => page.includes(chemin)),
    }),
  ],
});
