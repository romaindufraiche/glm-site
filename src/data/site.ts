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
  /** Pour qui : le client, ou « Projet GLM » pour un outil développé en interne. */
  client: string;
  calibre: CalibreId;
  /** Le problème de départ, en une phrase. */
  besoin: string;
  /** Ce que fait l’outil : sa capacité phare. */
  capacite: string;
  /** Ce que la personne y gagne (temps, argent, productivité…). */
  gain: string;
  /** Capture d’écran déposée dans src/assets/projets/ (format paysage). */
  image?: { fichier: string; alt: string };
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
  // Domaine déduit de l’adresse contact@glmprime.com. À ajuster si le site est servi sans « www ».
  url: 'https://www.glmprime.com',
  titre: 'GLM · Architectes de la tech',
  description:
    'GLM conçoit et construit les systèmes numériques des entreprises : sites web, automatisation et intelligence artificielle, et demain robots autonomes. Une seule équipe, du premier échange à la mise en service.',
  locale: 'fr_FR',
} as const;

export const entreprise = {
  raisonSociale: 'GLM',
  forme: 'SAS',
  // Informations reprises de l’extrait Kbis du 28 juillet 2026.
  siren: '108 105 529',
  rcs: 'RCS Pontoise 108 105 529',
  capital: '300 €',
  adresse: '51 rue Pierre-Émile Lesacq, 95110 Sannois',
  // Numéro calculé à partir du SIREN (clé 09) : à vérifier dans l’espace professionnel impots.gouv.fr.
  tva: 'FR09 108 105 529',
  // Numéro obligatoire dans les mentions légales (LCEN art. 6) : numéro WhatsApp de GLM, à confirmer.
  telephone: '+33 6 51 28 01 91',
  departement: 'Val-d’Oise',
  /** Directeur de la publication : en SAS, le représentant légal (le Président). */
  directeurPublication: 'Romain Dufraiche, Président',
  /** Date de dernière mise à jour des pages légales : à changer à chaque modification de leur contenu. */
  miseAJourLegale: '1er octobre 2026',
  /**
   * Médiateur de la consommation : obligatoire uniquement si GLM vend à des particuliers
   * (Code de la consommation, art. L612-1). Laisser vide tant que les prestations sont réservées aux professionnels.
   */
  mediateur: undefined as { nom: string; url: string } | undefined,
  /** Données du formulaire de contact. */
  donnees: {
    messagerie: 'OVHcloud, France',
    // Durée recommandée par la CNIL pour les échanges avec des prospects : à ajuster si besoin.
    conservation: '3 ans à compter du dernier échange',
  },
} as const;

/**
 * Hébergeurs possibles du site (LCEN art. 6 : nom, adresse et téléphone de l’hébergeur).
 * Le build choisit le bon avec la variable PUBLIC_HEBERGEMENT (voir src/lib/hebergement.ts).
 */
export const hebergeurs = {
  ovh: {
    nom: 'OVH SAS',
    adresse: '2 rue Kellermann, 59100 Roubaix, France',
    telephone: '1007',
    url: 'https://www.ovhcloud.com',
  },
  githubPages: {
    nom: 'GitHub, Inc. (service GitHub Pages)',
    adresse: '88 Colin P. Kelly Jr. Street, San Francisco, CA 94107, États-Unis',
    // TODO: numéro relevé dans l’annuaire ARIN (contact « Office » de GitHub), à confirmer auprès de GitHub.
    telephone: '+1 415 857 5430',
    url: 'https://github.com',
  },
} as const;

