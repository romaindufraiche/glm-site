<?php
/*
 * Bibliothèque de l'espace admin GLM : authentification, sessions,
 * et déploiement des démos clients dans le dossier de demo.glmprime.com.
 */

declare(strict_types=1);

const GLM_DATA_DIR = __DIR__ . '/data';
const GLM_MAX_LOGIN_FAILS = 5;
const GLM_LOGIN_WINDOW = 900; // secondes
const GLM_MAX_FILES = 20000;

// Extensions exécutables côté serveur ou fichiers de configuration Apache/PHP :
// une démo est un site statique, on refuse tout ce qui pourrait s'exécuter sur l'hébergement.
const GLM_BLOCKED_EXT = ['php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'pht', 'phar', 'phps',
    'cgi', 'pl', 'py', 'rb', 'sh', 'bash', 'asp', 'aspx', 'jsp', 'exe', 'dll', 'so'];
const GLM_BLOCKED_NAMES = ['.htaccess', '.htpasswd', '.user.ini', 'php.ini', 'web.config'];

function glm_config(): array
{
    static $config = null;
    if ($config !== null) return $config;
    $file = __DIR__ . '/config.php';
    if (!is_file($file)) {
        http_response_code(500);
        exit("Espace admin non configuré : copiez admin/config.sample.php en admin/config.php sur le serveur.");
    }
    $config = require $file;
    $config['demo_root'] = rtrim((string)($config['demo_root'] ?? ''), '/');
    $config['demo_url_pattern'] = $config['demo_url_pattern'] ?? 'https://demo.glmprime.com/{slug}/';
    $config['max_site_mb'] = (int)($config['max_site_mb'] ?? 500);
    return $config;
}

/* ================= Session & sécurité ================= */

function glm_session_start(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;
    $https = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || ($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
    session_name('GLMADMIN');
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/admin/',
        'secure' => $https,
        'httponly' => true,
        'samesite' => 'Strict',
    ]);
    session_start();
}

function glm_csrf_token(): string
{
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(32));
    return $_SESSION['csrf'];
}

function glm_csrf_valid(?string $token): bool
{
    return is_string($token) && !empty($_SESSION['csrf']) && hash_equals($_SESSION['csrf'], $token);
}

function glm_current_user(): ?string
{
    return $_SESSION['user'] ?? null;
}

function glm_flash(string $type, string $message): void
{
    $_SESSION['flash'][] = ['type' => $type, 'message' => $message];
}

function glm_take_flashes(): array
{
    $flashes = $_SESSION['flash'] ?? [];
    unset($_SESSION['flash']);
    return $flashes;
}

function glm_client_ip(): string
{
    return $_SERVER['REMOTE_ADDR'] ?? 'unknown';
}

/* ================= Stockage JSON ================= */

function glm_data_path(string $name): string
{
    if (!is_dir(GLM_DATA_DIR)) mkdir(GLM_DATA_DIR, 0750, true);
    return GLM_DATA_DIR . '/' . $name;
}

function glm_read_json(string $name): array
{
    $path = glm_data_path($name);
    if (!is_file($path)) return [];
    $data = json_decode((string)file_get_contents($path), true);
    return is_array($data) ? $data : [];
}

