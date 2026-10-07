<?php
/**
 * API de l’espace équipe (hébergement mutualisé OVH, PHP 8.1+) : connexion et publication des démos clients
 * sur demo.glmprime.com. Réponses en JSON uniquement.
 *
 * Utilisée par la page /admin/ (session + jeton CSRF), ou directement avec un jeton pour automatiser :
 *   curl -fsS -H "Authorization: Bearer $GLM_DEMOS_JETON" -F action=publier \
 *        -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip \
 *        https://www.glmprime.com/admin/api.php
 *
 * Configuration lue HORS du dossier web : voir config/glm-demos-config.example.php.
 */
declare(strict_types=1);

require __DIR__ . '/../_serveur/demos-lib.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');
header('X-Robots-Tag: noindex, nofollow');

const GLM_DEMOS_MAX_ECHECS = 5;
const GLM_DEMOS_FENETRE = 900; // 15 minutes

/** @param array<string, mixed> $donnees */
function repondre(int $statut, array $donnees): never
{
    http_response_code($statut);
    echo json_encode($donnees, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function erreur(int $statut, string $message): never
{
    repondre($statut, ['ok' => false, 'message' => $message]);
}

// ---------- Configuration ----------
$cheminConfig = getenv('GLM_DEMOS_CONFIG') ?: dirname(__DIR__, 2) . '/glm-demos-config.php';
$config = is_readable($cheminConfig) ? require $cheminConfig : null;
if (
    !is_array($config)
    || !is_array($config['utilisateurs'] ?? null)
    || !is_string($config['dossier_demos'] ?? null)
    || !is_string($config['sel'] ?? null)
    || strlen($config['sel']) < 32
) {
    error_log('[GLM démos] Configuration absente ou invalide : ' . $cheminConfig);
    erreur(500, 'L’espace équipe n’est pas encore configuré sur l’hébergement (voir le README).');
}
$racine = rtrim($config['dossier_demos'], '/');
$dossierDonnees = is_string($config['dossier_donnees'] ?? null)
    ? rtrim($config['dossier_donnees'], '/')
    : dirname($cheminConfig) . '/glm-demos-donnees';
$fichierMeta = "$dossierDonnees/demos.json";
$fichierEchecs = "$dossierDonnees/echecs-connexion.json";
$modeleUrl = is_string($config['modele_url'] ?? null) ? $config['modele_url'] : 'https://demo.glmprime.com/{slug}/';
$maxOctets = (is_int($config['taille_max_mo'] ?? null) ? $config['taille_max_mo'] : 500) * 1048576;
$jetonApi = is_string($config['jeton_api'] ?? null) ? $config['jeton_api'] : '';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'inconnue';
$maintenant = time();

$bloque = static fn(): bool => glm_demos_bloque($ip, $config['sel'], $fichierEchecs, GLM_DEMOS_MAX_ECHECS, GLM_DEMOS_FENETRE, $maintenant);
$noterEchec = static fn() => glm_demos_noter_echec($ip, $config['sel'], $fichierEchecs, GLM_DEMOS_FENETRE, $maintenant);

// ---------- Authentification ----------
$methode = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = (string) ($methode === 'POST' ? ($_POST['action'] ?? '') : ($_GET['action'] ?? 'etat'));

// Upload plus gros que post_max_size : PHP vide $_POST, on le signale clairement.
if ($methode === 'POST' && $_POST === [] && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    erreur(413, 'Archive trop volumineuse pour l’hébergement (limite : ' . ini_get('post_max_size') . ').');
}

$autorisation = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
$parJeton = preg_match('/^Bearer\s+(\S+)$/i', $autorisation, $m) === 1;

if ($parJeton) {
    // Accès automatisé (curl, GitHub Actions) : pas de session, publication uniquement.
    if ($jetonApi === '' || strlen($jetonApi) < 32) {
        erreur(403, 'Accès par jeton désactivé (« jeton_api » absent de la configuration).');
    }
    if ($bloque()) {
        erreur(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
    }
    if (!hash_equals($jetonApi, $m[1])) {
        $noterEchec();
        erreur(401, 'Jeton invalide.');
    }
    if ($methode !== 'POST' || $action !== 'publier') {
        erreur(400, 'Avec un jeton, seule l’action « publier » (POST) est disponible.');
    }
    $utilisateur = 'automatisation';
} else {
    $https = ($_SERVER['HTTPS'] ?? '') === 'on' || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_name('GLM_EQUIPE');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/admin/', 'secure' => $https, 'httponly' => true, 'samesite' => 'Strict']);
    session_start();
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    $utilisateur = is_string($_SESSION['utilisateur'] ?? null) ? $_SESSION['utilisateur'] : null;

    if ($methode === 'POST') {
        // Toute action vient de la page /admin/ elle-même : même origine et jeton CSRF de la session.
        $origine = $_SERVER['HTTP_ORIGIN'] ?? '';
        $hote = $_SERVER['HTTP_HOST'] ?? '';
        if ($origine !== '' && parse_url($origine, PHP_URL_HOST) !== parse_url("//$hote", PHP_URL_HOST)) {
            erreur(403, 'Requête refusée.');
        }
        if (!hash_equals($_SESSION['csrf'], (string) ($_SERVER['HTTP_X_CSRF'] ?? ''))) {
            erreur(403, 'Session expirée : rechargez la page.');
        }
    }
}

// ---------- Actions ----------
try {
    if ($action === 'etat' && $methode === 'GET') {
        $reponse = ['ok' => true, 'connecte' => $utilisateur !== null, 'csrf' => $_SESSION['csrf'] ?? null];
        if ($utilisateur !== null) {
            $reponse += [
                'utilisateur' => $utilisateur,
                'modeleUrl' => $modeleUrl,
                'limiteEnvoi' => ini_get('upload_max_filesize'),
                'demos' => array_map(
                    static fn(array $d): array => $d + ['url' => glm_demos_url($modeleUrl, $d['slug'])],
                    glm_demos_lister($racine, $fichierMeta),
                ),
            ];
        }
        repondre(200, $reponse);
    }

    if ($methode !== 'POST') {
        erreur(405, 'Méthode non autorisée.');
    }

    if ($action === 'connexion') {
        if ($bloque()) {
            erreur(429, 'Trop de tentatives. Réessayez dans 15 minutes.');
        }
        $identifiant = trim((string) ($_POST['identifiant'] ?? ''));
        $hash = $config['utilisateurs'][$identifiant] ?? null;
        // password_verify est toujours exécuté, pour ne pas révéler par le temps de réponse si le compte existe.
        $valide = password_verify((string) ($_POST['motDePasse'] ?? ''), is_string($hash) ? $hash : '$2y$10$en2BNzCVrVBAhpvf9rgd1egKZ8xZyX/IoB54ccRmSAXjZdu8JVR5i');
        if (!$valide || !is_string($hash)) {
            $noterEchec();
            erreur(401, 'Identifiant ou mot de passe incorrect.');
        }
        session_regenerate_id(true);
        $_SESSION['utilisateur'] = $identifiant;
        repondre(200, ['ok' => true]);
    }

    if ($utilisateur === null) {
        erreur(401, 'Connectez-vous pour continuer.');
    }

    switch ($action) {
        case 'deconnexion':
            $_SESSION = [];
            session_destroy();
            repondre(200, ['ok' => true]);

        case 'publier':
            $client = trim((string) ($_POST['client'] ?? ''));
            $slug = glm_demos_slug((string) ($_POST['slug'] ?? '') ?: $client);
            $fichier = $_FILES['archive'] ?? null;
            if (!is_array($fichier) || ($fichier['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
                $code = is_array($fichier) ? (int) $fichier['error'] : UPLOAD_ERR_NO_FILE;
                erreur(400, match ($code) {
                    UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => 'Archive trop volumineuse pour l’hébergement (limite : ' . ini_get('upload_max_filesize') . ').',
                    UPLOAD_ERR_NO_FILE => 'Ajoutez l’archive .zip du site.',
                    default => 'L’envoi de l’archive a échoué, réessayez.',
                });
            }
            $demo = glm_demos_publier($fichier['tmp_name'], $slug, mb_substr($client, 0, 120), $utilisateur, $racine, $fichierMeta, $maxOctets, $maintenant);
            repondre(200, ['ok' => true, 'demo' => $demo + ['url' => glm_demos_url($modeleUrl, $slug)]]);

        case 'supprimer':
            glm_demos_supprimer((string) ($_POST['slug'] ?? ''), $racine, $fichierMeta);
            repondre(200, ['ok' => true]);

        default:
            erreur(400, 'Action inconnue.');
    }
} catch (GlmDemoErreur $e) {
    erreur(422, $e->getMessage());
} catch (Throwable $e) {
    error_log('[GLM démos] ' . $e->getMessage());
    erreur(500, 'Erreur inattendue sur le serveur. Réessayez dans quelques instants.');
}
