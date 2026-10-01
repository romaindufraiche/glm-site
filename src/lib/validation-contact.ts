/**
 * Règles de validation du formulaire de contact.
 * Ces règles sont dupliquées côté serveur dans public/contact.php (seule validation qui fait foi) :
 * toute modification doit être reportée dans les deux fichiers.
 */
export const SUJETS = ['Web & communication', 'Automatisation & IA', 'Robotique', 'Autre'] as const;
export type Sujet = (typeof SUJETS)[number];

export const LIMITES = {
  nom: { min: 2, max: 100 },
  email: { max: 254 },
  entreprise: { max: 120 },
  message: { min: 10, max: 5000 },
} as const;

export interface DonneesContact {
  nom: string;
  email: string;
  entreprise: string;
  sujet: string;
  message: string;
}

export type ChampContact = keyof DonneesContact;
export type ErreursContact = Partial<Record<ChampContact, string>>;

// Volontairement simple : le serveur revalide avec filter_var(FILTER_VALIDATE_EMAIL).
const MOTIF_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validerChamp(champ: ChampContact, valeurBrute: string): string | undefined {
  const valeur = valeurBrute.trim();
  switch (champ) {
    case 'nom':
      if (!valeur) return 'Indiquez votre nom.';
      if (valeur.length < LIMITES.nom.min)
        return `Votre nom doit contenir au moins ${LIMITES.nom.min} caractères.`;
      if (valeur.length > LIMITES.nom.max)
        return `Votre nom ne doit pas dépasser ${LIMITES.nom.max} caractères.`;
      return undefined;
    case 'email':
      if (!valeur) return 'Indiquez votre adresse e-mail.';
      if (valeur.length > LIMITES.email.max || !MOTIF_EMAIL.test(valeur))
        return 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.fr.';
      return undefined;
    case 'entreprise':
      if (valeur.length > LIMITES.entreprise.max)
        return `Le nom de l’entreprise ne doit pas dépasser ${LIMITES.entreprise.max} caractères.`;
      return undefined;
    case 'sujet':
      if (!(SUJETS as readonly string[]).includes(valeur)) return 'Choisissez un sujet.';
      return undefined;
    case 'message':
      if (!valeur) return 'Écrivez votre message.';
      if (valeur.length < LIMITES.message.min)
        return `Votre message doit contenir au moins ${LIMITES.message.min} caractères.`;
      if (valeur.length > LIMITES.message.max)
        return `Votre message ne doit pas dépasser ${LIMITES.message.max} caractères.`;
      return undefined;
  }
}

export function validerContact(donnees: DonneesContact): ErreursContact {
  const erreurs: ErreursContact = {};
  (Object.keys(donnees) as ChampContact[]).forEach((champ) => {
    const erreur = validerChamp(champ, donnees[champ]);
    if (erreur) erreurs[champ] = erreur;
  });
  return erreurs;
}
