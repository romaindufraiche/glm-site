<?php
/**
 * Modèle de configuration du formulaire de contact.
 *
 * À copier sur l'hébergement OVH, HORS du dossier www/, sous le nom glm-contact-config.php :
 *   /home/<compte>/glm-contact-config.php   (www/ contient le site)
 * Ne jamais committer le fichier réel (il est ignoré par .gitignore).
 */
return [
    // Adresse qui reçoit les messages.
    'destinataire' => 'contact@votre-domaine.fr',
    // Adresse d'expédition : doit appartenir au domaine hébergé chez OVH, sinon les e-mails sont rejetés.
    'expediteur' => 'site@votre-domaine.fr',
    // Origines autorisées à envoyer le formulaire (le site, avec et sans www).
    'origines' => ['https://www.votre-domaine.fr', 'https://votre-domaine.fr'],
    // Chaîne aléatoire d'au moins 32 caractères (sert à rendre les IP non réversibles).
    // Générer par exemple avec : php -r "echo bin2hex(random_bytes(32));"
    'sel' => 'REMPLACER_PAR_UNE_CHAINE_ALEATOIRE_DE_64_CARACTERES_HEXADECIMAUX_',
    // Nombre maximum d'envois par adresse IP et par heure.
    'max_par_heure' => 5,
    // Dossier de stockage de la limitation (hors www/, créé automatiquement).
    // 'dossier_limites' => '/home/<compte>/glm-contact-limites',
];