function glm_write_json(string $name, array $data): void
{
    $path = glm_data_path($name);
    $tmp = $path . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($tmp, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($tmp, $path);
}

/* ================= Authentification ================= */

function glm_login_blocked(): bool
{
    $attempts = glm_read_json('login-attempts.json');
    $recent = array_filter($attempts[glm_client_ip()] ?? [], fn($t) => $t > time() - GLM_LOGIN_WINDOW);
    return count($recent) >= GLM_MAX_LOGIN_FAILS;
}

function glm_record_login_failure(): void
{
    $attempts = glm_read_json('login-attempts.json');
    $cutoff = time() - GLM_LOGIN_WINDOW;
    foreach ($attempts as $ip => $times) {
        $attempts[$ip] = array_values(array_filter($times, fn($t) => $t > $cutoff));
        if (!$attempts[$ip]) unset($attempts[$ip]);
    }
    $attempts[glm_client_ip()][] = time();
    glm_write_json('login-attempts.json', $attempts);
}

function glm_attempt_login(string $user, string $password): bool
{
    $users = glm_config()['users'] ?? [];
    // Toujours exécuter password_verify pour ne pas révéler l'existence d'un compte par le temps de réponse.
    $hash = $users[$user] ?? '$2y$10$gfmyricUf1q./uWmHDXYr.wBrLa2yQjlaMN4rPx46HnNBUjInrMRu';
    $ok = password_verify($password, $hash) && isset($users[$user]);
    if (!$ok) {
        glm_record_login_failure();
        return false;
    }
    session_regenerate_id(true);
    $_SESSION['user'] = $user;
    return true;
}

/* ================= Démos ================= */

function glm_slugify(string $value): string
{
    $value = trim($value);
    if (function_exists('iconv')) {
        $converted = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        if ($converted !== false) $value = $converted;
    }
    $value = strtolower($value);
    $value = preg_replace('/[^a-z0-9]+/', '-', $value) ?? '';
    return substr(trim($value, '-'), 0, 60);
}

function glm_valid_slug(string $slug): bool
{
    return (bool)preg_match('/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/', $slug);
}

function glm_demo_url(string $slug): string
{
    return str_replace('{slug}', $slug, glm_config()['demo_url_pattern']);
}

function glm_demo_root(): string
{
    $root = glm_config()['demo_root'];
    if ($root === '' || !is_dir($root) || !is_writable($root)) {
        throw new RuntimeException("Le dossier des démos ($root) est introuvable ou non accessible en écriture. Vérifiez 'demo_root' dans config.php.");
    }
    return $root;
}

function glm_list_demos(): array
{
    $meta = glm_read_json('demos.json');
    $demos = [];
    try {
        $root = glm_demo_root();
        foreach (scandir($root) ?: [] as $entry) {
            if ($entry[0] === '.' || !is_dir("$root/$entry") || !glm_valid_slug($entry)) continue;
            $demos[$entry] = ($meta[$entry] ?? []) + [
                'slug' => $entry,
                'client' => $entry,
                'updated_at' => filemtime("$root/$entry"),
                'size' => 0,
                'files' => 0,
                'by' => '—',
            ];
            $demos[$entry]['slug'] = $entry;
        }
    } catch (RuntimeException $e) {
        // Le tableau de bord affiche l'erreur de configuration séparément.
    }
    uasort($demos, fn($a, $b) => ($b['updated_at'] ?? 0) <=> ($a['updated_at'] ?? 0));
    return $demos;
}

function glm_rrmdir(string $dir): void
{
    if (!is_dir($dir) || is_link($dir)) {
        @unlink($dir);
        return;
    }
    foreach (scandir($dir) ?: [] as $entry) {
        if ($entry === '.' || $entry === '..') continue;
        glm_rrmdir("$dir/$entry");
    }
    rmdir($dir);
}

/**
 * Normalise un chemin d'entrée ZIP. Retourne null pour les entrées à ignorer
 * (dossiers, fichiers système macOS) et lève une exception pour les entrées dangereuses.
 */
function glm_zip_entry_path(string $name): ?string
{
    $name = str_replace('\\', '/', $name);
    if (str_ends_with($name, '/')) return null;
    if (str_starts_with($name, '__MACOSX/') || basename($name) === '.DS_Store' || basename($name) === 'Thumbs.db') return null;

    $parts = [];
    foreach (explode('/', $name) as $part) {
        if ($part === '' || $part === '.') continue;
        if ($part === '..' || str_contains($part, "\0") || str_contains($part, ':')) {
            throw new RuntimeException("Chemin invalide dans l'archive : $name");
        }
        $parts[] = $part;
    }
    if (!$parts) return null;

    $base = strtolower(end($parts));
    $ext = pathinfo($base, PATHINFO_EXTENSION);
    if (in_array($base, GLM_BLOCKED_NAMES, true) || in_array($ext, GLM_BLOCKED_EXT, true)) {
        throw new RuntimeException("Fichier non autorisé dans une démo (site statique uniquement) : $name");
    }
    return implode('/', $parts);
}

/**
 * Déploie une archive ZIP comme démo « $slug ». Remplace la version précédente de façon atomique.
 * Retourne les métadonnées de la démo.
 */
function glm_deploy_zip(string $zipPath, string $slug, string $client, string $by): array
{
    if (!glm_valid_slug($slug)) throw new RuntimeException("Identifiant invalide : utilisez des minuscules, chiffres et tirets.");
    if (!class_exists('ZipArchive')) throw new RuntimeException("L'extension PHP « zip » n'est pas activée sur l'hébergement.");

    $zip = new ZipArchive();
    if ($zip->open($zipPath) !== true) throw new RuntimeException("Le fichier envoyé n'est pas une archive ZIP valide.");

    try {
        // 1. Inventaire et contrôle de toutes les entrées avant d'écrire quoi que ce soit.
        $entries = [];
        $totalSize = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $path = glm_zip_entry_path($stat['name']);
            if ($path === null) continue;
            $entries[$i] = $path;
            $totalSize += $stat['size'];
        }
        if (!$entries) throw new RuntimeException("L'archive est vide.");
        if (count($entries) > GLM_MAX_FILES) throw new RuntimeException("L'archive contient trop de fichiers (max " . GLM_MAX_FILES . ").");
        if ($totalSize > glm_config()['max_site_mb'] * 1024 * 1024) {
            throw new RuntimeException("Le site décompressé dépasse " . glm_config()['max_site_mb'] . " Mo.");
        }

        // 2. Si tout le site est dans un unique dossier racine (cas typique « mon-site/index.html »), on le retire.
        $tops = array_unique(array_map(fn($p) => explode('/', $p, 2)[0], $entries));
        $allNested = count($tops) === 1 && !array_filter($entries, fn($p) => !str_contains($p, '/'));
        if ($allNested) {
            $prefix = reset($tops) . '/';
            $entries = array_map(fn($p) => substr($p, strlen($prefix)), $entries);
        }

        $hasIndex = (bool)array_filter($entries, fn($p) => in_array(strtolower($p), ['index.html', 'index.htm'], true));
        if (!$hasIndex) throw new RuntimeException("Aucun fichier index.html à la racine du site dans l'archive.");

        // 3. Extraction dans un dossier temporaire caché, à côté de la destination finale.
        $root = glm_demo_root();
        $tmpDir = "$root/.tmp-$slug-" . bin2hex(random_bytes(4));
        mkdir($tmpDir, 0755);
        try {
            foreach ($entries as $index => $path) {
                $target = "$tmpDir/$path";
                $dir = dirname($target);
                if (!is_dir($dir)) mkdir($dir, 0755, true);
                $in = $zip->getStream($zip->getNameIndex($index));
                if ($in === false) throw new RuntimeException("Impossible de lire $path dans l'archive.");
                $out = fopen($target, 'wb');
                stream_copy_to_stream($in, $out);
                fclose($in);
                fclose($out);
                chmod($target, 0644);
            }
        } catch (Throwable $e) {
            glm_rrmdir($tmpDir);
            throw $e;
        }
    } finally {
        $zip->close();
    }

    // 4. Bascule : l'ancienne version est mise de côté puis supprimée une fois la nouvelle en place.
    $final = "$root/$slug";
    $old = null;
    if (file_exists($final)) {
        $old = "$root/.old-$slug-" . bin2hex(random_bytes(4));
        rename($final, $old);
    }
    if (!rename($tmpDir, $final)) {
        if ($old) rename($old, $final);
        glm_rrmdir($tmpDir);
        throw new RuntimeException("Impossible de publier la démo (droits d'écriture ?).");
    }
    if ($old) glm_rrmdir($old);

    $meta = glm_read_json('demos.json');
    $previous = $meta[$slug] ?? [];
    $meta[$slug] = [
        'slug' => $slug,
        'client' => $client !== '' ? $client : ($previous['client'] ?? $slug),
        'created_at' => $previous['created_at'] ?? time(),
        'updated_at' => time(),
        'version' => ($previous['version'] ?? 0) + 1,
        'files' => count($entries),
        'size' => $totalSize,
        'by' => $by,
    ];
    glm_write_json('demos.json', $meta);
    return $meta[$slug];
}

