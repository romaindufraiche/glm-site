/**
 * Logique des démos clients partagée par la page /admin/ : identifiant d’URL, adresse publique,
 * lecture des réponses de l’API. L’identifiant est recalculé côté serveur
 * (public/_serveur/demos-lib.php), qui fait foi : toute modification doit être reportée dans les deux.
 */

export interface Demo {
  slug: string;
  client: string;
  url: string;
  modifieLe: number;
  version: number | null;
  taille: number | null;
  auteur: string | null;
}

export interface EtatEspace {
  ok: true;
  connecte: boolean;
  csrf: string | null;
  utilisateur?: string;
  modeleUrl?: string;
  limiteEnvoi?: string;
  demos?: Demo[];
}

/** Identifiant d’URL : minuscules sans accents, chiffres et tirets, 60 caractères au plus. */
export function slugDemo(valeur: string): string {
  return valeur
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

export function slugValide(slug: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/.test(slug);
}

export function urlDemo(modele: string, slug: string): string {
  return modele.replace('{slug}', slug);
}

export function formaterTaille(octets: number): string {
  if (octets < 1024) return `${octets} o`;
  if (octets < 1024 * 1024) return `${Math.round(octets / 1024)} Ko`;
  return `${(octets / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`;
}

export function formaterDate(secondes: number): string {
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(
    new Date(secondes * 1000),
  );
}

export function estEtatEspace(valeur: unknown): valeur is EtatEspace {
  if (typeof valeur !== 'object' || valeur === null) return false;
  const { ok, connecte } = valeur as Record<string, unknown>;
  return ok === true && typeof connecte === 'boolean';
}

/** Message d’erreur d’une réponse de l’API, ou message générique si la réponse est illisible. */
export function messageErreur(valeur: unknown): string {
  if (typeof valeur === 'object' && valeur !== null) {
    const { message } = valeur as Record<string, unknown>;
    if (typeof message === 'string' && message !== '') return message;
  }
  return 'Le serveur ne répond pas correctement. Réessayez dans quelques instants.';
}
