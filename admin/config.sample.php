<?php
/*
 * Configuration de l'espace admin GLM.
 *
 * Copier ce fichier en "config.php" (dans le même dossier) directement sur le serveur,
 * puis remplir les valeurs. config.php n'est jamais versionné dans Git.
 */
return [
    // Comptes autorisés : identifiant => hash du mot de passe.
    // Générer un hash :  php admin/hash-password.php "MonMotDePasse"
    'users' => [
        'romain' => '$2y$10$remplacer.par.le.hash.genere..............................',
    ],

    // Chemin ABSOLU sur le serveur du dossier racine de demo.glmprime.com
    // (le "document root" du sous-domaine configuré dans le panneau d'hébergement).
    'demo_root' => '/home/VOTRE_COMPTE/demo.glmprime.com',

    // Adresse publique d'une démo. {slug} est remplacé par l'identifiant du client.
    //   Sous-dossiers  : 'https://demo.glmprime.com/{slug}/'
    //   Sous-domaines  : 'https://{slug}.demo.glmprime.com/'  (voir docs/DEMOS.md)
    'demo_url_pattern' => 'https://demo.glmprime.com/{slug}/',

    // Jeton pour déployer sans passer par l'interface (curl, GitHub Actions…).
    // Laisser vide pour désactiver l'API. Générer : php -r "echo bin2hex(random_bytes(32));"
    'api_token' => '',

    // Taille maximale d'une archive décompressée (en Mo).
    'max_site_mb' => 500,
];
