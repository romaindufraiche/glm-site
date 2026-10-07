<?php
/**
 * Tests de la publication des démos clients (sans dépendance) : php tests/php/demos.test.php
 */
declare(strict_types=1);

require __DIR__ . '/../../public/_serveur/demos-lib.php';

$echecs = 0;
function verifier(string $nom, bool $condition): void
{
    global $echecs;
    echo ($condition ? '  ✓ ' : '  ✗ ') . $nom . PHP_EOL;
    if (!$condition) {
        $echecs++;
    }
}

/** Message d’erreur levé par $fonction, ou null si elle réussit. */
function erreur_de(callable $fonction): ?string
{
    try {
        $fonction();
        return null;
    } catch (GlmDemoErreur $e) {
        return $e->getMessage();
    }
}

/** @param array<string, string> $fichiers */
function creer_zip(string $chemin, array $fichiers): string
{
    $zip = new ZipArchive();
    $zip->open($chemin, ZipArchive::CREATE | ZipArchive::OVERWRITE);
    foreach ($fichiers as $nom => $contenu) {
        $zip->addFromString($nom, $contenu);
    }
    $zip->close();
    return $chemin;
}

$base = sys_get_temp_dir() . '/glm-demos-test-' . bin2hex(random_bytes(4));
$racine = "$base/demo";
$meta = "$base/donnees/demos.json";
mkdir($racine, 0755, true);
$publier = static fn(string $zip, string $slug, string $client = 'Client', int $t = 1000) =>
    glm_demos_publier($zip, $slug, $client, 'romain', $racine, $meta, 50 * 1048576, $t);

echo 'Identifiant d’URL' . PHP_EOL;
verifier('accents, espaces et symboles sont convertis', glm_demos_slug('Garage Dupré & Fils') === 'garage-dupre-fils');
verifier('limité à 60 caractères sans tiret final', glm_demos_slug(str_repeat('ab-', 40)) === rtrim(substr(str_repeat('ab-', 40), 0, 60), '-'));
verifier('un identifiant avec des majuscules est refusé', !glm_demos_slug_valide('Client'));
verifier('un identifiant avec « .. » est refusé', !glm_demos_slug_valide('..'));
verifier('le modèle d’adresse est appliqué', glm_demos_url('https://demo.glmprime.com/{slug}/', 'abc') === 'https://demo.glmprime.com/abc/');

echo 'Publication' . PHP_EOL;
$zip = creer_zip("$base/site.zip", [
    'mon-site/index.html' => '<h1>v1</h1>',
    'mon-site/assets/style.css' => 'body{}',
    '__MACOSX/mon-site/._index.html' => 'x',
    'mon-site/.DS_Store' => 'x',
]);
$demo = $publier($zip, 'garage-dupre', 'Garage Dupré');
verifier('le dossier racine unique de l’archive est retiré', is_file("$racine/garage-dupre/index.html"));
verifier('les sous-dossiers sont conservés', is_file("$racine/garage-dupre/assets/style.css"));
verifier('les fichiers système sont ignorés', !file_exists("$racine/garage-dupre/.DS_Store") && !is_dir("$racine/garage-dupre/__MACOSX"));
verifier('les métadonnées sont enregistrées', $demo['version'] === 1 && $demo['fichiers'] === 2 && $demo['client'] === 'Garage Dupré');

$demo = $publier(creer_zip("$base/v2.zip", ['index.html' => '<h1>v2</h1>']), 'garage-dupre', '', 2000);
verifier('une nouvelle version remplace entièrement l’ancienne', file_get_contents("$racine/garage-dupre/index.html") === '<h1>v2</h1>' && !is_dir("$racine/garage-dupre/assets"));
verifier('la version est incrémentée et le nom du client conservé', $demo['version'] === 2 && $demo['client'] === 'Garage Dupré' && $demo['creeLe'] === 1000);
verifier('aucun dossier temporaire ne reste', glob("$racine/.*-*") === []);

echo 'Archives refusées' . PHP_EOL;
$refus = [
    'un chemin qui remonte (« ../ »)' => ['index.html' => 'x', '../../evil.html' => 'x'],
    'un script PHP' => ['index.html' => 'x', 'contact.PHP' => '<?php'],
    'un fichier .htaccess' => ['index.html' => 'x', 'sous/.htaccess' => 'x'],
    'une archive sans index.html' => ['page.html' => 'x'],
];
foreach ($refus as $cas => $fichiers) {
    verifier("refuse $cas", erreur_de(fn() => $publier(creer_zip("$base/refus.zip", $fichiers), 'refus')) !== null);
}
file_put_contents("$base/pas-un-zip.zip", 'texte');
verifier('refuse un fichier qui n’est pas un ZIP', erreur_de(fn() => $publier("$base/pas-un-zip.zip", 'refus')) !== null);
verifier('refuse un identifiant invalide', erreur_de(fn() => $publier($zip, '../www')) !== null);
verifier('refuse un site trop volumineux', erreur_de(fn() => glm_demos_publier($zip, 'gros', '', 'r', $racine, $meta, 10, 0)) !== null);
verifier('une archive refusée ne crée aucun dossier', !is_dir("$racine/refus") && glob("$racine/.*-*") === []);
verifier('un dossier des démos absent est signalé', erreur_de(fn() => glm_demos_publier($zip, 'x', '', 'r', "$base/absent", $meta, 9999, 0)) !== null);

echo 'Liste et suppression' . PHP_EOL;
mkdir("$racine/depot-manuel");
$liste = glm_demos_lister($racine, $meta);
verifier('les démos sont listées, y compris celles déposées à la main', array_column($liste, 'slug') === ['garage-dupre', 'depot-manuel'] || array_column($liste, 'slug') === ['depot-manuel', 'garage-dupre']);
glm_demos_supprimer('garage-dupre', $racine, $meta);
verifier('la suppression retire le dossier et les métadonnées', !is_dir("$racine/garage-dupre") && !isset(glm_demos_lire_meta($meta)['garage-dupre']));
verifier('supprimer une démo absente est signalé', erreur_de(fn() => glm_demos_supprimer('garage-dupre', $racine, $meta)) !== null);

echo 'Limitation des tentatives de connexion' . PHP_EOL;
$echecsFichier = "$base/donnees/echecs.json";
$sel = str_repeat('s', 32);
for ($i = 0; $i < 5; $i++) {
    glm_demos_noter_echec('203.0.113.7', $sel, $echecsFichier, 900, 5000 + $i);
}
verifier('5 échecs bloquent l’IP', glm_demos_bloque('203.0.113.7', $sel, $echecsFichier, 5, 900, 5010));
verifier('une autre IP n’est pas bloquée', !glm_demos_bloque('203.0.113.8', $sel, $echecsFichier, 5, 900, 5010));
verifier('le blocage expire après 15 minutes', !glm_demos_bloque('203.0.113.7', $sel, $echecsFichier, 5, 900, 5000 + 905));
verifier('l’IP n’est jamais stockée en clair', !str_contains((string) file_get_contents($echecsFichier), '203.0.113.7'));

glm_demos_supprimer_dossier($base);

echo PHP_EOL . ($echecs === 0 ? 'Tous les tests des démos passent.' : "$echecs test(s) en échec.") . PHP_EOL;
exit($echecs === 0 ? 0 : 1);