function glm_delete_demo(string $slug): void
{
    if (!glm_valid_slug($slug)) throw new RuntimeException("Identifiant invalide.");
    $path = glm_demo_root() . "/$slug";
    if (!is_dir($path)) throw new RuntimeException("Cette démo n'existe pas.");
    glm_rrmdir($path);
    $meta = glm_read_json('demos.json');
    unset($meta[$slug]);
    glm_write_json('demos.json', $meta);
}

/** Message lisible pour une erreur d'upload PHP. */
function glm_upload_error(int $code): string
{
    return match ($code) {
        UPLOAD_ERR_INI_SIZE, UPLOAD_ERR_FORM_SIZE => "Fichier trop volumineux pour l'hébergement (limite : " . ini_get('upload_max_filesize') . ").",
        UPLOAD_ERR_PARTIAL => "Envoi interrompu, réessayez.",
        UPLOAD_ERR_NO_FILE => "Aucun fichier sélectionné.",
        default => "Erreur lors de l'envoi du fichier (code $code).",
    };
}

function glm_format_size(int $bytes): string
{
    if ($bytes < 1024) return "$bytes o";
    if ($bytes < 1048576) return round($bytes / 1024) . ' Ko';
    return number_format($bytes / 1048576, 1, ',', ' ') . ' Mo';
}

function e(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES, 'UTF-8');
}
