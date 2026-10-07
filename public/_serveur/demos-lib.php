<?php
/**
 * Logique des démos clients GLM : publication d’une archive ZIP dans le dossier du sous-domaine
 * demo.glmprime.com, liste, suppression, et limitation des tentatives de connexion.
 * Fichier non accessible depuis le web (voir _serveur/.htaccess) ; inclus par admin/api.php et par les tests.
 *
 * L’identifiant d’URL est calculé de la même façon dans src/lib/demos.ts (aperçu dans le navigateur) :
 * toute modification doit être reportée dans les deux fichiers. C’est ce fichier-ci qui fait foi.
 */
declare(strict_types=1);

const GLM_DEMOS_MAX_FICHIERS = 20000;

// Une démo est un site statique : tout ce qui pourrait s’exécuter sur l’hébergement est refusé.
const GLM_DEMOS_EXTENSIONS_INTERDITES = [
    'php', 'php3', 'php4', 'php5', 'php7', 'php8', 'phtml', 'pht', 'phar', 'phps',
    'cgi', 'pl', 'py', 'rb', 'sh', 'bash', 'asp', 'aspx', 'jsp', 'exe', 'dll', 'so',
];
const GLM_DEMOS_NOMS_INTERDITS = ['.htaccess', '.htpasswd', '.user.ini', 'php.ini', 'web.config', '.ovhconfig'];

/** Erreur destinée à être affichée telle quelle à l’équipe. */
final class GlmDemoErreur extends RuntimeException
{
}

/** Identifiant d’URL à partir d’un nom : minuscules, chiffres et tirets, 60 caractères au plus. */
function glm_demos_slug(string $valeur): string
{
    $valeur = trim($valeur);
    if (class_exists('Normalizer')) {
        $valeur = Normalizer::normalize($valeur, Normalizer::FORM_D) ?: $valeur;
        $valeur = preg_replace('/\p{Mn}/u', '', $valeur) ?? $valeur;
    } elseif (function_exists('iconv')) {
        $valeur = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $valeur) ?: $valeur;
    }
    $valeur = preg_replace('/[^a-z0-9]+/', '-', strtolower($valeur)) ?? '';
    return trim(substr(trim($valeur, '-'), 0, 60), '-');
}

function glm_demos_slug_valide(string $slug): bool
{
    return (bool) preg_match('/^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/', $slug);
}

/** Adresse publique d’une démo : {slug} est remplacé dans le modèle de la configuration. */
function glm_demos_url(string $modele, string $slug): string
{
    return str_replace('{slug}', $slug, $modele);
}

/**
 * Normalise le chemin d’une entrée de l’archive. Retourne null pour les entrées à ignorer
 * (dossiers, fichiers système macOS/Windows) ; lève une erreur pour une entrée dangereuse.
 */
function glm_demos_chemin_entree(string $nom): ?string
{
    $nom = str_replace('\\', '/', $nom);
    if (str_ends_with($nom, '/') || str_starts_with($nom, '__MACOSX/')) {
        return null;
    }
    $parties = [];
    foreach (explode('/', $nom) as $partie) {
        if ($partie === '' || $partie === '.') {
            continue;
        }
        if ($partie === '..' || str_contains($partie, "\0") || str_contains($partie, ':')) {
            throw new GlmDemoErreur("Chemin invalide dans l’archive : $nom");
        }
        $parties[] = $partie;
    }
    if ($parties === [] || in_array(end($parties), ['.DS_Store', 'Thumbs.db', 'desktop.ini'], true)) {
        return null;
    }
    $base = strtolower((string) end($parties));
    if (
        in_array($base, GLM_DEMOS_NOMS_INTERDITS, true)
        || in_array(pathinfo($base, PATHINFO_EXTENSION), GLM_DEMOS_EXTENSIONS_INTERDITES, true)
    ) {
        throw new GlmDemoErreur("Fichier non autorisé dans une démo (site statique uniquement) : $nom");
    }
    return implode('/', $parties);
}

/** @return array<string, array<string, mixed>> */
function glm_demos_lire_meta(string $fichier): array
{
    if (!is_file($fichier)) {
        return [];
    }
    $donnees = json_decode((string) file_get_contents($fichier), true);
    return is_array($donnees) ? $donnees : [];
}

