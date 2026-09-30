/**
 * Consentement aux contenus LinkedIn intégrés (iframes susceptibles de déposer des cookies).
 * Le choix est conservé 6 mois dans le navigateur (recommandation CNIL), puis redemandé.
 */
export type ChoixConsentement = 'accepte' | 'refuse';

export const CLE_CONSENTEMENT = 'glm-consentement-linkedin';
export const DUREE_CONSENTEMENT_MS = 1000 * 60 * 60 * 24 * 182;
export const EVENEMENT_CONSENTEMENT = 'glm:consentement';

interface ValeurStockee {
  choix: ChoixConsentement;
  date: number;
}

type Stockage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function estValeurStockee(valeur: unknown): valeur is ValeurStockee {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const { choix, date } = valeur as Record<string, unknown>;
  return (choix === 'accepte' || choix === 'refuse') && typeof date === 'number';
}

/** Retourne le choix enregistré, ou null s'il est absent, illisible ou expiré. */
export function lireConsentement(stockage: Stockage, maintenant = Date.now()): ChoixConsentement | null {
  try {
    const brut = stockage.getItem(CLE_CONSENTEMENT);
    if (!brut) return null;
    const valeur: unknown = JSON.parse(brut);
    if (!estValeurStockee(valeur) || maintenant - valeur.date > DUREE_CONSENTEMENT_MS) {
      stockage.removeItem(CLE_CONSENTEMENT);
      return null;
    }
    return valeur.choix;
  } catch {
    return null;
  }
}

export function enregistrerConsentement(
  stockage: Stockage,
  choix: ChoixConsentement,
  maintenant = Date.now(),
): void {
  try {
    stockage.setItem(CLE_CONSENTEMENT, JSON.stringify({ choix, date: maintenant } satisfies ValeurStockee));
  } catch {
    // Stockage indisponible (navigation privée stricte) : le choix vaut pour la page en cours.
  }
}

/** Accès sûr à localStorage (peut lever une exception si les données de site sont bloquées). */
export function stockageNavigateur(): Stockage {
  try {
    return window.localStorage;
  } catch {
    const memoire = new Map<string, string>();
    return {
      getItem: (cle) => memoire.get(cle) ?? null,
      setItem: (cle, valeur) => void memoire.set(cle, valeur),
      removeItem: (cle) => void memoire.delete(cle),
    };
  }
}
