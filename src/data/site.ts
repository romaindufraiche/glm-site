/**
 * Contenu éditable du site GLM.
 *
 * C’est le SEUL fichier à modifier pour changer les textes, les projets, l’équipe,
 * les posts LinkedIn ou les coordonnées. Les composants ne contiennent aucun contenu métier.
 * Les types garantissent qu’une donnée mal saisie fait échouer le build (npm run build)
 * au lieu de casser le site en production.
 *
 * Chaque contenu provisoire est marqué « TODO: » : la liste complète est dans le README.
 */

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

/** Les trois couleurs d’accent de la charte. */
export type Accent = 'corail' | 'jade' | 'bleu';

export type CalibreId = 'web' | 'ia' | 'robotique';

export interface Calibre {
  numero: '01' | '02' | '03';
  nom: string;
  accent: Accent;
}

export interface Expertise {
  calibre: CalibreId;
  titre: string;
  texte: string;
  /** Mention affichée sous le texte, par exemple « En préparation ». */
  statut?: string;
}

export interface Projet {
  nom: string;
  client: string;
  calibre: CalibreId;
  resultat: string;
  lien?: { url: string; libelle: string };
  /** Projet d’exemple : la carte affiche la mention « Exemple ». À retirer une fois le vrai projet saisi. */
  exemple?: boolean;
}

export interface EtapeMethode {
  titre: string;
  texte: string;
}

export interface Associe {
  prenom: string;
  nom: string;
  role: string;
  description?: string;
  /** Couleur de la bande du fondateur (ordre du logo : corail, jade, bleu). */
  accent: Accent;
  /** Chemin d’une photo dans public/ (ex. « /equipe/romain.jpg »), carrée, 800 × 800 px minimum. */
  photo?: string;
}

/* ------------------------------------------------------------------ */
/* Identité et coordonnées                                            */
/* ------------------------------------------------------------------ */

export const siteMeta = {
  nom: 'GLM',
  // TODO: remplacer par le nom de domaine définitif (utilisé pour les URL canoniques, le sitemap et l’Open Graph).
  url: 'https://www.TODO-domaine-glm.fr',
  titre: 'GLM · Architectes de la tech',
  description:
    'GLM conçoit et construit les systèmes numériques des entreprises : sites web, automatisation et intelligence artificielle, et demain robots autonomes. Une seule équipe, du premier échange à la mise en service.',
  signature: 'IA & data · Robotique · Web',
  locale: 'fr_FR',
} as const;

export const entreprise = {
  raisonSociale: 'GLM',
  forme: 'SAS',
  // TODO: vérifier le SIREN (repris de l’ancien site).
  siren: '108 105 529',
  // TODO: compléter le RCS (ville du greffe), ex. « RCS Pontoise 108 105 529 ».
  rcs: 'TODO: RCS',
  // TODO: compléter le capital social.
  capital: 'TODO: capital social',
  // TODO: compléter l’adresse du siège social.
  adresse: 'TODO: adresse du siège social',
  // TODO: compléter le numéro de TVA intracommunautaire.
  tva: 'TODO: numéro de TVA intracommunautaire',
  // TODO: compléter le numéro de téléphone (obligatoire dans les mentions légales, LCEN art. 6).
  telephone: 'TODO: numéro de téléphone',
  departement: 'Val-d’Oise',
  // TODO: confirmer le directeur de la publication (en principe le Président).
  directeurPublication: 'Romain Dufraiche, Président',
  // TODO: indiquer la date de mise en ligne des pages légales (ex. « 15 octobre 2026 »).
  miseAJourLegale: 'TODO: date de mise en ligne',
  hebergeur: {
    nom: 'OVH SAS',
    adresse: '2 rue Kellermann, 59100 Roubaix, France',
    telephone: '1007',
    url: 'https://www.ovhcloud.com',
  },
} as const;

export const contact = {
  // TODO: remplacer par une adresse professionnelle (ex. contact@domaine.fr). Adresse reprise de l’ancien site.
  email: 'romain.dufraiche@gmail.com',
  // TODO: vérifier l’URL de la page LinkedIn (reprise de l’ancien site).
  linkedin: 'https://www.linkedin.com/company/glmprime/',
  /** Script PHP de traitement du formulaire, déposé avec le site sur OVH (voir public/contact.php). */
  endpoint: '/contact.php',
  sujets: ['Web', 'Automatisation & IA', 'Robotique', 'Autre'],
} as const;

/* ------------------------------------------------------------------ */
/* Offres                                                             */
/* ------------------------------------------------------------------ */

