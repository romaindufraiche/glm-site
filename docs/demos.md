# Démos sur sous-domaine (demo1.glmprime.com…)

Chaque démo de projet a son propre dépôt GitHub, son dossier sur l’hébergement OVH et son
sous-domaine. Elle se met en ligne depuis ce dépôt, avec le workflow « Déploiement d’une démo ».

```
dossier personnel OVH
├── www/                 site principal (www.glmprime.com), géré par « Déploiement OVH »
└── demos/
    ├── demo1/           demo1.glmprime.com
    └── demo2/           demo2.glmprime.com
```

Les démos sont **à côté** de `www/`, jamais dedans : le déploiement du site principal vide `www/`
de tout fichier en trop et effacerait une démo qui s’y trouverait.

## Une seule fois : les secrets SFTP

Dans GitHub : **Settings → Secrets and variables → Actions → New repository secret**.

| Secret          | Valeur                                                               |
| --------------- | -------------------------------------------------------------------- |
| `SFTP_HOST`     | serveur SFTP de l’hébergement (ex. `ssh.cluster131.hosting.ovh.net`) |
| `SFTP_USER`     | identifiant FTP/SSH de l’hébergement                                 |
| `SFTP_PASSWORD` | mot de passe de cet identifiant                                      |
| `SFTP_PORT`     | `22`                                                                 |
| `DEMO_TOKEN`    | facultatif : jeton GitHub en lecture seule, pour une démo privée     |

Ils sont chiffrés par GitHub et n’apparaissent jamais dans les journaux. Ne les écrire nulle part
ailleurs (ni dans le code, ni dans un message).

## Pour chaque nouvelle démo

1. **Créer le sous-domaine chez OVH** : espace client → Web Cloud → Hébergements → glmprime.com →
   onglet **Multisite** → **Ajouter un domaine ou sous-domaine** → `demo1.glmprime.com`.
   - Dossier racine : `demos/demo1` (sans `www/` devant).
   - Cocher **SSL** (certificat Let’s Encrypt gratuit).
   - Laisser OVH créer l’entrée DNS si le domaine est géré chez OVH. Sinon, ajouter dans la zone DNS
     un `CNAME demo1 → glmprime.com.` (ou un `*` pour tous les sous-domaines d’un coup).
2. **Premier envoi, à blanc** : onglet **Actions → Déploiement d’une démo → Run workflow**.
   - `nom` : `demo1` (lettres minuscules, chiffres, tirets) ;
   - `depot` : le dépôt de la démo, ex. `krokow/ombres-reliques` ;
   - `branche` : `main` ;
   - `essai` : coché. Le journal affiche ce qui serait envoyé, sans rien modifier.
3. **Envoi réel** : relancer avec `essai` décoché. Après quelques minutes (propagation DNS et
   certificat la première fois), la démo répond sur `https://demo1.glmprime.com`.

Pour mettre une démo à jour, relancer le workflow avec le même `nom` : le dossier distant devient
une copie exacte de la démo (les anciens fichiers sont supprimés).

## Ce que fait le workflow

- Récupère le dépôt de la démo ; s’il a un script `build` (Vite, Astro…), lance `npm ci` puis
  `npm run build` et publie `dist/`, `build/` ou `out/`. Sinon, publie la racine (site statique).
- Ajoute, si la démo n’en fournit pas, un `.htaccess` (HTTPS imposé, en-têtes de sécurité, pas
  d’indexation par les moteurs) et un `robots.txt` qui interdit l’indexation : une démo n’a pas à
  concurrencer le site principal ni à être examinée comme un site à part entière.
- Envoie le tout par SFTP (`lftp mirror`) dans `demos/<nom>`, puis vérifie que le sous-domaine répond.

## Limites

L’hébergement mutualisé ne sert que des fichiers statiques (HTML, CSS, JS) et du PHP. Une
application qui a besoin d’un serveur Node (Next.js avec rendu serveur, routes API…) ne tournera
pas dessus : il lui faut un hébergement d’application, avec un sous-domaine qui pointe vers lui.
