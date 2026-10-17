/**
 * Adapte le site à son hébergement, choisi au moment du build :
 * - « ovh » (par défaut) : hébergement mutualisé OVH, formulaire de contact traité en PHP ;
 * - « github-pages » : site statique servi par GitHub Pages, sans PHP, donc sans formulaire
 *   (le contact passe par e-mail, WhatsApp et LinkedIn).
 *
 * PUBLIC_MASQUER_EXEMPLES=oui retire les projets d’exemple du site publié.
 */
import { hebergeurs, projets } from '../data/site';

const surGitHubPages = import.meta.env.PUBLIC_HEBERGEMENT === 'github-pages';

export const hebergement = surGitHubPages
  ? { cible: 'github-pages', hebergeur: hebergeurs.githubPages, formulaire: false, enFrance: false }
  : { cible: 'ovh', hebergeur: hebergeurs.ovh, formulaire: true, enFrance: true };

/** Projets affichés : sans les projets d’exemple quand PUBLIC_MASQUER_EXEMPLES vaut « oui ». */
export const projetsAffiches =
  import.meta.env.PUBLIC_MASQUER_EXEMPLES === 'oui' ? projets.filter((projet) => !projet.exemple) : projets;

/**
 * Chemin interne préfixé par la base du site (« / » chez OVH, « /glm-site/ » sur GitHub Pages).
 * À utiliser pour tout lien ou fichier interne : lien('/confidentialite/'), lien('/#contact').
 */
export function lien(chemin: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}${chemin.startsWith('/') ? chemin : `/${chemin}`}`;
}
