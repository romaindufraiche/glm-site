/**
 * Outils pour les posts LinkedIn intégrés via le code officiel d’intégration.
 *
 * Deux formats d’URL sont acceptés dans src/data/site.ts :
 * - l’URL d’intégration officielle (menu « … » → « Intégrer ce post ») :
 *   https://www.linkedin.com/embed/feed/update/urn:li:share:7000000000000000000
 * - le lien de partage d’un post (menu « … » → « Copier le lien vers le post ») :
 *   https://www.linkedin.com/posts/prenom-nom_sujet-activity-7000000000000000000-AbCd
 * Les paramètres de suivi (utm, rcm…) sont ignorés : ils ne sont jamais publiés sur le site.
 */
const PREFIXE_EMBED = 'https://www.linkedin.com/embed/feed/update/';
const PREFIXE_POSTS = 'https://www.linkedin.com/posts/';

export interface PostLinkedIn {
  /** URL de l’iframe (src du code d’intégration). */
  embed: string;
  /** URL publique du post, pour la carte de remplacement. */
  lien: string;
}

/** Valide une URL de post LinkedIn et en déduit l’iframe et le lien public. Lève une erreur au build si invalide. */
export function analyserPostLinkedIn(url: string): PostLinkedIn {
  const propre =
    url
      .trim()
      .split(/[?#]/)[0]
      ?.replace(/[./]+$/, '') ?? '';

  if (propre.startsWith(PREFIXE_EMBED)) {
    const urn = propre.slice(PREFIXE_EMBED.length);
    if (!/^urn:li:(share|ugcPost|activity):\d+$/.test(urn)) {
      throw new Error(`Identifiant de post LinkedIn invalide : « ${urn} ».`);
    }
    return { embed: `${PREFIXE_EMBED}${urn}`, lien: `https://www.linkedin.com/feed/update/${urn}/` };
  }

  if (propre.startsWith(PREFIXE_POSTS)) {
    const chemin = propre.slice(PREFIXE_POSTS.length);
    const activite = /^[\w%-]+-activity-(\d{10,25})-[\w-]+$/.exec(chemin)?.[1];
    if (!activite) {
      throw new Error(`Lien de post LinkedIn invalide : « ${propre} ».`);
    }
    return {
      embed: `${PREFIXE_EMBED}urn:li:activity:${activite}`,
      lien: `${PREFIXE_POSTS}${chemin}/`,
    };
  }

  throw new Error(
    `URL LinkedIn invalide dans src/data/site.ts : « ${url.trim()} ». Attendu : un lien de post (${PREFIXE_POSTS}…) ou une URL d’intégration (${PREFIXE_EMBED}…).`,
  );
}
