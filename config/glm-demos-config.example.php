<?php
/**
 * Modèle de configuration de l'espace équipe (publication des démos clients).
 *
 * À copier sur l'hébergement OVH, HORS du dossier www/, sous le nom glm-demos-config.php :
 *   /home/<compte>/glm-demos-config.php   (www/ contient le site)
 * Ne jamais committer le fichier réel (il est ignoré par .gitignore).
 */
return [
    // Comptes de l'équipe : identifiant => empreinte du mot de passe (jamais le mot de passe lui-même).
    // Générer une empreinte : php -r 'echo password_hash("MotDePasse", PASSWORD_DEFAULT), PHP_EOL;'
    'utilisateurs' => [
        'romain' => 'REMPLACER_PAR_L_EMPREINTE_DU_MOT_DE_PASSE',
    ],
    // Dossier racine du sous-domaine demo.glmprime.com (chemin absolu), HORS de www/ :
    // le déploiement du site remplace www/ et effacerait les démos.
    'dossier_demos' => '/home/<compte>/demo',
    // Adresse publique d'une démo ; {slug} est remplacé par l'identifiant du client.
    // Pour une démo par sous-domaine : 'https://{slug}.demo.glmprime.com/' (voir README).
    'modele_url' => 'https://demo.glmprime.com/{slug}/',
    // Chaîne aléatoire d'au moins 32 caractères (rend les IP enregistrées non réversibles).
    // Générer par exemple avec : php -r "echo bin2hex(random_bytes(32));"
    'sel' => 'REMPLACER_PAR_UNE_CHAINE_ALEATOIRE_DE_64_CARACTERES_HEXADECIMAUX_',
    // Facultatif : jeton pour publier sans passer par la page (curl, GitHub Actions). Vide = désactivé.
    // Au moins 32 caractères : php -r "echo bin2hex(random_bytes(32));"
    'jeton_api' => '',
    // Taille maximale d'un site décompressé, en Mo.
    'taille_max_mo' => 500,
    // Dossier des données internes (liste des démos, tentatives de connexion), hors www/, créé automatiquement.
    // 'dossier_donnees' => '/home/<compte>/glm-demos-donnees',
];
