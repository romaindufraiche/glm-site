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

/** Animation jouée au survol de la carte projet (voir src/components/AnimationProjet.astro). */
export type AnimationProjet = 'amicale' | 'crocomix' | 'infohub' | 'synapse' | 'pepites';

export interface Projet {
  nom: string;
  /** Pour qui : le client, « Projet GLM » pour un outil interne, « Projet R&D »… */
  client: string;
  calibre: CalibreId;
  /** Présentation du projet en deux ou trois phrases. */
  description: string;
  /** Ce qu’on a construit, en quelques mots-clés courts. */
  points: string[];
  /**
   * Capture d’écran déposée dans src/assets/projets/, recadrée au format 16:10 (1440 × 900) :
   * les animations sont calées sur ce cadrage. Sans image, l’animation sert d’illustration.
   */
  image?: { fichier: string; alt: string };
  /** Vidéo courte (muette, en boucle) déposée dans public/videos/ : <nom>.webm et <nom>.mp4, lancée au survol. */
  video?: string;
  animation?: AnimationProjet;
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
  ville: 'Sannois',
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
/* Page d’accueil : textes de la visite                               */
/* ------------------------------------------------------------------ */

export const accueil = {
  surtitre: 'Architectes de la tech',
  titre: 'On conçoit et on construit les systèmes numériques des entreprises.',
  accroche: 'Du site web à l’automatisation et à l’intelligence artificielle, et demain jusqu’aux robots.',
  indice: 'Faites défiler',
  /** Mots affichés en grand entre deux sections. */
  passages: { methode: 'Méthode', projets: 'Projets', media: 'Notre média', vision: 'Vision' },
  projets: { titre: 'Une histoire vraie vaut dix promesses.' },
  contact: {
    titre: 'Parlons-en.',
    texte: 'Un site, un process à automatiser, une idée encore floue : racontez-nous votre métier.',
  },
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

// Projets décrits par les associés, captures du dossier Drive « Site / Projets ».
// L’ordre alterne les domaines (robotique, web, IA…) : c’est l’ordre de l’anneau.
export const projets: Projet[] = [
  {
    nom: 'L’échiquier autonome',
    client: 'Projet R&D',
    calibre: 'robotique',
    description:
      'Une intelligence artificielle qui joue aux échecs, et l’échiquier qui va avec. Nous avons conçu et fabriqué toute son architecture : un chariot aimanté sur deux axes déplace les pièces, des LED indiquent les coups, et l’on joue à la voix contre notre moteur ou contre Stockfish.',
    points: ['Moteur d’échecs (Minimax)', 'Commande vocale', 'Mécanique sur deux axes', 'Éclairage LED'],
    image: {
      fichier: 'echiquier.webp',
      alt: 'L’échiquier autonome : une pièce avance seule sur le plateau en bois.',
    },
    video: 'echiquier',
  },
  {
    nom: 'Ombres & Reliques, un jeu vidéo dans le navigateur',
    client: 'Projet GLM',
    calibre: 'web',
    description:
      'Nous avons créé un jeu vidéo qui tourne directement dans le navigateur, de la conception graphique au gameplay, en passant par les mondes et les objets. Il est en ligne et 100 % fonctionnel.',
    points: ['Conception graphique', 'Gameplay', 'Mondes et objets', 'En production'],
    image: {
      fichier: 'ombres-reliques.webp',
      alt: 'Partie d’Ombres & Reliques : le héros affronte une horde de goules dans une salle du donjon.',
    },
    video: 'ombres-reliques',
    lien: { url: 'https://krokow.github.io/Ombres-Reliques', libelle: 'Jouer' },
  },
  {
    nom: 'Pépites, l’analyse de portefeuille',
    client: 'Projet GLM',
    calibre: 'ia',
    description:
      'Un algorithme qui analyse l’actualité et un portefeuille financier, puis propose des signaux d’achat ou de vente sur une sélection d’actions définie à l’avance. C’est un outil d’aide à la décision, pas un conseil en investissement.',
    points: [
      'Analyse de l’actualité',
      'Suivi de portefeuille',
      'Indicateurs techniques',
      'Signaux d’achat et de vente',
    ],
    image: {
      fichier: 'pepites.webp',
      alt: 'Écran de Pépites : graphique en chandeliers d’une action avec moyennes mobiles, volumes et RSI.',
    },
    animation: 'pepites',
  },
  {
    nom: 'Le site de l’Amicale des PME du Val-d’Oise',
    client: 'Amicale des PME du Val-d’Oise',
    calibre: 'web',
    description:
      'Un projet complet, de l’étude à la mise en ligne. Les adhérents achètent leurs billets et profitent des offres partenaires ; le bureau publie, suit les commandes et gère la billetterie depuis son espace.',
    points: [
      'Étude et conception',
      'Parcours d’achat de billets',
      'Paiement en ligne',
      'Espace administrateur',
      'Publication des offres',
      'Commandes et billetterie',
      'Génération des fichiers',
    ],
    image: {
      fichier: 'amicale.webp',
      alt: 'Page d’accueil du site de l’amicale : bandeau bleu, blanc, rouge, catégories d’offres et offres à la une.',
    },
    animation: 'amicale',
  },
  {
    nom: 'CrocoMix, le studio de remix',
    client: 'Projet GLM',
    calibre: 'ia',
    description:
      'Nous avons développé un algorithme qui sépare la voix, les instruments et chaque son d’un morceau pour isoler chaque piste audio. Nous avons aussi dessiné le logiciel et l’avons mis en production : on remixe, on crée du contenu, directement dans le navigateur.',
    points: [
      'Séparation des pistes par IA',
      'Une piste par instrument',
      'Design du logiciel',
      'Mise en production',
    ],
    image: {
      fichier: 'crocomix.webp',
      alt: 'Console de CrocoMix : forme d’onde du morceau, une tranche par instrument, effets et oscilloscope.',
    },
    animation: 'crocomix',
  },
  {
    nom: 'Synapse, le home cinéma personnalisé',
    client: 'Projet GLM',
    calibre: 'web',
    description:
      'Nous avons construit une grande base de films qui rassemble les films disponibles et les centralise dans un home cinéma : bandes-annonces, où les regarder, notes et recommandations personnalisées. Toute l’interface graphique est faite maison.',
    points: ['Base de films', 'Recommandations', 'Application installable', 'Design de l’interface'],
    image: {
      fichier: 'synapse.webp',
      alt: 'Accueil de Synapse au style cyberpunk : film à la une et rangée des tendances de la semaine.',
    },
    animation: 'synapse',
    lien: { url: 'https://krokow.github.io/synapse/', libelle: 'Voir l’application' },
  },
  {
    nom: 'InfoHub, le tableau de bord de la journée',
    client: 'Projet GLM',
    calibre: 'ia',
    description:
      'Un écran qui rassemble l’actualité financière et géopolitique, la météo, les tendances des réseaux sociaux, la playlist du moment et les résultats sportifs. Pensé pour l’écran de la maison ou l’ordinateur de bord d’une voiture : le récapitulatif de sa journée en un coup d’œil.',
    points: [
      'Finance et géopolitique',
      'Météo',
      'Tendances sociales',
      'Musique',
      'Sport',
      'Données en direct',
    ],
    image: {
      fichier: 'infohub.webp',
      alt: 'Tableau de bord InfoHub au style néon : météo, crypto, actualités, musique, sport et suivi de l’ISS.',
    },
    animation: 'infohub',
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
    'On s’est rencontrés en cours de data science, en Californie. De retour en France, on a créé GLM pour construire quelque chose à nous. Chaque projet est suivi par toute l’équipe.',
  // TODO: vérifier que chaque photo correspond au bon associé.
  associes: [
    {
      prenom: 'Romain',
      nom: 'Dufraiche',
      role: 'Président',
      formation: 'Ingénieur en électronique et en informatique · Télécom Paris · ESSEC',
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
      formation: 'Ingénieur data et IA, audit des systèmes informatiques · École des Mines',
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
      formation: 'Ingénieur en cybersécurité · Développement international',
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
  cap: 'Notre cap\u00a0: grâce à la technologie, vous faire gagner du temps et de l’argent et développer votre activité, pour que votre métier reste une passion.',
  // Principes reformulés à partir des réponses des associés (octobre 2026).
  principes: [
    {
      titre: 'Ambition',
      texte:
        'On voit grand, pour nous comme pour vous. On prend en charge le passé et le présent de votre entreprise pour la projeter vers l’avenir.',
      accent: 'corail',
    },
    {
      titre: 'Échange',
      texte:
        'On aime s’investir dans chaque projet, échanger, rencontrer de nouvelles personnes et découvrir de nouveaux métiers.',
      accent: 'jade',
    },
    {
      titre: 'Au quotidien',
      texte:
        'On expérimente les nouvelles technologies dès leur sortie et on se met à jour chaque jour. On vous aide à les comprendre et à vous les approprier pour donner de l’élan à votre activité.',
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
  surtitre: 'Une vidéo par jour',
  texte:
    'Notre média de vulgarisation tech. Hugo, le curieux, part d’une idée reçue. Nora, l’experte, explique ce qui se passe vraiment.',
  /** Page où suivre la série : la page LinkedIn de GLM. */
  lien: 'https://www.linkedin.com/company/glmprime/',
  /**
   * Miniatures d’épisodes déjà publiés ou prêts, déposées dans src/assets/tascru/ (format 1080 × 1350).
   * `question` sert de texte alternatif : la phrase que la miniature met en avant.
   */
  episodes: [
    {
      miniature: 'semaine4-ep3.png',
      question:
        'Une usine de puces en quelques mois\u00a0? Hugo\u00a0: « On construit en France, et c’est réglé\u00a0! »',
    },
    {
      miniature: 'semaine4-ep2.png',
      question:
        'Une puce, c’est du plastique\u00a0? Hugo\u00a0: « Un bout de plastique noir avec des pattes\u00a0! »',
    },
    {
      miniature: 'semaine4-ep1.png',
      question:
        'L’IA, c’est un jeu vidéo\u00a0? Hugo\u00a0: « Elle tourne sur des cartes graphiques, donc… »',
    },
    {
      miniature: 'semaine3-ep5.png',
      question:
        'Réentraîner l’IA avec mes docs\u00a0? Hugo\u00a0: « Je commande des cartes graphiques\u00a0! »',
    },
    {
      miniature: 'semaine3-ep4.png',
      question:
        'L’IA m’a trouvé un livre… qui existe\u00a0? Hugo\u00a0: « Titre, auteur, année\u00a0: tout y est\u00a0! »',
    },
    {
      miniature: 'semaine3-ep3.png',
      question: 'Un robot dans ChatGPT\u00a0? Hugo\u00a0: « Il y a un robot géant caché dans l’IA\u00a0? »',
    },
    {
      miniature: 'semaine3-ep2.png',
      question:
        'L’IA a un dictionnaire\u00a0? Hugo\u00a0: « Elle connaît la définition de chaque mot\u00a0! »',
    },
    {
      miniature: 'semaine3-ep1.png',
      question:
        'L’IA ne sait même pas lire\u00a0? Hugo\u00a0: « Elle ne sait même pas compter les lettres\u00a0! »',
    },
    {
      miniature: 'semaine2-ep5.png',
      question:
        'Supprimée, c’est effacé\u00a0? Hugo\u00a0: « Je supprime, et pouf\u00a0! Disparue pour toujours\u00a0! »',
    },
    {
      miniature: 'semaine2-ep4.png',
      question:
        'Je l’ai corrigée, elle a appris\u00a0? Hugo\u00a0: « Demain, il le saura pour tout le monde\u00a0! »',
    },
    {
      miniature: 'semaine2-ep3.png',
      question:
        'L’IA a un vrai cerveau\u00a0? Hugo\u00a0: « Elle a des neurones, donc elle pense comme nous\u00a0! »',
    },
    {
      miniature: 'semaine2-ep2.png',
      question:
        'ChatGPT recopie ses réponses\u00a0? Hugo\u00a0: « C’est une énorme base de données de réponses\u00a0! »',
    },
    {
      miniature: 'semaine2-ep1.png',
      question:
        'L’IA est en panne\u00a0? Hugo\u00a0: « Elle m’a juste écrit un texte au lieu de réserver\u00a0! »',
    },
  ],
} as const;
