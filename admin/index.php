<?php
/*
 * Espace admin GLM : connexion + tableau de bord de publication des démos clients.
 */

declare(strict_types=1);
require __DIR__ . '/lib.php';

glm_config();
glm_session_start();

function glm_redirect(): never
{
    // L'envoi avec barre de progression (XHR) recharge lui-même la page : pas de redirection,
    // sinon la requête suivie consommerait les messages flash.
    if (($_SERVER['HTTP_X_REQUESTED_WITH'] ?? '') === 'XMLHttpRequest') {
        http_response_code(204);
        exit;
    }
    header('Location: ./', true, 303);
    exit;
}

/* ================= Actions (POST) ================= */

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Un upload qui dépasse post_max_size arrive avec $_POST vide : on le signale clairement.
    if (empty($_POST) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        glm_flash('error', "Fichier trop volumineux pour l'hébergement (limite : " . ini_get('post_max_size') . ").");
        glm_redirect();
    }
    if (!glm_csrf_valid($_POST['csrf'] ?? null)) {
        glm_flash('error', 'Session expirée, veuillez réessayer.');
        glm_redirect();
    }

    $action = $_POST['action'] ?? '';

    if ($action === 'login') {
        if (glm_login_blocked()) {
            glm_flash('error', 'Trop de tentatives. Réessayez dans 15 minutes.');
        } elseif (!glm_attempt_login(trim((string)($_POST['user'] ?? '')), (string)($_POST['password'] ?? ''))) {
            glm_flash('error', 'Identifiant ou mot de passe incorrect.');
        }
        glm_redirect();
    }

    $user = glm_current_user();
    if ($user === null) glm_redirect();

    try {
        switch ($action) {
            case 'logout':
                $_SESSION = [];
                session_destroy();
                glm_redirect();

            case 'deploy':
                $client = trim((string)($_POST['client'] ?? ''));
                $slug = glm_slugify((string)($_POST['slug'] ?? '') ?: $client);
                $file = $_FILES['archive'] ?? null;
                if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
                    throw new RuntimeException(glm_upload_error($file['error'] ?? UPLOAD_ERR_NO_FILE));
                }
                if (strtolower(pathinfo($file['name'], PATHINFO_EXTENSION)) !== 'zip') {
                    throw new RuntimeException('Envoyez le site sous forme d\'archive .zip.');
                }
                $demo = glm_deploy_zip($file['tmp_name'], $slug, $client, $user);
                $_SESSION['last_deployed'] = $slug;
                glm_flash('success', sprintf('Démo « %s » publiée (version %d) : %s', $demo['client'], $demo['version'], glm_demo_url($slug)));
                break;

            case 'delete':
                $slug = (string)($_POST['slug'] ?? '');
                glm_delete_demo($slug);
                glm_flash('success', "Démo « $slug » supprimée.");
                break;
        }
    } catch (RuntimeException $e) {
        glm_flash('error', $e->getMessage());
    }
    glm_redirect();
}

/* ================= Affichage ================= */

$user = glm_current_user();
$flashes = glm_take_flashes();
$csrf = glm_csrf_token();
$configError = null;
$demos = [];
if ($user !== null) {
    try {
        glm_demo_root();
    } catch (RuntimeException $e) {
        $configError = $e->getMessage();
    }
    $demos = glm_list_demos();
}
$lastDeployed = $_SESSION['last_deployed'] ?? null;
unset($_SESSION['last_deployed']);
$urlPattern = glm_config()['demo_url_pattern'];
$demoHost = (string)parse_url(str_replace('{slug}.', '', $urlPattern), PHP_URL_HOST);
?>
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Espace GLM — Démos clients</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="admin.css?v=1">
<script>try { if (localStorage.getItem('glm-theme') === 'light') document.documentElement.dataset.theme = 'light'; } catch (e) {}</script>
</head>
<body class="<?= $user === null ? 'is-login' : '' ?>">

<?php if ($user === null): ?>

<main class="login-wrap">
  <form class="card login-card" method="post" action="./">
    <a href="../" class="brand" aria-label="Retour au site GLM">
      <span class="logo" aria-hidden="true"><i></i><i></i><i></i></span>
      <span>GLM</span>
    </a>
    <h1>Espace équipe</h1>
    <p class="muted">Connectez-vous pour publier les démos clients sur <strong><?= e($demoHost) ?></strong>.</p>
    <?php foreach ($flashes as $f): ?>
      <div class="alert alert-<?= e($f['type']) ?>"><?= e($f['message']) ?></div>
    <?php endforeach; ?>
    <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
    <input type="hidden" name="action" value="login">
    <label>Identifiant
      <input type="text" name="user" autocomplete="username" required autofocus>
    </label>
    <label>Mot de passe
      <input type="password" name="password" autocomplete="current-password" required>
    </label>
    <button class="btn btn-primary" type="submit">Se connecter</button>
    <a class="back-link" href="../">← Retour au site</a>
  </form>
</main>

<?php else: ?>

