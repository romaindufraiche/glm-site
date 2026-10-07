# Site vitrine GLM

Site vitrine d’une page de GLM, conforme à la charte graphique v0.5 (voir [`docs/charte-v05.md`](docs/charte-v05.md)).

- **Astro** (génération statique) : du HTML pur, environ 8 Ko de JavaScript au total, sans librairie.
- **Hébergement** : mutualisé OVH, dépôt par FTP du dossier `dist/`.
- **Formulaire de contact** : script PHP `contact.php` qui envoie un e-mail via le serveur OVH (aucun service tiers).
- **Espace équipe** (`/admin/`, lien « Se connecter ») : publication des démos clients sur `demo.glmprime.com`
  sans FTP (voir « Démos clients » plus bas).

## Modifier le contenu

Tout le contenu éditable est dans **un seul fichier** : [`src/data/site.ts`](src/data/site.ts).

| Pour changer…                     | Modifier dans `site.ts`             |
| --------------------------------- | ----------------------------------- |
| Projets (défilement épinglé)      | `projets`                           |
| Associés, bios, photos, LinkedIn  | `equipe`                            |
| Posts LinkedIn                    | `postsLinkedIn` (URL d’intégration) |
| E-mail, page LinkedIn             | `contact`                           |
| SIREN, adresse, mentions légales  | `entreprise`                        |
| Domaine, titre et description SEO | `siteMeta`                          |
| Étapes de la méthode              | `methode`                           |

Une faute de saisie (Calibre inconnu, URL LinkedIn invalide…) fait échouer `npm run build` avec un message
explicite, au lieu de casser le site en ligne.

**Ajouter un post LinkedIn** : sur LinkedIn, menu « … » du post → « Intégrer ce post » → copier uniquement
la valeur `src="…"` de l’iframe (elle commence par `https://www.linkedin.com/embed/feed/update/`).

**Ajouter une photo d’associé** : déposer le fichier (carré, 400 × 400 px minimum, JPEG, PNG ou WebP)
dans `src/assets/equipe/`, puis renseigner `photo: 'nom.jpg'` et `linkedin: 'https://www.linkedin.com/in/…'`.
Le build génère lui-même les versions optimisées (WebP). Les photos s’affichent dans un petit rond :
privilégier une photo carrée, visage centré.

## Développement

Prérequis : Node.js 20 ou plus (22 recommandé) et PHP 8.1 ou plus (tests du formulaire).

```bash
npm install
npm run dev          # site en local sur http://localhost:4321 (le formulaire PHP n’y tourne pas)
npm run lint         # ESLint + Prettier
npm test             # tests unitaires TypeScript (Vitest) et PHP
npm run build        # typecheck (astro check) + génération de dist/
npm run test:e2e     # tests de bout en bout et audit d’accessibilité (Playwright, après build)
npm run images       # régénère favicon, icônes et image Open Graph depuis le logo
```

Pour tester le formulaire réel en local : `npm run build`, copier `config/glm-contact-config.example.php`
dans le dossier parent de `dist/` sous le nom `glm-contact-config.php`, puis `php -S 127.0.0.1:8080 -t dist`.

## Architecture

```
src/
  data/site.ts        contenu éditable (seul fichier à modifier au quotidien)
  styles/tokens.css   design tokens de la charte (couleurs, typographie, espacements)
  components/         primitives de marque : Symbole, Logotype, Filet, Surtitre, Bouton, cartes
  sections/           sections de la page (Nav, Hero, Expertises, Projets, Méthode, Équipe…)
  layouts/            gabarits (base SEO + pages de texte)
  pages/              accueil, mentions légales, confidentialité, confirmations, 404, robots.txt, admin
  lib/                logique isolée et testée (validation du formulaire, consentement, LinkedIn)
  scripts/            comportements côté navigateur (menu, défilement des projets, formulaire, consentement)
public/
  contact.php         point d’entrée du formulaire
  admin/api.php       API de l’espace équipe (connexion, publication des démos)
  _serveur/           logique PHP (non accessible depuis le web)
  .htaccess           HTTPS, en-têtes de sécurité (CSP stricte), cache, 404
  sw.js               désinstalle le service worker de l’ancien site (à supprimer d’ici quelques mois)
config/               modèles de configuration (formulaire, démos) et fichiers du sous-domaine demo.glmprime.com
tests/                unit/ (Vitest), php/, e2e/ (Playwright + axe-core)
```