export const calibres: Record<CalibreId, Calibre> = {
  web: { numero: '01', nom: 'Web', accent: 'bleu' },
  ia: { numero: '02', nom: 'Automatisation & IA', accent: 'corail' },
  robotique: { numero: '03', nom: 'Robotique', accent: 'jade' },
};

export const expertises: Expertise[] = [
  {
    calibre: 'web',
    titre: 'La façade',
    texte: 'Sites, e-commerce, applications. Ce que vos clients voient de vous.',
  },
  {
    calibre: 'ia',
    titre: 'La structure',
    texte: 'Process automatisés, données, IA intégrée à vos outils. Ce qui fait tourner l’entreprise.',
  },
  {
    calibre: 'robotique',
    titre: 'L’extension',
    texte: 'Robots autonomes pilotés par IA. Ce qui prend en charge le travail physique.',
    statut: 'En préparation',
  },
];

/* ------------------------------------------------------------------ */
/* Projets                                                            */
/* ------------------------------------------------------------------ */

// TODO: remplacer ces 4 projets d’exemple par de vrais projets (nom, client, phrase de résultat),
// puis retirer « exemple: true » : la carte affiche la mention « Exemple » tant qu’il est présent.
export const projets: Projet[] = [
  {
    nom: 'Site vitrine et boutique en ligne pour [client]',
    client: '[Client]',
    calibre: 'web',
    resultat: 'Un site rapide et une boutique que le client met à jour lui-même.',
    exemple: true,
  },
  {
    nom: 'Devis et relances automatisés',
    client: '[Client]',
    calibre: 'ia',
    resultat: 'Les devis et les relances partent seuls, sans ressaisie.',
    exemple: true,
  },
  {
    nom: 'Assistant IA pour les demandes courantes',
    client: '[Client]',
    calibre: 'ia',
    resultat: 'Les questions fréquentes ont une réponse immédiate. L’équipe garde les cas complexes.',
    exemple: true,
  },
  {
    nom: 'Application de prise de rendez-vous',
    client: '[Client]',
    calibre: 'web',
    resultat: 'Les clients réservent en ligne, le planning se remplit sans appel.',
    exemple: true,
  },
];

/* ------------------------------------------------------------------ */
/* Méthode                                                            */
/* ------------------------------------------------------------------ */

export const methode = {
  idee: 'La technologie s’adapte à votre métier, jamais l’inverse.',
  // TODO: relire les phrases des étapes (rédigées à partir de la charte v0.5).
  etapes: [
    { titre: 'Écouter', texte: 'On part de votre métier réel et de ce qui vous fait perdre du temps.' },
    {
      titre: 'Concevoir',
      texte: 'On dessine la solution sur mesure, avec un devis clair avant d’écrire une ligne.',
    },
    {
      titre: 'Construire',
      texte: 'On développe, on teste avec vous et on ajuste jusqu’à ce que tout tourne.',
    },
    {
      titre: 'Accompagner',
      texte: 'On met en service, on forme vos équipes et on reste après la livraison.',
    },
  ] satisfies EtapeMethode[],
} as const;

/* ------------------------------------------------------------------ */
/* Équipe                                                             */
/* ------------------------------------------------------------------ */

export const equipe: { texte: string; associes: Associe[] } = {
  texte:
    'Trois associés du Val-d’Oise, formés à l’informatique et à la data en Californie. De retour en France, on a créé GLM pour construire quelque chose à nous.',
  // TODO: ajouter les photos (champ « photo ») et confirmer l’attribution des couleurs de bande.
  associes: [
    {
      prenom: 'Romain',
      // TODO: confirmer le nom (déduit de l’adresse e-mail de l’ancien site).
      nom: 'Dufraiche',
      role: 'Président',
      description: 'Vision, organisation, relation client.',
      accent: 'corail',
    },
    {
      prenom: 'Théo',
      nom: 'Delaforge',
      role: 'Expert technique',
      accent: 'jade',
    },
    {
      prenom: 'Romain',
      nom: 'Yerolymos',
      role: 'Développement et partenariats',
      accent: 'bleu',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Actualités LinkedIn                                                */
/* ------------------------------------------------------------------ */

/**
 * URL d’intégration officielles LinkedIn (menu « … » d’un post → « Intégrer ce post »).
 * Copier uniquement la valeur de l’attribut src de l’iframe, par exemple :
 * https://www.linkedin.com/embed/feed/update/urn:li:share:7000000000000000000
 *
 * Les iframes ne sont chargées qu’après consentement (bandeau cookies).
 */
// TODO: ajouter les 3 URL d’intégration des posts à afficher.
export const postsLinkedIn: string[] = [];
