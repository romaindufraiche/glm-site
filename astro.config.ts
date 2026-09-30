import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { siteMeta } from './src/data/site';

// Site 100 % statique : le dossier dist/ est déposé tel quel sur l'hébergement OVH (FTP).
export default defineConfig({
  site: siteMeta.url,
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
