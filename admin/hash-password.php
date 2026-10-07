<?php
// Usage (en ligne de commande uniquement) : php admin/hash-password.php "MonMotDePasse"
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
if ($argc < 2 || $argv[1] === '') { fwrite(STDERR, "Usage : php hash-password.php \"MotDePasse\"\n"); exit(1); }
echo password_hash($argv[1], PASSWORD_DEFAULT), PHP_EOL;