Choix techniques :

- **Aucun contenu tiers sans consentement** : polices auto-hébergées, iframes LinkedIn chargées seulement
  après accord (choix gardé 6 mois, modifiable via « Gérer les cookies » en pied de page).
- **CSP stricte** (`script-src 'self'`, `style-src 'self'`) : aucun script ni style en ligne.
- **Formulaire** : fonctionne aussi sans JavaScript (redirection vers une page de confirmation).
  Validation côté navigateur pour le confort ; la validation PHP est la seule qui fait foi.
  Protections : champ piège anti-robots, vérification de l’origine, 5 envois par heure et par IP
  (IP stockée sous forme hachée, supprimée après une heure), aucune injection d’en-tête possible.
- Les règles de validation existent en deux exemplaires (`src/lib/validation-contact.ts` et
  `public/_serveur/contact-lib.php`) : toute modification doit être reportée dans les deux.

## Mise en ligne sur OVH

### Première installation

1. **PHP** : dans l’espace client OVH (Hébergement → Informations générales → Version PHP), choisir PHP 8.2 ou plus.
2. **Configuration du formulaire** : copier `config/glm-contact-config.example.php` sur le FTP **à côté**
   du dossier `www/` (et non dedans), sous le nom `glm-contact-config.php`, puis le compléter :
   - `destinataire` : l’adresse qui reçoit les messages ;
   - `expediteur` : une adresse **du domaine hébergé** (ex. `contact@glmprime.com`), sinon OVH rejette l’envoi ;
   - `origines` : l’URL du site, avec et sans `www` ;
   - `sel` : une chaîne aléatoire (`php -r "echo bin2hex(random_bytes(32));"`).
3. **Domaine et HTTPS** : associer le domaine à l’hébergement (Multisite) et activer le certificat SSL gratuit.
   Une fois HTTPS vérifié, décommenter la ligne `Strict-Transport-Security` de `public/.htaccess`.
4. **E-mail** : recommandé, créer l’adresse d’expédition et configurer SPF/DKIM dans la zone DNS
   (OVH propose l’enregistrement SPF par défaut) pour éviter les spams.

### Déploiement automatique (recommandé)

Le workflow [`.github/workflows/deploiement.yml`](.github/workflows/deploiement.yml) met le site en ligne
à chaque mise à jour de `main` (fusion d’une PR), ou à la demande (onglet **Actions → Déploiement OVH →
Run workflow**). Il relance toutes les vérifications (lint, tests, build, accessibilité), refuse tout
contenu provisoire, puis synchronise `dist/` avec `www/` par SSH (rsync) : seuls les fichiers modifiés
partent, et les fichiers supprimés du site le sont aussi en ligne. `glm-contact-config.php` et
`glm-contact-limites/`, à côté de `www/`, ne sont jamais touchés.

Mise en place, une seule fois, depuis votre ordinateur :

1. Créer une clé SSH réservée au déploiement (sans phrase de passe, elle ne sert qu’à GitHub) :
   ```bash
   ssh-keygen -t ed25519 -N "" -C "deploiement-github-glm" -f glm-deploiement
   ```
2. Autoriser cette clé sur l’hébergement (le mot de passe SSH est demandé une dernière fois) :
   ```bash
   ssh-copy-id -i glm-deploiement.pub glmpria@ssh.cluster131.hosting.ovh.net
   ```
   Sans `ssh-copy-id` (Windows) : ajouter le contenu de `glm-deploiement.pub` à la fin du fichier
   `~/.ssh/authorized_keys` de l’hébergement (droits `700` sur `.ssh`, `600` sur le fichier).
3. Relever l’empreinte du serveur :
   ```bash
   ssh-keyscan -t ed25519,rsa ssh.cluster131.hosting.ovh.net
   ```
