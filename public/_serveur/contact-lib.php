<?php
/**
 * Logique du formulaire de contact GLM (validation, anti-abus, construction de l’e-mail).
 * Fichier non accessible depuis le web (voir _serveur/.htaccess) ; inclus par contact.php et par les tests.
 *
 * Les règles de validation reprennent src/lib/validation-contact.ts : toute modification
 * doit être reportée dans les deux fichiers. C’est cette validation-ci qui fait foi.
 */
declare(strict_types=1);

const GLM_SUJETS = ['Web & communication', 'Automatisation & IA', 'Robotique', 'Autre'];
const GLM_LIMITES = [
    'nom' => [2, 100],
    'email' => [3, 254],
    'entreprise' => [0, 120],
    'message' => [10, 5000],
];

/**
 * Normalise les champs reçus : chaînes uniquement, espaces superflus retirés, fins de ligne unifiées.
 * @param array<string, mixed> $brut
 * @return array{nom: string, email: string, entreprise: string, sujet: string, message: string}
 */
function glm_normaliser(array $brut): array
{
    $lire = static function (string $cle) use ($brut): string {
        $valeur = $brut[$cle] ?? '';
        if (!is_string($valeur)) {
            return '';
        }
        // Retire les caractères de contrôle invisibles (sauf retours à la ligne et tabulations).
        $valeur = preg_replace('/[^\P{C}\n\t]/u', '', str_replace("\r\n", "\n", $valeur)) ?? '';
        return trim($valeur);
    };

    return [
        'nom' => $lire('nom'),
        'email' => $lire('email'),
        'entreprise' => $lire('entreprise'),
        'sujet' => $lire('sujet'),
        'message' => $lire('message'),
    ];
}

/**
 * @param array{nom: string, email: string, entreprise: string, sujet: string, message: string} $d
 * @return array<string, string> Message d’erreur par champ (vide si tout est valide).
 */
function glm_valider(array $d): array
{
    $erreurs = [];
    $longueur = static fn(string $v): int => mb_strlen($v, 'UTF-8');

    [$min, $max] = GLM_LIMITES['nom'];
    if ($d['nom'] === '') {
        $erreurs['nom'] = 'Indiquez votre nom.';
    } elseif ($longueur($d['nom']) < $min) {
        $erreurs['nom'] = "Votre nom doit contenir au moins $min caractères.";
    } elseif ($longueur($d['nom']) > $max) {
        $erreurs['nom'] = "Votre nom ne doit pas dépasser $max caractères.";
    } elseif (str_contains($d['nom'], "\n")) {
        $erreurs['nom'] = 'Votre nom doit tenir sur une seule ligne.';
    }

    if ($d['email'] === '') {
        $erreurs['email'] = 'Indiquez votre adresse e-mail.';
    } elseif (
        $longueur($d['email']) > GLM_LIMITES['email'][1]
        || filter_var($d['email'], FILTER_VALIDATE_EMAIL) === false
    ) {
        $erreurs['email'] = 'Saisissez une adresse e-mail valide, par exemple nom@entreprise.fr.';
    }

    $maxEntreprise = GLM_LIMITES['entreprise'][1];
    if ($longueur($d['entreprise']) > $maxEntreprise) {
        $erreurs['entreprise'] = "Le nom de l’entreprise ne doit pas dépasser $maxEntreprise caractères.";
    } elseif (str_contains($d['entreprise'], "\n")) {
        $erreurs['entreprise'] = 'Le nom de l’entreprise doit tenir sur une seule ligne.';
    }

    if (!in_array($d['sujet'], GLM_SUJETS, true)) {
        $erreurs['sujet'] = 'Choisissez un sujet.';
    }

    [$min, $max] = GLM_LIMITES['message'];
    if ($d['message'] === '') {
        $erreurs['message'] = 'Écrivez votre message.';
    } elseif ($longueur($d['message']) < $min) {
        $erreurs['message'] = "Votre message doit contenir au moins $min caractères.";
    } elseif ($longueur($d['message']) > $max) {
        $erreurs['message'] = "Votre message ne doit pas dépasser $max caractères.";
    }

    return $erreurs;
}

