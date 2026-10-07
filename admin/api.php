<?php
/*
 * API de déploiement des démos, pour automatiser la publication sans passer par l'interface.
 *
 *   curl -fsS -H "Authorization: Bearer $GLM_DEMO_TOKEN" \
 *        -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip \
 *        https://glmprime.com/admin/api.php
 *
 * Réponse JSON : {"ok": true, "url": "https://demo.glmprime.com/boulangerie-martin/", ...}
 */

declare(strict_types=1);
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');

function glm_api_reply(int $status, array $body): never
{
    http_response_code($status);
    echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), "\n";
    exit;
}

$token = (string)(glm_config()['api_token'] ?? '');
if ($token === '') glm_api_reply(404, ['ok' => false, 'error' => 'API désactivée (api_token vide dans config.php).']);
if ($_SERVER['REQUEST_METHOD'] !== 'POST') glm_api_reply(405, ['ok' => false, 'error' => 'Utilisez POST.']);

// Certains hébergements ne transmettent pas l'en-tête Authorization à PHP : on accepte aussi X-GLM-Token.
$auth = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
$given = preg_match('/^Bearer\s+(.+)$/i', $auth, $m) ? trim($m[1]) : (string)($_SERVER['HTTP_X_GLM_TOKEN'] ?? '');
if (glm_login_blocked()) glm_api_reply(429, ['ok' => false, 'error' => 'Trop de tentatives, réessayez plus tard.']);
if ($given === '' || !hash_equals($token, $given)) {
    glm_record_login_failure();
    glm_api_reply(401, ['ok' => false, 'error' => 'Jeton invalide.']);
}

if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
    glm_api_reply(413, ['ok' => false, 'error' => 'Archive trop volumineuse (limite : ' . ini_get('post_max_size') . ').']);
}

$client = trim((string)($_POST['client'] ?? ''));
$slug = glm_slugify((string)($_POST['slug'] ?? '') ?: $client);
$file = $_FILES['archive'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    glm_api_reply(400, ['ok' => false, 'error' => glm_upload_error($file['error'] ?? UPLOAD_ERR_NO_FILE)]);
}

try {
    $demo = glm_deploy_zip($file['tmp_name'], $slug, $client, 'api');
} catch (RuntimeException $e) {
    glm_api_reply(422, ['ok' => false, 'error' => $e->getMessage()]);
}

glm_api_reply(200, ['ok' => true, 'url' => glm_demo_url($slug)] + $demo);
