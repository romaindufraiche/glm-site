# Site vitrine GLM

Site vitrine d’une page de GLM, conforme à la charte graphique v0.5 (voir [`docs/charte-v05.md`](docs/charte-v05.md)).

- **Astro** (génération statique) : du HTML pur, environ 8 Ko de JavaScript au total, sans librairie.
- **Hébergement** : mutualisé OVH, dépôt par FTP du dossier `dist/`.
- **Formulaire de contact** : script PHP `contact.php` qui envoie un e-mail via le serveur OVH (aucun service tiers).

## Modifier le contenu

Tout le contenu éditable est dans **un seul fichier** : [`src/data/site.ts`](src/data/site.ts).

| Pour changer…                     | Modifier dans `site.ts`             |
| --------------------------------- | ----------------------------------- |
| Projets (carrousel)               | `projets`                           |
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

**Ajouter une photo d’associé** : déposer le fichier (portrait 4:5, 1000 × 1250 px minimum, JPEG, PNG ou WebP)
dans `src/assets/equipe/`, puis renseigner `photo: 'nom.jpg'` et `linkedin: 'https://www.linkedin.com/in/…'`.
Le build génère lui-même les versions optimisées (WebP, plusieurs tailles). Les photos s’affichent en noir et
blanc pour former une série homogène, et en couleur au survol.

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
  pages/              accueil, mentions légales, confidentialité, confirmations, 404, robots.txt
  lib/                logique isolée et testée (validation du formulaire, consentement, LinkedIn)
  scripts/            comportements côté navigateur (menu, carrousel, formulaire, consentement)
public/
  contact.php         point d’entrée du formulaire
  _serveur/           logique PHP (non accessible depuis le web)
  .htaccess           HTTPS, en-têtes de sécurité (CSP stricte), cache, 404
  sw.js               désinstalle le service worker de l’ancien site (à supprimer d’ici quelques mois)
config/               modèle de configuration du formulaire (le vrai fichier n’est jamais commité)
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
   - `expediteur` : une adresse **du domaine hébergé** (ex. `site@votre-domaine.fr`), sinon OVH rejette l’envoi ;
   - `origines` : l’URL du site, avec et sans `www` ;
   - `sel` : une chaîne aléatoire (`php -r "echo bin2hex(random_bytes(32));"`).
3. **Domaine et HTTPS** : associer le domaine à l’hébergement (Multisite) et activer le certificat SSL gratuit.
   Une fois HTTPS vérifié, décommenter la ligne `Strict-Transport-Security` de `public/.htaccess`.
4. **E-mail** : recommandé, créer l’adresse d’expédition et configurer SPF/DKIM dans la zone DNS
   (OVH propose l’enregistrement SPF par défaut) pour éviter les spams.

### À chaque mise à jour

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

## Contenus à compléter avant la mise en ligne

Tous sont marqués `TODO:` dans le code ; `npm run verifier:production` les détecte dans le site construit.

**Identité et coordonnées** (`src/data/site.ts`)

- [ ] Nom de domaine définitif (`siteMeta.url`) : URL canoniques, sitemap, Open Graph, `robots.txt`
- [ ] Adresse e-mail professionnelle (actuellement l’adresse personnelle reprise de l’ancien site)
- [ ] URL de la page LinkedIn à vérifier (`linkedin.com/company/glmprime`, reprise de l’ancien site)
- [ ] Vérifier que chaque photo correspond au bon associé
- [ ] Bios et expertises des associés à relire (rédigées à partir des rôles et de la charte)
- [ ] Attribution des couleurs de bande à confirmer (corail, jade, bleu)

**Contenu**

- [ ] 4 projets d’exemple à remplacer par de vrais projets (puis retirer `exemple: true`)
- [ ] Un 3e post LinkedIn (idéalement de la page entreprise GLM)
- [ ] Phrases des 4 étapes de la méthode à relire (rédigées à partir de la charte)

**Mentions légales et confidentialité**

- [ ] SIREN à vérifier (108 105 529, repris de l’ancien site)
- [ ] RCS (ville du greffe), capital social, adresse du siège, numéro de TVA intracommunautaire
- [ ] Numéro de téléphone (obligatoire, LCEN)
- [ ] Directeur de la publication à confirmer
- [ ] Date de mise en ligne des pages légales
- [ ] Fournisseur de messagerie qui reçoit les messages (et garanties si hors UE)
- [ ] Durée de conservation des messages (3 ans proposés, recommandation CNIL)

**Hébergement**

- [ ] Redirection du domaine sans `www` vers `www` (ou l’inverse) dans `public/.htaccess`
- [ ] Activation de `Strict-Transport-Security` une fois HTTPS vérifié