export const contact = {
  email: 'contact@glmprime.com',
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

// Projets décrits par les associés (message vocal du 23 octobre 2026), captures du dossier Drive « Site / Projets ».
export const projets: Projet[] = [
  {
    nom: 'ADPVO, le site de l’Amicale des Policiers du Val-d’Oise',
    client: 'Amicale des Policiers du Val-d’Oise',
    calibre: 'web',
    besoin: 'Donner à l’Amicale un vrai site de CSE, que le bureau fait vivre seul.',
    capacite:
      'Billetterie avec commande en ligne, adhésion via HelloAsso, annonces entre collègues, posts « À la une » et espace bureau complet.',
    gain: 'Le bureau publie offres et actualités lui-même et reçoit les commandes déjà triées, export compris.',
    image: {
      fichier: 'adpvo.webp',
      alt: 'Page d’accueil du site de l’ADPVO : bandeau bleu, blanc, rouge et catégories d’offres.',
    },
    lien: { url: 'https://adpvo.fr', libelle: 'Voir le site' },
  },
  {
    nom: 'Atelier, l’organisateur de projets',
    client: 'Projet GLM',
    calibre: 'web',
    besoin: 'Suivre plusieurs projets, leurs tâches et le temps passé, sans jongler entre plusieurs outils.',
    capacite:
      'Projets, tâches épinglées, réunions, suivi des heures, tableau de bord, boîte de réception et calendrier au même endroit.',
    gain: 'Moins de temps à s’organiser, plus à produire : on s’en sert nous-mêmes au quotidien.',
    image: {
      fichier: 'atelier.webp',
      alt: 'Écran d’Atelier : liste de tâches d’un projet, avec dates, étiquettes et tâches épinglées.',
    },
  },
  {
    nom: 'CrocoMix, le studio de remix',
    client: 'Projet GLM',
    calibre: 'ia',
    besoin: 'Retravailler un morceau quand on n’a que le fichier final.',
    capacite:
      'L’IA sépare la voix, la basse, la batterie, la guitare et le piano. Chaque piste se règle, se coupe et reçoit ses propres effets.',
    gain: 'Remixer, s’entraîner sur un instrument ou enregistrer sa propre partie, directement dans le navigateur.',
    image: {
      fichier: 'crocomix.webp',
      alt: 'Console de CrocoMix : une piste par instrument, effets, oscilloscope et égaliseur.',
    },
  },
  {
    nom: 'InfoHub, le tableau de bord personnel',
    client: 'Projet GLM',
    calibre: 'ia',
    besoin: 'Avoir l’essentiel de sa journée sur un seul écran.',
    capacite:
      'Météo, marchés, actualités, sport, musique et état de l’ordinateur, alimentés en direct par de nombreuses sources de données.',
    gain: 'Un coup d’œil au lieu de passer d’un site à l’autre.',
    image: {
      fichier: 'infohub.webp',
      alt: 'Tableau de bord InfoHub au style néon : météo, crypto, actualités, musique et sport.',
    },
  },
  {
    nom: 'Un jeu roguelike dans le navigateur',
    client: 'Projet GLM',
    calibre: 'web',
    besoin: 'Prouver qu’un jeu complet peut tourner sans rien installer.',
    capacite: 'Cinq classes, plus de neuf niveaux, un mode infini et de nombreux objets à collectionner.',
    gain: 'On ouvre un lien et on joue, sur n’importe quel ordinateur.',
    image: {
      fichier: 'roguelike.webp',
      alt: 'Partie du roguelike : le héros affronte des monstres dans une salle de donjon.',
    },
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
/* Vision                                                             */
/* ------------------------------------------------------------------ */

export const vision: { cap: string; principes: { titre: string; texte: string; accent: Accent }[] } = {
  cap: 'Notre cap\u00a0: rendre l’IA et la robotique autonomes concrètes pour les entreprises en France et en Europe.',
  // Principes tirés des réponses des associés au questionnaire de marque.
  principes: [
    {
      titre: 'Liberté',
      texte:
        'On a créé GLM pour rester libres de nos choix. On choisit nos projets, et des clients qui jouent franc-jeu avec nous.',
      accent: 'corail',
    },
    {
      titre: 'Terrain',
      texte:
        'Jeunes et au contact des PME, on part de la réalité de votre quotidien, pas d’une vision lointaine.',
      accent: 'jade',
    },
    {
      titre: 'Ambition',
      texte: 'On a faim de réussir et on vise loin : faire de GLM une belle réussite de la tech française.',
      accent: 'bleu',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Média « T’as cru ? »                                               */
/* ------------------------------------------------------------------ */

/** Série vidéo quotidienne de vulgarisation publiée par GLM sur LinkedIn. */
export const media = {
  nom: 'T’as cru\u00a0?',
  surtitre: 'Notre média · Une vidéo par jour',
  accroche: 'Une idée reçue, démontée chaque jour en vidéo.',
  texte:
    'Chaque jour, une courte vidéo de vulgarisation scientifique, technologique et financière. Hugo, le curieux, part d’une idée reçue qu’on entend partout. Nora, l’experte, explique ce qui se passe vraiment.',
  rythme: 'Un thème par semaine, une vidéo par jour.',
  hashtag: '#TasCru',
  /** Page où suivre la série : la page LinkedIn de GLM. */
  lien: 'https://www.linkedin.com/company/glmprime/',
  /**
   * Miniatures d’épisodes déjà publiés ou prêts, déposées dans src/assets/tascru/ (format 1080 × 1350).
   * `question` sert de texte alternatif : la phrase que la miniature met en avant.
   */
  episodes: [
    {
      miniature: 'semaine2-ep1.png',
      question:
        'L’IA est en panne\u00a0? Hugo\u00a0: « Elle m’a juste écrit un texte au lieu de réserver\u00a0! »',
    },
    {
      miniature: 'semaine2-ep2.png',
      question:
        'ChatGPT recopie ses réponses\u00a0? Hugo\u00a0: « C’est une énorme base de données de réponses\u00a0! »',
    },
    {
      miniature: 'semaine2-ep3.png',
      question:
        'L’IA a un vrai cerveau\u00a0? Hugo\u00a0: « Elle a des neurones, donc elle pense comme nous\u00a0! »',
    },
    {
      miniature: 'semaine2-ep4.png',
      question:
        'Je l’ai corrigée, elle a appris\u00a0? Hugo\u00a0: « Demain, il le saura pour tout le monde\u00a0! »',
    },
  ],
} as const;

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
