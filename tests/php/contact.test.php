<?php
/**
 * Tests de la logique serveur du formulaire (sans dépendance) : php tests/php/contact.test.php
 */
declare(strict_types=1);

require __DIR__ . '/../../public/_serveur/contact-lib.php';

$echecs = 0;
function verifier(string $nom, bool $condition): void
{
    global $echecs;
    echo ($condition ? '  ✓ ' : '  ✗ ') . $nom . PHP_EOL;
    if (!$condition) {
        $echecs++;
    }
}

$valide = [
    'nom' => 'Camille Martin',
    'email' => 'camille@entreprise.fr',
    'entreprise' => '',
    'sujet' => 'Automatisation & IA',
    'message' => 'Bonjour, nous voulons automatiser nos relances.',
];

echo 'Validation' . PHP_EOL;
verifier('un message complet est valide', glm_valider(glm_normaliser($valide)) === []);
verifier('les champs vides sont signalés', array_keys(glm_valider(glm_normaliser([]))) === ['nom', 'email', 'sujet', 'message']);
verifier('un sujet hors liste est refusé', isset(glm_valider(glm_normaliser(['sujet' => 'Hack'] + $valide))['sujet']));
verifier('une adresse e-mail invalide est refusée', isset(glm_valider(glm_normaliser(['email' => 'pas-un-email'] + $valide))['email']));
verifier('un tableau à la place d’une chaîne est ignoré', glm_normaliser(['nom' => ['x']] + $valide)['nom'] === '');
verifier('les longueurs sont comptées en caractères (UTF-8)', glm_valider(glm_normaliser(['nom' => 'Éé'] + $valide)) === []);
verifier('un message trop long est refusé', isset(glm_valider(glm_normaliser(['message' => str_repeat('x', 5001)] + $valide))['message']));
verifier('les caractères de contrôle sont retirés', glm_normaliser(['nom' => "Cam\x07ille"] + $valide)['nom'] === 'Camille');

echo 'Injection d’en-têtes' . PHP_EOL;
$attaque = glm_normaliser(['nom' => "Camille\r\nBcc: victime@exemple.com"] + $valide);
verifier('un nom sur plusieurs lignes est refusé', isset(glm_valider($attaque)['nom']));
$email = glm_construire_email($attaque, 'site@glm.fr');
verifier('aucun en-tête Bcc ne peut être injecté', !preg_match('/^Bcc:/mi', $email['entetes']));
verifier('le sujet est encodé sur une seule ligne', !str_contains($email['sujet'], "\n"));
$email = glm_construire_email(glm_normaliser($valide), 'site@glm.fr');
verifier('le visiteur est en Reply-To', str_contains($email['entetes'], 'Reply-To: ') && str_contains($email['entetes'], '<camille@entreprise.fr>'));
verifier('l’expéditeur est l’adresse du domaine', str_contains($email['entetes'], '<site@glm.fr>'));
verifier('le corps contient le message', str_contains($email['corps'], $valide['message']));

echo 'Limitation des envois' . PHP_EOL;
$dossier = sys_get_temp_dir() . '/glm-test-' . bin2hex(random_bytes(4));
$sel = str_repeat('s', 32);
$t = 1_000_000;
$resultats = [];
for ($i = 0; $i < 4; $i++) {
    $resultats[] = glm_limite_atteinte('203.0.113.7', $sel, $dossier, 3, $t + $i);
}
verifier('3 envois passent, le 4e est bloqué', $resultats === [false, false, false, true]);
verifier('une autre IP n’est pas bloquée', glm_limite_atteinte('203.0.113.8', $sel, $dossier, 3, $t) === false);
verifier('le blocage expire après une heure', glm_limite_atteinte('203.0.113.7', $sel, $dossier, 3, $t + 3601) === false);
$contenu = implode('', array_map('file_get_contents', glob($dossier . '/*.json') ?: []));
$noms = implode('', glob($dossier . '/*') ?: []);
verifier('l’IP n’est jamais stockée en clair', !str_contains($contenu . $noms, '203.0.113.7'));
array_map('unlink', glob($dossier . '/*') ?: []);
rmdir($dossier);

echo PHP_EOL . ($echecs === 0 ? 'Tous les tests PHP passent.' : "$echecs test(s) en échec.") . PHP_EOL;
exit($echecs === 0 ? 0 : 1);