/** Encode une valeur d’en-tête en UTF-8 (RFC 2047), sur une seule ligne. */
function glm_encoder_entete(string $valeur): string
{
    return '=?UTF-8?B?' . base64_encode(glm_ligne($valeur)) . '?=';
}

/** Empêche l’injection d’en-têtes : aucune fin de ligne dans une valeur d’en-tête. */
function glm_ligne(string $valeur): string
{
    return trim(str_replace(["\r", "\n", "\0"], ' ', $valeur));
}

/**
 * Construit l’e-mail envoyé à GLM. Le visiteur est en Reply-To : on lui répond directement.
 * @param array{nom: string, email: string, entreprise: string, sujet: string, message: string} $d
 * @return array{sujet: string, corps: string, entetes: string}
 */
function glm_construire_email(array $d, string $expediteur): array
{
    $sujet = glm_encoder_entete("[Site GLM] {$d['sujet']} · {$d['nom']}");

    $corps = implode("\n", [
        'Nouveau message depuis le formulaire du site GLM.',
        '',
        'Nom : ' . $d['nom'],
        'E-mail : ' . $d['email'],
        'Entreprise : ' . ($d['entreprise'] !== '' ? $d['entreprise'] : '(non renseignée)'),
        'Sujet : ' . $d['sujet'],
        '',
        'Message :',
        $d['message'],
        '',
        '-- ',
        'Répondez directement à cet e-mail pour écrire à l’expéditeur.',
    ]);

    $entetes = implode("\r\n", [
        'From: ' . glm_encoder_entete('Site GLM') . ' <' . glm_ligne($expediteur) . '>',
        'Reply-To: ' . glm_encoder_entete($d['nom']) . ' <' . glm_ligne($d['email']) . '>',
        'MIME-Version: 1.0',
        'Content-Type: text/plain; charset=UTF-8',
        'Content-Transfer-Encoding: 8bit',
        'X-Mailer: GLM',
    ]);

    return ['sujet' => $sujet, 'corps' => $corps, 'entetes' => $entetes];
}

/**
 * Limite le nombre d’envois par adresse IP sur une heure glissante.
 * L’IP n’est jamais stockée en clair : seul un hachage salé sert de nom de fichier, supprimé après une heure.
 */
function glm_limite_atteinte(string $ip, string $sel, string $dossier, int $maxParHeure, int $maintenant): bool
{
    if (!is_dir($dossier) && !mkdir($dossier, 0700, true) && !is_dir($dossier)) {
        // Sans stockage possible, on ne bloque pas l’envoi (le champ piège reste actif).
        return false;
    }

    $fichier = $dossier . '/' . hash_hmac('sha256', $ip, $sel) . '.json';
    $poignee = fopen($fichier, 'c+');
    if ($poignee === false) {
        return false;
    }

    try {
        flock($poignee, LOCK_EX);
        $contenu = stream_get_contents($poignee);
        $horodatages = json_decode($contenu !== false && $contenu !== '' ? $contenu : '[]', true);
        $horodatages = array_values(array_filter(
            is_array($horodatages) ? $horodatages : [],
            static fn($t): bool => is_int($t) && $t > $maintenant - 3600,
        ));

        if (count($horodatages) >= $maxParHeure) {
            return true;
        }

        $horodatages[] = $maintenant;
        ftruncate($poignee, 0);
        rewind($poignee);
        fwrite($poignee, json_encode($horodatages));
        return false;
    } finally {
        flock($poignee, LOCK_UN);
        fclose($poignee);
        glm_nettoyer_limites($dossier, $maintenant);
    }
}

/** Supprime de temps en temps les fichiers de limitation de plus d’une heure. */
function glm_nettoyer_limites(string $dossier, int $maintenant): void
{
    if (random_int(1, 20) !== 1) {
        return;
    }
    foreach (glob($dossier . '/*.json') ?: [] as $fichier) {
        $modif = filemtime($fichier);
        if ($modif !== false && $modif < $maintenant - 3600) {
            @unlink($fichier);
        }
    }
}
