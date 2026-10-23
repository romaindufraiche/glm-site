import type { ImageMetadata } from 'astro';

const images = import.meta.glob<{ default: ImageMetadata }>('../assets/**/*.{png,jpg,jpeg,webp}', {
  eager: true,
});

/** Image déposée dans src/assets/<dossier>/ : le build échoue si le fichier cité dans site.ts n’existe pas. */
export function imageDe(dossier: 'equipe' | 'projets' | 'tascru', fichier: string): ImageMetadata {
  const image = images[`../assets/${dossier}/${fichier}`]?.default;
  if (!image) throw new Error(`Image introuvable dans src/assets/${dossier}/ : ${fichier}`);
  return image;
}