<header class="topbar">
  <a href="../" class="brand" aria-label="Retour au site GLM">
    <span class="logo" aria-hidden="true"><i></i><i></i><i></i></span>
    <span>GLM <small>Démos clients</small></span>
  </a>
  <div class="topbar-actions">
    <span class="muted user">Connecté : <strong><?= e($user) ?></strong></span>
    <form method="post" action="./">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <input type="hidden" name="action" value="logout">
      <button class="btn btn-ghost btn-sm" type="submit">Déconnexion</button>
    </form>
  </div>
</header>

<main class="container">
  <?php foreach ($flashes as $f): ?>
    <div class="alert alert-<?= e($f['type']) ?>"><?= e($f['message']) ?></div>
  <?php endforeach; ?>
  <?php if ($configError): ?>
    <div class="alert alert-error"><?= e($configError) ?></div>
  <?php endif; ?>

  <section class="card">
    <h2 id="formTitle">Publier une démo</h2>
    <p class="muted">Déposez l'archive <code>.zip</code> du site (avec un <code>index.html</code> à la racine). Si l'identifiant existe déjà, la démo est remplacée par la nouvelle version.</p>
    <form class="deploy-form" id="deployForm" method="post" action="./" enctype="multipart/form-data">
      <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
      <input type="hidden" name="action" value="deploy">
      <div class="grid-2">
        <label>Nom du client
          <input type="text" name="client" id="clientInput" placeholder="Boulangerie Martin" required>
        </label>
        <label>Identifiant dans l'URL
          <input type="text" name="slug" id="slugInput" placeholder="boulangerie-martin" pattern="[a-z0-9](?:[a-z0-9\-]{0,58}[a-z0-9])?" maxlength="60" required>
        </label>
      </div>
      <p class="url-preview">Lien de démo : <span id="urlPreview" class="mono"><?= e(glm_demo_url('…')) ?></span> <span id="replaceBadge" class="badge" hidden>remplace la version actuelle</span></p>
      <label class="dropzone" id="dropzone">
        <input type="file" name="archive" id="archiveInput" accept=".zip,application/zip" required>
        <span class="dz-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>
        </span>
        <span id="dzText">Glissez l'archive .zip ici ou <u>parcourez</u></span>
        <small class="muted">Limite d'envoi de l'hébergement : <?= e(ini_get('upload_max_filesize')) ?></small>
      </label>
      <div class="form-actions">
        <button class="btn btn-primary" type="submit" id="deployBtn">Publier la démo</button>
        <span class="progress" id="progress" hidden><span id="progressBar"></span></span>
        <span class="muted" id="progressText"></span>
      </div>
    </form>
  </section>

  <section class="card">
    <div class="card-head">
      <h2>Démos en ligne <span class="count"><?= count($demos) ?></span></h2>
    </div>
    <?php if (!$demos): ?>
      <p class="muted empty">Aucune démo pour le moment. Publiez la première ci-dessus.</p>
    <?php else: ?>
      <ul class="demo-list">
        <?php foreach ($demos as $d): $url = glm_demo_url($d['slug']); ?>
          <li class="demo<?= $d['slug'] === $lastDeployed ? ' is-new' : '' ?>">
            <div class="demo-main">
              <strong><?= e($d['client']) ?></strong>
              <a class="mono demo-url" href="<?= e($url) ?>" target="_blank" rel="noopener"><?= e($url) ?></a>
              <span class="muted small">
                Mise à jour le <?= e(date('d/m/Y à H:i', (int)$d['updated_at'])) ?>
                <?php if (!empty($d['version'])): ?> · v<?= (int)$d['version'] ?><?php endif; ?>
                <?php if (!empty($d['size'])): ?> · <?= e(glm_format_size((int)$d['size'])) ?><?php endif; ?>
                · par <?= e($d['by']) ?>
              </span>
            </div>
            <div class="demo-actions">
              <button class="btn btn-ghost btn-sm" type="button" data-copy="<?= e($url) ?>">Copier le lien</button>
              <button class="btn btn-ghost btn-sm" type="button" data-update="<?= e($d['slug']) ?>" data-client="<?= e($d['client']) ?>">Mettre à jour</button>
              <form method="post" action="./" data-confirm="Supprimer définitivement la démo « <?= e($d['client']) ?> » ? Le lien ne fonctionnera plus.">
                <input type="hidden" name="csrf" value="<?= e($csrf) ?>">
                <input type="hidden" name="action" value="delete">
                <input type="hidden" name="slug" value="<?= e($d['slug']) ?>">
                <button class="btn btn-danger btn-sm" type="submit">Supprimer</button>
              </form>
            </div>
          </li>
        <?php endforeach; ?>
      </ul>
    <?php endif; ?>
  </section>
</main>

<script>
  window.GLM_ADMIN = {
    urlPattern: <?= json_encode($urlPattern) ?>,
    existing: <?= json_encode(array_keys($demos)) ?>
  };
</script>
<script src="admin.js?v=1"></script>

<?php endif; ?>
</body>
</html>