4. Dans GitHub, **Settings → Secrets and variables → Actions → New repository secret** :
   | Secret                | Valeur                                                           |
   | --------------------- | ---------------------------------------------------------------- |
   | `OVH_SSH_HOST`        | `ssh.cluster131.hosting.ovh.net`                                 |
   | `OVH_SSH_USER`        | l’identifiant SSH (`glmpria`)                                    |
   | `OVH_SSH_KEY`         | le contenu **complet** du fichier `glm-deploiement` (clé privée) |
   | `OVH_SSH_KNOWN_HOSTS` | la sortie de l’étape 3                                           |
5. Supprimer `glm-deploiement` de l’ordinateur une fois le secret enregistré. Pour révoquer l’accès,
   retirer la ligne correspondante de `~/.ssh/authorized_keys` sur l’hébergement.
6. Déposer une fois `glm-contact-config.php` à côté de `www/` (voir « Première installation ») : le
   déploiement ne le transmet jamais, il ne doit pas être dans le dépôt.

La clé privée n’est jamais écrite dans le dépôt ni affichée dans les journaux ; elle est effacée de la
machine GitHub à la fin de chaque déploiement. Pour exiger une validation manuelle avant chaque mise en
ligne : **Settings → Environments → production → Required reviewers**.

**Retour arrière** : annuler le commit fautif sur `main` (`git revert`), ou relancer le workflow depuis
un commit antérieur.

### Mise à jour manuelle (sans GitHub)

```bash
npm ci
npm run build
npm run verifier:production   # refuse la mise en ligne s’il reste un « TODO » ou un projet d’exemple
```

Puis transférer **le contenu** de `dist/` (y compris les fichiers cachés `.htaccess`) dans `www/` via FTP
(FileZilla : activer « Afficher les fichiers cachés »). Supprimer au préalable les anciens fichiers de
l’ancien site (`index.html`, `assets/`, `manifest.json`) ; les fichiers de `_astro/` peuvent s’accumuler
sans risque et être nettoyés de temps en temps.

**Retour arrière** : garder une copie de la précédente version de `dist/` (ou reconstruire un ancien
commit avec `git checkout <commit> && npm ci && npm run build`) et la redéposer.

**Surveillance** : les erreurs du formulaire (configuration absente, échec d’envoi) sont écrites dans les
journaux PHP de l’hébergement (espace client OVH → Statistiques et logs), sans aucune donnée personnelle.

## Démos clients (demo.glmprime.com)

Le lien **Se connecter** de la navigation mène à `/admin/`, l’espace équipe. Il remplace le dépôt manuel par FTP :

1. se connecter ;
2. saisir le nom du client (l’identifiant de l’adresse est proposé automatiquement) ;
3. choisir l’archive `.zip` du site → **Publier la démo** ;
4. **Copier le lien** (`https://demo.glmprime.com/<client>/`) et l’envoyer au client.

**Mettre à jour** publie une nouvelle version au même lien (l’ancienne est remplacée d’un coup) ;
**Supprimer** retire la démo une fois le site livré sur le domaine du client.

Règles appliquées aux archives : un `index.html` à la racine (ou dans un unique dossier, retiré
automatiquement), sites **statiques** uniquement (`.php`, `.htaccess` et scripts serveur refusés),
chemins `../` refusés, 500 Mo décompressés au plus. Les démos étant servies dans un sous-dossier, le site
doit utiliser des chemins relatifs (`assets/style.css` et non `/assets/style.css` ; Vite : `base: './'`),
sinon passer à l’option « une démo par sous-domaine » ci-dessous.

### Mise en place sur OVH (une seule fois)

1. **Dossier des démos**, à créer **à côté de `www/`**, jamais dedans (le déploiement synchronise `www/`
   avec `dist/` et effacerait les démos) : par exemple `/home/<compte>/demo`.
2. **Sous-domaine** : espace client OVH → Hébergement → Multisite → Ajouter un domaine → `demo.glmprime.com`,
   dossier racine `demo`, SSL activé. Si la zone DNS n’est pas chez OVH, y ajouter l’enregistrement indiqué.
3. Déposer dans ce dossier le contenu de `config/sous-domaine-demo/` (`.htaccess` et `index.html`) :
   HTTPS, aucune indexation par les moteurs de recherche, aucun script serveur exécuté.
