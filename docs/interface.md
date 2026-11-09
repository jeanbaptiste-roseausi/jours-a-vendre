# Référentiel d'interface

Règles communes à toutes les spécifications, à partir de la 003. Les spécifications 001 et 002 ne sont pas concernées : sur elles, la mesure est donnée pour information et ne compte pas comme un écart.

- `/cadrer` s'appuie sur ce document pour poser ses questions d'interface et écrire les exigences de chaque spécification.
- Le recetteur vérifie ces exigences dans un vrai navigateur.

Chaque règle se vérifie par une mesure ou une observation sans interprétation. Une spécification ne s'en écarte que sur décision du responsable, notée avec sa raison dans sa section « Interface ».

## Règle 1 : l'écran principal tient à l'écran

**Écran principal** : chaque onglet de l'appli, dans son état le plus chargé, c'est-à-dire champs remplis et résultat affiché, avec le message le plus long prévu par la spécification.

| Taille | Écran réel | Zone mesurée | Exigence |
|---|---|---|---|
| PC standard | 1366 × 768 | 1366 × 630 | Tout tient sans défiler |
| PC grand | 1920 × 1080 | 1920 × 940 | Tout tient sans défiler |
| Téléphone | 360 × 800 | 360 × 800 | Lisible : aucun défilement horizontal, texte d'au moins 14 pixels, défilement vertical permis |

**Pourquoi la zone mesurée est plus petite sur PC** : sur un écran de 1366 × 768, les barres du navigateur et de Windows prennent de la hauteur. La page n'a donc qu'environ 630 pixels. Ces deux hauteurs sont des estimations pour un navigateur sous Windows, à ajuster si l'usage réel les contredit.

**Ce que veut dire « tient sans défiler »**, pour les deux tailles de PC :

- la page n'est pas plus haute que la zone mesurée ;
- la page n'est pas plus large que la zone mesurée ;
- aucune zone intérieure ne défile, pour ne pas déplacer le défilement au lieu de le supprimer.

**Limite** : la taille « téléphone » reproduit les dimensions d'un téléphone, mais pas un vrai appareil (ni tactile, ni clavier à l'écran).

## Charte RoseauSI

_À remplir plus tard._
