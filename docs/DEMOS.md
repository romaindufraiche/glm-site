# Démos clients sur demo.glmprime.com

Le bouton **Se connecter** du site mène à `glmprime.com/admin/`, un espace réservé à l'équipe qui permet de
publier un site client en démo, sans passer par le SFTP :

1. Se connecter.
2. Saisir le nom du client (l'identifiant d'URL est proposé automatiquement).
3. Déposer l'archive `.zip` du site → **Publier la démo**.
4. Copier le lien `https://demo.glmprime.com/<client>/` et l'envoyer au client.

Pour une nouvelle version, cliquer sur **Mettre à jour** à côté de la démo : l'ancienne version est remplacée
d'un coup (le lien ne change pas). **Supprimer** retire la démo une fois le site livré sur le domaine du client.

## Installation (une seule fois)

Prérequis : un hébergement Apache avec PHP 8.0+ et l'extension `zip` (OVH, o2switch, Hostinger, IONOS… : c'est le cas par défaut).

### 1. Créer le sous-domaine

Dans le panneau de l'hébergeur, créer le sous-domaine **demo.glmprime.com**, pointant vers un dossier dédié,
par exemple `/home/<compte>/demo.glmprime.com`, et activer le certificat SSL (Let's Encrypt) dessus.

Si le DNS est géré ailleurs, ajouter un enregistrement `CNAME demo → glmprime.com.` (ou un `A` vers l'IP de l'hébergement).

### 2. Préparer le dossier des démos

Envoyer par SFTP le contenu du dossier `demo-root/` de ce dépôt **à la racine du sous-domaine**
(`.htaccess` et `index.html`). Ce `.htaccess` :
- empêche l'indexation des démos par Google (`noindex`) ;
- interdit l'exécution de scripts serveur dans les démos ;
- masque les dossiers temporaires de publication.

Le dossier doit être accessible en écriture par PHP (c'est le cas par défaut sur un hébergement mutualisé,
le site et le sous-domaine tournant sous le même compte).

### 3. Configurer l'espace admin

Le dossier `admin/` est déployé avec le reste du site. Ensuite, **directement sur le serveur** :

1. Copier `admin/config.sample.php` en `admin/config.php`.
2. Générer le hash du mot de passe de chaque membre de l'équipe :
   ```sh
   php admin/hash-password.php "UnMotDePasseSolide"
   ```
   (ou, sans terminal : `php -r 'echo password_hash("UnMotDePasseSolide", PASSWORD_DEFAULT);'`)
3. Renseigner dans `config.php` :
   - `users` : identifiant → hash ;
   - `demo_root` : chemin absolu du dossier du sous-domaine (ex. `/home/<compte>/demo.glmprime.com`) ;
   - `api_token` (optionnel, voir plus bas).

`config.php` n'est **jamais** commité (il est dans `.gitignore`).

### Limite de taille des archives

`admin/.user.ini` et `admin/.htaccess` relèvent la limite d'envoi à 256 Mo. La limite réellement appliquée
s'affiche sous la zone de dépôt ; si elle reste basse (2M), la modifier dans le panneau PHP de l'hébergeur
(`upload_max_filesize` / `post_max_size`).

## Préparer l'archive d'un site

- Le `.zip` doit contenir un `index.html` à la racine, ou un unique dossier qui le contient (il est retiré automatiquement).
- Les démos sont des **sites statiques** : les fichiers `.php`, `.htaccess`, scripts serveur… sont refusés.
- Les démos étant servies dans un sous-dossier (`/client/`), le site doit utiliser des **chemins relatifs**
  (`assets/style.css` plutôt que `/assets/style.css`). Pour un projet Vite : `base: './'` ; pour Next.js
  en export statique : `basePath: '/client'`. Sinon, utiliser l'option sous-domaines ci-dessous.

## Option : une démo par sous-domaine (`client.demo.glmprime.com`)

Utile pour les sites qui utilisent des chemins absolus. Nécessite :
1. un enregistrement DNS wildcard `*.demo.glmprime.com` vers l'hébergement et un certificat SSL wildcard
   (proposé par la plupart des hébergeurs, ou via Cloudflare) ;
2. de rattacher le wildcard au même dossier que `demo.glmprime.com` ;
3. de décommenter le bloc « sous-domaines » dans le `.htaccess` du dossier des démos ;
4. `'demo_url_pattern' => 'https://{slug}.demo.glmprime.com/'` dans `config.php`.

## Automatiser depuis un dépôt Git (API)

En définissant `api_token` dans `config.php` (`php -r "echo bin2hex(random_bytes(32));"`), une démo peut être
publiée sans interface :

```sh
curl -fsS -H "Authorization: Bearer $GLM_DEMO_TOKEN" \
     -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip \
     https://glmprime.com/admin/api.php
```

Exemple de workflow GitHub Actions à placer dans le dépôt d'un site client (`.github/workflows/demo.yml`),
avec le jeton enregistré dans les secrets du dépôt sous `GLM_DEMO_TOKEN` : chaque push sur `main` met la démo à jour.

```yaml
name: Démo client
on:
  push:
    branches: [main]
jobs:
  demo:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # Si le site a une étape de build (npm run build…), l'ajouter ici et zipper le dossier de sortie.
      - run: zip -r site.zip . -x '.git/*' '.github/*'
      - run: |
          curl -fsS -H "Authorization: Bearer ${{ secrets.GLM_DEMO_TOKEN }}" \
               -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip \
               https://glmprime.com/admin/api.php
```

## Sécurité

- Mots de passe stockés uniquement sous forme de hash (bcrypt), session `HttpOnly`/`SameSite=Strict`, jeton CSRF sur chaque action.
- 5 échecs de connexion (ou de jeton API) par IP bloquent les tentatives pendant 15 minutes.
- Archives contrôlées avant extraction : chemins `..` refusés, fichiers exécutables refusés, taille et nombre de fichiers limités.
- `admin/config.php`, `admin/lib.php` et `admin/data/` sont inaccessibles depuis le web via `.htaccess`
  (sur un serveur **nginx**, reproduire ces règles dans la configuration du serveur).