4. **Configuration** : copier `config/glm-demos-config.example.php` à côté de `www/` sous le nom
   `glm-demos-config.php` et compléter :
   - `utilisateurs` : un identifiant par personne et l’empreinte de son mot de passe
     (`php -r 'echo password_hash("MotDePasse", PASSWORD_DEFAULT), PHP_EOL;'`) ;
   - `dossier_demos` : le chemin absolu du dossier de l’étape 1 ;
   - `sel` : une chaîne aléatoire (`php -r "echo bin2hex(random_bytes(32));"`).
5. Vérifier la taille d’envoi maximale affichée sous le champ « Archive » : si elle est trop basse,
   l’augmenter (`upload_max_filesize`, `post_max_size`) dans la configuration PHP de l’hébergement.

Sécurité : mots de passe stockés sous forme d’empreinte, session limitée à `/admin/` (`HttpOnly`, `Secure`,
`SameSite=Strict`), jeton CSRF et contrôle de l’origine sur chaque action, 5 échecs de connexion par IP
bloquent 15 minutes (IP hachée). La page `/admin/` est exclue du sitemap et de l’indexation.

### Automatiser depuis le dépôt d’un site client

Avec `jeton_api` renseigné dans `glm-demos-config.php`, une démo se publie sans passer par la page :

```bash
curl -fsS -H "Authorization: Bearer $GLM_DEMOS_JETON" -F action=publier \
     -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip \
     https://www.glmprime.com/admin/api.php
```

Dans le dépôt GitHub d’un site client (secret `GLM_DEMOS_JETON`), la démo suit alors chaque push sur `main` :

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
      # Site avec une étape de build : la lancer ici, puis zipper le dossier produit (dist/, build/…).
      - run: zip -r site.zip . -x '.git/*' '.github/*'
      - run: >
          curl -fsS -H "Authorization: Bearer ${{ secrets.GLM_DEMOS_JETON }}" -F action=publier
          -F slug=boulangerie-martin -F client="Boulangerie Martin" -F archive=@site.zip
          https://www.glmprime.com/admin/api.php
```

### Option : une démo par sous-domaine (`client.demo.glmprime.com`)

Pour les sites qui utilisent des chemins absolus : ajouter `*.demo.glmprime.com` (DNS et certificat), pointant
vers le même dossier, décommenter le bloc correspondant dans le `.htaccess` du dossier des démos, puis indiquer
`'modele_url' => 'https://{slug}.demo.glmprime.com/'` dans la configuration.

## Contenus à compléter avant la mise en ligne

Tous sont marqués `TODO:` dans le code ; `npm run verifier:production` les détecte dans le site construit.

**Identité et coordonnées** (`src/data/site.ts`)

- [ ] Domaine : `https://www.glmprime.com` retenu (déduit de contact@glmprime.com), à ajuster si le site est servi sans `www`
- [ ] URL de la page LinkedIn à vérifier (`linkedin.com/company/glmprime`, reprise de l’ancien site)
- [ ] Vérifier que chaque photo correspond au bon associé
- [ ] Attribution des couleurs de bande à confirmer (corail, jade, bleu)

**Contenu**

- [ ] 4 projets d’exemple à remplacer par de vrais projets (puis retirer `exemple: true`)
- [ ] Un 3e post LinkedIn (idéalement de la page entreprise GLM)
- [ ] Phrases des 4 étapes de la méthode à relire (rédigées à partir de la charte)

**Mentions légales et confidentialité** (complétées à partir de l’extrait Kbis)

- [ ] Numéro de TVA intracommunautaire `FR09 108 105 529` (calculé à partir du SIREN) à vérifier sur impots.gouv.fr
- [ ] Téléphone affiché dans les mentions légales : le numéro WhatsApp (+33 6 51 28 01 91), à confirmer
- [ ] Durée de conservation : 3 ans après le dernier échange (recommandation CNIL), à ajuster si besoin
- [ ] Médiateur de la consommation (`entreprise.mediateur`) : uniquement si GLM vend un jour à des particuliers
- [ ] Mettre à jour `entreprise.miseAJourLegale` à chaque modification des pages légales

**Hébergement**

- [ ] Redirection du domaine sans `www` vers `www` (ou l’inverse) dans `public/.htaccess`
- [ ] Activation de `Strict-Transport-Security` une fois HTTPS vérifié
