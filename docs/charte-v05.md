# Application de la charte graphique v0.5 sur le site

Source de vérité : « GLM · Brand Guidelines · v0.5 » (septembre 2026). Ce document explique comment
chaque règle est traduite dans le code, et les quelques arbitrages faits là où la charte ne tranche pas.

## Logo

- Construction exacte (grille de 12, bandes 2 × 6, 3 modules de marge) : `src/components/Symbole.astro`
  et `public/favicon.svg`. Aucun arrondi, dégradé ni élément ajouté.
- Logotype = symbole + « GLM » en Libre Caslon Display, espacement 0,14 em : `src/components/Logotype.astro`.
- Zone de protection (une largeur de bande) intégrée au composant ; taille minimale 24 px imposée.
- Sur fond Nuit, le carré se fond dans le fond (charte p. 15) : aucun contour ajouté.
- Favicon, icône Apple et image Open Graph générés depuis le même SVG : `npm run images`.

## Couleurs (`src/styles/tokens.css`)

| Rôle                        | Valeur                    | Contraste         |
| --------------------------- | ------------------------- | ----------------- |
| Fond principal              | Nuit `#0B1533`            | —                 |
| Fond clair / texte sur Nuit | Ivoire `#F4EFE4`          | 15,7:1            |
| Texte sur Ivoire            | Encre `#16181D`           | 15,5:1            |
| Texte secondaire sur Nuit   | Ivoire 75 % `#BAB9B8`     | 9,2:1             |
| Texte secondaire sur Ivoire | Encre 75 % `#4E4E4F`      | 7,3:1             |
| Filets sur fond clair       | Pierre `#D9D6CE`          | décoratif         |
| Bordure des champs          | `#7A7977`                 | 3,8:1 (composant) |
| Erreur (formulaire)         | corail assombri `#A63C29` | 5,5:1 sur Ivoire  |
| Succès (formulaire)         | jade assombri `#1D6E4D`   | 5,4:1 sur Ivoire  |

Les accents (corail, jade, bleu) ne servent qu’aux touches : logo, filet tricolore, barres des Calibres,
chiffres des Calibres sur Nuit. Combinaisons interdites respectées : jamais de bleu en texte sur Nuit
(3,7:1), jamais de corail ni de jade en texte sur Ivoire.

**Arbitrage :** la charte (p. 26) affiche le « 01 » du Calibre Web dans un bleu clair absent de la palette.
Le bleu étant interdit en texte sur Nuit, le chiffre est en Ivoire et la barre bleue porte la couleur.

## Typographie

Libre Caslon Display (titres, nom GLM) et IBM Plex Sans 400/500/600 (tout le reste), auto-hébergées
via `@fontsource` : aucune requête vers Google Fonts (RGPD). Pas de monospace.

**Arbitrage :** la charte indique 120 px pour le titre héro. Le titre du site compte onze mots : il est
plafonné à 84 px pour tenir en quatre lignes au lieu de sept. Les titres de section suivent les 56 px.

## Éléments graphiques

- Filet tricolore (`src/components/Filet.astro`) : devant chaque surtitre, et en séparateur sous la vision.
  Seul élément décoratif récurrent.
- Calibres : 01 · Web (bleu), 02 · Automatisation & IA (corail), 03 · Robotique (jade), avec barre de
  couleur en haut des cartes et gros chiffre en Caslon.
- Bords droits partout (`--radius: 0`), comme le carré du logo. Deux boutons seulement : aplat et contour.
- Fiches équipe sans photo : une seule bande de la couleur du fondateur, aux proportions du logo
  (déclinaison « accent unique », charte p. 16).

## Mouvement

Un seul moment animé : la montée des trois bandes du logo du hero au chargement. Les projets, eux, suivent
la molette : la section reste épinglée et défile horizontalement (desktop), avec le filet tricolore en barre de
progression (charte p. 25). Rien ne bouge tout seul ; `prefers-reduced-motion` affiche une grille simple.

## Éléments de l’ancienne identité retirés

Dégradés Spectrum, Ember, Verdant et Current ; polices Fraunces, Space Grotesk, Inter et JetBrains Mono ;
boutons pilule, boutons aimantés, boot G-L-M, changement de couleur par zone, mot-accent en italique
dégradé, style terminal ; ainsi que la palette de commandes, le faux assistant, l’easter egg, le thème
clair/sombre, les traductions EN/中文 et le lien WhatsApp.
