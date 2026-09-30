/**
 * Outils pour les posts LinkedIn intégrés via le code officiel « Intégrer ce post ».
 * Seules les URL d'intégration https://www.linkedin.com/embed/feed/update/… sont acceptées.
 */
const PREFIXE_EMBED = 'https://www.linkedin.com/embed/feed/update/';

export interface PostLinkedIn {
  /** URL de l'iframe (src du code d'intégration). */
  embed: string;
  /** URL publique du post, pour la carte de remplacement. */
  lien: string;
}

/** Valide une URL d'intégration et en déduit le lien public du post. Lève une erreur au build si invalide. */
export function analyserPostLinkedIn(url: string): PostLinkedIn {
  const propre = url.trim();
  if (!propre.startsWith(PREFIXE_EMBED)) {
    throw new Error(
      `URL LinkedIn invalide dans src/data/site.ts : « ${propre} ». Attendu : une URL commençant par ${PREFIXE_EMBED}`,
    );
  }
  const urn = propre.slice(PREFIXE_EMBED.length).split('?')[0] ?? '';
  if (!/^urn:li:(share|ugcPost|activity):\d+$/.test(urn)) {
    throw new Error(`Identifiant de post LinkedIn invalide : « ${urn} ».`);
  }
  return { embed: `${PREFIXE_EMBED}${urn}`, lien: `https://www.linkedin.com/feed/update/${urn}/` };
}