/** @param array<string, array<string, mixed>> $meta */
function glm_demos_ecrire_meta(string $fichier, array $meta): void
{
    if (!is_dir(dirname($fichier))) {
        mkdir(dirname($fichier), 0700, true);
    }
    $temporaire = $fichier . '.' . bin2hex(random_bytes(4)) . '.tmp';
    file_put_contents($temporaire, json_encode($meta, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), LOCK_EX);
    rename($temporaire, $fichier);
}

function glm_demos_supprimer_dossier(string $chemin): void
{
    if (is_link($chemin) || is_file($chemin)) {
        unlink($chemin);
        return;
    }
    if (!is_dir($chemin)) {
        return;
    }
    foreach (scandir($chemin) ?: [] as $entree) {
        if ($entree !== '.' && $entree !== '..') {
            glm_demos_supprimer_dossier("$chemin/$entree");
        }
    }
    rmdir($chemin);
}

function glm_demos_verifier_racine(string $racine): void
{
    if ($racine === '' || !is_dir($racine) || !is_writable($racine)) {
        throw new GlmDemoErreur("Le dossier des démos est introuvable ou non accessible en écriture. Vérifiez « dossier_demos » dans la configuration.");
    }
}

/**
 * Publie une archive ZIP comme démo « $slug » dans $racine/$slug. La version précédente est remplacée
 * d’un coup : le site n’est jamais à moitié publié.
 *
 * @return array<string, mixed> métadonnées de la démo
 */
function glm_demos_publier(
    string $archive,
    string $slug,
    string $client,
    string $auteur,
    string $racine,
    string $fichierMeta,
    int $maxOctets,
    int $maintenant,
): array {
    if (!glm_demos_slug_valide($slug)) {
        throw new GlmDemoErreur('Identifiant invalide : utilisez des minuscules, des chiffres et des tirets.');
    }
    if (!class_exists('ZipArchive')) {
        throw new GlmDemoErreur('L’extension PHP « zip » n’est pas activée sur l’hébergement.');
    }
    glm_demos_verifier_racine($racine);

    $zip = new ZipArchive();
    if ($zip->open($archive) !== true) {
        throw new GlmDemoErreur('Le fichier envoyé n’est pas une archive ZIP valide.');
    }

    $temporaire = "$racine/.publication-$slug-" . bin2hex(random_bytes(4));
    try {
        // 1. Contrôle de toutes les entrées avant d’écrire quoi que ce soit.
        $entrees = [];
        $taille = 0;
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $stat = $zip->statIndex($i);
            $chemin = $stat === false ? null : glm_demos_chemin_entree($stat['name']);
            if ($chemin !== null) {
                $entrees[$i] = $chemin;
                $taille += $stat['size'];
            }
        }
        if ($entrees === []) {
            throw new GlmDemoErreur('L’archive est vide.');
        }
        if (count($entrees) > GLM_DEMOS_MAX_FICHIERS) {
            throw new GlmDemoErreur('L’archive contient trop de fichiers (' . GLM_DEMOS_MAX_FICHIERS . ' au maximum).');
        }
        if ($taille > $maxOctets) {
            throw new GlmDemoErreur('Le site décompressé dépasse ' . intdiv($maxOctets, 1048576) . ' Mo.');
        }

        // 2. Site rangé dans un unique dossier (« mon-site/index.html ») : ce dossier est retiré.
        $premiers = array_unique(array_map(static fn(string $c): string => explode('/', $c, 2)[0], $entrees));
        $toutDansUnDossier = count($premiers) === 1
            && array_filter($entrees, static fn(string $c): bool => !str_contains($c, '/')) === [];
        if ($toutDansUnDossier) {
            $prefixe = reset($premiers) . '/';
            $entrees = array_map(static fn(string $c): string => substr($c, strlen($prefixe)), $entrees);
        }
        $index = array_filter($entrees, static fn(string $c): bool => in_array(strtolower($c), ['index.html', 'index.htm'], true));
        if ($index === []) {
            throw new GlmDemoErreur('Aucun fichier index.html à la racine du site dans l’archive.');
        }

        // 3. Extraction dans un dossier caché, à côté de la destination.
        mkdir($temporaire, 0755);
        foreach ($entrees as $i => $chemin) {
            $cible = "$temporaire/$chemin";
            if (!is_dir(dirname($cible))) {
                mkdir(dirname($cible), 0755, true);
            }
            $entree = $zip->getStream((string) $zip->getNameIndex($i));
            $sortie = fopen($cible, 'wb');
            if ($entree === false || $sortie === false) {
                throw new GlmDemoErreur("Impossible d’extraire $chemin.");
            }
            stream_copy_to_stream($entree, $sortie);
            fclose($entree);
            fclose($sortie);
            chmod($cible, 0644);
        }
    } catch (Throwable $erreur) {
        glm_demos_supprimer_dossier($temporaire);
        throw $erreur;
    } finally {
        $zip->close();
    }

    // 4. Bascule : l’ancienne version est mise de côté, puis supprimée une fois la nouvelle en place.
    $destination = "$racine/$slug";
    $ancienne = null;
    if (file_exists($destination)) {
        $ancienne = "$racine/.ancienne-$slug-" . bin2hex(random_bytes(4));
        rename($destination, $ancienne);
    }
    if (!rename($temporaire, $destination)) {
        if ($ancienne !== null) {
            rename($ancienne, $destination);
        }
        glm_demos_supprimer_dossier($temporaire);
        throw new GlmDemoErreur('Impossible de publier la démo (droits d’écriture du dossier des démos ?).');
    }
    if ($ancienne !== null) {
        glm_demos_supprimer_dossier($ancienne);
    }

    $meta = glm_demos_lire_meta($fichierMeta);
    $precedente = $meta[$slug] ?? [];
    $meta[$slug] = [
        'slug' => $slug,
        'client' => $client !== '' ? $client : ($precedente['client'] ?? $slug),
        'creeLe' => $precedente['creeLe'] ?? $maintenant,
        'modifieLe' => $maintenant,
        'version' => (int) ($precedente['version'] ?? 0) + 1,
        'fichiers' => count($entrees),
        'taille' => $taille,
        'auteur' => $auteur,
    ];
    glm_demos_ecrire_meta($fichierMeta, $meta);
    return $meta[$slug];
}

