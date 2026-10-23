# Sécurité du site

Ce document décrit les protections du site et la marche à suivre quand un filtre de sécurité
(proxy d’entreprise, centre de cyberdéfense) refuse d’ouvrir www.glmprime.com.

## Ce que le site fait déjà

- **Aucun script tiers** : polices, images et scripts sont servis par le site lui-même. La politique de
  sécurité du contenu (`public/.htaccess`) interdit tout le reste ; seules les publications LinkedIn
  peuvent s’afficher, et seulement après accord du visiteur.
- **Formulaire de contact sans service tiers** : `contact.php` valide tout côté serveur, limite les envois
  et lit sa configuration hors du dossier public.
- **En-têtes de sécurité** : HTTPS imposé (HSTS), une seule adresse (`https://www.glmprime.com`, la variante
  sans www y renvoie), isolation des onglets (COOP), fichiers non intégrables ailleurs (CORP), pas de
  version de PHP annoncée, pas d’affichage dans un cadre (`frame-ancestors 'none'`).
- **`/.well-known/security.txt`** : indique où signaler une faille (RFC 9116). Sa date d’expiration est
  vérifiée par les tests : ils échouent un mois avant, pour rappeler de la repousser.
- **Aucun contenu provisoire en production** : la version mise en ligne par le workflow de déploiement
  retire les projets d’exemple (« [client] »), qui donnent l’image d’un site inachevé.

## Si un filtre refuse d’ouvrir le site

Le motif « liens suspects ou fichiers infectés » est générique : il vient le plus souvent d’une
réputation automatique (domaine récent, hébergement mutualisé, fichiers d’un ancien site restés sur le
serveur), rarement d’un examen manuel. Dans l’ordre :

1. **Auditer l’hébergement** : onglet Actions → « Audit de l’hébergement » → Run workflow. Le rapport liste
   les fichiers présents sur le serveur mais absents du site (restes d’un ancien site ou d’un dépôt FTP),
   les fichiers PHP et tout motif de code malveillant. Il ne modifie rien.
2. **Remettre le serveur au propre** : onglet Actions → « Déploiement OVH » → Run workflow. Le dossier
   `www/` devient une copie exacte du site construit ; tout fichier en trop est supprimé. Un fichier
   suspect signalé hors de `www/` se supprime à la main par FTP, après vérification.
3. **Vérifier la réputation publique** de `https://www.glmprime.com` sur des services gratuits (VirusTotal,
   état de navigation sécurisée de Google, Sucuri SiteCheck, urlscan.io). Si un moteur signale le site,
   lui demander un réexamen depuis son propre formulaire.
4. **Demander le détail au centre de cyberdéfense** : le lien ou le fichier précis mis en cause, et le
   moteur de classement utilisé. Une demande de recatégorisation auprès de ce moteur est souvent la
   seule étape qui débloque un domaine récent.
5. **Refaire la demande d’ouverture** en indiquant les mesures prises (points 1 à 3).

## Liens externes du site

Tous les liens sortants pointent vers des services connus : LinkedIn (profils, page et publications de
GLM), WhatsApp (`wa.me`, contact direct), la CNIL et OVHcloud (pages légales). Les liens qui ouvrent un
nouvel onglet portent `rel="noopener noreferrer"`.
