<?php
/**
 * Point d’entrée du formulaire de contact (hébergement mutualisé OVH, PHP 8.1+).
 *
 * - Réponse JSON si le navigateur l’accepte (envoi en JavaScript), sinon redirection vers
 *   /message-envoye/ ou /message-non-envoye/ (formulaire envoyé sans JavaScript).
 * - Configuration (destinataire, expéditeur…) lue HORS du dossier web : voir config/glm-contact-config.example.php.
 * - Aucune donnée personnelle n’est écrite dans les journaux.
 */
declare(strict_types=1);

require __DIR__ . '/_serveur/contact-lib.php';

header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

$veutJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');

/** @param array<string, mixed> $donnees */
function repondre(bool $veutJson, int $statut, array $donnees): never
{
    http_response_code($statut);
    if ($veutJson) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode($donnees, JSON_UNESCAPED_UNICODE);
    } else {
        header('Location: ' . (($donnees['ok'] ?? false) ? '/message-envoye/' : '/message-non-envoye/'), true, 303);
    }
    exit;
}

$messageGenerique = "Le message n’a pas pu être envoyé. Réessayez dans quelques instants.";

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    header('Allow: POST');
    if (!$veutJson) {
        // Accès direct à l’adresse du script : on renvoie vers le formulaire.
        header('Location: /#contact', true, 303);
        exit;
    }
    repondre($veutJson, 405, ['ok' => false, 'message' => 'Méthode non autorisée.']);
}

// Configuration hors du dossier web (GLM_CONTACT_CONFIG permet de la placer ailleurs).
$cheminConfig = getenv('GLM_CONTACT_CONFIG') ?: dirname(__DIR__) . '/glm-contact-config.php';
$config = is_readable($cheminConfig) ? require $cheminConfig : null;
if (
    !is_array($config)
    || !filter_var($config['destinataire'] ?? '', FILTER_VALIDATE_EMAIL)
    || !filter_var($config['expediteur'] ?? '', FILTER_VALIDATE_EMAIL)
    || !is_string($config['sel'] ?? null)
    || strlen($config['sel']) < 32
) {
    error_log('[GLM contact] Configuration absente ou invalide : ' . $cheminConfig);
    repondre($veutJson, 500, ['ok' => false, 'message' => $messageGenerique]);
}

// Protection CSRF / envois depuis d’autres sites : l’origine doit être le site lui-même.
$origine = $_SERVER['HTTP_ORIGIN'] ?? '';
$originesAutorisees = is_array($config['origines'] ?? null) ? $config['origines'] : [];
if ($origine !== '' && !in_array($origine, $originesAutorisees, true)) {
    repondre($veutJson, 403, ['ok' => false, 'message' => $messageGenerique]);
}

if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 20000) {
    repondre($veutJson, 413, ['ok' => false, 'message' => 'Votre message est trop long.']);
}

// Champ piège rempli : robot. On répond comme un succès pour ne rien lui apprendre.
if (trim((string) ($_POST['site_web'] ?? '')) !== '') {
    repondre($veutJson, 200, ['ok' => true]);
}

$donnees = glm_normaliser($_POST);
$erreurs = glm_valider($donnees);
if ($erreurs !== []) {
    repondre($veutJson, 422, ['ok' => false, 'erreurs' => $erreurs]);
}

$dossierLimites = is_string($config['dossier_limites'] ?? null)
    ? $config['dossier_limites']
    : dirname(__DIR__) . '/glm-contact-limites';
$maxParHeure = is_int($config['max_par_heure'] ?? null) ? $config['max_par_heure'] : 5;
if (glm_limite_atteinte($_SERVER['REMOTE_ADDR'] ?? 'inconnue', $config['sel'], $dossierLimites, $maxParHeure, time())) {
    repondre($veutJson, 429, [
        'ok' => false,
        'message' => "Vous avez envoyé plusieurs messages en peu de temps. Réessayez dans une heure.",
    ]);
}

$email = glm_construire_email($donnees, $config['expediteur']);
$envoye = mail(
    $config['destinataire'],
    $email['sujet'],
    $email['corps'],
    $email['entetes'],
    '-f' . $config['expediteur'],
);

if (!$envoye) {
    error_log('[GLM contact] Échec de la fonction mail().');
    repondre($veutJson, 502, ['ok' => false, 'message' => $messageGenerique]);
}

repondre($veutJson, 200, ['ok' => true]);