/**
 * Démos présentes dans le dossier, les plus récentes d’abord. Une démo déposée à la main (sans
 * métadonnées) apparaît aussi.
 *
 * @return list<array<string, mixed>>
 */
function glm_demos_lister(string $racine, string $fichierMeta): array
{
    glm_demos_verifier_racine($racine);
    $meta = glm_demos_lire_meta($fichierMeta);
    $demos = [];
    foreach (scandir($racine) ?: [] as $entree) {
        if (!glm_demos_slug_valide($entree) || !is_dir("$racine/$entree")) {
            continue;
        }
        $demos[] = ['slug' => $entree] + ($meta[$entree] ?? []) + [
            'client' => $entree,
            'modifieLe' => (int) filemtime("$racine/$entree"),
            'version' => null,
            'fichiers' => null,
            'taille' => null,
            'auteur' => null,
        ];
    }
    usort($demos, static fn(array $a, array $b): int => $b['modifieLe'] <=> $a['modifieLe']);
    return $demos;
}

function glm_demos_supprimer(string $slug, string $racine, string $fichierMeta): void
{
    if (!glm_demos_slug_valide($slug)) {
        throw new GlmDemoErreur('Identifiant invalide.');
    }
    glm_demos_verifier_racine($racine);
    if (!is_dir("$racine/$slug")) {
        throw new GlmDemoErreur('Cette démo n’existe pas.');
    }
    glm_demos_supprimer_dossier("$racine/$slug");
    $meta = glm_demos_lire_meta($fichierMeta);
    unset($meta[$slug]);
    glm_demos_ecrire_meta($fichierMeta, $meta);
}

/**
 * Limitation des tentatives de connexion (mot de passe ou jeton) : $max échecs par IP sur $fenetre secondes.
 * L’IP est stockée sous forme hachée (avec le sel de la configuration).
 */
function glm_demos_bloque(string $ip, string $sel, string $fichier, int $max, int $fenetre, int $maintenant): bool
{
    $echecs = glm_demos_lire_meta($fichier)[hash('sha256', $sel . $ip)] ?? [];
    return count(array_filter($echecs, static fn($t): bool => is_int($t) && $t > $maintenant - $fenetre)) >= $max;
}

function glm_demos_noter_echec(string $ip, string $sel, string $fichier, int $fenetre, int $maintenant): void
{
    $tous = glm_demos_lire_meta($fichier);
    foreach ($tous as $cle => $echecs) {
        $tous[$cle] = array_values(array_filter($echecs, static fn($t): bool => is_int($t) && $t > $maintenant - $fenetre));
        if ($tous[$cle] === []) {
            unset($tous[$cle]);
        }
    }
    $tous[hash('sha256', $sel . $ip)][] = $maintenant;
    glm_demos_ecrire_meta($fichier, $tous);
}
