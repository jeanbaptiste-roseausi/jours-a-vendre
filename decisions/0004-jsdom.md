# 0004 – jsdom pour tester le comportement de la page

- **Date** : 8 novembre 2026
- **Statut** : adoptée

## Contexte

La spécification 001 décrit des comportements de page, et pas seulement des calculs : champs masqués selon le mode de tarif, valeurs conservées d'un mode à l'autre, résultats et messages effacés dès qu'un champ change, page vide après un rechargement (CA1, CA10, CA11, CA14 à CA18, CA21).

Sans simulateur de navigateur, ces critères ne seraient vérifiés qu'à la recette, à la main. Une régression plus tard passerait inaperçue jusqu'à la recette suivante. La fiche 0001 annonçait déjà ce besoin.

## Décision

- **jsdom 30.1.3** (publiée le 15 octobre 2026), en dépendance de développement seulement, en version exacte. C'est la dernière version publiée depuis plus de 14 jours au moment du choix : la 31.0.0, du 5 novembre 2026, a été écartée pour cette raison. Elle est compatible avec Node 26 et avec Vitest 5.1.0.
- Elle n'est pas chargée par la page publiée.
- Les fichiers de test qui en ont besoin la déclarent eux-mêmes en tête (`// @vitest-environment jsdom`). Les autres tests continuent de tourner sans elle, et la configuration de Vitest ne change pas.
- `npm audit` ne signalait aucune vulnérabilité lors de l'installation.

## Options écartées

- **Aucune dépendance** : le comportement de la page n'est vérifié qu'à la recette.
- **happy-dom** : plus rapide, mais moins fidèle aux navigateurs, et le gain de vitesse est négligeable pour une seule page.
- **Tests dans un vrai navigateur** (mode navigateur de Vitest avec Playwright) : plus fidèle, mais plus lourd à installer et plus lent. Le vrai navigateur reste l'outil du recetteur.

## Conséquences

- Chaque `npm test`, donc chaque commit et l'intégration continue, rejoue les critères de comportement.
- Dependabot surveille jsdom comme les autres dépendances npm, avec le même délai de 14 jours.
- jsdom n'exécute pas la mise en page : ce qu'on voit réellement (positions, styles) reste vérifié à la recette.
