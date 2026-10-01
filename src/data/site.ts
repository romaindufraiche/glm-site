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
  /** Parcours, affiché sous le rôle en une ligne courte (ex. « Télécom Paris · ESSEC »). */
  formation?: string;
  /** Deux phrases maximum : ce que l’associé apporte concrètement aux clients. */
  bio: string;
  /** Domaines d’expertise affichés en repères (3 à 4 mots-clés courts). */
  expertises: string[];
  /** Couleur de la bande du fondateur (ordre du logo : corail, jade, bleu). */
  accent: Accent;
  /**
   * Nom du fichier photo déposé dans src/assets/equipe/ (ex. « romain-dufraiche.jpg »).
   * Photo carrée, visage centré, 400 × 400 px minimum : elle est affichée dans un petit rond
   * et le site génère lui-même les versions optimisées. Sans photo, les initiales s’affichent.
   */
  photo?: string;
  /** URL du profil LinkedIn personnel. */
  linkedin?: string;
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
  /** Numéro WhatsApp au format international, sans « + » ni espaces. */
  whatsapp: '33651280191',
  whatsappMessage: 'Bonjour GLM, je souhaite échanger sur un projet.',
  /** Script PHP de traitement du formulaire, déposé avec le site sur OVH (voir public/contact.php). */
  endpoint: '/contact.php',
  sujets: ['Web & communication', 'Automatisation & IA', 'Robotique', 'Autre'],
} as const;

/* ------------------------------------------------------------------ */
/* Offres                                                             */
/* ------------------------------------------------------------------ */

export const calibres: Record<CalibreId, Calibre> = {
  web: { numero: '01', nom: 'Web & communication', accent: 'bleu' },
  ia: { numero: '02', nom: 'Automatisation & IA', accent: 'corail' },
  robotique: { numero: '03', nom: 'Robotique', accent: 'jade' },
};

export const expertises: Expertise[] = [
  {
    calibre: 'web',
    titre: 'La façade',
    texte:
      'Sites, e-commerce, applications, personal branding, campagnes de prospection et de communication. Ce qui vous rend visible et construit votre image.',
  },
  {
    calibre: 'ia',
    titre: 'La structure',
    texte:
      'Process automatisés, données, IA intégrée à vos outils. Ce qui fait tourner l’entreprise et vous fait gagner du temps et de l’argent.',
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

export const equipe: { titre: string; texte: string; associes: Associe[] } = {
  titre: 'Trois associés, une seule équipe.',
  texte:
    'On s’est rencontrés en cours de data science à UC Irvine, en Californie. De retour en France, on a créé GLM pour construire quelque chose à nous. Chaque projet est suivi par toute l’équipe, du premier échange à la mise en service.',
  // TODO: vérifier que chaque photo correspond au bon associé.
  associes: [
    {
      prenom: 'Romain',
      nom: 'Dufraiche',
      role: 'Président',
      formation: 'Télécom Paris · ESSEC',
      bio: 'Il porte la vision stratégique de GLM et traduit vos besoins métier en un projet clair.',
      expertises: ['Stratégie', 'Organisation', 'Relation client'],
      accent: 'corail',
      photo: 'romain-dufraiche.webp',
      linkedin: 'https://www.linkedin.com/in/romain-dufraiche/',
    },
    {
      prenom: 'Théo',
      nom: 'Delaforge',
      role: 'Expert technique',
      formation: 'École des Mines',
      bio: 'Il conçoit l’architecture de chaque solution et veille à sa solidité, du code à la mise en production.',
      expertises: ['Architecture', 'Développement', 'IA & données'],
      accent: 'jade',
      photo: 'theo-delaforge.png',
      linkedin: 'https://www.linkedin.com/in/theo-delaforge/',
    },
    {
      prenom: 'Romain',
      nom: 'Yerolymos',
      role: 'Développement et partenariats',
      formation: 'Expert en cybersécurité',
      bio: 'Il sécurise les systèmes que l’on construit et développe les partenariats de GLM.',
      expertises: ['Cybersécurité', 'Partenariats', 'Réseau'],
      accent: 'bleu',
      photo: 'romain-yerolymos.webp',
      linkedin: 'https://www.linkedin.com/in/romain-yerolymos/',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Actualités LinkedIn                                                */
/* ------------------------------------------------------------------ */

/**
 * Posts LinkedIn affichés dans la rubrique Actualités, du plus récent au plus ancien.
 * Coller au choix le lien du post (menu « … » → « Copier le lien vers le post »)
 * ou l’URL d’intégration officielle (menu « … » → « Intégrer ce post », valeur de src).
 * Les paramètres de suivi du lien sont ignorés automatiquement.
 *
 * Les iframes ne sont chargées qu’après consentement (bandeau cookies).
 */
// TODO: ajouter un 3e post (idéalement depuis la page entreprise GLM).
export const postsLinkedIn: string[] = [
  'https://www.linkedin.com/posts/romain-dufraiche_datascience-ai-generativeai-activity-7406866497341452288-Wxge',
  'https://www.linkedin.com/posts/romain-dufraiche_echec-ia-data-activity-7348087063193239552-Rr_i',
];
