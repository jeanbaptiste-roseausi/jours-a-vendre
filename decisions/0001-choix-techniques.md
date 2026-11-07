# 0001 – Choix techniques du socle

- **Date** : 7 novembre 2026
- **Statut** : adoptée

## Contexte

L'application est un calculateur simple : quelques champs à saisir et quelques résultats à afficher. Elle n'a ni comptes utilisateurs, ni serveur, ni base de données.

Le responsable du projet ne code pas. La technique doit donc rester lisible, avec peu d'outils, et chaque fonctionnalité doit pouvoir être vérifiée par des tests automatiques.

## Décision

1. **HTML, CSS et JavaScript, sans framework.** Pour une seule page de calcul, un framework (React, Vue…) ajouterait des notions et des dépendances sans bénéfice réel.
2. **Vite 8.3.6** pour le serveur de développement et la construction. La page se recharge à chaque modification, et `npm run build` produit des fichiers statiques publiables partout.
3. **Vitest 5.1.0** pour les tests. Il partage la configuration de Vite et lance les tests avec une seule commande, `npm test`.
4. **Versions exactes** dans `package.json` et fichier `package-lock.json` versionné, pour que tout le monde installe la même chose.

Ces deux outils ne servent qu'au développement. Aucun des deux n'est chargé par la page publiée.

## Options écartées

- **Aucune dépendance** (un simple serveur de fichiers et le lanceur de tests intégré à Node) : plus minimal, mais sans rechargement automatique ni construction, et avec deux outils à configurer au lieu d'un ensemble cohérent.
- **Un framework** (React, Vue, Svelte) : surdimensionné pour une page de calcul.

## Conséquences

- Les calculs seront écrits dans des modules JavaScript séparés de l'affichage, pour être testés directement.
- Le premier test lit `index.html` sans simuler de navigateur. Tester les interactions de la page demandera probablement une dépendance de plus (un simulateur de navigateur comme jsdom). Elle fera l'objet d'une fiche le moment venu.
